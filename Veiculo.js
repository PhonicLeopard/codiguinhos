// js/Veiculo.js
import Manutencao from './Manutencao.js';

export default class Veiculo {
  id;
  modelo;
  cor;
  imagem;
  ligado;
  historicoManutencoes;

  constructor(modelo, cor, imagem = 'placeholder.png') {
    if (typeof modelo !== 'string' || modelo.trim() === '') throw new Error("Modelo inválido para Veiculo.");
    if (typeof cor !== 'string' || cor.trim() === '') throw new Error("Cor inválida para Veiculo.");
    
    this.id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.modelo = modelo.trim();
    this.cor = cor.trim();
    this.imagem = (typeof imagem === 'string' && imagem.trim() !== '') ? imagem.trim() : 'placeholder.png';
    this.ligado = false;
    this.historicoManutencoes = [];
    console.log(`Veiculo Base criado: ${this.modelo}`);
  }

  ligar() { /* ... Lógica existente ... */ }
  desligar() { /* ... Lógica existente ... */ }
  buzinar() { /* ... Lógica existente ... */ }
  
  registrarManutencao(data, tipo, custo, descricao) {
    const novaManutencao = new Manutencao(data, tipo, custo, descricao);
    this.historicoManutencoes.push(novaManutencao);
    this.historicoManutencoes.sort((a, b) => b.data.getTime() - a.data.getTime());
    return true;
  }
  
  getPastMaintenances() {
    return this.historicoManutencoes.filter(m => m.data <= new Date());
  }

  getFutureMaintenances() {
    return this.historicoManutencoes.filter(m => m.data > new Date());
  }

  updateProperties(novoModelo, novaCor, novaImagem) { /* ... Lógica existente ... */ }
  getDisplayInfo() { /* ... Lógica existente ... */ }
}