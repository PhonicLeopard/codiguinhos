// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const Veiculo = require('./VeiculoModel.js');
const Manutencao = require('./ManutencaoModel.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Para simplificar, permite qualquer origem
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
        process.exit(1);
    }
}

// =========================================================================
//                     ROTAS PRINCIPAIS - VEÍCULOS (CRUD)
// =========================================================================

// GET: Buscar todos os veículos (COM MANUTENÇÕES POPULADAS)
app.get('/api/veiculos', async (req, res) => {
    try {
        // A mágica acontece aqui: .populate() busca os detalhes de cada manutenção
        // que está referenciada no array 'historicoManutencoes' de cada veículo.
        const veiculos = await Veiculo.find().sort({ createdAt: -1 }).populate('historicoManutencoes');
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos.", error: error.message });
    }
});

// POST: Criar um novo veículo
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculo = new Veiculo(req.body);
        const veiculoSalvo = await novoVeiculo.save();
        res.status(201).json(veiculoSalvo);
    } catch (error) {
        res.status(400).json({ message: "Erro ao criar veículo.", error: error.message });
    }
});

// PUT: Atualizar um veículo por ID
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!veiculoAtualizado) return res.status(404).json({ message: "Veículo não encontrado." });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        res.status(400).json({ message: "Erro ao atualizar veículo.", error: error.message });
    }
});

// DELETE: Excluir um veículo por ID
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        const veiculoDeletado = await Veiculo.findByIdAndDelete(req.params.id);
        if (!veiculoDeletado) return res.status(404).json({ message: "Veículo não encontrado." });

        // Opcional: Deletar todas as manutenções associadas a este veículo para não deixar lixo no DB
        await Manutencao.deleteMany({ veiculo: req.params.id });

        res.status(204).send(); // Sucesso, sem conteúdo para retornar
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar veículo.", error: error.message });
    }
});


// =========================================================================
//                  ROTAS DE SUB-RECURSO - MANUTENÇÕES
// =========================================================================

// ROTA: Criar uma nova manutenção para UM veículo específico
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;

        // 1. Validação: Verifica se o veículo com o ID fornecido existe.
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado. Impossível registrar manutenção." });
        }

        // 2. Criação: Cria a nova manutenção, associando-a ao veículo.
        const novaManutencao = new Manutencao({ 
            ...req.body,      // Pega dados como { tipo, custo, data } do corpo da requisição
            veiculo: veiculoId // Adiciona a referência obrigatória ao ID do veículo.
        });
        await novaManutencao.save();

        // 3. Vínculo: Adiciona a referência da nova manutenção ao array do veículo.
        veiculo.historicoManutencoes.push(novaManutencao._id);
        await veiculo.save();

        res.status(201).json(novaManutencao);
    } catch (error) {
        res.status(400).json({ message: "Erro ao criar manutenção.", error: error.message });
    }
});


// --- Inicialização do Servidor ---
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`🚀 Servidor backend rodando na porta ${PORT}`));
}

// Adicione este código dentro do seu arquivo server.js

/**
 * ROTA: POST /api/veiculos/:veiculoId/manutencoes
 * OBJETIVO: Criar um novo registro de manutenção e associá-lo a um veículo existente.
 */
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    // Envolve toda a lógica em um bloco try...catch para tratamento de erros
    try {
        // 1. Extrai o veiculoId dos parâmetros da rota (ex: da URL /api/veiculos/123/manutencoes)
        const { veiculoId } = req.params;

        // 2. Valida se o veículo com o ID fornecido realmente existe no banco de dados.
        //    Isso previne a criação de manutenções "órfãs".
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            // Se o findById retorna null, o veículo não foi encontrado.
            return res.status(404).json({ message: "Veículo não encontrado. Impossível registrar manutenção." });
        }

        // 3. Cria uma nova instância do modelo 'Manutencao'.
        //    - Usa o spread operator (...) para pegar todos os dados do corpo da requisição (tipo, custo, etc.)
        //    - Adiciona a referência obrigatória ao ID do veículo.
        const novaManutencao = new Manutencao({ 
            ...req.body, 
            veiculo: veiculoId 
        });
        
        // 4. Salva a nova manutenção no banco de dados. Se houver erro de validação (ex: custo negativo),
        //    o Mongoose lançará um erro que será capturado pelo bloco catch.
        await novaManutencao.save();

        // PASSO EXTRA ESSENCIAL: Atualiza o documento do veículo para incluir a referência a esta nova manutenção.
        // Isso é o que permite que o .populate() funcione corretamente na rota GET /api/veiculos.
        veiculo.historicoManutencoes.push(novaManutencao._id);
        await veiculo.save();

        // 5. Se tudo correu bem, responde com o status 201 (Created) e o documento da manutenção recém-criada.
        res.status(201).json(novaManutencao);

    } catch (error) {
        // 6. Lida com os erros que podem ter ocorrido.
        if (error.name === 'ValidationError') {
            // Se o erro foi lançado pelo Mongoose por falha na validação dos dados (ex: campo obrigatório faltando)
            res.status(400).json({ message: "Erro de validação nos dados da manutenção.", error: error.message });
        } else {
            // Para todos os outros tipos de erro (ex: falha de conexão com o DB)
            console.error('❌ Erro ao criar manutenção:', error); // Loga o erro no console do servidor para depuração
            res.status(500).json({ message: "Erro interno no servidor ao tentar criar manutenção.", error: error.message });
        }
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    // Envolve a lógica em um bloco try...catch para tratamento de erros.
    try {
        // 1. Extrai o veiculoId dos parâmetros da rota.
        const { veiculoId } = req.params;

        // 2. (Opcional, mas recomendado) Valida se o veículo pai existe.
        //    Isso fornece uma mensagem de erro mais clara ("Veículo não encontrado")
        //    em vez de apenas retornar uma lista vazia.
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }

        // 3. Usa o modelo Manutencao para encontrar todos os documentos
        //    cujo campo 'veiculo' corresponde ao veiculoId da rota.
        // 4. Ordena (sort) os resultados pela data em ordem decrescente (-1),
        //    colocando os serviços mais recentes no topo da lista.
        const manutenções = await Manutencao.find({ veiculo: veiculoId }).sort({ data: -1 });

        // 5. Retorna a lista de manutenções encontradas (pode ser uma lista vazia)
        //    com o status 200 (OK).
        res.status(200).json(manutenções);

    } catch (error) {
        // 6. Lida com erros internos do servidor.
        console.error('❌ Erro ao buscar manutenções:', error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar manutenções.", error: error.message });
    }
});

startServer();