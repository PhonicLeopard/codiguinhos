// ==========================================================================
//                 GARAGEM INTELIGENTE PRO - SCRIPT UNIFICADO
//                      (v3.2 - UX Refinements & Docs)
//
// Autor: Seu Nome/Equipe
// Descrição: Gerencia uma coleção virtual de veículos, permitindo
//            interações, registro de manutenções e persistência local.
// ==========================================================================

// --- Variáveis Globais e Constantes ---

/** @type {Veiculo[]} Array contendo todas as instâncias de veículos na garagem. */
let garage = [];
/** @type {Veiculo | null} A instância do veículo atualmente selecionado na interface. */
let currentlySelectedVehicle = null;
/** @type {number} O índice do veículo atualmente selecionado no array `garage`. -1 se nenhum selecionado. */
let currentlySelectedVehicleIndex = -1;
/** @const {string} Chave usada para armazenar/recuperar os dados da garagem no LocalStorage. */
const LOCAL_STORAGE_KEY = "garagemInteligenteDados_v3.2";

// --- Referências do DOM (Cache) ---
/** @type {Object<string, HTMLElement|null>} Cache de elementos DOM frequentemente usados. */
const DOM = {};

/**
 * @description Faz cache das referências a elementos DOM importantes na inicialização.
 */
function cacheDOMElements() {
  const ids = [
    "vehicle-list",
    "panel-content",
    "panel-placeholder",
    "vehicle-details-view",
    "add-vehicle-form-view",
    "notification-area",
    "vehicle-tabs-nav",
    "tab-content-container",
    "add-vehicle-form",
    "add-vehicle-type",
    "detail-vehicle-img",
    "detail-vehicle-name",
    "quick-edit-model",
    "quick-edit-color",
    "quick-edit-image",
    "info-details-content",
    "info-history-content",
    "info-schedule-content",
    "actions-esportivo",
    "actions-caminhao",
    "manutTipo",
    "manutCusto",
    "manutDesc",
    "agendamentoData",
    "agendamentoTipo",
    "agendamentoDesc",
    "add-modelo",
    "add-cor",
    "add-imagem",
    "add-capacidade",
    "btn-show-add-vehicle-form",
    "btn-cancel-add-vehicle",
    "btn-delete-vehicle",
    "btn-save-quick-edit",
  ];
  ids.forEach((id) => {
    const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    DOM[camelCaseId] = document.getElementById(id);
  });
  DOM.addCapacidadeGroup = document.querySelector(
    '#add-vehicle-form .specific-field[data-type="Caminhao"]'
  );
  // Verificação Essencial
  const essentialElements = [
    DOM.vehicleList,
    DOM.panelPlaceholder,
    DOM.vehicleDetailsView,
    DOM.addVehicleFormView,
    DOM.notificationArea,
  ];
  if (essentialElements.some((el) => !el)) {
    console.error(
      "❌ Erro Crítico: Elementos essenciais da UI não encontrados! Verifique IDs no HTML."
    );
    alert(
      "Erro crítico na inicialização da interface. Verifique o console (F12)."
    );
  }
}

// --- Configuração de Áudio ---
/** @type {Object<string, HTMLAudioElement>} Mapa de sons para ações. */
const soundMap = {
  ligar: new Audio("sounds/ligar.mp3"),
  desligar: new Audio("sounds/desligar.mp3"),
  acelerar: new Audio("sounds/acelerar.mp3"),
  frear: new Audio("sounds/frear.mp3"),
  buzinar_carro: new Audio("sounds/buzina_carro.mp3"),
  buzinar_esportivo: new Audio("sounds/buzina_esportivo.mp3"),
  buzinar_caminhao: new Audio("sounds/buzina_caminhao.mp3"),
  save: new Audio("sounds/save.mp3"),
  error: new Audio("sounds/error.mp3"),
  add_vehicle: new Audio("sounds/add_vehicle.mp3"),
  delete_vehicle: new Audio("sounds/delete_vehicle.mp3"),
};
Object.values(soundMap).forEach((sound) => {
  sound.preload = "auto";
  sound.onerror = () => console.warn(`⚠️ Falha ao carregar som: ${sound.src}.`);
});

// ==========================================================================
//                           CLASSES (Manutenção e Veículos)
// ==========================================================================

/** @class Manutencao @description Representa um registro de manutenção/agendamento. */
class Manutencao {
  /** @param {Date} data @param {string} tipo @param {number} custo @param {string} [descricao=''] */
  constructor(data, tipo, custo, descricao = "") {
    if (!(data instanceof Date) || isNaN(data.getTime()))
      throw new Error("Data inválida (Manutencao).");
    if (typeof tipo !== "string" || tipo.trim() === "")
      throw new Error("Tipo obrigatório (Manutencao).");
    if (typeof custo !== "number" || custo < 0 || isNaN(custo))
      throw new Error("Custo inválido (Manutencao).");
    if (typeof descricao !== "string")
      throw new Error("Descrição inválida (Manutencao).");
    this.id = `maint_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;
    this.data = data;
    this.tipo = tipo.trim();
    this.custo = custo;
    this.descricao = descricao.trim();
    /** @private */ this._notifiedRecently = false;
  }
  /** @description Retorna HTML formatado dos detalhes. @returns {string} */
  getDetalhesFormatados() {
    try {
      const dataF = this.data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const custoF =
        this.custo > 0
          ? this.custo.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "(Agendado)";
      const tipoN = document.createElement("b");
      tipoN.textContent = this.tipo;
      let det = `${tipoN.outerHTML} em ${dataF} - ${custoF}`;
      if (this.descricao) {
        const descN = document.createElement("span");
        descN.style.cssText = "color: var(--text-muted); font-size: 0.9em;";
        descN.textContent = ` (${this.descricao})`;
        det += descN.outerHTML;
      }
      return det;
    } catch (e) {
      console.error("Erro formatar Manut:", e, this);
      return "Erro ao exibir";
    }
  }
  /** @description Cria instância a partir de objeto simples. @static @param {object} obj @returns {Manutencao | null} */
  static fromPlainObject(obj) {
    try {
      if (
        !obj ||
        typeof obj.tipo !== "string" ||
        obj.tipo.trim() === "" ||
        typeof obj.custo !== "number" ||
        obj.custo < 0 ||
        !obj.data
      )
        return null;
      const dataO = new Date(obj.data);
      if (isNaN(dataO.getTime())) return null;
      const m = new Manutencao(dataO, obj.tipo, obj.custo, obj.descricao || "");
      if (obj.id) m.id = obj.id;
      return m;
    } catch (error) {
      console.error("Erro recriar Manut:", error.message, obj);
      return null;
    }
  }
}

/** @class Veiculo @description Classe base para veículos. */
class Veiculo {
  /** @param {string} modelo @param {string} cor @param {string} [imagem='placeholder.png'] */
  constructor(modelo, cor, imagem = "placeholder.png") {
    if (typeof modelo !== "string" || modelo.trim() === "")
      throw new Error("Modelo obrigatório.");
    if (typeof cor !== "string" || cor.trim() === "")
      throw new Error("Cor obrigatória.");
    this.id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.modelo = modelo.trim();
    this.cor = cor.trim();
    this.imagem =
      typeof imagem === "string" && imagem.trim() !== ""
        ? imagem.trim()
        : "placeholder.png";
    this.ligado = false;
    this.historicoManutencoes = [];
  }
  /** @description Liga o veículo. @returns {boolean} */
  ligar() {
    if (this.ligado) return false;
    this.ligado = true;
    return true;
  }
  /** @description Desliga o veículo (se parado). @returns {boolean} */
  desligar() {
    const v = this.velocidade ?? 0;
    if (!this.ligado) return false;
    if (v > 0) {
      showNotification(
        `Não desligar ${this.modelo} em movimento (V: ${v.toFixed(0)} km/h).`,
        "warning"
      );
      playSound(soundMap.error);
      return false;
    }
    this.ligado = false;
    return true;
  }
  /** @description Aciona buzina. @returns {boolean} */
  buzinar() {
    showNotification(`${this.modelo} buzinou! 📣`, "info", 1500);
    return true;
  }
  /** @description Gera HTML com informações básicas. @returns {string} */
  getDisplayInfo() {
    const statusClass = this.ligado ? "status-ligado" : "status-desligado";
    const statusText = this.ligado ? "Ligado" : "Desligado";
    const safeM = document.createElement("span");
    safeM.textContent = this.modelo;
    const safeC = document.createElement("span");
    safeC.textContent = this.cor;
    return (
      `<div class="info-item"><strong>ID:</strong> <span style="font-family: monospace; font-size: 0.9em;">${this.id}</span></div>` +
      `<div class="info-item"><strong>Modelo:</strong> ${safeM.innerHTML}</div>` +
      `<div class="info-item"><strong>Cor:</strong> ${safeC.innerHTML}</div>` +
      `<div class="info-item"><strong>Status:</strong> <span class="status ${statusClass}">${statusText}</span></div>`
    );
  }
  /** @description Adiciona registro de manutenção/agendamento. @param {Date} data @param {string} tipo @param {number} custo @param {string} [descricao=''] @returns {boolean} */
  registrarManutencao(data, tipo, custo, descricao = "") {
    try {
      const nM = new Manutencao(data, tipo, custo, descricao);
      if (!Array.isArray(this.historicoManutencoes))
        this.historicoManutencoes = [];
      this.historicoManutencoes.push(nM);
      this.historicoManutencoes.sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
      console.log(`Manut/Agend "${tipo}" [${nM.id}] add p/ ${this.modelo}`);
      playSound(soundMap.save);
      return true;
    } catch (error) {
      showNotification(`Erro registrar: ${error.message}`, "error");
      console.error("Falha Manut:", error);
      playSound(soundMap.error);
      return false;
    }
  }
  /** @description Retorna manutenções passadas. @returns {Manutencao[]} */
  getPastMaintenances() {
    const agora = new Date();
    return (this.historicoManutencoes || [])
      .filter((m) => m instanceof Manutencao && m.data <= agora)
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }
  /** @description Retorna agendamentos futuros. @returns {Manutencao[]} */
  getFutureMaintenances() {
    const agora = new Date();
    return (this.historicoManutencoes || [])
      .filter((m) => m instanceof Manutencao && m.data > agora)
      .sort((a, b) => a.data.getTime() - b.data.getTime());
  }
  /** @description Atualiza propriedades básicas. @param {string|null} newModel @param {string|null} newColor @param {string|null} newImage @returns {boolean} */
  updateProperties(newModel, newColor, newImage) {
    let ch = false;
    const clM = newModel?.trim();
    const clC = newColor?.trim();
    if (clM && this.modelo !== clM) {
      this.modelo = clM;
      ch = true;
    }
    if (clC && this.cor !== clC) {
      this.cor = clC;
      ch = true;
    }
    const pI =
      typeof newImage === "string" && newImage.trim() !== ""
        ? newImage.trim()
        : "placeholder.png";
    if (this.imagem !== pI) {
      this.imagem = pI;
      ch = true;
    }
    if (!ch) {
      showNotification("Nenhuma alteração detectada.", "info");
      return false;
    }
    playSound(soundMap.save);
    return true;
  }
}

/** @class Carro @extends Veiculo @description Carro comum. */
class Carro extends Veiculo {
  constructor(modelo, cor, imagem) {
    super(modelo, cor, imagem);
    this.velocidade = 0;
    this.maxVelocidade = 180;
    this.quilometragem = 0;
  }
  /** @description Acelera. @param {number} [inc=10] @returns {boolean} */
  acelerar(inc = 10) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) return false;
    if (!this.ligado) {
      showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      showNotification(
        `Velocidade máx (${this.maxVelocidade}) atingida.`,
        "info"
      );
      return false;
    }
    this.velocidade = Math.min(this.velocidade + n, this.maxVelocidade);
    return true;
  }
  /** @description Freia. @param {number} [dec=10] @returns {boolean} */
  frear(dec = 10) {
    const n = Number(dec);
    if (isNaN(n) || n <= 0 || this.velocidade === 0) return false;
    this.velocidade = Math.max(0, this.velocidade - n);
    return true;
  }
  /** @description Simula rodagem. @param {number} distancia @returns {boolean} */
  rodar(distancia) {
    const dist = Number(distancia);
    if (isNaN(dist) || dist <= 0) {
      showNotification("Distância inválida (> 0).", "warning");
      playSound(soundMap.error);
      return false;
    }
    if (!this.ligado) {
      showNotification(`${this.modelo} precisa estar ligado.`, "warning");
      playSound(soundMap.error);
      return false;
    }
    this.quilometragem += dist;
    showNotification(
      `${this.modelo} rodou ${dist} km. Total: ${this.quilometragem.toFixed(
        0
      )} km.`,
      "info",
      3000
    );
    return true;
  }
  /** @description Gera HTML com info + KM + Velocidade. @returns {string} */
  getDisplayInfo() {
    let bI = super.getDisplayInfo();
    bI += `<div class="info-item"><strong>KM Rodados:</strong> ${this.quilometragem.toFixed(
      0
    )}</div>`;
    if (typeof this.maxVelocidade === "number" && this.maxVelocidade > 0) {
      const sP = Math.max(
        0,
        Math.min(100, (this.velocidade / this.maxVelocidade) * 100)
      );
      bI += `<div class="speed-bar-container"><div class="speed-bar-label">Velocidade (${this.velocidade.toFixed(
        0
      )} / ${
        this.maxVelocidade
      } km/h):</div><div class="speed-bar"><div class="speed-bar-fill" style="width: ${sP.toFixed(
        2
      )}%;"></div></div></div>`;
    } else {
      bI += `<div class="info-item"><strong>Velocidade:</strong> ${this.velocidade.toFixed(
        0
      )} km/h</div>`;
    }
    return bI;
  }
}

/** @class CarroEsportivo @extends Carro @description Carro com turbo. */
class CarroEsportivo extends Carro {
  constructor(modelo, cor, imagem) {
    super(modelo, cor, imagem);
    this.turboAtivado = false;
    this.maxVelocidade = 350;
  }
  /** @description Acelera (com boost). @param {number} [inc=25] @returns {boolean} */
  acelerar(inc = 25) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) return false;
    if (!this.ligado) {
      showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      showNotification(
        `Velocidade máx (${this.maxVelocidade}) atingida.`,
        "info"
      );
      return false;
    }
    const b = this.turboAtivado ? n * 1.8 : n;
    this.velocidade = Math.min(this.velocidade + b, this.maxVelocidade);
    return true;
  }
  /** @description Freia (mais forte). @param {number} [dec=20] @returns {boolean} */
  frear(dec = 20) {
    return super.frear(dec);
  }
  /** @description Ativa turbo. @returns {boolean} */
  ativarTurbo() {
    if (!this.ligado) {
      showNotification("Ligue para ativar o turbo!", "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.turboAtivado) {
      showNotification("Turbo já ON.", "info");
      return false;
    }
    this.turboAtivado = true;
    showNotification("🚀 Turbo ATIVADO!", "success", 2500);
    return true;
  }
  /** @description Desativa turbo. @returns {boolean} */
  desativarTurbo() {
    if (!this.turboAtivado) {
      showNotification("Turbo já OFF.", "info");
      return false;
    }
    this.turboAtivado = false;
    showNotification("Turbo desativado.", "info");
    return true;
  }
  /** @description Gera HTML com info + Turbo status. @returns {string} */
  getDisplayInfo() {
    let bI = super.getDisplayInfo();
    const tS = this.turboAtivado
      ? '<span style="color: var(--accent-color); font-weight: bold; animation: pulse 1s infinite;">ATIVADO 🔥</span>'
      : "Desativado";
    bI += `<div class="info-item"><strong>Turbo:</strong> ${tS}</div>`;
    return bI;
  }
}

/** @class Caminhao @extends Carro @description Caminhão com carga. */
class Caminhao extends Carro {
  constructor(modelo, cor, capacidadeCarga = 5000, imagem) {
    super(modelo, cor, imagem);
    this.capacidadeCarga = Math.max(0, Number(capacidadeCarga) || 0);
    this.cargaAtual = 0;
    this.maxVelocidade = 120;
  }
  /** @description Acelera (influenciado pela carga). @param {number} [inc=8] @returns {boolean} */
  acelerar(inc = 8) {
    const n = Number(inc);
    if (isNaN(n) || n <= 0) return false;
    if (!this.ligado) {
      showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.velocidade >= this.maxVelocidade) {
      showNotification(
        `Velocidade máx (${this.maxVelocidade}) atingida.`,
        "info"
      );
      return false;
    }
    const f =
      this.capacidadeCarga > 0
        ? Math.max(0.3, 1 - this.cargaAtual / (this.capacidadeCarga * 1.5))
        : 1;
    this.velocidade = Math.min(this.velocidade + n * f, this.maxVelocidade);
    return true;
  }
  /** @description Freia (influenciado pela carga). @param {number} [dec=8] @returns {boolean} */
  frear(dec = 8) {
    const n = Number(dec);
    if (isNaN(n) || n <= 0 || this.velocidade === 0) return false;
    const f =
      this.capacidadeCarga > 0
        ? Math.max(0.4, 1 - this.cargaAtual / (this.capacidadeCarga * 2))
        : 1;
    this.velocidade = Math.max(0, this.velocidade - n * f);
    return true;
  }
  /** @description Adiciona carga. @param {number} peso @returns {boolean} */
  carregar(peso) {
    const p = Number(peso);
    if (isNaN(p) || p <= 0) {
      showNotification("Peso inválido (> 0).", "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.capacidadeCarga <= 0) {
      showNotification(`${this.modelo} não pode carregar.`, "warning");
      playSound(soundMap.error);
      return false;
    }
    if (this.cargaAtual + p > this.capacidadeCarga) {
      showNotification(
        `Carga excedida! Máx: ${this.capacidadeCarga}kg. Disp: ${
          this.capacidadeCarga - this.cargaAtual
        }kg.`,
        "warning"
      );
      playSound(soundMap.error);
      return false;
    }
    this.cargaAtual += p;
    showNotification(
      `📦 +${p}kg carregados. Total: ${this.cargaAtual}kg.`,
      "success",
      3000
    );
    return true;
  }
  /** @description Remove carga. @param {number} peso @returns {boolean} */
  descarregar(peso) {
    const p = Number(peso);
    if (isNaN(p) || p <= 0) {
      showNotification("Peso inválido (> 0).", "warning");
      playSound(soundMap.error);
      return false;
    }
    if (p > this.cargaAtual) {
      showNotification(`Carga insuficiente (${this.cargaAtual}kg).`, "warning");
      playSound(soundMap.error);
      return false;
    }
    this.cargaAtual -= p;
    showNotification(
      `📦 -${p}kg descarregados. Restante: ${this.cargaAtual}kg.`,
      "success",
      3000
    );
    return true;
  }
  /** @description Atualiza propriedades + capacidade. @param {string|null} nM @param {string|null} nC @param {string|null} nI @param {number|null} [nCap=null] @returns {boolean} */
  updateProperties(nM, nC, nI, nCap = null) {
    const bU = super.updateProperties(nM, nC, nI);
    let cU = false;
    if (nCap !== null && !isNaN(Number(nCap))) {
      const numC = Math.max(0, Number(nCap));
      if (this.capacidadeCarga !== numC) {
        this.capacidadeCarga = numC;
        this.cargaAtual = Math.min(this.cargaAtual, this.capacidadeCarga);
        cU = true;
      }
    }
    if (bU || cU) playSound(soundMap.save);
    return bU || cU;
  }
  /** @description Gera HTML com info + Carga. @returns {string} */
  getDisplayInfo() {
    let bI = super.getDisplayInfo();
    const cP =
      this.capacidadeCarga > 0
        ? ((this.cargaAtual / this.capacidadeCarga) * 100).toFixed(1)
        : 0;
    bI += `<div class="info-item"><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString(
      "pt-BR"
    )} kg</div><div class="info-item"><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString(
      "pt-BR"
    )} kg (${cP}%)</div>`;
    return bI;
  }
}

// ==========================================================================
//                      PERSISTÊNCIA (LocalStorage)
// ==========================================================================
/** @description Prepara dados de UM veículo para salvar. @param {Veiculo} vehicle @returns {object | null} */
function prepareVehicleDataForStorage(vehicle) {
  if (!vehicle?.id || !vehicle?.constructor) return null;
  try {
    const d = { ...vehicle };
    d.historicoManutencoes = (vehicle.historicoManutencoes || [])
      .filter((m) => m instanceof Manutencao)
      .map((m) => ({
        ...m,
        data: m.data.toISOString(),
        _notifiedRecently: undefined,
      }));
    d._classType = vehicle.constructor.name;
    delete d._notifiedRecently;
    return d;
  } catch (e) {
    console.error(`Erro prepareStorage ${vehicle.id}:`, e);
    return null;
  }
}
/** @description Recria UM veículo a partir dos dados. @param {object} plainData @returns {Veiculo | null} */
function recreateVehicleFromData(plainData) {
  if (!plainData?._classType || !plainData?.id) return null;
  const d = plainData;
  let vI = null;
  try {
    switch (d._classType) {
      case "Carro":
        vI = new Carro(d.modelo, d.cor, d.imagem);
        break;
      case "CarroEsportivo":
        vI = new CarroEsportivo(d.modelo, d.cor, d.imagem);
        break;
      case "Caminhao":
        vI = new Caminhao(d.modelo, d.cor, d.capacidadeCarga, d.imagem);
        break;
      default:
        return null;
    }
    vI.id = d.id;
    vI.ligado = d.ligado || false;
    vI.velocidade = Number(d.velocidade) || 0;
    vI.quilometragem = Number(d.quilometragem) || 0;
    if (typeof d.maxVelocidade === "number") vI.maxVelocidade = d.maxVelocidade;
    if (vI instanceof CarroEsportivo && typeof d.turboAtivado === "boolean")
      vI.turboAtivado = d.turboAtivado;
    else if (vI instanceof Caminhao && typeof d.cargaAtual === "number")
      vI.cargaAtual = Math.min(Number(d.cargaAtual) || 0, vI.capacidadeCarga);
    if (Array.isArray(d.historicoManutencoes)) {
      vI.historicoManutencoes = d.historicoManutencoes
        .map(Manutencao.fromPlainObject)
        .filter(Boolean);
      vI.historicoManutencoes.sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
    } else vI.historicoManutencoes = [];
    return vI;
  } catch (e) {
    console.error(`Erro recriar ${d.id}:`, e);
    return null;
  }
}
/** @description Salva TODA a garagem no LocalStorage. */
function salvarGaragemNoLocalStorage() {
  try {
    const dS = garage.map(prepareVehicleDataForStorage).filter(Boolean);
    if (dS.length > 0)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dS));
    else localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error("Erro CRÍTICO salvar LS:", e);
    const m =
      e.name === "QuotaExceededError"
        ? "Armazenamento cheio!"
        : "Erro ao salvar!";
    showNotification(`❌ ${m}`, "error", 0);
    playSound(soundMap.error);
  }
}
/** @description Carrega a garagem do LocalStorage. */
function carregarGaragemDoLocalStorage() {
  const dS = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!dS) {
    garage = [];
    return;
  }
  let vS;
  try {
    vS = JSON.parse(dS);
    if (!Array.isArray(vS)) throw new Error("Formato inválido");
  } catch (e) {
    console.error("Erro PARSE LS:", e);
    showNotification("❌ Erro ler dados! Resetando.", "error", 0);
    playSound(soundMap.error);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    garage = [];
    return;
  }
  const tG = [];
  let f = 0;
  vS.forEach((d) => {
    const v = recreateVehicleFromData(d);
    if (v) tG.push(v);
    else f++;
  });
  garage = tG;
  console.log(`${garage.length} carregados, ${f} falha(s).`);
  if (f > 0)
    showNotification(`⚠️ ${f} veículo(s) não carregados.`, "warning", 7000);
  else if (garage.length > 0)
    showNotification(
      `🚗 ${garage.length} veículo(s) carregados!`,
      "info",
      3000
    );
}

// ==========================================================================
//                      LÓGICA DE EXIBIÇÃO E INTERFACE (UI)
// ==========================================================================
/** @description Mostra o painel correto e gerencia estado. @param {'placeholder' | 'details' | 'addForm'} contentType */
function showPanelContent(contentType) {
  if (
    !DOM.panelPlaceholder ||
    !DOM.vehicleDetailsView ||
    !DOM.addVehicleFormView
  )
    return;
  DOM.panelPlaceholder.classList.add("hidden");
  DOM.vehicleDetailsView.classList.add("hidden");
  DOM.addVehicleFormView.classList.add("hidden");
  let fT = null;
  switch (contentType) {
    case "details":
      DOM.vehicleDetailsView.classList.remove("hidden");
      fT = DOM.detailName;
      break;
    case "addForm":
      DOM.addVehicleFormView.classList.remove("hidden");
      fT = DOM.addVehicleType;
      break;
    default:
      DOM.panelPlaceholder.classList.remove("hidden");
      break;
  }
  if (contentType !== "details") {
    deselectAllVehiclesInList();
    currentlySelectedVehicle = null;
    currentlySelectedVehicleIndex = -1;
  }
  if (fT) setTimeout(() => fT?.focus({ preventScroll: true }), 100);
}
/** @description Renderiza a lista de veículos na sidebar. */
function renderVehicleList() {
  if (!DOM.vehicleList) return;
  DOM.vehicleList.innerHTML = "";
  if (garage.length === 0) {
    DOM.vehicleList.innerHTML = '<li class="placeholder">Garagem vazia.</li>';
    return;
  }
  const frag = document.createDocumentFragment();
  garage.forEach((v, i) => {
    const li = document.createElement("li");
    li.dataset.vehicleIndex = i;
    li.setAttribute("role", "button");
    li.tabIndex = 0;
    const sM = document.createElement("span");
    sM.textContent = v.modelo || "S/ Nome";
    li.setAttribute("aria-label", `Selecionar: ${sM.textContent}`);
    li.innerHTML = `<img src="${v.imagem}" alt="" class="vehicle-list-img" onerror="this.src='placeholder.png';"> <span class="vehicle-list-name">${sM.innerHTML}</span>`;
    if (i === currentlySelectedVehicleIndex) {
      li.classList.add("selected");
      li.setAttribute("aria-current", "true");
    }
    li.addEventListener("click", () => handleVehicleSelection(i));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleVehicleSelection(i);
      }
    });
    frag.appendChild(li);
  });
  DOM.vehicleList.appendChild(frag);
}
/** @description Remove seleção visual da lista. */
function deselectAllVehiclesInList() {
  DOM.vehicleList?.querySelectorAll("li.selected").forEach((li) => {
    li.classList.remove("selected");
    li.removeAttribute("aria-current");
  });
}
/** @description Manipula a seleção de um veículo. @param {number} index */
function handleVehicleSelection(index) {
  if (index >= 0 && index < garage.length) {
    currentlySelectedVehicle = garage[index];
    currentlySelectedVehicleIndex = index;
    console.log(
      `Selecionado: ${currentlySelectedVehicle.modelo} (Idx: ${index})`
    );
    deselectAllVehiclesInList();
    const sL = DOM.vehicleList?.querySelector(
      `li[data-vehicle-index="${index}"]`
    );
    sL?.classList.add("selected");
    sL?.setAttribute("aria-current", "true");
    displaySelectedVehicleDetails();
    showPanelContent("details");
  } else {
    console.error("Índice inválido:", index);
    showNotification("Erro selecionar.", "error");
    playSound(soundMap.error);
    showPanelContent("placeholder");
    currentlySelectedVehicle = null;
    currentlySelectedVehicleIndex = -1;
  }
}
/** @description Atualiza painel de detalhes. */
function displaySelectedVehicleDetails() {
  if (!currentlySelectedVehicle) {
    showPanelContent("placeholder");
    return;
  }
  try {
    if (DOM.detailImg)
      DOM.detailImg.src = currentlySelectedVehicle.imagem || "placeholder.png";
    if (DOM.detailName)
      DOM.detailName.textContent = currentlySelectedVehicle.modelo || "S/ Nome";
    if (DOM.quickModel)
      DOM.quickModel.value = currentlySelectedVehicle.modelo || "";
    if (DOM.quickColor)
      DOM.quickColor.value = currentlySelectedVehicle.cor || "";
    if (DOM.quickImage)
      DOM.quickImage.value =
        currentlySelectedVehicle.imagem === "placeholder.png"
          ? ""
          : currentlySelectedVehicle.imagem;
    if (DOM.infoContent)
      DOM.infoContent.innerHTML = currentlySelectedVehicle.getDisplayInfo();
    if (DOM.historyContent)
      DOM.historyContent.innerHTML = generateMaintenanceListHtml(
        currentlySelectedVehicle.getPastMaintenances(),
        "maintenance-list",
        "Nenhuma manutenção passada."
      );
    if (DOM.scheduleContent) {
      DOM.scheduleContent.innerHTML = generateMaintenanceListHtml(
        currentlySelectedVehicle.getFutureMaintenances(),
        "schedule-list",
        "Nenhum agendamento futuro."
      );
      verificarAgendamentosProximos(currentlySelectedVehicle);
    }
    document
      .querySelectorAll(".specific-actions")
      .forEach((el) => el.classList.add("hidden"));
    if (
      currentlySelectedVehicle instanceof CarroEsportivo &&
      DOM.actionsEsportivo
    )
      DOM.actionsEsportivo.classList.remove("hidden");
    else if (
      currentlySelectedVehicle instanceof Caminhao &&
      DOM.actionsCaminhao
    )
      DOM.actionsCaminhao.classList.remove("hidden");
    [
      DOM.manutTipo,
      DOM.manutCusto,
      DOM.manutDesc,
      DOM.agendData,
      DOM.agendTipo,
      DOM.agendDesc,
    ].forEach((i) => {
      if (i) {
        i.value = "";
        i.classList.remove("error");
      }
    });
    const fTB = DOM.tabNav?.querySelector(".tab-link");
    if (fTB) activateTab(fTB);
  } catch (e) {
    console.error("Erro UI detalhes:", e);
    showNotification("❌ Erro exibir detalhes.", "error", 0);
    playSound(soundMap.error);
  }
}
/** @description Gera HTML para listas de manutenção. @param {Manutencao[]} maintenances @param {string} listClass @param {string} emptyMessage @returns {string} */
function generateMaintenanceListHtml(maintenances, listClass, emptyMessage) {
  if (!Array.isArray(maintenances) || maintenances.length === 0)
    return `<p>${emptyMessage}</p>`;
  const lI = maintenances
    .map((m) =>
      m instanceof Manutencao
        ? `<li data-maint-id="${m.id}">${m.getDetalhesFormatados()}</li>`
        : ""
    )
    .join("");
  return `<ul class="${listClass}">${lI}</ul>`;
}
/** @description Ativa aba e mostra conteúdo. @param {HTMLButtonElement} tabButton */
function activateTab(tabButton) {
  if (!tabButton || !DOM.tabNav || !DOM.tabContentContainer) return;
  DOM.tabNav.querySelectorAll(".tab-link").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  DOM.tabContentContainer
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  tabButton.classList.add("active");
  tabButton.setAttribute("aria-selected", "true");
  const tCId = tabButton.dataset.target;
  if (tCId) {
    const tC = DOM.tabContentContainer.querySelector(tCId);
    tC?.classList.add("active");
  }
}
/** @description Exibe notificação. @param {string} message @param {'info'|'success'|'warning'|'error'} [type='info'] @param {number} [duration=4000] */
function showNotification(message, type = "info", duration = 4000) {
  if (!DOM.notificationArea) {
    console.warn("Notif:", message);
    return;
  }
  const n = document.createElement("div");
  n.className = `notification notification-${type}`;
  n.setAttribute("role", "alert");
  n.setAttribute("aria-live", "assertive");
  const mS = document.createElement("span");
  mS.innerHTML = message;
  const cB = document.createElement("button");
  cB.className = "close-btn";
  cB.innerHTML = "×";
  cB.setAttribute("aria-label", "Fechar");
  cB.title = "Fechar";
  n.appendChild(mS);
  n.appendChild(cB);
  let tId = null;
  const rN = () => {
    clearTimeout(tId);
    if (n.parentNode === DOM.notificationArea)
      DOM.notificationArea.removeChild(n);
  };
  cB.addEventListener("click", rN);
  DOM.notificationArea.insertBefore(n, DOM.notificationArea.firstChild);
  if (duration > 0) tId = setTimeout(rN, duration);
}
/** @description Verifica e notifica agendamentos próximos. @param {Veiculo} veiculo */
function verificarAgendamentosProximos(veiculo) {
  if (!veiculo?.getFutureMaintenances) return;
  const fM = veiculo.getFutureMaintenances();
  if (!fM?.length) return;
  const agora = Date.now();
  const UM_DIA = 86400000;
  const UMA_SEMANA = 7 * UM_DIA;
  fM.forEach((m) => {
    if (!(m instanceof Manutencao) || !m.data || m._notifiedRecently) return;
    const diff = m.data.getTime() - agora;
    let not = false;
    let msg = "";
    const dF = m.data.toLocaleDateString("pt-BR");
    const hF = m.data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const nV = veiculo.modelo || "Veículo";
    if (diff > 0 && diff <= UM_DIA * 1.5) {
      msg = `⏰ HOJE/AMANHÃ: "${m.tipo}" p/ <b>${nV}</b> (${dF} ${hF}).`;
      not = true;
    } else if (diff > UM_DIA * 1.5 && diff <= UMA_SEMANA) {
      msg = `🗓️ Próx. Semana: "${m.tipo}" p/ <b>${nV}</b> (${dF}).`;
      not = true;
    }
    if (not) {
      showNotification(msg, "warning", 10000);
      m._notifiedRecently = true;
    }
  });
}
/** @description Toca um som. @param {HTMLAudioElement} audioObject */
function playSound(audioObject) {
  if (!audioObject?.play) return;
  audioObject.pause();
  audioObject.currentTime = 0;
  audioObject.play().catch((e) => {
    if (e.name !== "NotAllowedError")
      console.warn(`Erro som (${audioObject.src}): ${e.message}`);
  });
}
/** @description Toca som correspondente à ação/veículo. @param {Veiculo|null} veiculo @param {string} acao */
function tocarSomCorrespondente(veiculo, acao) {
  if (!veiculo) return;
  let sTP = null;
  switch (acao) {
    case "ligar":
      sTP = soundMap.ligar;
      break;
    case "desligar":
      sTP = soundMap.desligar;
      break;
    case "acelerar":
      sTP = soundMap.acelerar;
      break;
    case "frear":
      sTP = soundMap.frear;
      break;
    case "buzinar":
      if (veiculo instanceof Caminhao) sTP = soundMap.buzinar_caminhao;
      else if (veiculo instanceof CarroEsportivo)
        sTP = soundMap.buzinar_esportivo;
      else sTP = soundMap.buzinar_carro;
      break;
  }
  if (sTP) playSound(sTP);
}

// ==========================================================================
//                  FUNÇÃO CENTRAL DE INTERAÇÃO + FEEDBACK VISUAL
// ==========================================================================
/** @description Função central para interagir com veículo. @param {string} acao @param {Event|null} event @param {...any} args @returns {Promise<boolean>} */
async function interagir(acao, event = null, ...args) {
  if (!currentlySelectedVehicle) {
    showNotification("❗ Nenhum veículo selecionado!", "warning");
    playSound(soundMap.error);
    return false;
  }
  const button = event?.target?.closest("button");
  if (button) {
    button.disabled = true;
    button.classList.add("processing");
  }
  const veiculo = currentlySelectedVehicle;
  let sucesso = false;
  if (typeof veiculo[acao] !== "function") {
    const msg = `Ação inválida "${acao}" p/ ${veiculo.modelo}.`;
    showNotification(`❌ ${msg}`, "error");
    console.error(msg);
    playSound(soundMap.error);
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
    return false;
  }
  try {
    await new Promise((r) => setTimeout(r, 50));
    const res = veiculo[acao](...args);
    sucesso = res !== false;
  } catch (e) {
    console.error(`Erro ${acao} em ${veiculo.modelo}:`, e);
    showNotification(`❌ Erro ao ${acao}. Ver console.`, "error", 0);
    playSound(soundMap.error);
    sucesso = false;
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
  }
  displaySelectedVehicleDetails(); // Atualiza sempre
  if (sucesso) {
    tocarSomCorrespondente(veiculo, acao);
    const persist = [
      "ligar",
      "desligar",
      "rodar",
      "ativarTurbo",
      "desativarTurbo",
      "carregar",
      "descarregar",
      "registrarManutencao",
      "updateProperties",
    ];
    if (persist.includes(acao)) salvarGaragemNoLocalStorage();
  }
  return sucesso;
}

// ==========================================================================
//                  HANDLERS DE EVENTOS DA UI
// ==========================================================================
/** @param {Event} event */ function handleLigarClick(event) {
  interagir("ligar", event);
}
/** @param {Event} event */ function handleDesligarClick(event) {
  interagir("desligar", event);
}
/** @param {Event} event */ function handleBuzinarClick(event) {
  interagir("buzinar", event);
}
/** @param {Event} event */ function handleAcelerarClick(event) {
  let inc = 10;
  if (currentlySelectedVehicle instanceof CarroEsportivo) inc = 25;
  else if (currentlySelectedVehicle instanceof Caminhao) inc = 8;
  interagir("acelerar", event, inc);
}
/** @param {Event} event */ function handleFrearClick(event) {
  let dec = 10;
  if (currentlySelectedVehicle instanceof CarroEsportivo) dec = 20;
  else if (currentlySelectedVehicle instanceof Caminhao) dec = 8;
  interagir("frear", event, dec);
}
/** @param {Event} event */ function handleRodarClick(event) {
  const dI = document.getElementById("distanciaRodar");
  interagir("rodar", event, dI?.value);
}
/** @param {Event} event */ function handleTurboOnClick(event) {
  interagir("ativarTurbo", event);
}
/** @param {Event} event */ function handleTurboOffClick(event) {
  interagir("desativarTurbo", event);
}
/** @param {Event} event */ function handleCarregarClick(event) {
  const pI = document.getElementById("pesoCarga");
  interagir("carregar", event, pI?.value);
}
/** @param {Event} event */ function handleDescarregarClick(event) {
  const pI = document.getElementById("pesoCarga");
  interagir("descarregar", event, pI?.value);
}

/** @description Handler p/ registrar manutenção. @param {Event} event */
function handleRegistrarManutencao(event) {
  if (!currentlySelectedVehicle) {
    showNotification("Selecione veículo.", "warning");
    playSound(soundMap.error);
    return;
  }
  const tI = DOM.manutTipo;
  const cI = DOM.manutCusto;
  const dI = DOM.manutDesc;
  if (!tI || !cI) {
    console.error("Inputs Manut não encontrados");
    return;
  }
  [tI, cI].forEach((el) => el.classList.remove("error"));
  const tipo = tI.value.trim();
  const cS = cI.value.replace(",", ".").trim();
  const custo = parseFloat(cS);
  let v = true;
  if (!tipo) {
    showNotification("❗ Tipo obrigatório.", "warning");
    tI.classList.add("error");
    tI.focus();
    v = false;
  }
  if (cS === "" || isNaN(custo) || custo < 0) {
    showNotification("❗ Custo inválido (>= 0).", "warning");
    cI.classList.add("error");
    if (v) cI.focus();
    v = false;
  }
  if (!v) {
    playSound(soundMap.error);
    return;
  }
  interagir(
    "registrarManutencao",
    event,
    new Date(),
    tipo,
    custo,
    dI?.value.trim()
  ).then((s) => {
    if (s) {
      showNotification(`✅ Manut "${tipo}" registrada!`, "success");
      [tI, cI, dI].forEach((el) => {
        if (el) el.value = "";
      });
    }
  });
}
/** @description Handler p/ agendar serviço. @param {Event} event */
function handleAgendarManutencao(event) {
  if (!currentlySelectedVehicle) {
    showNotification("Selecione veículo.", "warning");
    playSound(soundMap.error);
    return;
  }
  const dI = DOM.agendData;
  const tI = DOM.agendTipo;
  const descI = DOM.agendDesc;
  if (!dI || !tI) {
    console.error("Inputs Agendamento não encontrados");
    return;
  }
  [dI, tI].forEach((el) => el.classList.remove("error"));
  const dS = dI.value;
  const tipo = tI.value.trim();
  let v = true;
  if (!dS) {
    showNotification("❗ Data/Hora obrigatória.", "warning");
    dI.classList.add("error");
    dI.focus();
    v = false;
  }
  if (!tipo) {
    showNotification("❗ Tipo obrigatório.", "warning");
    tI.classList.add("error");
    if (v) tI.focus();
    v = false;
  }
  const dA = new Date(dS);
  if (v && isNaN(dA.getTime())) {
    showNotification("❗ Data/Hora inválida.", "warning");
    dI.classList.add("error");
    dI.focus();
    v = false;
  }
  if (v && dA <= new Date()) {
    showNotification("❗ Agendamento no passado.", "warning");
    dI.classList.add("error");
    dI.focus();
    v = false;
  }
  if (!v) {
    playSound(soundMap.error);
    return;
  }
  interagir(
    "registrarManutencao",
    event,
    dA,
    tipo,
    0,
    descI?.value.trim()
  ).then((s) => {
    if (s) {
      showNotification(`🗓️ Serviço "${tipo}" agendado!`, "success");
      [dI, tI, descI].forEach((el) => {
        if (el) el.value = "";
      });
    }
  });
}
/** @description Handler p/ salvar quick edit. @param {Event} event */
function handleQuickEditSave(event) {
  if (!currentlySelectedVehicle) {
    showNotification("Selecione veículo.", "warning");
    playSound(soundMap.error);
    return;
  }
  const mI = DOM.quickModel;
  const cI = DOM.quickColor;
  const iI = DOM.quickImage;
  if (!mI || !cI) {
    console.error("Inputs Quick Edit não encontrados");
    return;
  }
  [mI, cI].forEach((el) => el.classList.remove("error"));
  const nM = mI.value.trim();
  const nC = cI.value.trim();
  let v = true;
  if (!nM) {
    showNotification("❗ Modelo obrigatório.", "warning");
    mI.classList.add("error");
    mI.focus();
    v = false;
  }
  if (!nC) {
    showNotification("❗ Cor obrigatória.", "warning");
    cI.classList.add("error");
    if (v) cI.focus();
    v = false;
  }
  if (!v) {
    playSound(soundMap.error);
    return;
  }
  interagir("updateProperties", event, nM, nC, iI?.value.trim(), null).then(
    (s) => {
      if (s) {
        showNotification("✅ Propriedades atualizadas!", "success");
        renderVehicleList();
      }
    }
  );
}
/** @description Handler p/ submit do form de add. @param {Event} event */
function handleAddFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const sB = form.querySelector('button[type="submit"]');
  const tipo = DOM.addVehicleTypeSelect?.value;
  const mI = DOM.addModelo;
  const cI = DOM.addCor;
  const iI = DOM.addImagem;
  const capI = DOM.addCapacidade;
  let v = true;
  const iTV = [DOM.addVehicleTypeSelect, mI, cI];
  if (tipo === "Caminhao" && capI) iTV.push(capI);
  iTV.forEach((i) => {
    if (!i) return;
    i.classList.remove("error");
    let iE = !i.value || i.value.trim() === "";
    if (i.type === "number" && (isNaN(Number(i.value)) || Number(i.value) < 0))
      iE = true;
    if (iE && i.hasAttribute("required")) {
      v = false;
      i.classList.add("error");
      if (v) i.focus();
    }
  });
  if (!v) {
    showNotification("❗ Preencha campos obrigatórios.", "warning");
    playSound(soundMap.error);
    return;
  }
  if (sB) {
    sB.disabled = true;
    sB.classList.add("processing");
  }
  const modelo = mI.value.trim();
  const cor = cI.value.trim();
  const imagem = iI?.value.trim();
  let cap = tipo === "Caminhao" && capI ? Number(capI.value) : null;
  setTimeout(() => {
    let nV = null;
    try {
      switch (tipo) {
        case "Carro":
          nV = new Carro(modelo, cor, imagem);
          break;
        case "CarroEsportivo":
          nV = new CarroEsportivo(modelo, cor, imagem);
          break;
        case "Caminhao":
          nV = new Caminhao(modelo, cor, cap, imagem);
          break;
        default:
          throw new Error("Tipo inválido.");
      }
      if (nV) {
        garage.push(nV);
        salvarGaragemNoLocalStorage();
        renderVehicleList();
        form.reset();
        handleAddTypeChange();
        showPanelContent("placeholder");
        showNotification(`✅ ${tipo} "${modelo}" adicionado!`, "success");
        playSound(soundMap.add_vehicle);
      }
    } catch (e) {
      showNotification(`❌ Erro criar: ${e.message}`, "error");
      console.error("Erro add vehicle:", e);
      playSound(soundMap.error);
    } finally {
      if (sB) {
        sB.disabled = false;
        sB.classList.remove("processing");
      }
    }
  }, 150);
}
/** @description Mostra/esconde campo capacidade no form add. */
function handleAddTypeChange() {
  const sT = DOM.addVehicleTypeSelect?.value;
  const cG = DOM.addCapacidadeGroup;
  const cI = DOM.addCapacidade;
  if (cG && cI) {
    if (sT === "Caminhao") {
      cG.classList.remove("hidden");
      cI.setAttribute("required", "required");
    } else {
      cG.classList.add("hidden");
      cI.removeAttribute("required");
      cI.classList.remove("error");
      cI.value = "10000";
    }
  }
}
/** @description Handler p/ excluir veículo. @param {Event} event */
function handleDeleteVehicle(event) {
  if (!currentlySelectedVehicle || currentlySelectedVehicleIndex < 0) {
    showNotification("Selecione p/ excluir.", "warning");
    playSound(soundMap.error);
    return;
  }
  const vN = currentlySelectedVehicle.modelo || "este veículo";
  if (confirm(`❓ Excluir "${vN}"?\n\nPermanente.`)) {
    const b = event?.target?.closest("button");
    if (b) {
      b.disabled = true;
      b.classList.add("processing");
    }
    setTimeout(() => {
      const iTR = currentlySelectedVehicleIndex;
      const dM = currentlySelectedVehicle.modelo;
      if (
        iTR >= 0 &&
        iTR < garage.length &&
        garage[iTR] === currentlySelectedVehicle
      ) {
        garage.splice(iTR, 1);
        currentlySelectedVehicle = null;
        currentlySelectedVehicleIndex = -1;
        salvarGaragemNoLocalStorage();
        renderVehicleList();
        showPanelContent("placeholder");
        showNotification(`🗑️ "${dM}" excluído.`, "info");
        playSound(soundMap.delete_vehicle);
      } else {
        showNotification("❌ Erro excluir.", "error");
        playSound(soundMap.error);
        console.error("Erro exclusão: inconsistente.");
        currentlySelectedVehicle = null;
        currentlySelectedVehicleIndex = -1;
        renderVehicleList();
        showPanelContent("placeholder");
      }
      if (b) {
        b.disabled = false;
        b.classList.remove("processing");
      }
    }, 150);
  } else {
    showNotification("Exclusão cancelada.", "info");
  }
}
/** @description Limpa erro do input ao digitar. @param {Event} event */
function clearInputErrorOnInput(event) {
  event.target.classList.remove("error");
}

// ==========================================================================
//                         INICIALIZAÇÃO E LISTENERS GERAIS
// ==========================================================================
/** @description Configura todos os event listeners da aplicação. */
function setupEventListeners() {
  DOM.btnShowAddForm?.addEventListener("click", () => {
    DOM.addVehicleForm?.reset();
    DOM.addVehicleForm
      ?.querySelectorAll(".error")
      .forEach((el) => el.classList.remove("error"));
    handleAddTypeChange();
    showPanelContent("addForm");
  });
  DOM.btnCancelAdd?.addEventListener("click", () =>
    showPanelContent("placeholder")
  );
  DOM.btnDelete?.addEventListener("click", handleDeleteVehicle);
  DOM.btnQuickSave?.addEventListener("click", handleQuickEditSave);
  DOM.addVehicleForm?.addEventListener("submit", handleAddFormSubmit);
  DOM.addVehicleTypeSelect?.addEventListener("change", handleAddTypeChange);
  const formInputs = document.querySelectorAll("input, select, textarea");
  formInputs.forEach((i) =>
    i.addEventListener("input", clearInputErrorOnInput)
  ); // Limpa erro ao digitar
  DOM.tabNav?.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-link")) activateTab(e.target);
  });
  // Listeners para botões de ação são via onclick no HTML para simplicidade
}
// --- Ponto de Entrada Principal ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Garagem Inteligente PRO Inicializando...");
  cacheDOMElements();
  setupEventListeners();
  carregarGaragemDoLocalStorage();
  renderVehicleList();
  showPanelContent("placeholder");
  console.log("✅ Garagem Pronta!");
});
// --- FIM DO SCRIPT ---
