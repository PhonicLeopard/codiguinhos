// Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors'; // Importa o pacote cors

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001; // Porta para o servidor backend
                                    // Use uma porta diferente do frontend se rodar ambos localmente
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para habilitar CORS de forma simples (permite todas as origens por padrão)
app.use(cors());

// ----- NOSSO PRIMEIRO ENDPOINT: Previsão do Tempo -----
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params; // Pega o parâmetro :cidade da URL

    if (!apiKey) {
        console.error('[Servidor] ERRO FATAL: Chave da API OpenWeatherMap não carregada do .env');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Recebida requisição para: /api/previsao/${cidade}`);
        console.log(`[Servidor] URL da API Externa: ${weatherAPIUrl.replace(apiKey, "SUA_CHAVE_OCULTA")}`); // Não logar a chave completa
        
        const apiResponse = await axios.get(weatherAPIUrl);
        
        console.log(`[Servidor] Sucesso! Dados recebidos da OpenWeatherMap para ${cidade}. Status: ${apiResponse.status}`);
        
        // Enviamos a resposta da API OpenWeatherMap diretamente para o nosso frontend
        res.json(apiResponse.data);

    } catch (error) {
        // Log detalhado do erro no servidor
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com um status code
            // que cai fora do range de 2xx
            console.error(`[Servidor] Erro da API OpenWeatherMap (Status: ${error.response.status}):`, error.response.data);
            const status = error.response.status;
            const message = error.response.data?.message || 'Erro ao buscar dados da API externa.';
            return res.status(status).json({ error: message, details: error.response.data });
        } else if (error.request) {
            // A requisição foi feita mas nenhuma resposta foi recebida
            console.error('[Servidor] Erro de requisição: Nenhuma resposta recebida da API OpenWeatherMap.', error.request);
            return res.status(503).json({ error: 'Serviço da API externa indisponível ou sem resposta.' });
        } else {
            // Algo aconteceu na configuração da requisição que acionou um erro
            console.error('[Servidor] Erro ao configurar requisição para OpenWeatherMap:', error.message);
            return res.status(500).json({ error: 'Erro interno no servidor ao preparar a requisição.', details: error.message });
        }
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    if (!apiKey) {
        console.warn('[Servidor] ATENÇÃO: A chave da API OpenWeatherMap (OPENWEATHER_API_KEY) não foi encontrada no arquivo .env ou não foi carregada corretamente.');
        console.warn('[Servidor] Certifique-se de que o arquivo .env existe na pasta "backend" e contém a linha OPENWEATHER_API_KEY=SUA_CHAVE_REAL');
    } else {
        console.log('[Servidor] Chave da API OpenWeatherMap carregada com sucesso.');
    }
});