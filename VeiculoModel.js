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
    min: 0, 
    default: 0 
  },
  // A referência chave para o veículo ao qual esta manutenção pertence.
  veiculo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Veiculo', // Diz ao Mongoose que este ID se refere a um documento na coleção 'Veiculo'
    required: true
  }
}, { timestamps: true });

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

module.exports = Manutencao;