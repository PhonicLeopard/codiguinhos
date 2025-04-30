// js/Carro.js
import Veiculo from './Veiculo.js'; // Importa a classe base Veiculo

/**
 * @class Carro
 * @extends Veiculo
 * @classdesc Representa um carro comum, herda de Veiculo, adiciona velocidade, KM, etc.
 */
export default class Carro extends Veiculo {
  /** @property {number} velocidade Velocidade atual em km/h. */
  velocidade;
  /** @property {number} maxVelocidade Velocidade máxima em km/h. */
  maxVelocidade;
  /** @property {number} quilometragem Quilometragem total. */
  quilometragem;

  /**
   * Cria uma instância de Carro.
   * @param {string} modelo Modelo do carro.
   * @param {string} cor Cor do carro.
   * @param {string} [imagem='placeholder.png'] URL da imagem.
   */
  constructor(modelo, cor, imagem = 'placeholder.png') {
    // Garante imagem válida ou placeholder
    const imgFinal = (typeof imagem === 'string' && imagem.trim() !== '') ? imagem.trim() : 'placeholder.png';
    super(modelo, cor, imgFinal); // Chama construtor pai
    this.velocidade = 0;
    this.maxVelocidade = 180; // Padrão para carro comum
    this.quilometragem = 0;
    console.log(`Carro instanciado: ${this.modelo}`);
  }

  /**
   * Tenta aumentar a velocidade.
   * @param {number} [incremento=10] Valor a adicionar (km/h).
   * @returns {boolean} True se acelerou, false se impedido.
   */
  acelerar(inc = 10) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) {
      console.warn(`Carro ${this.modelo}: Incremento inválido ${inc}`);
      return false;
    }
    if (!this.ligado) {
      console.warn(`Carro ${this.modelo}: Tentativa de acelerar desligado.`);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      console.info(`Carro ${this.modelo}: Velocidade máxima ${this.maxVelocidade} km/h atingida.`);
      return false;
    }
    this.velocidade = Math.min(this.velocidade + n, this.maxVelocidade);
    console.log(`Carro ${this.modelo}: Acelerou para ${this.velocidade.toFixed(0)} km/h.`);
    return true;
  }

  /**
   * Tenta diminuir a velocidade.
   * @param {number} [decremento=10] Valor a subtrair (km/h).
   * @returns {boolean} True se freou, false se já parado ou inválido.
   */
  frear(dec = 10) {
    const n = Number(dec);
    if (isNaN(n) || n <= 0) {
      console.warn(`Carro ${this.modelo}: Decremento inválido ${dec}`);
      return false;
    }
    if (this.velocidade === 0) {
      console.info(`Carro ${this.modelo}: Já está parado.`);
      return false; // Não mudou estado significativamente
    }
    this.velocidade = Math.max(0, this.velocidade - n);
    console.log(`Carro ${this.modelo}: Freou para ${this.velocidade.toFixed(0)} km/h.`);
    return true;
  }

  /**
   * Simula rodagem, aumentando a quilometragem.
   * @param {number} distancia Distância em km (> 0).
   * @returns {boolean} True se rodou, false se desligado ou inválido.
   */
  rodar(distancia) {
    const dist = Number(distancia);
    if (isNaN(dist) || dist <= 0) {
      console.warn(`Carro ${this.modelo}: Distância inválida ${distancia}`);
      return false;
    }
    if (!this.ligado) {
      console.warn(`Carro ${this.modelo}: Tentativa de rodar desligado.`);
      return false;
    }
    this.quilometragem += dist;
    console.log(`Carro ${this.modelo}: Rodou ${dist.toFixed(1)} km. Total: ${this.quilometragem.toFixed(1)} km.`);
    return true;
  }

  /**
   * Gera HTML com informações do Carro (inclui base + KM + Barra Velocidade).
   * @override
   * @returns {string} HTML formatado.
   */
  getDisplayInfo() {
    let baseInfoHtml = super.getDisplayInfo(); // Pega ID, Modelo, Cor, Status

    // Adiciona KM
    baseInfoHtml += `<div class="info-item"><strong>KM Rodados:</strong> ${this.quilometragem.toLocaleString("pt-BR", {maximumFractionDigits: 0})}</div>`;

    // Adiciona Barra de Velocidade
    if (typeof this.maxVelocidade === "number" && this.maxVelocidade > 0) {
      const speedPercentage = Math.max(0, Math.min(100, (this.velocidade / this.maxVelocidade) * 100));
      baseInfoHtml += `
        <div class="speed-bar-container">
          <div class="speed-bar-label">Velocidade (${this.velocidade.toFixed(0)} / ${this.maxVelocidade} km/h):</div>
          <div class="speed-bar">
            <div class="speed-bar-fill" style="width: ${speedPercentage.toFixed(2)}%;"></div>
          </div>
        </div>`;
    } else {
      // Fallback
      baseInfoHtml += `<div class="info-item"><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h</div>`;
    }
    return baseInfoHtml;
  }

  /**
   * Tenta desligar o carro, adicionando regra de velocidade = 0.
   * @override
   * @returns {boolean} True se desligou, false se em movimento ou já desligado.
   */
  desligar() {
    if (this.velocidade > 0) {
      console.warn(`Carro ${this.modelo}: Não pode desligar em movimento (${this.velocidade.toFixed(0)} km/h).`);
      // Erro será notificado por 'interagir'
      return false;
    }
    // Se velocidade é 0, delega para a lógica base de Veiculo.desligar()
    return super.desligar();
  }
}