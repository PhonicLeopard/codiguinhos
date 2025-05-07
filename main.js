// js/main.js

// ==========================================================================
//                 GARAGEM INTELIGENTE PRO - SCRIPT COMBINADO
//                      (v3.3 Refatorado + Lógica Original)
// ==========================================================================

// --- Importações dos Módulos das Classes ---
import Veiculo from "./Veiculo.js";
import Carro from "./Carro.js";
import CarroEsportivo from "./CarroEsportivo.js";
import Caminhao from "./Caminhao.js";
import Manutencao from "./Manutencao.js";
import weatherService from "./weatherService.js";

// --- Variáveis Globais e Constantes ---
/** @type {Veiculo[]} */
let garage = [];
/** @type {Veiculo | null} */
let currentlySelectedVehicle = null;
/** @type {number} */
let currentlySelectedVehicleIndex = -1;
/** @const {string} */
const LOCAL_STORAGE_KEY = "garagemInteligenteDados_v3.3_Combined"; // Chave atualizada

// --- Cache DOM ---
/** @type {Object<string, HTMLElement|null>} */
const DOM = {};
function cacheDOMElements() {
  console.log("Caching DOM elements...");
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
    "base-vehicle-details",
    "btn-fetch-external-details",
    "external-vehicle-details-content",
    // IDs dos botões de ação
    "btn-ligar",
    "btn-desligar",
    "btn-acelerar",
    "btn-frear",
    "btn-buzinar",
    "btn-rodar",
    "btn-turbo-on",
    "btn-turbo-off",
    "btn-carregar",
    "btn-descarregar",
    // Forms pais (para pegar botões depois)
    "register-maint-form",
    "schedule-maint-form",
  ];
  let allFound = true;
  ids.forEach((id) => {
    const element = document.getElementById(id);
    const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    DOM[camelCaseId] = element;
    if (!element) {
      const isOptional = [
        // IDs que podem não existir dependendo da feature ou HTML
        "actionsEsportivo",
        "actionsCaminhao",
        "btnTurboOn",
        "btnTurboOff",
        "btnCarregar",
        "btnDescarregar",
        "registerMaintForm",
        "scheduleMaintForm",
      ].includes(camelCaseId);

      if (!isOptional) {
        console.error(
          `❌ Cache DOM Crítico: Elemento com ID "${id}" não encontrado!`
        );
        allFound = false; // Marcar erro se for crítico
      } else {
        console.warn(
          `Cache DOM Opcional: Elemento com ID "${id}" não encontrado.`
        );
      }
    }
  });
  // Seletores específicos
  DOM.addCapacidadeGroup = DOM.addVehicleForm?.querySelector(
    '.specific-field[data-type="Caminhao"]'
  );
  if (!DOM.addCapacidadeGroup && DOM.addVehicleForm)
    console.warn(
      'Cache DOM: .specific-field[data-type="Caminhao"] não encontrado.'
    );

  // Botões dentro dos forms (se os forms existirem)
  DOM.btnRegisterMaint = DOM.registerMaintForm?.querySelector("button");
  DOM.btnScheduleMaint = DOM.scheduleMaintForm?.querySelector("button");
  if (!DOM.btnRegisterMaint && DOM.registerMaintForm)
    console.warn("Cache DOM: Botão de registrar manutenção não encontrado.");
  if (!DOM.btnScheduleMaint && DOM.scheduleMaintForm)
    console.warn("Cache DOM: Botão de agendar serviço não encontrado.");

  console.log("DOM caching finished.");
  return allFound; // Retorna false se um elemento crítico faltar
}

// --- Configuração de Áudio ---
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
//                      PERSISTÊNCIA (LocalStorage)
// ==========================================================================

/** Prepara dados de UM veículo para salvar. @param {Veiculo} vehicle @returns {object | null} */
function prepareVehicleDataForStorage(vehicle) {
  if (!(vehicle instanceof Veiculo) || !vehicle.id || !vehicle.constructor) {
    console.warn(
      "prepareVehicleDataForStorage: Tentativa de salvar objeto inválido.",
      vehicle
    );
    return null;
  }
  try {
    const d = { ...vehicle }; // Clona superficialmente
    // Trata o histórico de manutenções
    d.historicoManutencoes = Array.isArray(vehicle.historicoManutencoes)
      ? vehicle.historicoManutencoes
          .filter((m) => m instanceof Manutencao) // Garante que são instâncias corretas
          .map((m) => ({
            ...m, // Copia propriedades
            data: m.data.toISOString(), // Converte data para string ISO
            _notifiedRecently: undefined, // Remove propriedade transitória
          }))
      : []; // Salva como array vazio se não for array
    d._classType = vehicle.constructor.name; // Guarda o nome da classe
    delete d._notifiedRecently; // Remove outras props transitórias se houver

    // Validação simples (opcional)
    if (!d.id || !d._classType || !d.modelo) {
      console.warn(
        "prepareVehicleDataForStorage: Dados preparados parecem incompletos.",
        d
      );
    }
    return d;
  } catch (e) {
    console.error(`Erro ao preparar ${vehicle?.id} para storage:`, e);
    return null;
  }
}

/** Recria UM veículo a partir dos dados. @param {object} plainData @returns {Veiculo | null} */
function recreateVehicleFromData(plainData) {
  if (
    !plainData ||
    typeof plainData !== "object" ||
    !plainData._classType ||
    !plainData.id
  ) {
    console.warn(
      "recreateVehicleFromData: Dados inválidos ou incompletos.",
      plainData
    );
    return null;
  }
  const d = plainData;
  let vehicleInstance = null;
  try {
    // Instancia a classe correta usando os imports no topo do arquivo
    switch (d._classType) {
      case "Carro":
        vehicleInstance = new Carro(d.modelo, d.cor, d.imagem);
        break;
      case "CarroEsportivo":
        vehicleInstance = new CarroEsportivo(d.modelo, d.cor, d.imagem);
        break;
      case "Caminhao":
        const capacidade =
          typeof d.capacidadeCarga === "number" ? d.capacidadeCarga : 0;
        vehicleInstance = new Caminhao(d.modelo, d.cor, capacidade, d.imagem);
        break;
      default:
        console.warn(`Tipo de veículo desconhecido: ${d._classType}`);
        return null;
    }

    // Atribui propriedades comuns e específicas com checagens
    vehicleInstance.id = d.id; // ID é obrigatório
    vehicleInstance.ligado = d.ligado === true; // Garante booleano
    vehicleInstance.velocidade = Number(d.velocidade) || 0;
    vehicleInstance.quilometragem = Number(d.quilometragem) || 0;
    if (typeof d.maxVelocidade === "number") {
      vehicleInstance.maxVelocidade = d.maxVelocidade;
    }
    // Propriedades específicas
    if (
      vehicleInstance instanceof CarroEsportivo &&
      typeof d.turboAtivado === "boolean"
    ) {
      vehicleInstance.turboAtivado = d.turboAtivado;
    } else if (
      vehicleInstance instanceof Caminhao &&
      typeof d.cargaAtual === "number"
    ) {
      vehicleInstance.cargaAtual = Math.min(
        Math.max(0, Number(d.cargaAtual) || 0),
        vehicleInstance.capacidadeCarga // Garante que não exceda a capacidade
      );
    }

    // Recria histórico de manutenções
    if (Array.isArray(d.historicoManutencoes)) {
      vehicleInstance.historicoManutencoes = d.historicoManutencoes
        .map(Manutencao.fromPlainObject) // Usa método estático seguro
        .filter((m) => m instanceof Manutencao); // Filtra inválidos
      // Ordena por data decrescente
      vehicleInstance.historicoManutencoes.sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
    } else {
      vehicleInstance.historicoManutencoes = []; // Garante array
    }
    return vehicleInstance;
  } catch (e) {
    console.error(
      `Erro ao recriar ${d.id} (${d.modelo || "?"}, ${d._classType}):`,
      e
    );
    return null;
  }
}

/** Salva TODA a garagem no LocalStorage. */
function salvarGaragemNoLocalStorage() {
  console.log("Attempting to save garage to LocalStorage...");
  try {
    const dataToStore = garage
      .map(prepareVehicleDataForStorage)
      .filter(Boolean); // Remove nulos
    if (dataToStore.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
      console.log(`${dataToStore.length} vehicles saved successfully.`);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log("Garage empty, LocalStorage cleared.");
    }
  } catch (e) {
    console.error("Erro CRÍTICO ao salvar no LocalStorage:", e);
    let message = "Erro desconhecido ao salvar!";
    if (e.name === "QuotaExceededError") message = "Erro: Armazenamento cheio!";
    else if (e instanceof TypeError)
      message = "Erro: Problema converter dados.";
    if (typeof showNotification === "function")
      showNotification(`❌ ${message}`, "error", 0);
    if (typeof playSound === "function") playSound(soundMap.error);
  }
}

/** Carrega a garagem do LocalStorage. */
function carregarGaragemDoLocalStorage() {
  console.log(
    `Loading garage from LocalStorage (Key: ${LOCAL_STORAGE_KEY})...`
  );
  const dataString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!dataString) {
    console.log("LocalStorage empty. Initializing empty garage.");
    garage = [];
    return;
  }
  let parsedData;
  try {
    parsedData = JSON.parse(dataString);
    if (!Array.isArray(parsedData)) throw new Error("Invalid format.");
  } catch (e) {
    console.error("Erro ao PARSE LocalStorage:", e);
    if (typeof showNotification === "function")
      showNotification("❌ Erro ao ler dados! Resetando.", "error", 0);
    if (typeof playSound === "function") playSound(soundMap.error);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (removeError) {}
    garage = [];
    return;
  }
  const temporaryGarage = [];
  let failures = 0;
  parsedData.forEach((vehicleData) => {
    const vehicle = recreateVehicleFromData(vehicleData);
    if (vehicle instanceof Veiculo) temporaryGarage.push(vehicle);
    else {
      failures++;
      console.warn("Falha ao recriar veículo:", vehicleData);
    }
  });
  garage = temporaryGarage;
  console.log(
    `Garage loaded: ${garage.length} vehicles, ${failures} failures.`
  );
  if (failures > 0 && typeof showNotification === "function")
    showNotification(
      `⚠️ ${failures} veículo(s) não carregados.`,
      "warning",
      7000
    );
}

// ==========================================================================
//                 LÓGICA DE DADOS EXTERNOS (API SIMULADA)
// ==========================================================================

/** Busca detalhes adicionais de um veículo na API simulada (JSON local).
 * @async @param {string} idVeiculo ID do veículo. @returns {Promise<object|null>} Detalhes ou null. */
async function buscarDetalhesVeiculoAPI(idVeiculo) {
  console.log(`Buscando API simulada para ID: ${idVeiculo}`);
  try {
    const response = await fetch("./dados_veiculos_api.json");
    if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
    const todosDetalhes = await response.json();
    if (!Array.isArray(todosDetalhes))
      throw new Error("Formato inválido no JSON.");

    const detalhes = todosDetalhes.find((d) => d && d.id === idVeiculo);
    if (detalhes) {
      console.log(`Detalhes API encontrados para ${idVeiculo}:`, detalhes);
      return detalhes;
    } else {
      console.log(`Detalhes API não encontrados para ${idVeiculo}`);
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Falha buscar/processar API simulada (${idVeiculo}):`,
      error
    );
    return null;
  }
}

// ==========================================================================
//                 LÓGICA DE EXIBIÇÃO E INTERFACE (UI)
// ==========================================================================

function showPanelContent(contentType) {
  // Lista de todos os painéis principais que podem ser mostrados/escondidos
  const allPanels = [
    DOM.panelPlaceholder,
    DOM.vehicleDetailsView,
    DOM.addVehicleFormView,
    DOM.weatherForecastView // Adicionado aqui!
  ];

  // Validação inicial para garantir que os elementos DOM necessários existem
  if (
    !DOM.panelPlaceholder ||
    !DOM.vehicleDetailsView ||
    !DOM.addVehicleFormView ||
    !DOM.weatherForecastView // Verifique se este está no cache DOM
  ) {
    console.error(
      "showPanelContent: Um ou mais elementos de painel principais não foram encontrados no DOM. Verifique o cache."
    );
    // Poderia até mesmo mostrar um alerta ou uma mensagem de erro mais visível na UI
    return;
  }

  console.log(`showPanelContent called with: ${contentType}`);

  // Esconde todos os painéis
  allPanels.forEach(panel => {
    if (panel) { // Verifica se o elemento do painel existe antes de tentar adicionar a classe
        panel.classList.add("hidden");
    } else {
        // Isso pode acontecer se um ID não for encontrado durante o cacheDOMElements
        // console.warn(`showPanelContent: Tentativa de esconder um painel não cacheado ou inexistente.`);
    }
  });

  let elementToFocus = null;

  // Mostra o painel desejado
  switch (contentType) {
    case "details":
      if (DOM.vehicleDetailsView) {
        DOM.vehicleDetailsView.classList.remove("hidden");
        elementToFocus =
          DOM.detailVehicleName ||
          DOM.vehicleDetailsView.querySelector("button, input, select, textarea");
        console.log("Showing details panel.");
      }
      break;
    case "addForm":
      if (DOM.addVehicleFormView) {
        DOM.addVehicleFormView.classList.remove("hidden");
        elementToFocus =
          DOM.addVehicleType ||
          DOM.addVehicleFormView.querySelector("input, select, textarea");
        console.log("Showing add vehicle form panel.");
      }
      break;
    case "weather": // Nosso novo case
      if (DOM.weatherForecastView) {
        DOM.weatherForecastView.classList.remove("hidden");
        elementToFocus = DOM.weatherCityInput || DOM.weatherForecastView.querySelector("input, button");
        console.log("Showing weather forecast panel.");
      }
      break;
    case "placeholder":
    default:
      if (DOM.panelPlaceholder) {
        DOM.panelPlaceholder.classList.remove("hidden");
        console.log("Showing placeholder panel.");
      }
      break;
  }

  // Desseleciona na lista de veículos se não estiver mostrando 'details'
  if (contentType !== "details") {
    deselectAllVehiclesInList();
    currentlySelectedVehicle = null;
    currentlySelectedVehicleIndex = -1;
  }

  // Foco com delay para garantir que o elemento está visível
  if (elementToFocus) {
    setTimeout(() => {
      if (document.body.contains(elementToFocus) && !elementToFocus.classList.contains('hidden')) { // Verifica se ainda está no DOM e visível
        elementToFocus.focus({ preventScroll: true });
        console.log("Focus set to:", elementToFocus);
      } else {
        console.warn(
          "showPanelContent: Elemento para foco não encontrado, não visível, ou removido do DOM.",
          elementToFocus
        );
      }
    }, 150); // Um pequeno delay pode ajudar
  }

/** Renderiza a lista de veículos na sidebar. */
function renderVehicleList() {
  if (!DOM.vehicleList) {
    console.error("renderVehicleList: #vehicle-list não encontrado.");
    return;
  }
  DOM.vehicleList.innerHTML = ""; // Limpa

  if (garage.length === 0) {
    DOM.vehicleList.innerHTML =
      '<li class="placeholder" role="status">Sua garagem está vazia.</li>';
    console.log("Rendered empty garage list.");
    return;
  }

  const fragment = document.createDocumentFragment();
  garage.forEach((vehicle, index) => {
    if (!(vehicle instanceof Veiculo) || !vehicle.id || !vehicle.modelo) {
      console.warn(
        `renderVehicleList: Item inválido no índice ${index}`,
        vehicle
      );
      return; // Pula item inválido
    }
    const listItem = document.createElement("li");
    listItem.dataset.vehicleIndex = index;
    listItem.setAttribute("role", "button");
    listItem.tabIndex = 0;
    listItem.setAttribute("aria-label", `Selecionar: ${vehicle.modelo}`);

    const img = document.createElement("img");
    img.src = vehicle.imagem || "placeholder.png";
    img.alt = ""; // Decorativo
    img.className = "vehicle-list-img";
    img.onerror = function () {
      if (this.src !== "placeholder.png") {
        // Evita loop
        this.src = "placeholder.png";
        console.warn(
          `renderVehicleList: Falha imagem ${vehicle.modelo}. Usando placeholder.`
        );
      }
    };

    const nameSpan = document.createElement("span");
    nameSpan.className = "vehicle-list-name";
    nameSpan.textContent = vehicle.modelo;

    listItem.appendChild(img);
    listItem.appendChild(nameSpan);

    if (index === currentlySelectedVehicleIndex) {
      listItem.classList.add("selected");
      listItem.setAttribute("aria-current", "true");
    }

    // Listeners
    listItem.addEventListener("click", () => handleVehicleSelection(index));
    listItem.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleVehicleSelection(index);
      }
    });
    fragment.appendChild(listItem);
  });
  DOM.vehicleList.appendChild(fragment);
  console.log(`Rendered vehicle list with ${garage.length} items.`);
}

/** Remove seleção visual da lista. */
function deselectAllVehiclesInList() {
  if (!DOM.vehicleList) return;
  DOM.vehicleList.querySelectorAll("li.selected").forEach((li) => {
    li.classList.remove("selected");
    li.removeAttribute("aria-current");
  });
}

/** Manipula a seleção de um veículo na lista. @param {number} index */
function handleVehicleSelection(index) {
  if (typeof index !== "number" || index < 0 || index >= garage.length) {
    console.error("handleVehicleSelection: Índice inválido:", index);
    showNotification("❌ Erro ao selecionar.", "error");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }
  const selectedVehicle = garage[index];
  if (!(selectedVehicle instanceof Veiculo)) {
    console.error(
      `handleVehicleSelection: Item no índice ${index} inválido.`,
      selectedVehicle
    );
    showNotification("❌ Erro interno.", "error");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  currentlySelectedVehicle = selectedVehicle;
  currentlySelectedVehicleIndex = index;
  console.log(
    `Vehicle selected: ${currentlySelectedVehicle.modelo} (Index: ${index})`
  );

  deselectAllVehiclesInList(); // Desmarca outros
  const selectedListItem = DOM.vehicleList?.querySelector(
    `li[data-vehicle-index="${index}"]`
  );
  if (selectedListItem) {
    // Marca o selecionado
    selectedListItem.classList.add("selected");
    selectedListItem.setAttribute("aria-current", "true");
  } else {
    console.warn(
      `handleVehicleSelection: Li não encontrada para índice ${index}.`
    );
  }

  displaySelectedVehicleDetails(); // Atualiza painel direito
  showPanelContent("details"); // Garante que painel direito está visível
}

/** Atualiza painel de detalhes com infos do veículo selecionado. */
function displaySelectedVehicleDetails() {
  if (
    !currentlySelectedVehicle ||
    !(currentlySelectedVehicle instanceof Veiculo)
  ) {
    console.log(
      "displaySelectedVehicleDetails: Nenhum veículo válido selecionado."
    );
    showPanelContent("placeholder");
    return;
  }
  console.log(`Displaying details for: ${currentlySelectedVehicle.modelo}`);

  try {
    // Atualiza Quick Edit
    if (DOM.quickEditModel)
      DOM.quickEditModel.value = currentlySelectedVehicle.modelo || "";
    if (DOM.quickEditColor)
      DOM.quickEditColor.value = currentlySelectedVehicle.cor || "";
    if (DOM.quickEditImage)
      DOM.quickEditImage.value =
        currentlySelectedVehicle.imagem === "placeholder.png"
          ? ""
          : currentlySelectedVehicle.imagem || "";
    DOM.quickEditModel?.classList.remove("error");
    DOM.quickEditColor?.classList.remove("error");

    // Atualiza Imagem e Título Principal
    if (DOM.detailVehicleImg)
      DOM.detailVehicleImg.src =
        currentlySelectedVehicle.imagem || "placeholder.png";
    if (DOM.detailVehicleName)
      DOM.detailVehicleName.textContent =
        currentlySelectedVehicle.modelo || "Veículo";

    // Popula detalhes BASE
    if (DOM.baseVehicleDetails) {
      DOM.baseVehicleDetails.innerHTML =
        currentlySelectedVehicle.getDisplayInfo();
    } else console.warn("Elemento #base-vehicle-details não encontrado.");

    // Reseta área de detalhes EXTERNOS
    const externalContentArea = DOM.externalVehicleDetailsContent;
    const fetchButton = DOM.btnFetchExternalDetails;
    if (externalContentArea) {
      externalContentArea.innerHTML =
        "<p>Clique acima para carregar detalhes extras (API simulada).</p>";
      externalContentArea.classList.remove(
        "loading",
        "error",
        "success",
        "not-found"
      );
    } else console.warn("#external-vehicle-details-content não encontrado.");
    if (fetchButton) {
      fetchButton.disabled = false;
      fetchButton.classList.remove("processing");
    } else console.warn("#btn-fetch-external-details não encontrado.");

    // Atualiza Histórico e Agendamentos
    if (DOM.infoHistoryContent) {
      DOM.infoHistoryContent.innerHTML = generateMaintenanceListHtml(
        currentlySelectedVehicle.getPastMaintenances(),
        "maintenance-list",
        "Nenhum histórico registrado."
      );
    } else console.warn("#info-history-content não encontrado.");
    if (DOM.infoScheduleContent) {
      DOM.infoScheduleContent.innerHTML = generateMaintenanceListHtml(
        currentlySelectedVehicle.getFutureMaintenances(),
        "schedule-list",
        "Nenhum serviço agendado."
      );
      verificarAgendamentosProximos(currentlySelectedVehicle); // Verifica após renderizar
    } else console.warn("#info-schedule-content não encontrado.");

    // Mostra/Esconde Ações Específicas
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

    // Limpa Forms Manutenção
    [
      DOM.manutTipo,
      DOM.manutCusto,
      DOM.manutDesc,
      DOM.agendamentoData,
      DOM.agendamentoTipo,
      DOM.agendamentoDesc,
    ].forEach((input) => {
      if (input) {
        input.value = "";
        input.classList.remove("error");
      }
    });

    // Ativa Primeira Aba
    const firstTabButton = DOM.vehicleTabsNav?.querySelector(".tab-link");
    if (firstTabButton) activateTab(firstTabButton);

    console.log("Vehicle details display updated.");
  } catch (error) {
    console.error(
      `Erro fatal ao exibir detalhes (${currentlySelectedVehicle?.modelo}):`,
      error
    );
    showNotification(
      "❌ Erro grave ao exibir detalhes. Veja console.",
      "error",
      0
    );
    if (typeof playSound === "function") playSound(soundMap.error);
  }
}

/** Gera HTML para listas de manutenção. @param {Manutencao[]} maintenances @param {string} listClass @param {string} emptyMessage @returns {string} */
function generateMaintenanceListHtml(maintenances, listClass, emptyMessage) {
  if (!Array.isArray(maintenances)) {
    console.warn(
      "generateMaintenanceListHtml: Input não é array.",
      maintenances
    );
    return `<p>Erro lista.</p>`;
  }
  if (maintenances.length === 0) return `<p>${emptyMessage}</p>`;

  const listItemsHtml = maintenances
    .filter((m) => m instanceof Manutencao) // Garante instância válida
    .map((m) => {
      try {
        return `<li data-maint-id="${m.id}">${m.getDetalhesFormatados()}</li>`;
      } catch (e) {
        console.error(`Erro formatar manut ${m.id}:`, e);
        return `<li>Erro item.</li>`; // Fallback seguro
      }
    })
    .join("");

  return listItemsHtml
    ? `<ul class="${listClass}">${listItemsHtml}</ul>`
    : `<p>Erro gerar lista.</p>`;
}

/** Ativa aba e mostra conteúdo. @param {HTMLButtonElement} tabButton */
function activateTab(tabButton) {
  if (
    !(tabButton instanceof HTMLButtonElement) ||
    !tabButton.classList.contains("tab-link")
  ) {
    console.warn("activateTab: Argumento inválido.", tabButton);
    return;
  }
  if (!DOM.vehicleTabsNav || !DOM.tabContentContainer) {
    console.error("activateTab: Nav ou container não encontrados.");
    return;
  }
  // Desativa todos
  DOM.vehicleTabsNav.querySelectorAll(".tab-link").forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-selected", "false");
  });
  DOM.tabContentContainer.querySelectorAll(".tab-content").forEach((panel) => {
    panel.classList.remove("active"); // Ou display: none
    panel.hidden = true; // Melhor para acessibilidade
  });
  // Ativa o clicado
  tabButton.classList.add("active");
  tabButton.setAttribute("aria-selected", "true");
  // Mostra conteúdo correspondente
  const targetId = tabButton.dataset.target; // Ex: "#tab-info"
  if (targetId) {
    try {
      const targetContent = DOM.tabContentContainer.querySelector(targetId);
      if (targetContent) {
        targetContent.classList.add("active"); // Ou display: block
        targetContent.hidden = false; // Torna visível
        console.log(`Activated tab: ${targetId}`);
      } else
        console.warn(
          `activateTab: Content panel "${targetId}" não encontrado.`
        );
    } catch (e) {
      console.error(`activateTab: Erro encontrar/ativar "${targetId}":`, e);
    }
  } else console.warn("activateTab: Botão sem data-target.", tabButton);
}

/** Exibe notificação. @param {string} message @param {'info'|'success'|'warning'|'error'} [type='info'] @param {number} [duration=4000] */
function showNotification(message, type = "info", duration = 4000) {
  if (!DOM.notificationArea) {
    console[type === "error" ? "error" : type === "warning" ? "warn" : "log"](
      `Notify UI Missing: [${type.toUpperCase()}] ${message}`
    );
    return;
  }
  const el = document.createElement("div");
  el.className = `notification notification-${type}`;
  el.setAttribute("role", "alert");
  el.setAttribute(
    "aria-live",
    type === "error" || type === "success" ? "assertive" : "polite"
  );

  const msgSpan = document.createElement("span");
  msgSpan.innerHTML = message; // Assume HTML simples ou texto

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "×";
  closeBtn.setAttribute("aria-label", "Fechar");
  closeBtn.title = "Fechar";

  el.appendChild(msgSpan);
  el.appendChild(closeBtn);

  let timeoutId = null;
  const removeNotification = () => {
    clearTimeout(timeoutId);
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      if (el.parentNode === DOM.notificationArea)
        DOM.notificationArea.removeChild(el);
    }, 300);
  };
  closeBtn.addEventListener("click", removeNotification);

  DOM.notificationArea.insertBefore(el, DOM.notificationArea.firstChild);
  console.log(`Showing notification: [${type}] ${message}`);

  if (duration > 0) timeoutId = setTimeout(removeNotification, duration);
}

/** Verifica e notifica agendamentos próximos. @param {Veiculo} veiculo */
function verificarAgendamentosProximos(veiculo) {
  if (!veiculo || typeof veiculo.getFutureMaintenances !== "function") return;
  const futureMaint = veiculo.getFutureMaintenances();
  if (!Array.isArray(futureMaint) || futureMaint.length === 0) return;

  console.log(`Checking upcoming for ${veiculo.modelo}...`);
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;
  let notified = false;

  futureMaint.forEach((m) => {
    if (
      !(m instanceof Manutencao) ||
      !(m.data instanceof Date) ||
      m._notifiedRecently
    )
      return; // Pula inválidos ou já notificados

    const diffMs = m.data.getTime() - now;
    let notify = false;
    let message = "";
    const vName = `<b>${veiculo.modelo || "Veículo"}</b>`;
    const mType = `"${m.tipo || "Serviço"}"`;
    const dateFmt = m.data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeFmt = m.data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffMs > 0 && diffMs <= DAY_MS * 1.5) {
      // Hoje ou Amanhã
      message = `⏰ HOJE/AMANHÃ: ${mType} para ${vName} às ${timeFmt} (${dateFmt}).`;
      notify = true;
    } else if (diffMs > DAY_MS * 1.5 && diffMs <= WEEK_MS) {
      // Próxima Semana
      message = `🗓️ Próx. Semana: ${mType} para ${vName} em ${dateFmt}.`;
      notify = true;
    }

    if (notify) {
      console.log(`Upcoming found: ${message}`);
      showNotification(message, "warning", 10000);
      m._notifiedRecently = true; // Marca para não repetir na sessão
      notified = true;
    }
  });
  if (!notified) console.log("No immediate upcoming appointments found.");
}

/** Toca um som. @param {HTMLAudioElement} audioObject */
function playSound(audioObject) {
  if (!(audioObject instanceof HTMLAudioElement)) return;
  audioObject.pause();
  audioObject.currentTime = 0;
  audioObject.play().catch((e) => {
    if (e.name !== "NotAllowedError")
      console.warn(`Sound error (${audioObject.src}): ${e.message}`);
    // else console.log("Autoplay blocked by browser.");
  });
}

/** Toca som correspondente à ação/veículo. @param {Veiculo|null} veiculo @param {string} acao */
function tocarSomCorrespondente(veiculo, acao) {
  // Permite sons globais mesmo sem veículo selecionado
  if (
    !veiculo &&
    !["add_vehicle", "delete_vehicle", "save", "error"].includes(acao)
  )
    return;

  let soundToPlay = null;
  switch (acao) {
    case "ligar":
      soundToPlay = soundMap.ligar;
      break;
    case "desligar":
      soundToPlay = soundMap.desligar;
      break;
    case "acelerar":
      soundToPlay = soundMap.acelerar;
      break;
    case "frear":
      soundToPlay = soundMap.frear;
      break;
    case "buzinar":
      if (veiculo instanceof Caminhao) soundToPlay = soundMap.buzinar_caminhao;
      else if (veiculo instanceof CarroEsportivo)
        soundToPlay = soundMap.buzinar_esportivo;
      else if (veiculo instanceof Carro) soundToPlay = soundMap.buzinar_carro;
      // else soundToPlay = soundMap.buzinar_default; // Fallback
      break;
    case "add_vehicle":
      soundToPlay = soundMap.add_vehicle;
      break;
    case "delete_vehicle":
      soundToPlay = soundMap.delete_vehicle;
      break;
    case "save":
      soundToPlay = soundMap.save;
      break;
    case "error":
      soundToPlay = soundMap.error;
      break;
  }
  if (soundToPlay) {
    console.log(`Playing sound for action: ${acao}`);
    playSound(soundToPlay);
  }
}

// ==========================================================================
//                  FUNÇÃO CENTRAL DE INTERAÇÃO + FEEDBACK
// ==========================================================================

/** Função central para interagir com veículo. @param {string} acao @param {Event|null} event @param {...any} args @returns {Promise<boolean>} */
async function interagir(acao, event = null, ...args) {
  if (
    !currentlySelectedVehicle ||
    !(currentlySelectedVehicle instanceof Veiculo)
  ) {
    console.warn("interagir: No valid vehicle selected.");
    showNotification("❗ Selecione um veículo!", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return false;
  }
  const veiculo = currentlySelectedVehicle;
  console.log(
    `Interacting with ${veiculo.modelo}: Action=${acao}, Args=`,
    args
  );

  let button = event?.target?.closest("button");
  if (button) {
    // Feedback visual no botão
    button.disabled = true;
    button.classList.add("processing");
  }

  let sucesso = false;
  // Verifica se a ação existe no veículo
  if (typeof veiculo[acao] !== "function") {
    const errMsg = `Ação inválida "${acao}" p/ ${veiculo.constructor.name}.`;
    console.error(`interagir: ${errMsg}`);
    showNotification(`❌ ${errMsg}`, "error");
    if (typeof playSound === "function") playSound(soundMap.error);
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
    return false;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Pequeno delay simulado
    // Chama o método no objeto veículo
    const result = veiculo[acao](...args);
    // Assume sucesso se não retornar explicitamente false
    sucesso = result !== false;
    console.log(
      `Action "${acao}" executed. Result: ${result}, Success: ${sucesso}`
    );
  } catch (error) {
    // Captura erros lançados pelos métodos (ex: new Manutencao)
    console.error(`Erro durante ação "${acao}" em ${veiculo.modelo}:`, error);
    const errorMsg =
      error instanceof Error ? error.message : `Erro ao ${acao}.`;
    showNotification(`❌ Erro: ${errorMsg}`, "error", 0);
    if (typeof playSound === "function") playSound(soundMap.error);
    sucesso = false;
  } finally {
    // Garante reabilitar botão
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
  }

  // Atualiza a UI SEMPRE após a ação (para refletir mudança ou falha)
  displaySelectedVehicleDetails();

  // Se sucesso, toca som e persiste se necessário
  if (sucesso) {
    tocarSomCorrespondente(veiculo, acao);

    const actionsToPersist = [
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
    if (actionsToPersist.includes(acao)) {
      console.log(`Action "${acao}" requires persistence. Saving...`);
      salvarGaragemNoLocalStorage();
    }
  } else {
    console.log(`Action "${acao}" failed or returned false.`);
    // Som de erro geralmente já foi tocado no catch ou pelo método que retornou false
  }
  return sucesso;
}

// ==========================================================================
//                  HANDLERS DE EVENTOS DA UI
// ==========================================================================

/** @param {Event} event */ function handleLigarClick(event) {
  console.log("H: Ligar");
  interagir("ligar", event);
}
/** @param {Event} event */ function handleDesligarClick(event) {
  console.log("H: Desligar");
  interagir("desligar", event);
}
/** @param {Event} event */ function handleBuzinarClick(event) {
  console.log("H: Buzinar");
  interagir("buzinar", event);
}

/** @param {Event} event */ function handleAcelerarClick(event) {
  console.log("H: Acelerar");
  let inc = 10; // Padrão
  if (currentlySelectedVehicle instanceof CarroEsportivo) inc = 25;
  else if (currentlySelectedVehicle instanceof Caminhao) inc = 8;
  interagir("acelerar", event, inc);
}

/** @param {Event} event */ function handleFrearClick(event) {
  console.log("H: Frear");
  let dec = 10; // Padrão
  if (currentlySelectedVehicle instanceof CarroEsportivo) dec = 20;
  else if (currentlySelectedVehicle instanceof Caminhao) dec = 8;
  interagir("frear", event, dec);
}

/** @param {Event} event */ function handleRodarClick(event) {
  console.log("H: Rodar");
  const input = document.getElementById("distanciaRodar"); // Pega input direto
  if (!input || !input.checkValidity() || Number(input.value) <= 0) {
    console.warn("H: Rodar - Distância inválida.");
    showNotification("❗ Distância inválida.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    input?.classList.add("error");
    input?.focus();
    return;
  }
  input.classList.remove("error");
  interagir("rodar", event, Number(input.value));
}

/** @param {Event} event */ function handleTurboOnClick(event) {
  console.log("H: Turbo ON");
  interagir("ativarTurbo", event);
}
/** @param {Event} event */ function handleTurboOffClick(event) {
  console.log("H: Turbo OFF");
  interagir("desativarTurbo", event);
}

/** @param {Event} event */ function handleCarregarClick(event) {
  console.log("H: Carregar");
  const input = document.getElementById("pesoCarga");
  if (!input || !input.checkValidity() || Number(input.value) <= 0) {
    console.warn("H: Carregar - Peso inválido.");
    showNotification("❗ Peso inválido.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    input?.classList.add("error");
    input?.focus();
    return;
  }
  input.classList.remove("error");
  interagir("carregar", event, Number(input.value));
}

/** @param {Event} event */ function handleDescarregarClick(event) {
  console.log("H: Descarregar");
  const input = document.getElementById("pesoCarga"); // Reusa input
  if (!input || !input.checkValidity() || Number(input.value) <= 0) {
    console.warn("H: Descarregar - Peso inválido.");
    showNotification("❗ Peso inválido.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    input?.classList.add("error");
    input?.focus();
    return;
  }
  input.classList.remove("error");
  interagir("descarregar", event, Number(input.value));
}

/** Handler p/ registrar manutenção realizada. @param {Event} event */
function handleRegistrarManutencao(event) {
  console.log("H: Registrar Manut.");
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione veículo.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  const tipoI = DOM.manutTipo,
    custoI = DOM.manutCusto,
    descI = DOM.manutDesc;
  if (!tipoI || !custoI) {
    console.error("H: Reg Manut - Inputs não encontrados.");
    showNotification("❌ Erro form.", "error");
    return;
  }

  tipoI.classList.remove("error");
  custoI.classList.remove("error");
  let isValid = true;
  const tipo = tipoI.value.trim();
  const custoStr = custoI.value.replace(",", ".").trim();
  const custo = parseFloat(custoStr);
  const desc = descI ? descI.value.trim() : "";

  if (!tipo) {
    showNotification("❗ Tipo obrigatório.", "warning");
    tipoI.classList.add("error");
    tipoI.focus();
    isValid = false;
  }
  if (
    custoStr === "" ||
    isNaN(custo) ||
    custo < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(custoStr)
  ) {
    showNotification("❗ Custo inválido (ex: 150 ou 150.00).", "warning");
    custoI.classList.add("error");
    if (isValid) custoI.focus();
    isValid = false;
  }
  if (!isValid) {
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  // Chama interagir com data ATUAL
  interagir("registrarManutencao", event, new Date(), tipo, custo, desc).then(
    (success) => {
      if (success) {
        showNotification(`✅ Manut "${tipo}" registrada!`, "success");
        tipoI.value = "";
        custoI.value = "";
        if (descI) descI.value = ""; // Limpa form
      } // Erro já notificado por 'interagir'
    }
  );
}

/** Handler p/ agendar serviço futuro. @param {Event} event */
function handleAgendarManutencao(event) {
  console.log("H: Agendar Manut.");
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione veículo.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  const dataI = DOM.agendamentoData,
    tipoI = DOM.agendamentoTipo,
    descI = DOM.agendamentoDesc;
  if (!dataI || !tipoI) {
    console.error("H: Ag Manut - Inputs não encontrados.");
    showNotification("❌ Erro form.", "error");
    return;
  }

  dataI.classList.remove("error");
  tipoI.classList.remove("error");
  let isValid = true;
  const dataStr = dataI.value;
  const tipo = tipoI.value.trim();
  const desc = descI ? descI.value.trim() : "";
  let dataAgendamento = null;

  if (!dataStr) {
    showNotification("❗ Data/Hora obrigatória.", "warning");
    dataI.classList.add("error");
    dataI.focus();
    isValid = false;
  } else {
    dataAgendamento = new Date(dataStr);
    if (isNaN(dataAgendamento.getTime())) {
      showNotification("❗ Data/Hora inválida.", "warning");
      dataI.classList.add("error");
      if (isValid) dataI.focus();
      isValid = false;
      dataAgendamento = null;
    } else if (dataAgendamento <= new Date()) {
      showNotification("❗ Data deve ser futura.", "warning");
      dataI.classList.add("error");
      if (isValid) dataI.focus();
      isValid = false;
    }
  }
  if (!tipo) {
    showNotification("❗ Tipo Serviço obrigatório.", "warning");
    tipoI.classList.add("error");
    if (isValid) tipoI.focus();
    isValid = false;
  }

  if (!isValid) {
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  // Chama interagir com data FUTURA e custo 0
  interagir("registrarManutencao", event, dataAgendamento, tipo, 0, desc).then(
    (success) => {
      if (success) {
        showNotification(`🗓️ Serviço "${tipo}" agendado!`, "success");
        dataI.value = "";
        tipoI.value = "";
        if (descI) descI.value = ""; // Limpa form
      }
    }
  );
}

/** Handler p/ salvar quick edit (modelo, cor, imagem). @param {Event} event */
function handleQuickEditSave(event) {
  console.log("H: Quick Edit Save");
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione veículo.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  const modelI = DOM.quickEditModel,
    colorI = DOM.quickEditColor,
    imageI = DOM.quickEditImage;
  if (!modelI || !colorI) {
    console.error("H: Quick Edit - Inputs não encontrados.");
    showNotification("❌ Erro form.", "error");
    return;
  }

  modelI.classList.remove("error");
  colorI.classList.remove("error");
  let isValid = true;
  const novoModelo = modelI.value.trim();
  const novaCor = colorI.value.trim();
  const novaImagem = imageI ? imageI.value.trim() : null; // Permite vazio

  if (!novoModelo) {
    showNotification("❗ Modelo obrigatório.", "warning");
    modelI.classList.add("error");
    modelI.focus();
    isValid = false;
  }
  if (!novaCor) {
    showNotification("❗ Cor obrigatória.", "warning");
    colorI.classList.add("error");
    if (isValid) colorI.focus();
    isValid = false;
  }

  if (!isValid) {
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  // Chama interagir com updateProperties (4o arg null p/ capacidade)
  interagir(
    "updateProperties",
    event,
    novoModelo,
    novaCor,
    novaImagem,
    null
  ).then((success) => {
    if (success) {
      // 'success' aqui significa que *algo mudou*
      showNotification("✅ Propriedades atualizadas!", "success");
      renderVehicleList(); // Atualiza nome/imagem na lista
      // Som de save é tocado por 'interagir'
    } else {
      console.log("Quick Edit: Nenhuma alteração detectada.");
      // Opcional: notificar que nada mudou
      // showNotification("Nenhuma alteração para salvar.", "info");
    }
  });
}

/** Handler p/ submit do form de adicionar novo veículo. @param {Event} event */
function handleAddFormSubmit(event) {
  event.preventDefault(); // Previne envio padrão
  console.log("H: Add Form Submit");
  const form = event.target;
  if (!form || form.id !== "add-vehicle-form") return;

  const btn = form.querySelector('button[type="submit"]');
  console.log("Validating form...");
  const tipoS = DOM.addVehicleType,
    modeloI = DOM.addModelo,
    corI = DOM.addCor,
    imgI = DOM.addImagem,
    capI = DOM.addCapacidade;
  if (!tipoS || !modeloI || !corI) {
    console.error("H: Add Submit - Inputs essenciais não encontrados.");
    showNotification("❌ Erro form.", "error");
    return;
  }

  let isValid = true;
  const tipo = tipoS.value,
    modelo = modeloI.value.trim(),
    cor = corI.value.trim(),
    img = imgI ? imgI.value.trim() : "";
  let capacidade = null;

  const inputsToValidate = [tipoS, modeloI, corI];
  if (tipo === "Caminhao") {
    if (capI) inputsToValidate.push(capI);
    else {
      console.error(
        "H: Add Submit - Input capacidade não encontrado p/ Caminhão."
      );
      showNotification("❌ Erro form cap.", "error");
      isValid = false;
    }
  }

  inputsToValidate.forEach((input) => {
    if (!input) return; // Pula se não achou no cache
    input.classList.remove("error");
    let isEmpty =
      !input.value ||
      (typeof input.value === "string" && input.value.trim() === "");
    let isInvalidNumber = false;

    if (input.type === "number") {
      const numValue = Number(input.value);
      if (isNaN(numValue) || numValue < 0) isInvalidNumber = true;
      else if (input === capI) capacidade = numValue; // Guarda valor válido
    }
    // Marca inválido se vazio E requerido, OU se for número inválido
    if ((isEmpty && input.hasAttribute("required")) || isInvalidNumber) {
      isValid = false;
      input.classList.add("error");
      // Foca no primeiro inválido
      if (isValid === false && !form.querySelector(".error:focus"))
        input.focus();
    }
  });

  if (!isValid) {
    console.error("Form validation failed.");
    showNotification("❗ Preencha os campos obrigatórios.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }

  console.log("Validation passed.");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("processing");
  }

  // Delay simulado (opcional)
  setTimeout(() => {
    console.log("Timeout - Creating vehicle...");
    let novoVeiculo = null;
    try {
      switch (
        tipo // Usa classes importadas
      ) {
        case "Carro":
          novoVeiculo = new Carro(modelo, cor, img);
          break;
        case "CarroEsportivo":
          novoVeiculo = new CarroEsportivo(modelo, cor, img);
          break;
        case "Caminhao":
          novoVeiculo = new Caminhao(modelo, cor, capacidade, img);
          break; // capacidade já validada
        default:
          throw new Error("Tipo de veículo inválido.");
      }
      if (novoVeiculo instanceof Veiculo) {
        console.log("Vehicle created:", novoVeiculo);
        garage.push(novoVeiculo);
        salvarGaragemNoLocalStorage();
        renderVehicleList();
        form.reset();
        handleAddTypeChange(); // Reseta campo capacidade
        showPanelContent("placeholder"); // Volta ao placeholder
        showNotification(`✅ ${tipo} "${modelo}" adicionado!`, "success");
        tocarSomCorrespondente(null, "add_vehicle"); // Som global
      } else throw new Error("Falha ao criar instância.");
    } catch (error) {
      console.error("Erro criar/add veículo:", error);
      showNotification(`❌ Erro criar: ${error.message}`, "error", 0);
      if (typeof playSound === "function") playSound(soundMap.error);
    } finally {
      console.log("Processing finished.");
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("processing");
      }
    }
  }, 150);
}

/** Mostra/esconde campo capacidade no form add. */
function handleAddTypeChange() {
  const selectedType = DOM.addVehicleType?.value;
  const capacityGroup = DOM.addCapacidadeGroup; // Div que envolve label e input
  const capacityInput = DOM.addCapacidade;
  if (!capacityGroup || !capacityInput) return; // Elementos não encontrados

  if (selectedType === "Caminhao") {
    capacityGroup.classList.remove("hidden");
    capacityInput.setAttribute("required", "required"); // Torna obrigatório
  } else {
    capacityGroup.classList.add("hidden");
    capacityInput.removeAttribute("required"); // Deixa de ser obrigatório
    capacityInput.classList.remove("error"); // Limpa erro se houver
    capacityInput.value = capacityInput.defaultValue || "10000"; // Reseta valor
  }
  console.log(`Add type changed: ${selectedType}. Capacity field updated.`);
}

/** Handler p/ excluir veículo selecionado. @param {Event} event */
function handleDeleteVehicle(event) {
  console.log("H: Delete");
  if (
    !currentlySelectedVehicle ||
    currentlySelectedVehicleIndex < 0 ||
    currentlySelectedVehicleIndex >= garage.length
  ) {
    showNotification("❗ Selecione p/ excluir.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }
  const name = currentlySelectedVehicle.modelo || "este veículo";
  if (confirm(`❓ Excluir "${name}"?\n\nEsta ação não pode ser desfeita.`)) {
    console.log(`User confirmed delete: ${name}`);
    const btn = event?.target?.closest("button");
    if (btn) {
      btn.disabled = true;
      btn.classList.add("processing");
    }

    setTimeout(() => {
      // Delay simulado
      try {
        const indexToRemove = currentlySelectedVehicleIndex;
        const deletedModelName = currentlySelectedVehicle.modelo;
        // Dupla checagem
        if (
          indexToRemove >= 0 &&
          indexToRemove < garage.length &&
          garage[indexToRemove] === currentlySelectedVehicle
        ) {
          garage.splice(indexToRemove, 1); // Remove do array
          currentlySelectedVehicle = null; // Limpa seleção
          currentlySelectedVehicleIndex = -1;
          salvarGaragemNoLocalStorage();
          renderVehicleList();
          showPanelContent("placeholder");
          showNotification(`🗑️ "${deletedModelName}" excluído.`, "info");
          tocarSomCorrespondente(null, "delete_vehicle");
          console.log(`Vehicle index ${indexToRemove} deleted.`);
        } else throw new Error("Inconsistência ao excluir.");
      } catch (error) {
        console.error("Erro excluir veículo:", error);
        showNotification("❌ Erro ao excluir.", "error");
        if (typeof playSound === "function") playSound(soundMap.error);
        currentlySelectedVehicle = null;
        currentlySelectedVehicleIndex = -1; // Reseta em caso de erro
        renderVehicleList();
        showPanelContent("placeholder");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove("processing");
        }
      }
    }, 150);
  } else {
    console.log("Delete cancelled.");
    showNotification("Exclusão cancelada.", "info");
  }
}

/** Limpa classe 'error' do input ao digitar. @param {Event} event */
function clearInputErrorOnInput(event) {
  if (
    event.target instanceof Element &&
    event.target.classList.contains("error")
  ) {
    event.target.classList.remove("error");
  }
}

/** Handler para buscar detalhes externos da API simulada. @param {Event} event */
async function handleFetchExternalDetailsClick(event) {
  console.log("H: Fetch External Details");
  if (!currentlySelectedVehicle || !currentlySelectedVehicle.id) {
    showNotification("❗ Selecione veículo.", "warning");
    if (typeof playSound === "function") playSound(soundMap.error);
    return;
  }
  const button = DOM.btnFetchExternalDetails;
  const contentArea = DOM.externalVehicleDetailsContent;
  if (!button || !contentArea) {
    console.error("H: Fetch Ext - Botão ou área não encontrados.");
    showNotification("❌ Erro interno UI.", "error");
    return;
  }

  const vehicleId = currentlySelectedVehicle.id;
  button.disabled = true;
  button.classList.add("processing");
  contentArea.innerHTML = "<p><i>Carregando detalhes extras...</i></p>";
  contentArea.className = "info-panel loading"; // Define estado inicial

  try {
    const detalhesAPI = await buscarDetalhesVeiculoAPI(vehicleId);
    if (detalhesAPI) {
      let html = "";
      const labelMap = {
        /* Mapa de labels para pt-BR */ valorFIPE_estimado: "Valor FIPE (Est.)",
        recall_pendente: "Recall Pendente?",
        dica_especifica: "Dica",
        consumo_medio_cidade_kml: "Consumo Cid (Km/L)",
        consumo_medio_estrada_kml: "Consumo Est (Km/L)",
        proxima_inspecao_obrigatoria: "Próx. Inspeção",
        tipo_oleo_recomendado: "Óleo Recomendado",
      };
      for (const key in detalhesAPI) {
        if (
          key !== "id" &&
          detalhesAPI[key] !== null &&
          detalhesAPI[key] !== undefined
        ) {
          const label =
            labelMap[key] ||
            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          let value = detalhesAPI[key];
          // Formatações específicas
          if (key === "valorFIPE_estimado")
            value = Number(value).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          else if (key === "recall_pendente")
            value = value
              ? '<strong style="color: var(--danger-color);">SIM</strong>'
              : "Não";
          else if (key.startsWith("consumo_medio") && typeof value === "number")
            value = value.toFixed(1);
          else if (key === "proxima_inspecao_obrigatoria") {
            try {
              value = new Date(value + "T00:00:00").toLocaleDateString("pt-BR");
            } catch (e) {}
          }

          const valueNode = document.createElement("span"); // Para segurança
          if (key === "recall_pendente")
            valueNode.innerHTML = value; // Permite HTML seguro
          else valueNode.textContent = value;
          html += `<div class="info-item"><strong>${label}:</strong> ${valueNode.outerHTML}</div>`;
        }
      }
      contentArea.innerHTML =
        html || "<p><i>Detalhes extras não disponíveis.</i></p>";
      contentArea.className = "info-panel success"; // Muda estado para sucesso
    } else {
      contentArea.innerHTML =
        "<p><i>Detalhes extras não encontrados para este veículo.</i></p>";
      contentArea.className = "info-panel not-found"; // Muda estado para não encontrado
    }
  } catch (error) {
    console.error("Erro buscar/exibir detalhes externos:", error);
    contentArea.innerHTML =
      '<p style="color: var(--danger-color);">❌ Falha ao carregar. Veja console.</p>';
    contentArea.className = "info-panel error"; // Muda estado para erro
  } finally {
    button.disabled = false;
    button.classList.remove("processing");
    contentArea.classList.remove("loading"); // Remove estado de carregamento
  }
}

// ==========================================================================
//                         INICIALIZAÇÃO E LISTENERS GERAIS
// ==========================================================================

/** Configura todos os event listeners da aplicação. */
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // --- Botões Principais ---
  DOM.btnShowAddVehicleForm?.addEventListener("click", () => {
    console.log("H: Show Add Form");
    DOM.addVehicleForm?.reset();
    DOM.addVehicleForm
      ?.querySelectorAll(".error")
      .forEach((el) => el.classList.remove("error"));
    handleAddTypeChange();
    showPanelContent("addForm");
  });
  DOM.btnCancelAddVehicle?.addEventListener("click", () => {
    console.log("H: Cancel Add");
    showPanelContent("placeholder");
  });
  DOM.btnDeleteVehicle?.addEventListener("click", handleDeleteVehicle);
  DOM.btnSaveQuickEdit?.addEventListener("click", handleQuickEditSave);

  // --- Formulário Add ---
  DOM.addVehicleForm?.addEventListener("submit", handleAddFormSubmit);
  DOM.addVehicleType?.addEventListener("change", handleAddTypeChange);

  // --- Limpar Erro Input ---
  document
    .querySelectorAll("input, select, textarea")
    .forEach((el) => el.addEventListener("input", clearInputErrorOnInput));

  // --- Abas ---
  DOM.vehicleTabsNav?.addEventListener("click", (e) => {
    if (
      e.target instanceof HTMLButtonElement &&
      e.target.classList.contains("tab-link")
    ) {
      console.log(`H: Tab Nav Click on: ${e.target.dataset.target}`);
      activateTab(e.target);
    }
  });

  // --- Botões de Ação Veículo (usando cache DOM) ---
  DOM.btnLigar?.addEventListener("click", handleLigarClick);
  DOM.btnDesligar?.addEventListener("click", handleDesligarClick);
  DOM.btnAcelerar?.addEventListener("click", handleAcelerarClick);
  DOM.btnFrear?.addEventListener("click", handleFrearClick);
  DOM.btnBuzinar?.addEventListener("click", handleBuzinarClick);
  DOM.btnRodar?.addEventListener("click", handleRodarClick);
  DOM.btnTurboOn?.addEventListener("click", handleTurboOnClick);
  DOM.btnTurboOff?.addEventListener("click", handleTurboOffClick);
  DOM.btnCarregar?.addEventListener("click", handleCarregarClick);
  DOM.btnDescarregar?.addEventListener("click", handleDescarregarClick);

  // --- Botões Forms Manutenção (usando cache DOM) ---
  DOM.btnRegisterMaint?.addEventListener("click", handleRegistrarManutencao);
  DOM.btnScheduleMaint?.addEventListener("click", handleAgendarManutencao);

  // --- Botão API Simulada ---
  DOM.btnFetchExternalDetails?.addEventListener(
    "click",
    handleFetchExternalDetailsClick
  );

  console.log("Event listeners setup finished.");
  // main.js - dentro de setupEventListeners()

function setupEventListeners() {
  // ... seus outros listeners ...

  DOM.btnBuscarPrevisao?.addEventListener('click', handleBuscarPrevisaoClick);
  DOM.weatherCityInput?.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
          // Opcional: prevenir submit de formulário se o input estiver dentro de um <form>
          // event.preventDefault(); 
          handleBuscarPrevisaoClick();
      }
  });

  console.log("Event listeners setup finished.");
}
}

// --- Ponto de Entrada Principal ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed.");
  // Cache DOM e verifica elementos críticos
  if (!cacheDOMElements()) {
    alert(
      "Erro crítico: Elementos essenciais da UI não encontrados. App não pode iniciar."

    );
    return; // Impede inicialização se faltar algo crítico
    // ... outros IDs
    weather-forecast-view
    weather-city-input
    btn-buscar-previsao
    previsao-tempo-resultado
// ...
  }

// Se você não estiver usando import/export dessa forma e as funções estiverem globais,
// não precisa do import. Mas com type="module", o import é o caminho.

/**
 * Exibe a previsão do tempo processada na interface do usuário.
 * @param {Array<Object>|null} previsaoDiaria Array de objetos de previsão por dia, ou null.
 * @param {string} nomeCidade O nome da cidade para exibição no título.
 */
function exibirPrevisaoDetalhada(previsaoDiaria, nomeCidade) {
    if (!DOM.previsaoTempoResultado) {
        console.error("exibirPrevisaoDetalhada: Elemento #previsao-tempo-resultado não encontrado.");
        showNotification("Erro na UI: Área de previsão não encontrada.", "error");
        return;
    }

    const containerResultados = DOM.previsaoTempoResultado;
    containerResultados.innerHTML = ""; // Limpa resultados anteriores

    if (!previsaoDiaria || previsaoDiaria.length === 0) {
        const p = document.createElement('p');
        p.className = 'info-message';
        p.textContent = `Nenhuma previsão encontrada para ${nomeCidade || 'a cidade informada'}. Verifique o nome ou tente mais tarde.`;
        containerResultados.appendChild(p);
        console.log("Nenhuma previsão para exibir.");
        return;
    }

    // Adiciona um título geral para a previsão
    const titulo = document.createElement('h3');
    titulo.className = 'forecast-title';
    titulo.textContent = `Previsão para os próximos dias em ${nomeCidade}`;
    containerResultados.appendChild(titulo);

    // Cria um container para os cards dos dias (para usar flexbox/grid)
    const daysContainer = document.createElement('div');
    daysContainer.className = 'forecast-days-container';
    containerResultados.appendChild(daysContainer);

    previsaoDiaria.forEach(dia => {
        const cardDia = document.createElement('div');
        cardDia.className = 'forecast-day-card';

        const dataFormatada = new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { // Adiciona T00:00:00 para evitar problemas de fuso
            weekday: 'short', day: '2-digit', month: 'short'
        });

        const tituloDia = document.createElement('h4');
        tituloDia.textContent = dataFormatada;
        cardDia.appendChild(tituloDia);

        if (dia.iconeRepresentativo) {
            const imgIcone = document.createElement('img');
            imgIcone.src = `https://openweathermap.org/img/wn/${dia.iconeRepresentativo}@2x.png`;
            imgIcone.alt = dia.descricaoRepresentativa;
            imgIcone.title = dia.descricaoRepresentativa; // Tooltip com a descrição
            cardDia.appendChild(imgIcone);
        }

        const temperaturas = document.createElement('p');
        temperaturas.className = 'temperatures';
        temperaturas.innerHTML = `
            <span class="temp-max" title="Máxima">${dia.temp_max.toFixed(1)}°C</span> /
            <span class="temp-min" title="Mínima">${dia.temp_min.toFixed(1)}°C</span>
        `;
        cardDia.appendChild(temperaturas);

        const descricao = document.createElement('p');
        descricao.className = 'description';
        descricao.textContent = dia.descricaoRepresentativa;
        cardDia.appendChild(descricao);

        // Opcional: Mostrar mais detalhes de cada intervalo de 3h (dia.entradas)
        // const detalhes3h = document.createElement('details');
        // const sumario3h = document.createElement('summary');
        // sumario3h.textContent = "Ver detalhes (3h em 3h)";
        // detalhes3h.appendChild(sumario3h);
        // dia.entradas.forEach(entrada => {
        //     const pEntrada = document.createElement('p');
        //     pEntrada.style.fontSize = "0.8em";
        //     pEntrada.textContent = `${entrada.hora}: ${entrada.temp.toFixed(1)}°C, ${entrada.descricao}`;
        //     detalhes3h.appendChild(pEntrada);
        // });
        // cardDia.appendChild(detalhes3h);

        daysContainer.appendChild(cardDia);
    });
    console.log("Previsão exibida na UI.");
}
/**
 * Handler para o clique no botão de buscar previsão do tempo.
 * @async
 */
async function handleBuscarPrevisaoClick() {
  if (!DOM.weatherCityInput || !DOM.previsaoTempoResultado || !DOM.btnBuscarPrevisao) {
      console.error("handleBuscarPrevisaoClick: Elementos da UI de previsão não encontrados.");
      showNotification("Erro crítico na UI de previsão.", "error");
      return;
  }

  const cidade = DOM.weatherCityInput.value.trim();
  if (!cidade) {
      showNotification("Por favor, digite o nome de uma cidade.", "warning");
      DOM.weatherCityInput.focus();
      return;
  }

  const btn = DOM.btnBuscarPrevisao;
  const resultadosContainer = DOM.previsaoTempoResultado;

  btn.disabled = true;
  btn.classList.add('processing'); // Reutilizando sua classe de loading de botão
  resultadosContainer.innerHTML = '<p class="loading-message">Buscando previsão para ' + cidade + '...</p>';

  try {
      const rawData = await buscarPrevisaoDetalhada(cidade);

      if (rawData && rawData.cod === "200") { // Verifica o 'cod' da OpenWeatherMap
          const processedData = processarDadosForecast(rawData);
          if (processedData && processedData.length > 0) {
              exibirPrevisaoDetalhada(processedData, rawData.city ? rawData.city.name : cidade);
          } else {
              resultadosContainer.innerHTML = `<p class="error-message">Não foi possível processar os dados da previsão para ${cidade}.</p>`;
              console.warn("Dados processados vieram vazios ou nulos para:", cidade, rawData);
          }
      } else {
          // Erro já tratado em buscarPrevisaoDetalhada, mas podemos dar um feedback mais específico aqui
          // A mensagem de erro da API (se existir) está em rawData.message se a busca não deu null
          const apiErrorMessage = rawData && rawData.message ? rawData.message : "Não foi possível conectar à API ou cidade não encontrada.";
          resultadosContainer.innerHTML = `<p class="error-message">Falha ao buscar previsão para ${cidade}: ${apiErrorMessage}</p>`;
          console.error("Erro ao buscar previsão (raw):", rawData);
      }
  } catch (error) { // Este catch é mais para erros inesperados no fluxo
      console.error("Erro inesperado no fluxo de busca de previsão:", error);
      resultadosContainer.innerHTML = `<p class="error-message">Ocorreu um erro inesperado ao buscar a previsão. Tente novamente.</p>`;
      showNotification("Erro inesperado: " + error.message, "error");
  } finally {
      btn.disabled = false;
      btn.classList.remove('processing');
  }
}

// 5. Adicionar o Event Listener em setupEventListeners()
// Dentro de setupEventListeners() em main.js:
// DOM.btnBuscarPrevisao?.addEventListener('click', handleBuscarPrevisaoClick);
// DOM.weatherCityInput?.addEventListener('keypress', (event) => {
//     if (event.key === 'Enter') {
//         handleBuscarPrevisaoClick();
//     }
// });

  console.log("Setting up application...");
  setupEventListeners(); // Configura listeners
  carregarGaragemDoLocalStorage(); // Carrega dados
  renderVehicleList(); // Renderiza lista
  showPanelContent("placeholder"); // Mostra estado inicial

  console.log("✅ Garagem Inteligente PRO Inicializada!");
});
}
