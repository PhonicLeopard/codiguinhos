// js/weatherService.js

// A OPENWEATHER_API_KEY NÃO É MAIS USADA AQUI!
// Pode remover a constante OPENWEATHER_API_KEY daqui ou comentá-la.
// const OPENWEATHER_API_KEY = "SUA_CHAVE_REMOVIDA_DAQUI"; // <-- REMOVER OU COMENTAR

// Limites de temperatura e POP continuam aqui, pois são usados por processarDadosForecast
const TEMP_BAIXA_LIMITE = 10;
const TEMP_ALTA_LIMITE = 30;
const LIMITE_POP_ALERTA_CHUVA = 0.4;

/**
 * Busca a previsão do tempo detalhada para uma cidade, AGORA USANDO NOSSO BACKEND.
 * @async
 * @param {string} cidade O nome da cidade.
 * @returns {Promise<Object|null>} Objeto com dados da previsão (direto da OpenWeatherMap via backend) ou null em caso de erro.
 *                                Esta função agora não lida diretamente com a UI de "Buscando...",
 *                                isso será feito pelo main.js que a chama.
 *                                Ela retorna os dados brutos ou lança um erro.
 */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade || typeof cidade !== 'string' || cidade.trim() === '') {
        console.error("[Frontend/weatherService] Nome da cidade inválido.");
        throw new Error("Nome da cidade não fornecido."); // Lança erro para ser pego pelo chamador
    }

    // A URL agora aponta para o seu servidor backend
    // Certifique-se de que a porta (3001) corresponde à porta do seu server.js
    const backendUrl = `http://localhost:3001/api/previsao/${encodeURIComponent(cidade.trim())}`;
    console.log(`[Frontend/weatherService] Solicitando previsão para: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
            // Tenta obter a mensagem de erro do JSON retornado pelo backend
            let errorData = { error: `Erro ${response.status} do servidor.` };
            try {
                errorData = await response.json();
            } catch (e) {
                // Se não conseguir parsear o JSON, usa a mensagem de status
                console.warn("[Frontend/weatherService] Resposta de erro do backend não é JSON válido.");
            }
            const errorMessage = errorData.error || errorData.message || `Erro ${response.status} ao buscar previsão do backend.`;
            console.error(`[Frontend/weatherService] Erro da requisição ao backend: ${errorMessage}`, errorData);
            throw new Error(errorMessage); // Lança erro para ser pego pelo chamador
        }

        const data = await response.json();
        console.log("[Frontend/weatherService] Dados da previsão recebidos do backend:", data);

        // A função agora retorna os dados brutos da OpenWeatherMap,
        // que o backend repassou.
        // A responsabilidade de chamar processarDadosForecast e exibirPrevisaoDetalhada
        // ficará no main.js (ou onde a UI é manipulada).
        return data; // Retorna os dados para serem processados por outra função

    } catch (error) {
        // Se o erro já é uma instância de Error, apenas relança
        if (error instanceof Error) {
             console.error("[Frontend/weatherService] Erro no fetch para o backend:", error.message);
            throw error;
        }
        // Caso contrário, cria um novo erro
        console.error("[Frontend/weatherService] Erro desconhecido no fetch para o backend:", error);
        throw new Error("Falha de comunicação com o servidor de previsão.");
    }
}

/**
 * Processa os dados brutos da API e agrupa por dia, adicionando flags de alerta.
 * (Esta função continua a mesma, pois o formato dos dados vindos do backend
 * é o mesmo que vinha direto da OpenWeatherMap)
 * @param {Object} apiData Dados brutos da API OpenWeatherMap.
 * @returns {Array<Object>|null} Array de objetos de previsão por dia, ou null.
 */
function processarDadosForecast(apiData) {
    // ... (seu código existente de processarDadosForecast, sem alterações) ...
    // Cole aqui sua função processarDadosForecast que já funciona.
    // Vou colocar um placeholder aqui para lembrar:

    if (!apiData || apiData.cod !== "200" || !apiData.list || !Array.isArray(apiData.list) || apiData.list.length === 0) {
        console.error("[Frontend/weatherService] processarDadosForecast: Dados da API inválidos ou lista de previsão vazia.", apiData);
        return null;
    }
    const previsoesPorDia = {};
    apiData.list.forEach(item => {
        if (!item || typeof item !== 'object' || !item.dt_txt || typeof item.dt_txt !== 'string' ||
            !item.main || typeof item.main !== 'object' ||
            !item.weather || !Array.isArray(item.weather) || item.weather.length === 0 ||
            !item.weather[0] || typeof item.weather[0] !== 'object') {
            console.warn("[Frontend/weatherService] processarDadosForecast: Item da lista de previsão malformado, pulando:", item);
            return;
        }
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
        const popConvertida = typeof item.pop === 'number' ? item.pop : 0;
        const tempAtual = item.main.temp;
        previsoesPorDia[dia].entradas.push({
            hora: dataHora.split(' ')[1].substring(0, 5),
            temp: tempAtual,
            feels_like: item.main.feels_like,
            descricao: item.weather[0].description,
            icone: item.weather[0].icon,
            pop: popConvertida,
            vento_velocidade: (item.wind && typeof item.wind.speed === 'number') ? item.wind.speed : null,
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
            diaData.temp_min = Math.min(...diaData.temps);
            diaData.temp_max = Math.max(...diaData.temps);
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
        delete diaData.temps;
        resultadoFinal.push(diaData);
    }
    resultadoFinal.sort((a, b) => new Date(a.data) - new Date(b.data));
    console.log("[Frontend/weatherService] Dados da previsão processados:", resultadoFinal);
    return resultadoFinal;

}

// Não se esqueça de exportar as funções que o main.js precisa
export default { buscarPrevisaoDetalhada, processarDadosForecast };