// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch'); // Necessário para a API de clima
const Veiculo = require('./models/VeiculoModel');
const Manutencao = require('./models/ManutencaoModel'); // <-- ADICIONE ESTA LINHA

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

// GET: Buscar todos os veículos (COM MANUTENÇÕES POPULADAS)
app.get('/api/veiculos', async (req, res) => {
    try {
        // A mágica do .populate() acontece aqui.
        const veiculos = await Veiculo.find().sort({ createdAt: -1 }).populate('historicoManutencoes');
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
// Importe o novo modelo no início do arquivo
const Manutencao = require('./models/ManutencaoModel');

// ...

// ROTA: Listar todas as manutenções de UM veículo específico
app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.veiculoId)) {
            return res.status(400).json({ message: "ID do veículo inválido." });
        }
        const manutenções = await Manutencao.find({ veiculo: req.params.veiculoId }).sort({ data: -1 });
        res.status(200).json(manutenções);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar manutenções.", error: error.message });
    }
});

// ROTA: Criar uma nova manutenção para UM veículo específico
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(veiculoId)) {
            return res.status(400).json({ message: "ID do veículo inválido." });
        }
        
        // 1. Verifique se o veículo realmente existe
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }

        // 2. Crie a nova manutenção, associando-a ao veículo
        const novaManutencao = new Manutencao({ ...req.body, veiculo: veiculoId });
        await novaManutencao.save();

        // 3. Adicione a referência da nova manutenção ao array do veículo
        veiculo.historicoManutencoes.push(novaManutencao._id);
        await veiculo.save();
        
        res.status(201).json(novaManutencao);

    } catch (error) {
        res.status(400).json({ message: "Erro ao criar manutenção.", error: error.message });
    }
});
app.get('/api/veiculos', async (req, res) => {
    try {
        // A mágica acontece aqui: .populate() busca os detalhes de cada manutenção referenciada
        const veiculos = await Veiculo.find().sort({ createdAt: -1 }).populate('historicoManutencoes');
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos.", error: error.message });
    }
});
// =========================================================================
//                  ROTAS DE MANUTENÇÃO (SUB-RECURSO)
// =========================================================================

// ROTA: POST /api/veiculos/:veiculoId/manutencoes (CRIAR UMA NOVA MANUTENÇÃO PARA UM VEÍCULO)
app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        // 1. Extrai o veiculoId dos parâmetros da rota.
        const { veiculoId } = req.params;

        // 2. Valida se o veículo com esse ID realmente existe.
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            // Se não existir, retorna um erro 404 (Not Found).
            return res.status(404).json({ message: "Veículo não encontrado." });
        }

        // 3. Cria a nova manutenção, associando-a ao veículo.
        const novaManutencao = new Manutencao({ 
            ...req.body, // Pega todos os dados do corpo da requisição (tipo, custo, etc.)
            veiculo: veiculoId // Adiciona a referência ao ID do veículo.
        });
        
        // 4. Salva a nova manutenção no banco de dados.
        await novaManutencao.save();

        // (Passo extra, mas essencial para consistência)
        // 5. Adiciona a referência da nova manutenção ao array do veículo.
        veiculo.historicoManutencoes.push(novaManutencao._id);
        await veiculo.save();

        // 6. Se bem-sucedido, retorna um status 201 (Created) com o documento salvo.
        res.status(201).json(novaManutencao);

    } catch (error) {
        // 7. Lida com erros.
        if (error.name === 'ValidationError') {
            // Erros de validação do Mongoose retornam 400 (Bad Request).
            res.status(400).json({ message: "Erro de validação.", error: error.message });
        } else {
            // Outros erros internos retornam 500 (Internal Server Error).
            console.error('❌ Erro ao criar manutenção:', error);
            res.status(500).json({ message: "Erro interno ao criar manutenção.", error: error.message });
        }
    }
});
// ROTA: GET /api/veiculos/:veiculoId/manutencoes (LISTAR TODAS AS MANUTENÇÕES DE UM VEÍCULO)
app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        // 1. Extrai o veiculoId.
        const { veiculoId } = req.params;

        // 2. Valida se o veículo existe.
        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }

        // 3. Busca todas as manutenções associadas a este veículo...
        // 4. ...e ordena pela data mais recente.
        const manutenções = await Manutencao.find({ veiculo: veiculoId }).sort({ data: -1 });

        // 5. Retorna a lista de manutenções.
        res.status(200).json(manutenções);

    } catch (error) {
        // 6. Lida com erros do servidor.
        console.error('❌ Erro ao buscar manutenções:', error);
        res.status(500).json({ message: "Erro interno ao buscar manutenções.", error: error.message });
    }
});
// main.js

// ...

async function handleMaintenanceSubmit(event, isFuture) {
    event.preventDefault();
    if (!currentlySelectedVehicle) return;

    const form = event.target;

    // 1. Coleta os dados do formulário para enviar ao backend.
    const dadosFormulario = {
        data: new Date(form.elements[0].value + "T12:00:00"),
        tipo: form.elements[1].value.trim(), // 'tipo' corresponde ao schema do backend
        custo: isFuture ? 0 : parseFloat(form.elements[2].value),
        // Opcional: Se seu formulário tivesse quilometragem, você adicionaria aqui.
        // quilometragem: Number(form.elements[3].value),
    };

    try {
        // 2. Chama a função para fazer um POST para a nova rota de manutenção.
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}/manutencoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario),
        });

        // 3. Se o POST for bem-sucedido, recarrega a garagem para atualizar a lista.
        //    Esta é a sua "carregarManutencoes()" em ação!
        await initializeGarage(); 

        // 4. Re-seleciona o veículo para garantir que a UI mostre os dados atualizados.
        currentlySelectedVehicle = garage.find(v => v.id === currentlySelectedVehicle.id);
        
        // 5. Renderiza as listas de manutenção atualizadas.
        renderMaintenanceLists();
        form.reset();
        showNotification(`Serviço ${isFuture ? 'agendado' : 'registrado'} com sucesso!`, 'success');

    } catch (error) {
        // A função fetchAPI já lida com a exibição da notificação de erro.
        console.error("Falha ao submeter o formulário de manutenção.");
    }
}

// ...


startServer();