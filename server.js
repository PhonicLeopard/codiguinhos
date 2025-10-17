// server.js (trecho relevante atualizado)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Dependência para criptografia

// Corrija os caminhos para apontar para dentro das pastas
const User = require('./models/User.js'); 
const authMiddleware = require('./middleware/auth.js');

// Os outros modelos provavelmente também estão na pasta models, confira!
// Se estiverem, o correto seria:
const Veiculo = require('./models/VeiculoModel.js'); 
const Manutencao = require('./models/ManutencaoModel.js');
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ... (Conexão com o banco de dados permanece a mesma) ...
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
//                     ROTAS DE AUTENTICAÇÃO
// =========================================================================

// ROTA DE REGISTRO (POST /api/auth/register)
app.post('/api/auth/register', async (req, res) => { /* ... (código anterior) ... */ });

// ROTA DE LOGIN (POST /api/auth/login) - IMPLEMENTADA
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // 1. Buscar o usuário pelo e-mail
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Resposta genérica por segurança (não informa se o e-mail existe)
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // 2. Comparar a senha enviada com a senha criptografada no banco
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // 3. Se as senhas baterem, gerar um JWT
        const payload = {
            userId: user._id // O dado que queremos associar ao token
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("ERRO GRAVE: JWT_SECRET não definido no arquivo .env");
            return res.status(500).json({ message: "Erro de configuração no servidor." });
        }

        const token = jwt.sign(
            payload,
            secret,
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        // 4. Retornar o token para o cliente
        res.status(200).json({
            message: "Login bem-sucedido!",
            token: token,
            user: { // Enviamos alguns dados do usuário para o frontend usar
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
});


// =========================================================================
//              ROTAS DE VEÍCULOS (PROTEGIDAS E COM LÓGICA DE DONO)
// =========================================================================

// GET: Listar todos os veículos DO USUÁRIO LOGADO
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        // A busca agora filtra pelo 'owner' que corresponde ao ID do usuário no token
        const veiculos = await Veiculo.find({ owner: req.userId })
            .sort({ createdAt: -1 })
            .populate('historicoManutencoes');
        res.status(200).json(veiculos);
    } catch (e) {
        res.status(500).json({ message: "Erro ao buscar veículos." });
    }
});

// POST: Criar um novo veículo PARA O USUÁRIO LOGADO
app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        // Adicionamos o 'owner' ao objeto do veículo com o ID do usuário do token
        const v = new Veiculo({ ...req.body, owner: req.userId });
        const s = await v.save();
        res.status(201).json(s);
    } catch (e) {
        res.status(400).json({ message: "Erro ao criar veículo." });
    }
});

// PUT: Atualizar um veículo existente, VERIFICANDO SE PERTENCE AO USUÁRIO
app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        // A atualização só funcionará se o _id do veículo E o owner corresponderem
        const v = await Veiculo.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            req.body,
            { new: true }
        );
        // Se v for nulo, ou o veículo não existe ou não pertence ao usuário
        if (!v) return res.status(404).json({ message: "Veículo não encontrado ou você não tem permissão para editá-lo." });
        res.status(200).json(v);
    } catch (e) {
        res.status(400).json({ message: "Erro ao atualizar veículo." });
    }
});

// DELETE: Deletar um veículo, VERIFICANDO SE PERTENCE AO USUÁRIO
app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.findOneAndDelete({ _id: req.params.id, owner: req.userId });
        if (!v) return res.status(404).json({ message: "Veículo não encontrado ou você não tem permissão para excluí-lo." });

        // Também deletamos as manutenções associadas
        await Manutencao.deleteMany({ veiculo: req.params.id });
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ message: "Erro ao deletar veículo." });
    }
});

// POST: Adicionar manutenção, VERIFICANDO SE O VEÍCULO PERTENCE AO USUÁRIO
app.post('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        // Primeiro, encontramos o veículo E checamos se pertence ao usuário
        const v = await Veiculo.findOne({ _id: req.params.veiculoId, owner: req.userId });
        if (!v) return res.status(404).json({ message: "Veículo não encontrado ou você não tem permissão." });

        const m = new Manutencao({ ...req.body, veiculo: v._id });
        await m.save();
        v.historicoManutencoes.push(m._id);
        await v.save();
        res.status(201).json(m);
    } catch (e) {
        res.status(400).json({ message: "Erro ao criar manutenção." });
    }
});


// =========================================================================
//                  ROTA PROXY PARA O CLIMA (PÚBLICA)
// =========================================================================
app.get('/api/weather', async (req, res) => { /* ... (código anterior sem alterações) ... */ });


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