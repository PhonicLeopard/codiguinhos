// js/weatherService.js

// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.

const OPENWEATHER_API_KEY = "SUA_CHAVE_OPENWEATHERMAP_AQUI"; // <-- SUBSTITUA PELA SUA CHAVE

/**
 * Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade.
 * @async
 * @param {string} cidade O nome da cidade para a qual buscar a previsão.
 * @returns {Promise<Object|null>} Um objeto com os dados da previsão se sucesso, ou null em caso de erro.
 */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade || typeof cidade !== 'string' || cidade.trim() === '') {
        console.error("buscarPrevisaoDetalhada: Nome da cidade inválido ou não fornecido.");
        // Poderia lançar um erro aqui também, mas para API externa, vamos focar nos erros de rede/API
        return null;
    }

    if (OPENWEATHER_API_KEY === "SUA_CHAVE_OPENWEATHERMAP_AQUI" || !OPENWEATHER_API_KEY) {
        console.error("buscarPrevisaoDetalhada: A chave da API OpenWeatherMap (OPENWEATHER_API_KEY) não está configurada.");
        // Alertar o usuário ou lançar um erro específico pode ser útil em uma aplicação real
        // alert("Erro: A chave da API de previsão do tempo não está configurada.");
        return null; // Ou throw new Error("API Key não configurada");
    }

    const endpoint = "https://api.openweathermap.org/data/2.5/forecast";
    // encodeURIComponent garante que caracteres especiais na cidade (ex: "São Paulo") sejam formatados corretamente para a URL
    const cidadeCodificada = encodeURIComponent(cidade.trim());
    const unidades = "metric";
    const idioma = "pt_br";

    const url = `${endpoint}?q=${cidadeCodificada}&units=${unidades}&lang=${idioma}&appid=${OPENWEATHER_API_KEY}`;

    console.log(`Buscando previsão para: ${cidade} na URL: ${url}`); // Útil para debug

    try {
        const response = await fetch(url);

        // Verifica se a resposta da rede foi bem-sucedida (status 200-299)
        if (!response.ok) {
            let errorMessage = `Erro HTTP: ${response.status} - ${response.statusText}`;
            try {
                // Tenta obter uma mensagem de erro mais detalhada do corpo da resposta JSON da API
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    errorMessage = `Erro da API OpenWeatherMap: ${errorData.message} (cidade: ${cidade})`;
                }
            } catch (jsonError) {
                // Se não conseguir parsear o JSON do erro, mantém a mensagem HTTP original
                console.warn("Não foi possível parsear JSON da resposta de erro da API:", jsonError);
            }
            throw new Error(errorMessage); // Lança um erro que será capturado pelo catch abaixo
        }

        // Se response.ok é true, parseia o JSON da resposta bem-sucedida
        const data = await response.json();
        console.log("Dados da previsão recebidos:", data);
        return data; // Retorna os dados completos da previsão

    } catch (error) {
        // Captura erros de rede (fetch falhou) ou erros lançados manualmente (response.ok === false)
        console.error("Erro em buscarPrevisaoDetalhada:", error.message);
        // Em uma aplicação real, você poderia querer notificar o usuário aqui também
        // showNotification(`Falha ao buscar previsão: ${error.message}`, "error");
        return null; // Retorna null para indicar falha na busca
    }
}

import { buscarPrevisaoDetalhada } from './weatherService.js'; // Se testando de outro módulo

// Ou se weatherService.js já foi carregado globalmente pelo <script>
// (lembre-se que com type="module" não fica global automaticamente)

// Para teste direto no console após o carregamento da página:
(async () => {
    const cidade = prompt("Digite o nome da cidade para buscar a previsão:");
    if (cidade) {
        const dados = await buscarPrevisaoDetalhada(cidade);
        if (dados) {
            console.log(`Previsão para ${cidade}:`, dados);
            // Aqui você verá o objeto JSON completo com a propriedade 'list'
        } else {
            console.log(`Falha ao buscar previsão para ${cidade}. Verifique o console para mais detalhes.`);
        }
    }
})();

export { buscarPrevisaoDetalhada, OPENWEATHER_API_KEY };
/**
 * Processa os dados brutos da API de forecast (5 dias/3 horas) e agrupa
 * as informações relevantes por dia.
 * @param {Object} apiData O objeto JSON completo retornado pela API OpenWeatherMap.
 * @returns {Array<Object>|null} Um array de objetos, onde cada objeto representa
 *                                um dia de previsão com dados resumidos, ou null se os dados
 *                                de entrada forem inválidos.
 */
function processarDadosForecast(apiData) {
    if (!apiData || !apiData.list || !Array.isArray(apiData.list) || apiData.list.length === 0) {
        console.error("processarDadosForecast: Dados da API inválidos ou lista de previsão vazia.");
        return null;
    }

    const previsoesPorDia = {}; // Usaremos um objeto para agrupar, chave será a data 'YYYY-MM-DD'

    // 1. Agrupar todas as entradas de 3 horas por dia
    apiData.list.forEach(item => {
        // Validação mais robusta do item da API
        if (!item || typeof item !== 'object' ||
            !item.dt_txt || typeof item.dt_txt !== 'string' ||
            !item.main || typeof item.main !== 'object' ||
            !item.weather || !Array.isArray(item.weather) || item.weather.length === 0 || !item.weather[0] || typeof item.weather[0] !== 'object') {
            console.warn("processarDadosForecast: Item da lista de previsão incompleto ou malformado, pulando:", item);
            return; // Pula item malformado
        }

        const dataHora = item.dt_txt; // Formato "YYYY-MM-DD HH:MM:SS"
        const dia = dataHora.split(' ')[0]; // Extrai "YYYY-MM-DD"

        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = {
                data: dia,
                entradas: [], // Armazena todas as previsões de 3h para este dia
                temps: [],    // Para calcular min/max facilmente
                descricoes: new Set(), // Para armazenar descrições únicas
                icones: new Set()      // Para armazenar ícones únicos
            };
        }

        previsoesPorDia[dia].entradas.push({
            hora: dataHora.split(' ')[1].substring(0, 5), // HH:MM
            temp: item.main.temp,
            feels_like: item.main.feels_like,
            temp_min_intervalo: item.main.temp_min, // temp_min do intervalo de 3h
            temp_max_intervalo: item.main.temp_max, // temp_max do intervalo de 3h
            descricao: item.weather[0].description,
            icone: item.weather[0].icon,
            pop: typeof item.pop === 'number' ? item.pop : 0, // Probabilidade de precipitação, default 0
            vento_velocidade: (item.wind && typeof item.wind.speed === 'number') ? item.wind.speed : null,
            vento_direcao: (item.wind && typeof item.wind.deg === 'number') ? item.wind.deg : null,
            umidade: (item.main && typeof item.main.humidity === 'number') ? item.main.humidity : null,
            dt_txt: item.dt_txt
        });

        // Adicionar temps apenas se for um número válido
        if (typeof item.main.temp === 'number' && !isNaN(item.main.temp)) {
             previsoesPorDia[dia].temps.push(item.main.temp);
        }
        if (item.weather[0].description) { // Garante que a descrição existe
            previsoesPorDia[dia].descricoes.add(item.weather[0].description);
        }
        if (item.weather[0].icon) { // Garante que o ícone existe
            previsoesPorDia[dia].icones.add(item.weather[0].icon);
        }
    });

    // 2. Processar cada dia para calcular resumos (min/max, ícone/descrição representativos)
    const resultadoFinal = [];
    for (const diaKey in previsoesPorDia) {
        const diaData = previsoesPorDia[diaKey];

        if (diaData.entradas.length === 0) continue; // Pula dia sem entradas válidas

        // Cálculo de temp_min e temp_max
        if (diaData.temps.length > 0) {
            diaData.temp_min = Math.min(...diaData.temps);
            diaData.temp_max = Math.max(...diaData.temps);
        } else {
            // Fallback se não houver temperaturas válidas (improvável com a lógica atual, mas seguro)
            diaData.temp_min = diaData.entradas[0]?.temp; // Usa a temp do primeiro item se existir
            diaData.temp_max = diaData.entradas[0]?.temp;
        }


        // Lógica para ícone e descrição representativos
        let itemRepresentativo = diaData.entradas.find(e => e.hora === "12:00" || e.hora === "15:00");
        if (!itemRepresentativo && diaData.entradas.length > 0) {
            // Fallback: usar o item do meio da lista de entradas do dia
            itemRepresentativo = diaData.entradas[Math.floor(diaData.entradas.length / 2)];
        }
        
        // Adiciona fallback para caso itemRepresentativo ainda seja undefined ou não tenha as propriedades
        diaData.iconeRepresentativo = itemRepresentativo?.icone || diaData.entradas[0]?.icone || null;
        diaData.descricaoRepresentativa = itemRepresentativo?.descricao || diaData.entradas[0]?.descricao || "N/A";
        
        // delete diaData.temps; // Opcional: limpar dados brutos de agrupamento

        resultadoFinal.push(diaData);
    }

    // Ordena os resultados por data
    resultadoFinal.sort((a, b) => new Date(a.data) - new Date(b.data));

    console.log("Dados da previsão processados por dia:", resultadoFinal);
    return resultadoFinal;
}

// Não se esqueça de exportar a nova função se estiver usando módulos:
export { buscarPrevisaoDetalhada, OPENWEATHER_API_KEY, processarDadosForecast };
/**
 * Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade na API OpenWeatherMap.
 * Utiliza o endpoint 'data/2.5/forecast'.
 * @async
 * @function buscarPrevisaoDetalhada
 * @param {string} cidade O nome da cidade para a qual buscar a previsão. Deve ser uma string não vazia.
 * @returns {Promise<Object|null>} Um objeto com os dados da previsão da API se a requisição for bem-sucedida (contendo `cod: "200"` e a propriedade `list`),
 *                                 ou um objeto de erro da API (contendo `cod` diferente de "200" e `message`),
 *                                 ou `null` em caso de falha na validação da cidade, falha na configuração da API Key,
 *                                 ou erro de rede não tratado pela API (ex: fetch falha completamente).
 * @throws {Error} Lança um erro interno se a resposta da API não for OK e não for possível parsear o JSON de erro,
 *                 ou se ocorrer um erro durante a chamada `fetch` (que é capturado e tratado, resultando em retorno `null`).
 * @example
 * // Exemplo de uso:
 * async function obterPrevisao(nomeCidade) {
 *   const dados = await buscarPrevisaoDetalhada(nomeCidade);
 *   if (dados && dados.cod === "200") {
 *     console.log("Sucesso:", dados.list);
 *   } else if (dados) {
 *     console.error("Erro da API:", dados.message);
 *   } else {
 *     console.error("Falha geral ao buscar previsão.");
 *   }
 * }
 */
async function buscarPrevisaoDetalhada(cidade) {
    // ... (implementação como antes) ...
}

/**
 * Processa os dados brutos da API de forecast (5 dias/3 horas) da OpenWeatherMap
 * e agrupa as informações relevantes por dia, calculando temperaturas mínimas/máximas
 * e selecionando um ícone/descrição representativos para cada dia.
 * @function processarDadosForecast
 * @param {Object} apiData O objeto JSON completo retornado pela API OpenWeatherMap,
 *                         espera-se que contenha a propriedade `list` como um array de previsões horárias.
 * @returns {Array<Object>|null} Um array de objetos, onde cada objeto representa um dia de previsão com
 *                                dados resumidos. Cada objeto de dia contém:
 *                                `{ data: string, temp_min: number, temp_max: number, iconeRepresentativo: string,
 *                                descricaoRepresentativa: string, entradas: Array<Object> }`.
 *                                Retorna `null` se os dados de entrada (`apiData` ou `apiData.list`)
 *                                forem inválidos ou a lista de previsão estiver vazia.
 * @example
 * // Supondo que `rawData` é o resultado de `buscarPrevisaoDetalhada`
 * const previsaoPorDia = processarDadosForecast(rawData);
 * if (previsaoPorDia) {
 *   previsaoPorDia.forEach(dia => {
 *     console.log(dia.data, dia.temp_min, dia.temp_max, dia.iconeRepresentativo);
 *   });
 * }
 */
function processarDadosForecast(apiData) {
    // ... (implementação como antes, com as correções de robustez) ...
}

export { buscarPrevisaoDetalhada, OPENWEATHER_API_KEY, processarDadosForecast };