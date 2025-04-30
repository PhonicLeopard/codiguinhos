// js/CarroEsportivo.js
import Carro from './Carro.js'; // Importa a classe Carro

/**
 * @class CarroEsportivo
 * @extends Carro
 * @classdesc Representa um carro esportivo, herda de Carro, adiciona turbo.
 */
export default class CarroEsportivo extends Carro {
  /** @property {boolean} turboAtivado Status do turbo. */
  turboAtivado;

  /**
   * Cria uma instância de CarroEsportivo.
   * @param {string} modelo Modelo do esportivo.
   * @param {string} cor Cor do esportivo.
   * @param {string} [imagem='placeholder.png'] URL da imagem.
   */
  constructor(modelo, cor, imagem = 'placeholder.png') {
    super(modelo, cor, imagem); // Chama construtor de Carro
    this.turboAtivado = false;
    this.maxVelocidade = 350; // Velocidade máxima maior
    console.log(`Carro Esportivo instanciado: ${this.modelo}`);
  }

  /**
   * Acelera com boost se o turbo estiver ativo.
   * @override
   * @param {number} [incremento=25] Incremento base (km/h).
   * @returns {boolean} True se acelerou.
   */
  acelerar(inc = 25) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) {
      console.warn(`CarroEsportivo ${this.modelo}: Incremento inválido ${inc}`);
      return false;
    }
    if (!this.ligado) {
      console.warn(`CarroEsportivo ${this.modelo}: Tentativa de acelerar desligado.`);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      console.info(`CarroEsportivo ${this.modelo}: Velocidade máxima ${this.maxVelocidade} atingida.`);
      return false;
    }
    const boost = this.turboAtivado ? n * 1.8 : n; // Fator de boost do turbo
    this.velocidade = Math.min(this.velocidade + boost, this.maxVelocidade);
    console.log(`CarroEsportivo ${this.modelo} ${this.turboAtivado ? '(TURBO ON) ' : ''}acelerou para ${this.velocidade.toFixed(0)} km/h.`);
    return true;
  }

  /**
   * Freia com maior potência (decremento padrão maior).
   * @override
   * @param {number} [decremento=20] Decremento base (km/h).
   * @returns {boolean} True se freou.
   */
  frear(dec = 20) {
    // Reutiliza lógica de Carro.frear, mas com valor padrão maior
    return super.frear(dec);
  }

  /**
   * Tenta ativar o turbo.
   * @returns {boolean} True se ativou (ou já estava ativo).
   */
  ativarTurbo() {
    if (!this.ligado) {
      console.warn(`CarroEsportivo ${this.modelo}: Não pode ativar turbo desligado.`);
      return false;
    }
    if (this.turboAtivado) {
      console.info(`CarroEsportivo ${this.modelo}: Turbo já ON.`);
      return false; // Não mudou estado
    }
    this.turboAtivado = true;
    console.log(`🚀 CarroEsportivo ${this.modelo}: Turbo ATIVADO!`);
    return true;
  }

  /**
   * Tenta desativar o turbo.
   * @returns {boolean} True se desativou.
   */
  desativarTurbo() {
    if (!this.turboAtivado) {
      console.info(`CarroEsportivo ${this.modelo}: Turbo já OFF.`);
      return false; // Não mudou estado
    }
    this.turboAtivado = false;
    console.log(`CarroEsportivo ${this.modelo}: Turbo desativado.`);
    return true;
  }

  /**
   * Gera HTML com infos do Esportivo (inclui base Carro + Status Turbo).
   * @override
   * @returns {string} HTML formatado.
   */
  getDisplayInfo() {
    let baseInfoHtml = super.getDisplayInfo(); // Pega HTML de Carro
    const turboStatusHtml = this.turboAtivado
      ? '<span style="color: var(--accent-color, green); font-weight: bold; animation: pulse 1s infinite;">ATIVADO 🔥</span>'
      : "Desativado";
    baseInfoHtml += `<div class="info-item"><strong>Turbo:</strong> ${turboStatusHtml}</div>`;
    return baseInfoHtml;
  }
}