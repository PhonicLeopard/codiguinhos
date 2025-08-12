// models/ManutencaoModel.js

const mongoose = require('mongoose');


const manutencaoSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    required: [true, 'A descrição do serviço é obrigatória.'] 
  },
  data: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  custo: { 
    type: Number, 
    required: true, 
    min: [0, 'O custo não pode ser negativo.'], 
    default: 0 
  },
  
  // --- A LÓGICA DO RELACIONAMENTO IMPLEMENTADA AQUI ---
  // Este campo conecta a manutenção ao seu respectivo veículo.
  veiculo: {
    // 1. O tipo de dado é um ObjectId, o formato padrão de _id do MongoDB.
    type: mongoose.Schema.Types.ObjectId,
    
    // 2. A propriedade 'ref' informa ao Mongoose qual modelo procurar 
    //    ao popular este campo. [1, 5, 7, 9]
    ref: 'Veiculo', 
    
    // 3. Garante que nenhuma manutenção possa ser salva sem estar
    //    associada a um veículo.
    required: true 
  }
}, { 
  timestamps: true 
});

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

module.exports = Manutencao;