import Carro from './Carro.js';

export default class Caminhao extends Carro {
  capacidadeCarga;
  cargaAtual = 0;

  constructor(modelo, cor, capacidadeCarga = 5000, imagem) {
    super(modelo, cor, imagem);
    this.capacidadeCarga = capacidadeCarga;
    this.maxVelocidade = 120;
  }

  getDisplayInfo() {
      let baseInfo = super.getDisplayInfo();
      baseInfo += `<div class="info-item"><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString("pt-BR")} kg</div>`;
      baseInfo += `<div class="info-item"><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString("pt-BR")} kg</div>`;
      return baseInfo;
  }
}