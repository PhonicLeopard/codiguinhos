// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch'); // Necessário para a API de clima
const Veiculo = require('./models/VeiculoModel');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(express.json()); // Permite que o servidor entenda JSON
// Middleware de CORS para permitir requisições do seu frontend (Live Server)
app.use((req, res, next) => {
    // A origem 'http://127.0.0.1:5500' é a padrão do Live Server. Ajuste se for diferente.
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); 
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// --- Conexão com o Banco de Dados ---
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI_CRUD);
        console.log("✅ Conectado ao MongoDB com sucesso!");
    } catch (error) {
        console.error("❌ FALHA FATAL ao conectar ao MongoDB:", error);
        process.exit(1); // Encerra a aplicação se não conseguir conectar
    }
}

// =========================================================================
//                               ROTAS DA API
// =========================================================================

// Rota de Teste
app.get('/', (req, res) => res.send('API da Garagem Inteligente PRO está no ar!'));

// ROTA CORRIGIDA -> POST /api/veiculos (CRIAR UM NOVO VEÍCULO)
app.post('/api/veiculos', async (req, res) => {
    try {
        // 1. Cria uma nova instância do modelo 'Veiculo' com os dados do corpo da requisição
        const novoVeiculo = new Veiculo(req.body);
        
        // 2. Salva o novo veículo no banco de dados
        const veiculoSalvo = await novoVeiculo.save();
        
        // 3. Responde com status 201 (Created) e o documento do veículo salvo (incluindo o _id gerado)
        console.log('✅ Veículo salvo no DB:', veiculoSalvo.modelo);
        res.status(201).json(veiculoSalvo);

    } catch (error) {
        // Se houver um erro de validação ou outro problema, informa o erro.
        console.error('❌ Erro ao salvar veículo:', error.message);
        res.status(400).json({ message: "Erro ao criar veículo.", error: error.message });
    }
});

// --- Outras rotas (GET, PUT, DELETE, /api/weather) permanecem as mesmas da versão anterior ---
// GET: Buscar todos os veículos
app.get('/api/veiculos', async (req, res) => {
    try {
        const veiculos = await Veiculo.find().sort({ createdAt: -1 });
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos.", error: error.message });
    }
});

// PUT: Atualizar um veículo
app.put('/api/veiculos/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    try {
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!veiculoAtualizado) return res.status(404).json({ message: "Veículo não encontrado." });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar veículo.", error: error.message });
    }
});

// DELETE: Excluir um veículo
app.delete('/api/veiculos/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    try {
        const veiculoDeletado = await Veiculo.findByIdAndDelete(req.params.id);
        if (!veiculoDeletado) return res.status(404).json({ message: "Veículo não encontrado." });
        res.status(204).send(); // Resposta 204 No Content é ideal para DELETE
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar veículo.", error: error.message });
    }
});

// Rota Proxy para a API de Clima
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!city) return res.status(400).json({ message: 'O nome da cidade é obrigatório.' });
    if (!apiKey) return res.status(500).json({ message: 'Chave da API de clima não configurada no servidor.' });
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const weatherResponse = await fetch(url);
        const weatherData = await weatherResponse.json();
        if (!weatherResponse.ok) return res.status(weatherResponse.status).json(weatherData);
        res.status(200).json(weatherData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao se comunicar com a API de clima.', error: error.message });
    }
});


// --- Inicialização do Servidor ---
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`🚀 Servidor backend rodando na porta ${PORT}`));
}

startServer();