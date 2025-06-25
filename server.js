// backend-proxy/server.js

const express = require('express');
const app = express();
// O uso de 'node-fetch' pode ser necessário se você estiver em uma versão do Node.js
// que não tem 'fetch' globalmente. As versões mais recentes (18+) já o incluem.
// const fetch = require('node-fetch'); 
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY_BACKEND;

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Para desenvolvimento. Em produção, restrinja.
    res.header('Access-control-allow-headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// =======================================================
//          BANCO DE DADOS SIMULADO (MOCK DATA)
// =======================================================

const dadosRevisao = {
    "carro_1715190000000_abcde": { proxima_revisao: "2025-05-15", tipo_revisao: "Padrão", detalhes: "Troca de filtros e verificação de fluidos." },
    "carroesportivo_1715191000000_fghij": { proxima_revisao: "2024-12-01", tipo_revisao: "Performance", detalhes: "Verificação do sistema de turbo e freios de cerâmica." },
    "caminhao_1715192000000_klmno": { proxima_revisao: "2024-10-20", tipo_revisao: "Pesada", detalhes: "Inspeção completa do motor diesel e eixos." }
};

const dicasManutencao = {
    "Carro": [{ dica: "Calibre os pneus do seu carro a cada 15 dias." }, { dica: "Verifique o nível do óleo semanalmente." }],
    "CarroEsportivo": [{ dica: "Use somente gasolina de alta octanagem." }, { dica: "Evite acelerações bruscas com o motor frio." }],
    "Caminhao": [{ dica: "Verifique o sistema de freios a ar regularmente." }, { dica: "Mantenha o tacógrafo em dia." }],
    "Geral": [{ dica: "Lave o veículo regularmente para proteger a pintura." }]
};

const veiculosDestaque = [
  {
    "id_destaque": "dest01",
    "modelo": "Porsche 911 GT3 RS",
    "ano": 2024,
    "imagem_url": "https://files.porsche.com/filestore/image/multimedia/none/992-gt3-rs-modelimage-sideshot/model/cfbb8ed3-1a15-11ed-80f5-005056bbdc38/porsche-model.png",
    "descricao_destaque": "A perfeição da engenharia para as pistas, homologado para as ruas. Uma experiência de pilotagem pura e visceral.",
    "especificacao_chave": "Motor: 4.0L Boxer 6 Cil. Aspirado",
    "cor_destaque": "#93FF7A"
  },
  {
    "id_destaque": "dest02",
    "modelo": "Scania 770 S V8",
    "ano": 2023,
    "imagem_url": "https://www.scania.com/content/dam/group/products-and-services/trucks/s-series/gallery/exterior/Scania-S-series-V8-Exterior-Gallery-1-1920x1080.jpg",
    "descricao_destaque": "O Rei da Estrada. Combina potência incomparável com o máximo de conforto e tecnologia para longas distâncias.",
    "especificacao_chave": "Potência: 770 cv",
    "cor_destaque": "#3498DB"
  },
    {
    "id_destaque": "dest03",
    "modelo": "Ford Mustang Dark Horse",
    "ano": 2024,
    "imagem_url": "https://www.ford.com/is/image/content/dam/vdm_ford/live/en_us/ford/nameplate/mustang/2024/collections/dm/24_FRD_MST_E7963.tif?croppathe=1_3x2&wid=720",
    "descricao_destaque": "A mais recente evolução do lendário 'pony car', com um V8 Coyote aprimorado e foco total na performance.",
    "especificacao_chave": "Câmbio: Manual de 6 marchas Tremec",
    "cor_destaque": "#B0B0B0"
  }
];

const servicosOferecidos = [
  { "id": "serv01", "nome": "Troca de Óleo e Filtro", "custo_estimado": 350.00 },
  { "id": "serv02", "nome": "Alinhamento e Balanceamento 3D", "custo_estimado": 180.00 },
  { "id": "serv03", "nome": "Revisão Completa de Freios", "custo_estimado": 550.00 },
  { "id": "serv04", "nome": "Diagnóstico de Performance (Turbo)", "custo_estimado": 400.00 },
  { "id": "serv05", "nome": "Manutenção do Sistema de Arla 32", "custo_estimado": 250.00 }
];

const pecasRecomendadas = {
  "Carro": {
    "oleo_motor": [{ "nome": "Óleo Sintético 5W-30", "marca_sugerida": "Motul, Mobil", "observacao": "Ideal para motores modernos e uso urbano." }],
    "pneus": [{ "nome": "Pneu 205/55 R16", "marca_sugerida": "Pirelli, Goodyear", "observacao": "Verificar calibragem quinzenalmente." }]
  },
  "CarroEsportivo": {
    "oleo_motor": [{ "nome": "Óleo 10W-60 Performance", "marca_sugerida": "Castrol Edge, Liqui Moly", "observacao": "Formulado para altas temperaturas e performance extrema." }],
    "pneus": [{ "nome": "Pneu P-Zero 245/35 R20", "marca_sugerida": "Pirelli", "observacao": "Pneus de composto macio para máxima aderência." }],
    "freios": [{ "nome": "Pastilhas de Freio de Cerâmica", "marca_sugerida": "Brembo", "observacao": "Resistência superior ao superaquecimento ('fading')." }]
  },
  "Caminhao": {
    "oleo_motor": [{ "nome": "Óleo 15W-40 para Motores Diesel", "marca_sugerida": "Petronas Urania, Shell Rimula", "observacao": "Essencial para alta quilometragem e cargas pesadas." }],
    "pneus": [{ "nome": "Pneu de Carga 295/80 R22.5", "marca_sugerida": "Michelin, Bridgestone", "observacao": "Verificar o índice de carga e a pressão semanalmente." }],
    "filtros": [{ "nome": "Filtro Separador de Água (Racor)", "marca_sugerida": "Parker", "observacao": "Drenar a água acumulada diariamente antes da primeira partida." }]
  }
};


// =======================================================
//                  DEFINIÇÃO DOS ENDPOINTS (ROTAS)
// =======================================================

// Endpoint proxy para OpenWeatherMap
app.get('/api/weather', async (req, res) => {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: 'Parâmetro "city" é obrigatório.' });
    if (!OPENWEATHER_API_KEY) {
        console.error('ERRO: OPENWEATHER_API_KEY_BACKEND não está definida!');
        return res.status(500).json({ error: 'Configuração do servidor incompleta.' });
    }
    const weatherURL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=pt_br&appid=${OPENWEATHER_API_KEY}`;
    console.log(`Backend: Buscando previsão para ${city}`);
    try {
        const weatherResponse = await fetch(weatherURL);
        const weatherData = await weatherResponse.json();
        if (!weatherResponse.ok) return res.status(weatherResponse.status).json(weatherData);
        res.json(weatherData);
    } catch (error) {
        console.error('Backend: Erro ao buscar dados do clima:', error);
        res.status(500).json({ error: 'Falha ao buscar dados do clima.', details: error.message });
    }
});

// Endpoint para detalhes de revisão
app.get('/api/revisao/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;
    const revisao = dadosRevisao[vehicleId];
    if (revisao) res.json(revisao);
    else res.status(404).json({ error: "Dados de revisão não encontrados." });
});

// Endpoint para dicas de manutenção
app.get('/api/dicas-manutencao/:tipoVeiculo?', (req, res) => {
    const { tipoVeiculo } = req.params;
    const dicas = dicasManutencao[tipoVeiculo] || dicasManutencao["Geral"];
    if (dicas) res.json(dicas);
    else res.status(404).json({ error: "Nenhuma dica encontrada." });
});

// Endpoint para veículos em destaque
app.get('/api/veiculos-destaque', (req, res) => {
    res.json(veiculosDestaque);
});

// Endpoint para serviços oferecidos
app.get('/api/servicos-oferecidos', (req, res) => {
    res.json(servicosOferecidos);
});

// Endpoint para peças recomendadas
app.get('/api/pecas-recomendadas/:tipoVeiculo', (req, res) => {
    const { tipoVeiculo } = req.params;
    const pecas = pecasRecomendadas[tipoVeiculo];
    if (pecas) res.json(pecas);
    else res.status(404).json({ error: `Recomendações não encontradas para '${tipoVeiculo}'.` });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    if (!OPENWEATHER_API_KEY) console.warn('ATENÇÃO: OPENWEATHER_API_KEY_BACKEND não está definida!');
    else console.log('OPENWEATHER_API_KEY_BACKEND carregada com sucesso.');
});