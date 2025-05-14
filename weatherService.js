// js/weatherService.js

// ATENÇÃO: SUBSTITUA PELA SUA CHAVE DA API OPENWEATHERMAP
const OPENWEATHER_API_KEY = "SUA_CHAVE_OPENWEATHERMAP_AQUI";

// Limites de temperatura para os alertas (Celsius)
const TEMP_BAIXA_LIMITE = 10;
const TEMP_ALTA_LIMITE = 30;
const LIMITE_POP_ALERTA_CHUVA = 0.4; // 40% de probabilidade de precipitação

/**
 * Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade.
 * @async
 * @param {string} cidade O nome da cidade.
 * @returns {Promise<Object|null>} Objeto com dados da previsão ou objeto de erro/null.
 */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade || typeof cidade !== 'string' || cidade.trim() === '') {
        console.error("buscarPrevisaoDetalhada: Nome da cidade inválido.");
        return { cod: "custom_error", message: "Nome da cidade não fornecido." };
    }

    if (OPENWEATHER_API_KEY === "SUA_CHAVE_OPENWEATHERMAP_AQUI" || !OPENWEATHER_API_KEY) {
        console.error("buscarPrevisaoDetalhada: Chave da API OpenWeatherMap não configurada.");
        return { cod: "custom_error", message: "Chave da API não configurada." };
    }

    const endpoint = "https://api.openweathermap.org/data/2.5/forecast";
    const cidadeCodificada = encodeURIComponent(cidade.trim());
    const unidades = "metric"; // Sempre buscar em Celsius
    const idioma = "pt_br";
    const url = `${endpoint}?q=${cidadeCodificada}&units=${unidades}&lang=${idioma}&appid=${OPENWEATHER_API_KEY}`;

    console.log(`Buscando previsão para: ${cidade} (URL: ${url.replace(OPENWEATHER_API_KEY, "SUA_CHAVE")})`); // Não logar a chave

    try {
        const response = await fetch(url);
        const data = await response.json(); // Tenta parsear JSON mesmo para erros

        if (!response.ok) {
            const errorMessage = data && data.message
                ? `Erro da API OpenWeatherMap: ${data.message} (cidade: ${cidade})`
                : `Erro HTTP: ${response.status} - ${response.statusText}`;
            console.error(errorMessage, data);
            return data; // Retorna o objeto de erro da API (ex: {cod: "404", message: "city not found"})
        }
        
        console.log("Dados da previsão recebidos:", data);
        return data;

    } catch (error) {
        console.error("Erro em buscarPrevisaoDetalhada (catch geral):", error.message);
        return { cod: "network_error", message: `Falha de rede ou comunicação: ${error.message}` };
    }
}

/**
 * Processa os dados brutos da API e agrupa por dia, adicionando flags de alerta.
 * @param {Object} apiData Dados brutos da API OpenWeatherMap.
 * @returns {Array<Object>|null} Array de objetos de previsão por dia, ou null.
 */
function processarDadosForecast(apiData) {
    if (!apiData || apiData.cod !== "200" || !apiData.list || !Array.isArray(apiData.list) || apiData.list.length === 0) {
        console.error("processarDadosForecast: Dados da API inválidos ou lista de previsão vazia.", apiData);
        return null;
    }

    const previsoesPorDia = {};

    apiData.list.forEach(item => {
        if (!item || typeof item !== 'object' || !item.dt_txt || typeof item.dt_txt !== 'string' ||
            !item.main || typeof item.main !== 'object' ||
            !item.weather || !Array.isArray(item.weather) || item.weather.length === 0 ||
            !item.weather[0] || typeof item.weather[0] !== 'object') {
            console.warn("processarDadosForecast: Item da lista de previsão malformado, pulando:", item);
            return;
        }

        const dataHora = item.dt_txt;
        const dia = dataHora.split(' ')[0];

        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = {
                data: dia,
                entradas: [],
                temps: [], // Para calcular min/max diário
                temAlertaChuva: false,
                maiorPopDia: 0,
                temAlertaFrio: false,
                temAlertaCalor: false,
            };
        }

        const popConvertida = typeof item.pop === 'number' ? item.pop : 0;
        const tempAtual = item.main.temp;

        previsoesPorDia[dia].entradas.push({
            hora: dataHora.split(' ')[1].substring(0, 5), // HH:MM
            temp: tempAtual, // Original em Celsius
            feels_like: item.main.feels_like, // Original em Celsius
            descricao: item.weather[0].description,
            icone: item.weather[0].icon,
            pop: popConvertida,
            vento_velocidade: (item.wind && typeof item.wind.speed === 'number') ? item.wind.speed : null, // m/s
            umidade: (item.main && typeof item.main.humidity === 'number') ? item.main.humidity : null,
            dt_txt: item.dt_txt
        });

        if (typeof tempAtual === 'number' && !isNaN(tempAtual)) {
             previsoesPorDia[dia].temps.push(tempAtual);
        }
        
        if (popConvertida >= LIMITE_POP_ALERTA_CHUVA) {
            previsoesPorDia[dia].temAlertaChuva = true;
        }
        if (popConvertida > previsoesPorDia[dia].maiorPopDia) {
            previsoesPorDia[dia].maiorPopDia = popConvertida;
        }
    });

    const resultadoFinal = [];
    for (const diaKey in previsoesPorDia) {
        const diaData = previsoesPorDia[diaKey];
        if (diaData.entradas.length === 0) continue;

        if (diaData.temps.length > 0) {
            diaData.temp_min = Math.min(...diaData.temps); // Celsius
            diaData.temp_max = Math.max(...diaData.temps); // Celsius
        } else {
            diaData.temp_min = diaData.entradas[0]?.temp;
            diaData.temp_max = diaData.entradas[0]?.temp;
        }

        if (typeof diaData.temp_min === 'number' && diaData.temp_min < TEMP_BAIXA_LIMITE) {
            diaData.temAlertaFrio = true;
        }
        if (typeof diaData.temp_max === 'number' && diaData.temp_max > TEMP_ALTA_LIMITE) {
            diaData.temAlertaCalor = true;
        }

        let itemRepresentativo = diaData.entradas.find(e => e.hora === "12:00" || e.hora === "15:00");
        if (!itemRepresentativo && diaData.entradas.length > 0) {
            itemRepresentativo = diaData.entradas[Math.floor(diaData.entradas.length / 2)];
        }
        
        diaData.iconeRepresentativo = itemRepresentativo?.icone || diaData.entradas[0]?.icone || null;
        diaData.descricaoRepresentativa = itemRepresentativo?.descricao || diaData.entradas[0]?.descricao || "N/A";
        
        delete diaData.temps; // Não precisa mais do array de temps individuais
        resultadoFinal.push(diaData);
    }

    resultadoFinal.sort((a, b) => new Date(a.data) - new Date(b.data));
    console.log("Dados da previsão processados:", resultadoFinal);
    return resultadoFinal;
}

export default { buscarPrevisaoDetalhada, processarDadosForecast };