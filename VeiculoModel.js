// models/VeiculoModel.js
const mongoose = require('mongoose');

const veiculoSchema = new mongoose.Schema({
  modelo: { type: String, required: [true, 'O modelo é obrigatório.'] },
  cor: { type: String, required: [true, 'A cor é obrigatória.'] },
  tipo: { 
    type: String, 
    required: [true, 'O tipo é obrigatório.'],
    enum: ['Carro', 'CarroEsportivo', 'Caminhao']
  },
  imagem: { type: String, default: 'placeholder.png' },
  capacidadeCarga: { type: Number, default: 0 },
  
  historicoManutencoes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manutencao' 
  }]

}, { 
  timestamps: true 
});

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

module.exports = Veiculo;