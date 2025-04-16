// js/Manutencao.js

/**
 * @class Manutencao
 * @classdesc Representa um registro de manutenção realizada ou um agendamento de serviço futuro para um veículo.
 *              Armazena detalhes como data, tipo de serviço, custo e descrição.
 *              Cada registro possui um identificador único. É usado pela classe Veiculo
 *              para manter o histórico e os agendamentos.
 */
export default class Manutencao {
  /**
   * @property {string} id Identificador único para esta instância de manutenção/agendamento.
   *                      Gerado automaticamente no formato 'maint_<timestamp>_<random_string>'.
   */
  id;
  /**
   * @property {Date} data A data e hora exata em que o serviço foi realizado ou está agendado.
   *                     Crucial para diferenciar histórico de agendamentos e para ordenação.
   */
  data;
  /**
   * @property {string} tipo Descreve o tipo de serviço efetuado ou a ser efetuado.
   *                       Exemplos: "Troca de Óleo", "Revisão Preventiva", "Alinhamento".
   */
  tipo;
  /**
   * @property {number} custo O valor monetário gasto no serviço. Para agendamentos futuros
   *                      que ainda não foram realizados, este valor deve ser 0.
   *                      Não pode ser um valor negativo.
   */
  custo;
  /**
   * @property {string} descricao Campo opcional para adicionar detalhes, observações ou lembretes
   *                          sobre o serviço. Pode estar vazio.
   */
  descricao;
  /**
   * @property {boolean} _notifiedRecently Flag de controle interno, usado pela UI para evitar
   *                                     notificações repetidas sobre agendamentos próximos
   *                                     em um curto período. Não é persistido.
   * @private
   */
  _notifiedRecently;

  /**
   * Cria uma nova instância de Manutencao, validando os dados de entrada.
   * Este construtor é chamado ao registrar uma nova manutenção ou agendamento.
   *
   * @param {Date} data Objeto Date representando a data e hora do serviço. A validação garante que seja uma data válida.
   * @param {string} tipo String não vazia descrevendo o tipo de serviço. Espaços em branco no início/fim são removidos.
   * @param {number} custo Valor numérico não negativo representando o custo. Usar 0 para agendamentos.
   * @param {string} [descricao=''] String opcional com detalhes adicionais. Padrão é string vazia. Espaços em branco no início/fim são removidos.
   *
   * @throws {Error} Lança um erro se a `data` não for um objeto Date válido.
   * @throws {Error} Lança um erro se o `tipo` não for uma string ou estiver vazio após trim().
   * @throws {Error} Lança um erro se o `custo` for negativo, NaN ou não for um número.
   * @throws {Error} Lança um erro se a `descricao` não for uma string.
   */
  constructor(data, tipo, custo, descricao = "") {
      if (!(data instanceof Date) || isNaN(data.getTime())) {
          throw new Error("Data inválida fornecida para Manutencao. Deve ser um objeto Date válido.");
      }
      if (typeof tipo !== "string" || tipo.trim() === "") {
          throw new Error("Tipo de manutenção inválido ou vazio. Deve ser uma string não vazia.");
      }
      if (typeof custo !== "number" || isNaN(custo) || custo < 0) {
          throw new Error("Custo de manutenção inválido. Deve ser um número maior ou igual a zero.");
      }
      if (typeof descricao !== "string") {
          throw new Error("Descrição da manutenção inválida. Deve ser uma string.");
      }
      this.id = `maint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.data = data;
      this.tipo = tipo.trim();
      this.custo = custo;
      this.descricao = descricao.trim();
      this._notifiedRecently = false;
  }

  /**
   * Formata os detalhes desta instância de Manutencao em uma string HTML
   * legível para exibição na interface do usuário (por exemplo, no histórico ou agendamentos).
   * Inclui formatação localizada para data/hora (pt-BR) e moeda (BRL).
   * Indica "(Agendado)" se o custo for zero.
   * Usa `document.createElement` e `textContent` para prevenir XSS em `tipo` e `descricao`.
   *
   * @returns {string} Uma string contendo HTML formatado para exibição, ou uma mensagem de erro segura em caso de falha.
   */
  getDetalhesFormatados() {
      try {
          const dataF = this.data.toLocaleDateString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
          });
          const custoF = this.custo > 0
              ? this.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "(Agendado)";
          const tipoN = document.createElement("b");
          tipoN.textContent = this.tipo; // Seguro
          let det = `${tipoN.outerHTML} em ${dataF} - ${custoF}`;
          if (this.descricao) {
              const descN = document.createElement("span");
              descN.style.cssText = "color: var(--text-muted, #6c757d); font-size: 0.9em;";
              descN.textContent = ` (${this.descricao})`; // Seguro
              det += descN.outerHTML;
          }
          return det;
      } catch (e) {
          console.error("Erro ao formatar detalhes da Manutencao:", e, this);
          return "Erro ao exibir detalhes."; // Mensagem segura
      }
  }

  /**
   * Método estático para recriar uma instância de `Manutencao` a partir de um
   * objeto simples (plain JavaScript object), como os que são obtidos após
   * `JSON.parse()` dos dados vindos do LocalStorage.
   * Realiza validações essenciais e converte a string de data ISO de volta para um objeto `Date`.
   *
   * @static
   * @param {object} obj O objeto simples contendo os dados da manutenção.
   *                     Deve possuir as chaves `tipo` (string), `custo` (number), `data` (string ISO 8601).
   *                     Pode opcionalmente conter `id` (string) e `descricao` (string).
   * @returns {Manutencao | null} Uma nova instância de `Manutencao` se a recriação for bem-sucedida,
   *                              ou `null` se os dados forem inválidos ou ocorrer um erro.
   */
  static fromPlainObject(obj) {
      try {
          // Validações mais rigorosas
          if (!obj || typeof obj.tipo !== "string" || obj.tipo.trim() === "" || typeof obj.custo !== "number" || isNaN(obj.custo) || obj.custo < 0 || !obj.data || typeof obj.data !== 'string') {
              console.warn("Manutencao.fromPlainObject: Objeto inválido ou incompleto.", obj);
              return null;
          }
          const dataO = new Date(obj.data);
          if (isNaN(dataO.getTime())) {
               console.warn("Manutencao.fromPlainObject: Data inválida.", obj.data);
              return null;
          }
          // Usa o construtor para criar e validar
          const m = new Manutencao(dataO, obj.tipo, obj.custo, obj.descricao || "");
          // Restaura ID se existir
          if (obj.id && typeof obj.id === 'string') {
              m.id = obj.id;
          }
          return m;
      } catch (error) {
          // Captura erros do construtor ou outros
          console.error("Manutencao.fromPlainObject: Erro ao recriar instância:", error.message, obj);
          return null;
      }
  }
}