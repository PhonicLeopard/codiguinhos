// js/Caminhao.js
import Carro from './Carro.js'; // Importa a classe Carro

/**
 * @class Caminhao
 * @extends Carro
 * @classdesc Representa um caminhão, herda de Carro, adiciona capacidade/carga.
 */
export default class Caminhao extends Carro {
  /** @property {number} capacidadeCarga Capacidade máxima em kg. */
  capacidadeCarga;
  /** @property {number} cargaAtual Carga atual em kg. */
  cargaAtual;

  /**
   * Cria uma instância de Caminhao.
   * @param {string} modelo Modelo do caminhão.
   * @param {string} cor Cor do caminhão.
   * @param {number} [capacidadeCarga=5000] Capacidade em kg (>= 0).
   * @param {string} [imagem='placeholder.png'] URL da imagem.
   */
  constructor(modelo, cor, capacidadeCarga = 5000, imagem = 'placeholder.png') {
    super(modelo, cor, imagem); // Chama construtor de Carro
    this.capacidadeCarga = Math.max(0, Number(capacidadeCarga) || 0); // Garante >= 0
    this.cargaAtual = 0;
    this.maxVelocidade = 120; // Velocidade padrão mais baixa
    console.log(`Caminhao instanciado: ${this.modelo}`);
  }

  /**
   * Acelera considerando o fator de carga.
   * @override
   * @param {number} [incremento=8] Incremento base (km/h).
   * @returns {boolean} True se acelerou.
   */
  acelerar(inc = 8) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) {
      console.warn(`Caminhao ${this.modelo}: Incremento inválido ${inc}`);
      return false;
    }
    if (!this.ligado) {
      console.warn(`Caminhao ${this.modelo}: Tentativa de acelerar desligado.`);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      console.info(`Caminhao ${this.modelo}: Velocidade máxima ${this.maxVelocidade} atingida.`);
      return false;
    }
    // Fator de carga (0.3 a 1.0), reduz aceleração com mais carga
    const fatorCarga = this.capacidadeCarga > 0
      ? Math.max(0.3, 1 - this.cargaAtual / (this.capacidadeCarga * 1.5))
      : 1;
    this.velocidade = Math.min(this.velocidade + n * fatorCarga, this.maxVelocidade);
    console.log(`Caminhao ${this.modelo} (Carga: ${this.cargaAtual}kg) acelerou para ${this.velocidade.toFixed(0)} km/h (Fator: ${fatorCarga.toFixed(2)}).`);
    return true;
  }

  /**
   * Freia considerando o fator de carga (inércia).
   * @override
   * @param {number} [decremento=8] Decremento base (km/h).
   * @returns {boolean} True se freou.
   */
  frear(dec = 8) {
    const n = Number(dec);
    if (isNaN(n) || n <= 0) {
      console.warn(`Caminhao ${this.modelo}: Decremento inválido ${dec}`);
      return false;
    }
    if (this.velocidade === 0) {
      console.info(`Caminhao ${this.modelo}: Já está parado.`);
      return false;
    }
    // Fator de carga para frenagem (0.4 a 1.0), reduz frenagem com mais carga
    const fatorCarga = this.capacidadeCarga > 0
      ? Math.max(0.4, 1 - this.cargaAtual / (this.capacidadeCarga * 2))
      : 1;
    this.velocidade = Math.max(0, this.velocidade - n * fatorCarga);
    console.log(`Caminhao ${this.modelo} (Carga: ${this.cargaAtual}kg) freou para ${this.velocidade.toFixed(0)} km/h (Fator: ${fatorCarga.toFixed(2)}).`);
    return true;
  }

  /**
   * Adiciona peso à carga atual.
   * @param {number} peso Peso em kg (> 0).
   * @returns {boolean} True se carregou.
   */
  carregar(peso) {
    const p = Number(peso);
    if (isNaN(p) || p <= 0) {
      console.warn(`Caminhao ${this.modelo}: Peso inválido ${peso}`);
      return false;
    }
    if (this.capacidadeCarga <= 0) {
      console.warn(`Caminhao ${this.modelo}: Não pode carregar (cap <= 0).`);
      return false;
    }
    if (this.cargaAtual + p > this.capacidadeCarga) {
      const disp = this.capacidadeCarga - this.cargaAtual;
      console.warn(`Caminhao ${this.modelo}: Carga excedida (+${p}kg). Disp: ${disp}kg.`);
      return false;
    }
    this.cargaAtual += p;
    console.log(`📦 Caminhao ${this.modelo}: +${p}kg. Total: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);
    return true;
  }

  /**
   * Remove peso da carga atual.
   * @param {number} peso Peso em kg (> 0).
   * @returns {boolean} True se descarregou.
   */
  descarregar(peso) {
    const p = Number(peso);
    if (isNaN(p) || p <= 0) {
      console.warn(`Caminhao ${this.modelo}: Peso inválido ${peso}`);
      return false;
    }
    if (p > this.cargaAtual) {
      console.warn(`Caminhao ${this.modelo}: Descarga inválida (${p}kg > ${this.cargaAtual}kg).`);
      return false;
    }
    this.cargaAtual -= p;
    console.log(`📦 Caminhao ${this.modelo}: -${p}kg. Restante: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);
    return true;
  }

  /**
   * Atualiza propriedades, incluindo capacidade. Ajusta carga se necessário.
   * @override Sobrescreve Veiculo.updateProperties para add capacidade.
   * @param {string|null} nM Novo modelo.
   * @param {string|null} nC Nova cor.
   * @param {string|null} nI Nova imagem.
   * @param {number|null} [nCap=null] Nova capacidade (kg >= 0).
   * @returns {boolean} True se algo mudou.
   */
  updateProperties(nM, nC, nI, nCap = null) {
    const baseAlterada = super.updateProperties(nM, nC, nI); // Chama Veiculo.updateProperties
    let capacidadeAlterada = false;

    if (nCap !== null && !isNaN(Number(nCap))) {
      const numC = Math.max(0, Number(nCap)); // Garante >= 0
      if (this.capacidadeCarga !== numC) {
        console.log(`Caminhao ${this.modelo}: Capacidade ${this.capacidadeCarga}kg -> ${numC}kg.`);
        this.capacidadeCarga = numC;
        if (this.cargaAtual > this.capacidadeCarga) {
          console.warn(`Caminhao ${this.modelo}: Carga atual (${this.cargaAtual}kg) ajustada p/ nova capacidade (${this.capacidadeCarga}kg).`);
          this.cargaAtual = this.capacidadeCarga;
        }
        capacidadeAlterada = true;
      }
    }
    return baseAlterada || capacidadeAlterada;
  }

  /**
   * Gera HTML com infos do Caminhão (inclui base Carro + Carga/Capacidade).
   * @override
   * @returns {string} HTML formatado.
   */
  getDisplayInfo() {
    let baseInfoHtml = super.getDisplayInfo(); // Pega HTML de Carro
    const cargaPercent = this.capacidadeCarga > 0 ? ((this.cargaAtual / this.capacidadeCarga) * 100).toFixed(1) : 0;
    baseInfoHtml += `<div class="info-item"><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString("pt-BR")} kg</div>`;
    baseInfoHtml += `<div class="info-item"><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString("pt-BR")} kg (${cargaPercent}%)</div>`;
    return baseInfoHtml;
  }
}