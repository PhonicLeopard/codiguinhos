// js/weatherService.js

// A OPENWEATHER_API_KEY foi removida do frontend.

const TEMP_BAIXA_LIMITE = 10;
const TEMP_ALTA_LIMITE = 30;
const LIMITE_POP_ALERTA_CHUVA = 0.4;

/**
 * Busca a previsão do tempo detalhada para uma cidade, usando o backend como proxy.
 * @async
 * @param {string} cidade O nome da cidade.
 * @returns {Promise<Object>} Objeto com dados da previsão (direto da OpenWeatherMap via backend).
 * @throws {Error} Lança um erro em caso de falha na comunicação ou erro do servidor.
 */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade || typeof cidade !== 'string' || cidade.trim() === '') {
        console.error("[Frontend/weatherService] Nome da cidade inválido.");
        throw new Error("Nome da cidade não fornecido.");
    }
    // A URL agora aponta para o seu servidor backend
    const backendUrl = `http://localhost:3001/api/weather?city=${encodeURIComponent(cidade.trim())}`;
    console.log(`[Frontend/weatherService] Solicitando previsão para: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: `Erro ${response.status} do servidor.` };
            }
            const errorMessage = errorData.message || `Erro ao buscar previsão.`;
            console.error(`[Frontend/weatherService] Erro da requisição ao backend: ${errorMessage}`, errorData);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("[Frontend/weatherService] Dados da previsão recebidos do backend:", data);
        return data; // Retorna os dados para serem processados pelo main.js

    } catch (error) {
        if (error instanceof Error) {
            console.error("[Frontend/weatherService] Erro no fetch para o backend:", error.message);
            throw error; // Relança o erro para o chamador (main.js)
        }
        console.error("[Frontend/weatherService] Erro desconhecido:", error);
        throw new Error("Falha de comunicação com o servidor de previsão.");
    }
}

/**
 * Processa os dados brutos da API e agrupa por dia, adicionando flags de alerta.
 * @param {Object} apiData Dados brutos da API OpenWeatherMap.
 * @returns {Array<Object>|null} Array de objetos de previsão por dia, ou null.
 */
function processarDadosForecast(apiData) {
    if (!apiData || apiData.cod !== "200" || !Array.isArray(apiData.list) || apiData.list.length === 0) {
        console.error("[Frontend/weatherService] processarDadosForecast: Dados da API inválidos.", apiData);
        return null;
    }

    const previsoesPorDia = {};
    apiData.list.forEach(item => {
        const dataHora = item.dt_txt;
        const dia = dataHora.split(' ')[0];
        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = {
                data: dia,
                entradas: [],
                temps: [],
                temAlertaChuva: false,
                maiorPopDia: 0,
                temAlertaFrio: false,
                temAlertaCalor: false,
            };
        }
        previsoesPorDia[dia].entradas.push({
            hora: dataHora.split(' ')[1].substring(0, 5),
            temp: item.main.temp,
            descricao: item.weather[0].description,
            icone: item.weather[0].icon,
            pop: item.pop,
        });
        previsoesPorDia[dia].temps.push(item.main.temp);
        if (item.pop >= LIMITE_POP_ALERTA_CHUVA) previsoesPorDia[dia].temAlertaChuva = true;
        if (item.pop > previsoesPorDia[dia].maiorPopDia) previsoesPorDia[dia].maiorPopDia = item.pop;
    });

    const resultadoFinal = Object.values(previsoesPorDia).map(diaData => {
        diaData.temp_min = Math.min(...diaData.temps);
        diaData.temp_max = Math.max(...diaData.temps);
        if (diaData.temp_min < TEMP_BAIXA_LIMITE) diaData.temAlertaFrio = true;
        if (diaData.temp_max > TEMP_ALTA_LIMITE) diaData.temAlertaCalor = true;
        
        let itemRep = diaData.entradas.find(e => e.hora === "12:00" || e.hora === "15:00") || diaData.entradas[Math.floor(diaData.entradas.length / 2)];
        diaData.iconeRepresentativo = itemRep.icone;
        diaData.descricaoRepresentativa = itemRep.descricao;
        
        delete diaData.temps; // Limpa dados intermediários
        return diaData;
    });

    resultadoFinal.sort((a, b) => new Date(a.data) - new Date(b.data));
    console.log("[Frontend/weatherService] Dados da previsão processados:", resultadoFinal);
    return resultadoFinal;
}

export default { buscarPrevisaoDetalhada, processarDadosForecast };