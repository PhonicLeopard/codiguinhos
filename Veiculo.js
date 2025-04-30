// js/Veiculo.js
import Manutencao from './Manutencao.js'; // Importa a classe Manutencao

/**
 * @class Veiculo
 * @classdesc Classe base para todos os veículos da garagem.
 */
export default class Veiculo {
  /** @property {string} id Identificador único. */
  id;
  /** @property {string} modelo Modelo do veículo. */
  modelo;
  /** @property {string} cor Cor do veículo. */
  cor;
  /** @property {string} imagem URL da imagem. */
  imagem;
  /** @property {boolean} ligado Status do motor. */
  ligado;
  /** @property {Manutencao[]} historicoManutencoes Histórico e agendamentos. */
  historicoManutencoes;

  /**
   * Construtor base chamado pelas subclasses.
   * @param {string} modelo Modelo não vazio.
   * @param {string} cor Cor não vazia.
   * @param {string} [imagem='placeholder.png'] URL da imagem.
   * @throws {Error} Se modelo ou cor forem inválidos.
   */
  constructor(modelo, cor, imagem = 'placeholder.png') {
    if (typeof modelo !== 'string' || modelo.trim() === '') {
      throw new Error("Modelo inválido para Veiculo.");
    }
    if (typeof cor !== 'string' || cor.trim() === '') {
      throw new Error("Cor inválida para Veiculo.");
    }
    const imgFinal = (typeof imagem === 'string' && imagem.trim() !== '') ? imagem.trim() : 'placeholder.png';

    this.id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.modelo = modelo.trim();
    this.cor = cor.trim();
    this.imagem = imgFinal;
    this.ligado = false;
    this.historicoManutencoes = [];
    console.log(`Veiculo Base criado: ${this.modelo} (ID: ${this.id})`);
  }

  /**
   * Liga o veículo.
   * @returns {boolean} True se ligou, false se já estava ligado.
   */
  ligar() {
    if (this.ligado) {
      console.info(`Veiculo ${this.modelo}: Já está ligado.`);
      return false;
    }
    this.ligado = true;
    console.log(`Veiculo ${this.modelo}: Ligado.`);
    return true;
  }

  /**
   * Desliga o veículo (pode ser sobrescrito com regras).
   * @returns {boolean} True se desligou, false se já estava desligado.
   */
  desligar() {
    if (!this.ligado) {
      console.info(`Veiculo ${this.modelo}: Já está desligado.`);
      return false;
    }
    // Subclasses podem adicionar regras aqui ou sobrescrever
    this.ligado = false;
    console.log(`Veiculo ${this.modelo}: Desligado.`);
    return true;
  }

  /**
   * Executa a ação de buzinar (som tratado externamente).
   * @returns {boolean} Sempre true para indicar execução.
   */
  buzinar() {
    console.log(`Veiculo ${this.modelo}: 📣 Beep! Beep!`);
    return true;
  }

  /**
   * Registra uma manutenção/agendamento.
   * @param {Date} data Data do evento.
   * @param {string} tipo Tipo do serviço.
   * @param {number} custo Custo (0 para agendamento).
   * @param {string} descricao Descrição opcional.
   * @returns {boolean} True se adicionado com sucesso.
   * @throws {Error} Se dados da Manutencao forem inválidos (tratado por 'interagir').
   */
  registrarManutencao(data, tipo, custo, descricao) {
    const novaManutencao = new Manutencao(data, tipo, custo, descricao);
    this.historicoManutencoes.push(novaManutencao);
    this.historicoManutencoes.sort((a, b) => b.data.getTime() - a.data.getTime());
    console.log(`Veiculo ${this.modelo}: Manut/Agend registrado: ${tipo}`);
    return true;
  }

  /**
   * Retorna manutenções passadas.
   * @returns {Manutencao[]}
   */
  getPastMaintenances() {
    const now = new Date();
    return this.historicoManutencoes.filter(m => m.data <= now);
  }

  /**
   * Retorna agendamentos futuros.
   * @returns {Manutencao[]}
   */
  getFutureMaintenances() {
    const now = new Date();
    return this.historicoManutencoes.filter(m => m.data > now);
  }

  /**
   * Atualiza modelo, cor e imagem.
   * @param {string|null} novoModelo Novo modelo (ignora se inválido).
   * @param {string|null} novaCor Nova cor (ignora se inválido).
   * @param {string|null} novaImagem Nova imagem (string vazia = placeholder).
   * @returns {boolean} True se algo mudou.
   */
  updateProperties(novoModelo, novaCor, novaImagem) {
    let alterado = false;
    if (novoModelo && typeof novoModelo === 'string' && novoModelo.trim() !== '' && this.modelo !== novoModelo.trim()) {
      this.modelo = novoModelo.trim();
      console.log(`Veiculo ${this.modelo}: Modelo alterado.`);
      alterado = true;
    }
    if (novaCor && typeof novaCor === 'string' && novaCor.trim() !== '' && this.cor !== novaCor.trim()) {
      this.cor = novaCor.trim();
      console.log(`Veiculo ${this.modelo}: Cor alterada.`);
      alterado = true;
    }
    if (novaImagem !== null && typeof novaImagem === 'string') {
      const imgFinal = novaImagem.trim() !== '' ? novaImagem.trim() : 'placeholder.png';
      if (this.imagem !== imgFinal) {
        this.imagem = imgFinal;
        console.log(`Veiculo ${this.modelo}: Imagem alterada.`);
        alterado = true;
      }
    }
    return alterado;
  }

  /**
   * Gera HTML com informações base (ID, Modelo, Cor, Status).
   * @returns {string} HTML formatado.
   */
  getDisplayInfo() {
    const statusClass = this.ligado ? 'status-ligado' : 'status-desligado';
    const statusText = this.ligado ? 'Ligado' : 'Desligado';

    // Prevenção de XSS
    const idNode = document.createElement('span'); idNode.textContent = this.id;
    const modeloNode = document.createElement('span'); modeloNode.textContent = this.modelo;
    const corNode = document.createElement('span'); corNode.textContent = this.cor;

    return `
      <div class="info-item"><strong>ID:</strong> ${idNode.textContent}</div>
      <div class="info-item"><strong>Modelo:</strong> ${modeloNode.textContent}</div>
      <div class="info-item"><strong>Cor:</strong> ${corNode.textContent}</div>
      <div class="info-item"><strong>Status:</strong> <span class="status ${statusClass}">${statusText}</span></div>
    `;
  }
}