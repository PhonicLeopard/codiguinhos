import Carro from './Carro.js';

export default class CarroEsportivo extends Carro {
  turboAtivado = false;
  maxVelocidade = 350;

  constructor(modelo, cor, imagem) {
    super(modelo, cor, imagem);
  }
  
  getDisplayInfo() {
      let baseInfo = super.getDisplayInfo();
      const turboStatus = this.turboAtivado ? '<span style="color:red; font-weight:bold;">ATIVADO</span>' : 'Desativado';
      baseInfo += `<div class="info-item"><strong>Turbo:</strong> ${turboStatus}</div>`;
      return baseInfo;
  }
}