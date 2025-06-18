// backend-proxy/server.js

const express = require('express');
const fetch = require('node-fetch'); // Ou: import fetch from 'node-fetch'; se package.json tiver "type": "module"
require('dotenv').config(); // Para carregar variáveis do arquivo .env

const app = express();
const PORT = process.env.PORT || 3001; // Porta para o servidor local
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY_BACKEND; // Nome diferente da do frontend

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
// Isso é importante se seu frontend e backend rodarem em portas diferentes localmente
// ou quando o frontend for consumir o backend publicado.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permite qualquer origem (para desenvolvimento)
                                                  // Em produção, restrinja para a URL do seu frontend
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint do seu backend que o frontend vai chamar
// ex: http://localhost:3001/api/weather?city=Londres
app.get('/api/weather', async (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.status(400).json({ error: 'Parâmetro "city" é obrigatório.' });
    }

    if (!OPENWEATHER_API_KEY) {
        console.error('ERRO: OPENWEATHER_API_KEY_BACKEND não está definida no backend!');
        return res.status(500).json({ error: 'Configuração do servidor incompleta (API Key).' });
    }

    const units = 'metric';
    const lang = 'pt_br';
    const weatherURL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${units}&lang=${lang}&appid=${OPENWEATHER_API_KEY}`;

    console.log(`Backend: Recebida requisição para cidade: ${city}`);
    console.log(`Backend: Buscando dados de: ${weatherURL.replace(OPENWEATHER_API_KEY, "SUA_CHAVE_BACKEND")}`);


    try {
        const weatherResponse = await fetch(weatherURL);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            // Se a OpenWeatherAPI retornar um erro (ex: cidade não encontrada, chave inválida)
            console.error('Backend: Erro da API OpenWeatherMap:', weatherData);
            return res.status(weatherResponse.status).json(weatherData);
        }

        console.log('Backend: Dados da OpenWeatherMap recebidos com sucesso.');
        res.json(weatherData); // Envia os dados da OpenWeatherMap para o frontend

    } catch (error) {
        console.error('Backend: Erro ao buscar dados da OpenWeatherMap:', error);
        res.status(500).json({ error: 'Falha ao buscar dados do clima.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend (proxy) rodando na porta ${PORT}`);
    if (!OPENWEATHER_API_KEY) {
        console.warn('ATENÇÃO: A variável de ambiente OPENWEATHER_API_KEY_BACKEND não está definida!');
        console.warn('O endpoint /api/weather não funcionará corretamente sem ela.');
    } else {
        console.log('OPENWEATHER_API_KEY_BACKEND carregada com sucesso.');
    }
    // (Cole isso dentro de server.js, depois da rota /api/weather)

// Dados mocados para as novas rotas
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

// Endpoint para detalhes de revisão
app.get('/api/revisao/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;
    console.log(`Backend: Recebida requisição de revisão para ID: ${vehicleId}`);
    const revisao = dadosRevisao[vehicleId];
    if (revisao) {
        res.json(revisao);
    } else {
        res.status(404).json({ error: "Dados de revisão não encontrados para este veículo." });
    }
});

// Endpoint para dicas de manutenção
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const { tipoVeiculo } = req.params;
     console.log(`Backend: Recebida requisição de dicas para tipo: ${tipoVeiculo}`);
    const dicas = dicasManutencao[tipoVeiculo] || dicasManutencao["Geral"];
    if (dicas) {
        res.json(dicas);
    } else {
         res.status(404).json({ error: "Nenhuma dica encontrada." });
    }
    // =======================================================
//          BANCO DE DADOS SIMULADO (MOCK DATA)
// =======================================================

// (Dados da etapa anterior - mantenha-os aqui)
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

// =======================================================
//      NOVOS ESTOQUES DE DADOS (ATIVIDADE ATUAL)
// =======================================================

// 1. Estoque de dados para: GET /api/veiculos-destaque
const veiculosDestaque = [
  {
    "id_destaque": "dest01",
    "modelo": "Porsche 911 GT3 RS",
    "ano": 2024,
    "imagem_url": "https://files.porsche.com/filestore/image/multimedia/none/992-gt3-rs-modelimage-sideshot/model/cfbb8ed3-1a15-11ed-80f5-005056bbdc38/porsche-model.png",
    "descricao_destaque": "A perfeição da engenharia para as pistas, homologado para as ruas. Uma experiência de pilotagem pura e visceral.",
    "especificacao_chave": "Motor: 4.0L Boxer 6 Cil. Aspirado",
    "cor_destaque": "#93FF7A" // Verde "Lizard Green"
  },
  {
    "id_destaque": "dest02",
    "modelo": "Scania 770 S V8",
    "ano": 2023,
    "imagem_url": "https://www.scania.com/content/dam/group/products-and-services/trucks/s-series/gallery/exterior/Scania-S-series-V8-Exterior-Gallery-1-1920x1080.jpg",
    "descricao_destaque": "O Rei da Estrada. Combina potência incomparável com o máximo de conforto e tecnologia para longas distâncias.",
    "especificacao_chave": "Potência: 770 cv",
    "cor_destaque": "#3498DB" // Azul Scania
  },
  {
    "id_destaque": "dest03",
    "modelo": "Ford Mustang Dark Horse",
    "ano": 2024,
    "imagem_url": "https://www.ford.com/is/image/content/dam/vdm_ford/live/en_us/ford/nameplate/mustang/2024/collections/dm/24_FRD_MST_E7963.tif?croppathe=1_3x2&wid=720",
    "descricao_destaque": "A mais recente evolução do lendário 'pony car', com um V8 Coyote aprimorado e foco total na performance.",
    "especificacao_chave": "Câmbio: Manual de 6 marchas Tremec",
    "cor_destaque": "#B0B0B0" // Cinza Chumbo
  }
];

// 2. Estoque de dados para: GET /api/servicos-oferecidos
const servicosOferecidos = [
  {
    "id": "serv01",
    "nome": "Troca de Óleo e Filtro",
    "descricao": "Substituição do óleo do motor e do filtro de óleo, usando produtos recomendados pela montadora.",
    "custo_estimado": 350.00,
    "aplicavel_a": ["Carro", "CarroEsportivo", "Caminhao"]
  },
  {
    "id": "serv02",
    "nome": "Alinhamento e Balanceamento 3D",
    "descricao": "Ajuste da geometria das rodas com tecnologia 3D e balanceamento preciso para evitar vibrações.",
    "custo_estimado": 180.00,
    "aplicavel_a": ["Carro", "CarroEsportivo", "Caminhao"]
  },
  {
    "id": "serv03",
    "nome": "Revisão Completa de Freios",
    "descricao": "Inspeção e substituição de pastilhas, discos e fluido de freio, se necessário.",
    "custo_estimado": 550.00,
    "aplicavel_a": ["Carro", "CarroEsportivo"]
  },
  {
    "id": "serv04",
    "nome": "Diagnóstico de Performance (Turbo)",
    "descricao": "Verificação de mangueiras, pressão e performance geral do sistema de sobrealimentação.",
    "custo_estimado": 400.00,
    "aplicavel_a": ["CarroEsportivo"]
  },
  {
    "id": "serv05",
    "nome": "Manutenção do Sistema de Arla 32",
    "descricao": "Verificação de níveis, filtros e funcionamento do sistema de redução de emissões para motores diesel.",
    "custo_estimado": 250.00,
    "aplicavel_a": ["Caminhao"]
  }
];


// 3. Estoque de dados para: GET /api/pecas-recomendadas/:tipoVeiculo
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

// (Mantenha aqui as rotas existentes, como /api/weather, /api/revisao, etc.)

// --- NOVAS ROTAS DA ATIVIDADE ATUAL ---

// Endpoint 1: Retorna a lista de veículos em destaque
app.get('/api/veiculos-destaque', (req, res) => {
    console.log(`[Servidor] Requisição recebida para: /api/veiculos-destaque`);
    // Simplesmente retorna o array completo
    res.json(veiculosDestaque);
});

// Endpoint 2: Retorna a lista completa de serviços oferecidos pela garagem
app.get('/api/servicos-oferecidos', (req, res) => {
    console.log(`[Servidor] Requisição recebida para: /api/servicos-oferecidos`);
    // Simplesmente retorna o array completo
    res.json(servicosOferecidos);
});

// Endpoint 3: Retorna peças recomendadas para um tipo específico de veículo
// Note o uso de um parâmetro na URL (:tipoVeiculo)
app.get('/api/pecas-recomendadas/:tipoVeiculo', (req, res) => {
    // Captura o parâmetro da URL (ex: 'Carro', 'CarroEsportivo', 'Caminhao')
    const { tipoVeiculo } = req.params; 
    console.log(`[Servidor] Requisição de peças para o tipo: ${tipoVeiculo}`);

    // Busca no nosso objeto 'pecasRecomendadas' usando o tipo como chave
    const pecas = pecasRecomendadas[tipoVeiculo];

    if (pecas) {
        // Se encontrarmos peças para aquele tipo, retornamos o objeto correspondente
        res.json(pecas);
    } else {
        // Se o tipo de veículo não existir em nosso "banco de dados",
        // retornamos um erro 404 (Not Found)
        res.status(404).json({ 
            error: 'Tipo de veículo não encontrado.',
            mensagem: `Não há recomendações de peças para o tipo '${tipoVeiculo}'.`
        });
    }
});

// (OPCIONAL, mas uma ótima prática) Endpoint para buscar um serviço específico por ID
app.get('/api/servicos-oferecidos/:idServico', (req, res) => {
    const { idServico } = req.params;
    console.log(`[Servidor] Buscando serviço específico com ID: ${idServico}`);

    // Usa o método .find() para procurar no array o serviço com o ID correspondente
    const servico = servicosOferecidos.find(s => s.id === idServico);

    if (servico) {
        // Se encontrou, retorna o objeto do serviço
        res.json(servico);
    } else {
        // Se não encontrou, retorna um erro 404
        res.status(404).json({ error: 'Serviço não encontrado.' });
    }
});
