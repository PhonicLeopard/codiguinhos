/**
 * Busca a previsão do tempo detalhada usando o backend como proxy seguro.
 * @param {string} cidade - O nome da cidade.
 * @returns {Promise<object>} Os dados brutos da API de clima.
 */
async function buscarPrevisaoDetalhada(cidade) {
    const backendProxyUrl = `http://localhost:3001/api/weather?city=${encodeURIComponent(cidade)}`;
    // A chamada fetch agora é encapsulada na função fetchAPI em main.js, 
    // mas a lógica de construção da URL permanece aqui.
    // Para manter a modularidade, vamos assumir que quem chama trata o erro.
    const response = await fetch(backendProxyUrl);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar previsão do tempo.');
    }
    return data;
}

/**
 * Processa os dados brutos da API de clima e agrupa por dia.
 * @param {object} apiData - Os dados retornados pela API OpenWeatherMap.
 * @returns {Array<object>|null} Um array com a previsão para os próximos 5 dias, ou nulo se os dados forem inválidos.
 */
function processarDadosForecast(apiData) {
    if (apiData.cod !== "200" || !apiData.list) return null;

    const previsoesPorDia = {};
    apiData.list.forEach(item => {
        const dia = item.dt_txt.split(' ')[0];
        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = { data: dia, temps: [], weathers: [] };
        }
        previsoesPorDia[dia].temps.push(item.main.temp);
        previsoesPorDia[dia].weathers.push({ icon: item.weather[0].icon, description: item.weather[0].description });
    });

    return Object.values(previsoesPorDia).map(diaData => {
        // Pega o ícone do meio-dia, se houver, para ser mais representativo do dia.
        const itemRep = diaData.weathers.find(w => w.icon.includes('d')) || diaData.weathers[0];
        return {
            data: diaData.data,
            temp_min: Math.min(...diaData.temps),
            temp_max: Math.max(...diaData.temps),
            iconeRepresentativo: itemRep.icon,
            descricaoRepresentativa: itemRep.description,
        };
    }).slice(0, 5); // Garante que retornará no máximo 5 dias.
}

export default { buscarPrevisaoDetalhada, processarDadosForecast };