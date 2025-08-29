// models/ManutencaoModel.js
const mongoose = require('mongoose');

const manutencaoSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    required: [true, 'A descrição do serviço (tipo) é obrigatória.']
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
  veiculo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Veiculo', 
    required: true
  }
}, { 
  timestamps: true 
});

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

module.exports = Manutencao;