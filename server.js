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
});