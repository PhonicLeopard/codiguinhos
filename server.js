// A LINHA ABAIXO PRECISA SER A PRIMEIRA INSTRUÇÃO DE CÓDIGO DO ARQUIVO
require('dotenv').config();

// AGORA SIM, O RESTO DO CÓDIGO
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const Veiculo = require('./VeiculoModel.js');
const Manutencao = require('./ManutencaoModel.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
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
        console.error("❌ FALHA FATAL ao conectar ao MongoDB:", error.message);
        process.exit(1);
    }
}

// =========================================================================
//                     ROTAS DE VEÍCULOS (CRUD)
// =========================================================================
app.get('/api/veiculos', async (req, res) => { try { const veiculos = await Veiculo.find().sort({ createdAt: -1 }).populate('historicoManutencoes'); res.status(200).json(veiculos); } catch (e) { res.status(500).json({ message: "Erro ao buscar veículos."}); } });
app.post('/api/veiculos', async (req, res) => { try { const v = new Veiculo(req.body); const s = await v.save(); res.status(201).json(s); } catch (e) { res.status(400).json({ message: "Erro ao criar veículo."}); } });
app.put('/api/veiculos/:id', async (req, res) => { try { const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!v) return res.status(404).json({ message: "Veículo não encontrado." }); res.status(200).json(v); } catch (e) { res.status(400).json({ message: "Erro ao atualizar veículo."}); } });
app.delete('/api/veiculos/:id', async (req, res) => { try { const v = await Veiculo.findByIdAndDelete(req.params.id); if (!v) return res.status(404).json({ message: "Veículo não encontrado." }); await Manutencao.deleteMany({ veiculo: req.params.id }); res.status(204).send(); } catch (e) { res.status(500).json({ message: "Erro ao deletar veículo."}); } });
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => { try { const v = await Veiculo.findById(req.params.veiculoId); if (!v) return res.status(404).json({ message: "Veículo não encontrado." }); const m = new Manutencao({ ...req.body, veiculo: v._id }); await m.save(); v.historicoManutencoes.push(m._id); await v.save(); res.status(201).json(m); } catch (e) { res.status(400).json({ message: "Erro ao criar manutenção."}); } });

// =========================================================================
//                  ROTA PROXY PARA O CLIMA
// =========================================================================
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    if (!city) {
        return res.status(400).json({ message: "O nome da cidade é obrigatório." });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        console.error("ERRO GRAVE: A chave OPENWEATHER_API_KEY não foi encontrada. Verifique o arquivo .env e a ordem do require('dotenv').config() no server.js.");
        return res.status(500).json({ message: "A chave da API de clima não foi configurada corretamente no servidor." });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "Não foi possível obter a previsão do tempo.";
        console.error(`Erro ao buscar clima para "${city}":`, message);
        res.status(status).json({ message });
    }
});

// =========================================================================
//                  INICIALIZAÇÃO DO SERVIDOR
// =========================================================================
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
    });
}

startServer();