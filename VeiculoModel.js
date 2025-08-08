// models/VeiculoModel.js

const mongoose = require('mongoose');

// Define a estrutura (Schema) para os veículos no MongoDB
const veiculoSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    required: true, 
    enum: ['Carro', 'CarroEsportivo', 'Caminhao'] 
  },
  modelo: { 
    type: String, 
    required: [true, 'O modelo do veículo é obrigatório.'] 
  },
  cor: { 
    type: String, 
    required: [true, 'A cor do veículo é obrigatória.'] 
  },
  imagem: { 
    type: String, 
    default: 'placeholder.png' 
  },
  // Campo específico para caminhões. Não é obrigatório para outros tipos.
  capacidadeCarga: { 
    type: Number,
    default: 0
  },
  // Armazena todos os registros de manutenção (passados e futuros)
  historicoManutencoes: {
    type: [Object],
    default: []
  }
}, {
  // Adiciona os campos `createdAt` e `updatedAt` automaticamente
  timestamps: true 
});

// Cria e exporta o Modelo 'Veiculo' que usaremos para interagir com a coleção 'veiculos'
const Veiculo = mongoose.model('Veiculo', veiculoSchema);

module.exports = Veiculo;