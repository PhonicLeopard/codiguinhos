// js/main.js
import Manutencao from './Manutencao.js';
import Veiculo from './Veiculo.js';
import Carro from './Carro.js';
import CarroEsportivo from './CarroEsportivo.js';
import Caminhao from './Caminhao.js';
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
let currentlySelectedVehicleIndex = -1; // <<< CORRIGIDO

/** @const {string} Chave usada para armazenar/recuperar os dados da garagem no LocalStorage. */
const LOCAL_STORAGE_KEY = "garagemInteligenteDados_v3.2"; // <<< CORRIGIDO

// --- Referências do DOM (Cache) ---
/** @type {Object<string, HTMLElement|null>} Cache de elementos DOM frequentemente usados. */
const DOM = {};

/**
 * @description Faz cache das referências a elementos DOM importantes na inicialização.
 */
function cacheDOMElements() {
  console.log("Caching DOM elements..."); // Log Adicionado
  const ids = [
    "vehicle-list", "panel-content", "panel-placeholder", "vehicle-details-view",
    "add-vehicle-form-view", "notification-area", "vehicle-tabs-nav",
    "tab-content-container", "add-vehicle-form", "add-vehicle-type",
    "detail-vehicle-img", "detail-vehicle-name", "quick-edit-model",
    "quick-edit-color", "quick-edit-image", "info-details-content",
    "info-history-content", "info-schedule-content", "actions-esportivo",
    "actions-caminhao", "manutTipo", "manutCusto", "manutDesc",
    "agendamentoData", "agendamentoTipo", "agendamentoDesc", "add-modelo",
    "add-cor", "add-imagem", "add-capacidade", "btn-show-add-vehicle-form",
    "btn-cancel-add-vehicle", "btn-delete-vehicle", "btn-save-quick-edit",
    // Adicione aqui IDs dos botões de ação se for referenciá-los diretamente
    // Ex: "btn-ligar", "btn-desligar", etc. - Embora não pareçam ser usados em DOM[] atualmente
  ];
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) {
        // Aviso se um ID específico não for encontrado, mas não para a execução
        console.warn(`Cache DOM: Elemento com ID "${id}" não encontrado.`);
    }
    const camelCaseId = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    DOM[camelCaseId] = element;
  });
  // Seletores específicos
  DOM.addCapacidadeGroup = document.querySelector(
    '#add-vehicle-form .specific-field[data-type="Caminhao"]'
  );
  if (!DOM.addCapacidadeGroup) {
      console.warn("Cache DOM: Elemento .specific-field[data-type=\"Caminhao\"] não encontrado dentro de #add-vehicle-form.");
  }

  // Verificação de elementos *críticos* para a UI funcionar
  const essentialElements = [
    { name: "vehicleList", el: DOM.vehicleList },
    { name: "panelPlaceholder", el: DOM.panelPlaceholder },
    { name: "vehicleDetailsView", el: DOM.vehicleDetailsView },
    { name: "addVehicleFormView", el: DOM.addVehicleFormView },
    { name: "notificationArea", el: DOM.notificationArea },
    { name: "addVehicleForm", el: DOM.addVehicleForm }, // Adicionado à verificação
  ];
  let missingEssential = false;
  essentialElements.forEach(item => {
      if (!item.el) {
          console.error(`❌ Erro Crítico: Elemento essencial da UI "${item.name}" (ID: ${ids.find(id => id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) === item.name) || 'N/A'}) não encontrado! Verifique o ID no HTML.`);
          missingEssential = true;
      }
  });
   console.log("DOM caching finished."); // Log Adicionado
   return !missingEssential; // Retorna false se um elemento essencial faltar
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
  sound.onerror = () => console.warn(`⚠️ Falha ao carregar som: ${sound.src}. Verifique se o arquivo existe e o caminho está correto.`); // Mensagem mais clara
});

// ==========================================================================
//                           CLASSES (Manutenção e Veículos)
// ==========================================================================
// (As classes são importadas, não definidas aqui)


// ==========================================================================
//                      PERSISTÊNCIA (LocalStorage)
// ==========================================================================

/** @description Prepara dados de UM veículo para salvar. @param {Veiculo} vehicle @returns {object | null} */
function prepareVehicleDataForStorage(vehicle) {
  // Verificação robustecida
  if (!(vehicle instanceof Veiculo) || !vehicle.id || !vehicle.constructor) {
      console.warn("prepareVehicleDataForStorage: Tentativa de salvar objeto inválido.", vehicle);
      return null;
  }
  try {
    const d = { ...vehicle };
    // Garante que historicoManutencoes é um array antes de filtrar/mapear
    d.historicoManutencoes = Array.isArray(vehicle.historicoManutencoes)
        ? vehicle.historicoManutencoes
            .filter((m) => m instanceof Manutencao) // Garante que são instâncias corretas
            .map((m) => ({
                ...m, // Copia propriedades da instância
                data: m.data.toISOString(), // Converte data para string
                _notifiedRecently: undefined, // Remove propriedade transitória
            }))
        : []; // Se não for array, salva como array vazio
    d._classType = vehicle.constructor.name; // Guarda o nome da classe
    // Remove outras propriedades transitórias se houver
    delete d._notifiedRecently; // Exemplo

    // Validação simples do objeto resultante antes de retornar
    if (!d.id || !d._classType || !d.modelo) {
        console.warn("prepareVehicleDataForStorage: Dados preparados parecem incompletos.", d);
        // return null; // Talvez seja muito restritivo, depende do caso
    }

    return d;
  } catch (e) {
    console.error(`Erro ao preparar dados do veículo ${vehicle?.id} para storage:`, e);
    return null;
  }
}

/** @description Recria UM veículo a partir dos dados. @param {object} plainData @returns {Veiculo | null} */
function recreateVehicleFromData(plainData) {
   // Validação inicial mais robusta
  if (!plainData || typeof plainData !== 'object' || !plainData._classType || !plainData.id) {
    console.warn("recreateVehicleFromData: Dados inválidos ou incompletos recebidos.", plainData);
    return null;
  }

  const d = plainData; // Renomeia para clareza
  let vehicleInstance = null; // Usa nome mais descritivo

  try {
    // Instancia a classe correta
    switch (d._classType) {
      case "Carro":
        vehicleInstance = new Carro(d.modelo, d.cor, d.imagem);
        break;
      case "CarroEsportivo":
        vehicleInstance = new CarroEsportivo(d.modelo, d.cor, d.imagem);
        break;
      case "Caminhao":
        // Garante que capacidadeCarga é um número ao recriar
        const capacidade = typeof d.capacidadeCarga === 'number' ? d.capacidadeCarga : 0;
        vehicleInstance = new Caminhao(d.modelo, d.cor, capacidade, d.imagem);
        break;
      default:
        console.warn(`Tipo de veículo desconhecido encontrado no LocalStorage: ${d._classType}`);
        return null; // Tipo não reconhecido
    }

    // Atribui propriedades comuns e específicas com checagens
    vehicleInstance.id = d.id; // ID é obrigatório pela validação inicial
    vehicleInstance.ligado = d.ligado === true; // Garante booleano
    vehicleInstance.velocidade = Number(d.velocidade) || 0; // Garante número, fallback 0
    vehicleInstance.quilometragem = Number(d.quilometragem) || 0; // Garante número, fallback 0

    if (typeof d.maxVelocidade === "number") {
        vehicleInstance.maxVelocidade = d.maxVelocidade;
    } // Mantém o padrão da classe se não estiver salvo ou for inválido

    // Propriedades específicas das subclasses
    if (vehicleInstance instanceof CarroEsportivo && typeof d.turboAtivado === "boolean") {
      vehicleInstance.turboAtivado = d.turboAtivado;
    } else if (vehicleInstance instanceof Caminhao && typeof d.cargaAtual === "number") {
      // Garante que a carga atual não exceda a capacidade ao carregar
      vehicleInstance.cargaAtual = Math.min(
        Math.max(0, Number(d.cargaAtual) || 0), // Garante número >= 0
        vehicleInstance.capacidadeCarga // Limita pela capacidade
      );
    }

    // Recria histórico de manutenções
    if (Array.isArray(d.historicoManutencoes)) {
      vehicleInstance.historicoManutencoes = d.historicoManutencoes
        .map(Manutencao.fromPlainObject) // Usa o método estático seguro da classe Manutencao
        .filter(m => m instanceof Manutencao); // Filtra resultados nulos ou inválidos
      // Ordena por data decrescente (mais recente primeiro)
      vehicleInstance.historicoManutencoes.sort((a, b) => b.data.getTime() - a.data.getTime());
    } else {
      vehicleInstance.historicoManutencoes = []; // Garante que é sempre um array
    }

    return vehicleInstance;

  } catch (e) {
    // Captura erros da instanciação ou atribuição
    console.error(`Erro ao recriar veículo ${d.id} (Modelo: ${d.modelo || "?"}, Tipo: ${d._classType}):`, e);
    return null; // Retorna null se a recriação falhar
  }
}

/** @description Salva TODA a garagem no LocalStorage. */
function salvarGaragemNoLocalStorage() {
  console.log("Attempting to save garage to LocalStorage..."); // Log Adicionado
  try {
    const dataToStore = garage
        .map(prepareVehicleDataForStorage) // Prepara cada veículo
        .filter(Boolean); // Remove quaisquer veículos que falharam na preparação (retornaram null)

    if (dataToStore.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
      console.log(`${dataToStore.length} vehicles saved successfully.`); // Log Adicionado
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpa se a garagem estiver vazia
      console.log("Garage is empty, LocalStorage cleared."); // Log Adicionado
    }
  } catch (e) {
    console.error("Erro CRÍTICO ao salvar no LocalStorage:", e);
    let message = "Erro desconhecido ao salvar os dados!";
    if (e.name === 'QuotaExceededError') {
        message = "Erro: Armazenamento local cheio! Não foi possível salvar.";
    } else if (e instanceof TypeError) {
        message = "Erro: Problema ao converter dados para salvar.";
    }
    // Mostra notificação apenas se a função existir (para evitar erro sobre erro)
    if (typeof showNotification === 'function') {
        showNotification(`❌ ${message}`, "error", 0); // Duração 0 para não sumir
    }
     if (typeof playSound === 'function') {
        playSound(soundMap.error);
     }
  }
}

/** @description Carrega a garagem do LocalStorage. */
function carregarGaragemDoLocalStorage() {
  console.log(`Loading garage from LocalStorage (Key: ${LOCAL_STORAGE_KEY})...`); // Log Adicionado
  const dataString = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!dataString) {
    console.log("LocalStorage is empty or key not found. Initializing empty garage.");
    garage = [];
    return; // Sai da função se não há dados
  }

  let parsedData;
  try {
    parsedData = JSON.parse(dataString);
    // Validação básica do formato
    if (!Array.isArray(parsedData)) {
      throw new Error("Dados do LocalStorage não estão no formato de array esperado.");
    }
  } catch (e) {
    console.error("Erro ao fazer PARSE dos dados do LocalStorage:", e);
    if (typeof showNotification === 'function') {
        showNotification("❌ Erro ao ler dados salvos! Resetando garagem.", "error", 0);
    }
    if (typeof playSound === 'function') {
        playSound(soundMap.error);
    }
    // Tenta limpar os dados inválidos para evitar erros futuros
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log("Cleared invalid data from LocalStorage.");
    } catch (removeError) {
      console.error("Failed to clear invalid data from LocalStorage:", removeError);
    }
    garage = []; // Reseta a garagem em memória
    return; // Sai da função
  }

  const temporaryGarage = [];
  let failures = 0;
  parsedData.forEach((vehicleData) => {
    const vehicle = recreateVehicleFromData(vehicleData);
    if (vehicle instanceof Veiculo) { // Checa se a recriação foi bem sucedida
      temporaryGarage.push(vehicle);
    } else {
      failures++;
      console.warn("Falha ao recriar veículo a partir dos dados:", vehicleData);
    }
  });

  garage = temporaryGarage; // Atualiza a garagem global
  console.log(`Garage loaded: ${garage.length} vehicles successfully recreated, ${failures} failures.`);

  if (failures > 0 && typeof showNotification === 'function') {
    showNotification(
      `⚠️ ${failures} veículo(s) não puderam ser carregados (dados antigos/inválidos?).`,
      "warning",
      7000
    );
  } else if (garage.length > 0 && typeof showNotification === 'function') {
    // Pequena notificação de sucesso se carregou algo e não houve falhas
    // showNotification( `🚗 ${garage.length} veículo(s) carregados!`, "info", 3000 ); // Talvez seja muito verboso
  }
}

// ==========================================================================
//                      LÓGICA DE EXIBIÇÃO E INTERFACE (UI)
// ==========================================================================

/** @description Mostra o painel correto e gerencia estado. @param {'placeholder' | 'details' | 'addForm'} contentType */
function showPanelContent(contentType) {
   // Verifica se os elementos essenciais do painel existem
  if (!DOM.panelPlaceholder || !DOM.vehicleDetailsView || !DOM.addVehicleFormView) {
    console.error("showPanelContent: Elementos de painel necessários (placeholder, details, addForm) não encontrados no DOM.");
    return; // Impede a execução se elementos críticos faltarem
  }

  // Esconde todos os painéis primeiro
  DOM.panelPlaceholder.classList.add("hidden");
  DOM.vehicleDetailsView.classList.add("hidden");
  DOM.addVehicleFormView.classList.add("hidden");

  let elementToFocus = null; // Elemento que receberá foco

  // Mostra o painel desejado e define o foco
  switch (contentType) {
    case "details":
      DOM.vehicleDetailsView.classList.remove("hidden");
      // Foca no título ou primeiro elemento interativo dos detalhes
      elementToFocus = DOM.detailVehicleName || DOM.vehicleDetailsView.querySelector('button, input, select, textarea');
      console.log("Showing details panel."); // Log Adicionado
      break;
    case "addForm":
      DOM.addVehicleFormView.classList.remove("hidden");
      // Foca no primeiro campo do formulário
      elementToFocus = DOM.addVehicleType || DOM.addVehicleFormView.querySelector('input, select, textarea');
       console.log("Showing add vehicle form panel."); // Log Adicionado
      break;
    case "placeholder":
    default: // Caso padrão ou se contentType for inválido
      DOM.panelPlaceholder.classList.remove("hidden");
       console.log("Showing placeholder panel."); // Log Adicionado
      break;
  }

  // Desseleciona veículo na lista se não estiver mostrando detalhes
  if (contentType !== "details") {
    deselectAllVehiclesInList();
    currentlySelectedVehicle = null;
    currentlySelectedVehicleIndex = -1;
  }

  // Adiciona um pequeno delay antes de focar para garantir que o elemento está visível e pronto
  if (elementToFocus) {
    setTimeout(() => {
        // Verifica novamente se o elemento existe antes de focar
        if (document.body.contains(elementToFocus)) {
            elementToFocus.focus({ preventScroll: true });
             console.log("Focus set to:", elementToFocus); // Log Adicionado
        } else {
            console.warn("showPanelContent: Elemento para foco não encontrado ou não está no DOM no momento de focar.", elementToFocus);
        }
    }, 150); // Delay pode precisar de ajuste
  }
}

/** @description Renderiza a lista de veículos na sidebar. */
function renderVehicleList() {
  if (!DOM.vehicleList) {
      console.error("renderVehicleList: Elemento #vehicle-list não encontrado no DOM.");
      return; // Sai se a lista não existe
  }

  DOM.vehicleList.innerHTML = ""; // Limpa a lista atual

  if (garage.length === 0) {
    // Mensagem mais informativa e acessível
    DOM.vehicleList.innerHTML =
      '<li class="placeholder" role="status" aria-live="polite">Sua garagem está vazia.</li>';
    console.log("Rendered empty garage list."); // Log Adicionado
    return; // Sai se a garagem está vazia
  }

  const fragment = document.createDocumentFragment(); // Usa fragmento para melhor performance

  garage.forEach((vehicle, index) => {
    // Verifica se o veículo é válido antes de tentar renderizar
    if (!(vehicle instanceof Veiculo) || !vehicle.id || !vehicle.modelo) {
        console.warn(`renderVehicleList: Tentando renderizar item inválido no índice ${index}`, vehicle);
        return; // Pula este item inválido
    }

    const listItem = document.createElement("li");
    listItem.dataset.vehicleIndex = index; // Guarda o índice para seleção
    listItem.setAttribute("role", "button");
    listItem.tabIndex = 0; // Torna focável por teclado
    listItem.setAttribute("aria-label", `Selecionar veículo: ${vehicle.modelo}`);

    // Imagem com fallback e texto alternativo vazio (decorativo neste contexto)
    const img = document.createElement("img");
    img.src = vehicle.imagem || "placeholder.png";
    img.alt = ""; // Alt vazio pois o texto do veículo já descreve
    img.className = "vehicle-list-img";
    img.onerror = function() { // Função de fallback mais segura
        if (this.src !== 'placeholder.png') { // Evita loop se o placeholder falhar
            this.src = 'placeholder.png';
            console.warn(`renderVehicleList: Falha ao carregar imagem para ${vehicle.modelo}, usando placeholder.`);
        }
    };

    // Nome do veículo
    const nameSpan = document.createElement("span");
    nameSpan.className = "vehicle-list-name";
    nameSpan.textContent = vehicle.modelo; // Usa textContent por segurança

    listItem.appendChild(img);
    listItem.appendChild(nameSpan);

    // Adiciona classe 'selected' se for o veículo atualmente selecionado
    if (index === currentlySelectedVehicleIndex) {
      listItem.classList.add("selected");
      listItem.setAttribute("aria-current", "true"); // Indica item atual para acessibilidade
    }

    // Adiciona listeners para clique e teclado (Enter/Espaço)
    listItem.addEventListener("click", () => handleVehicleSelection(index));
    listItem.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // Previne scroll ou outra ação padrão
        handleVehicleSelection(index);
      }
    });

    fragment.appendChild(listItem); // Adiciona ao fragmento
  });

  DOM.vehicleList.appendChild(fragment); // Adiciona o fragmento ao DOM de uma vez
  console.log(`Rendered vehicle list with ${garage.length} items.`); // Log Adicionado
}

/** @description Remove seleção visual da lista. */
function deselectAllVehiclesInList() {
  if (!DOM.vehicleList) return; // Sai se a lista não existe

  const selectedItems = DOM.vehicleList.querySelectorAll("li.selected");
  selectedItems.forEach((li) => {
    li.classList.remove("selected");
    li.removeAttribute("aria-current"); // Remove indicação de item atual
  });
   // console.log("Deselected all items in vehicle list."); // Log pode ser muito verboso
}

/** @description Manipula a seleção de um veículo. @param {number} index */
function handleVehicleSelection(index) {
  // Valida o índice
  if (typeof index !== 'number' || index < 0 || index >= garage.length) {
    console.error("handleVehicleSelection: Índice inválido fornecido:", index);
    showNotification("❌ Erro ao tentar selecionar o veículo.", "error");
     if (typeof playSound === 'function') playSound(soundMap.error);
    // Poderia resetar para placeholder, mas talvez seja melhor não fazer nada
    // showPanelContent("placeholder");
    // currentlySelectedVehicle = null;
    // currentlySelectedVehicleIndex = -1;
    return;
  }

  const selectedVehicle = garage[index]; // Pega o veículo selecionado

  // Verifica se o veículo selecionado é válido
   if (!(selectedVehicle instanceof Veiculo)) {
       console.error(`handleVehicleSelection: Item no índice ${index} não é uma instância válida de Veiculo.`, selectedVehicle);
       showNotification("❌ Erro interno ao selecionar o veículo.", "error");
       if (typeof playSound === 'function') playSound(soundMap.error);
       return;
   }


  currentlySelectedVehicle = selectedVehicle;
  currentlySelectedVehicleIndex = index;
  console.log(`Vehicle selected: ${currentlySelectedVehicle.modelo} (Index: ${index})`); // Log Adicionado

  // Atualiza a UI
  deselectAllVehiclesInList(); // Remove seleção anterior
  const selectedListItem = DOM.vehicleList?.querySelector(`li[data-vehicle-index="${index}"]`);
  if (selectedListItem) {
      selectedListItem.classList.add("selected");
      selectedListItem.setAttribute("aria-current", "true");
  } else {
      console.warn(`handleVehicleSelection: Não foi possível encontrar o elemento li para o índice ${index} para adicionar a classe 'selected'.`);
  }

  displaySelectedVehicleDetails(); // Mostra os detalhes
  showPanelContent("details"); // Garante que o painel de detalhes está visível
}

/** @description Atualiza painel de detalhes com informações do veículo selecionado. */
function displaySelectedVehicleDetails() {
  // Verifica se há um veículo selecionado e se é válido
  if (!currentlySelectedVehicle || !(currentlySelectedVehicle instanceof Veiculo)) {
    console.log("displaySelectedVehicleDetails: Nenhum veículo válido selecionado, mostrando placeholder.");
    showPanelContent("placeholder"); // Mostra placeholder se não houver seleção
    return;
  }

  console.log(`Displaying details for: ${currentlySelectedVehicle.modelo}`); // Log Adicionado

  try {
    // Atualiza campos de Edição Rápida (Quick Edit)
    if (DOM.quickModel) {
        DOM.quickModel.value = currentlySelectedVehicle.modelo || "";
        DOM.quickModel.classList.remove("error"); // Limpa erro anterior
    }
    if (DOM.quickColor) {
        DOM.quickColor.value = currentlySelectedVehicle.cor || "";
        DOM.quickColor.classList.remove("error");
    }
    if (DOM.quickImage) {
        // Mostra vazio se a imagem for o placeholder padrão
        DOM.quickImage.value = (currentlySelectedVehicle.imagem === "placeholder.png")
                                ? ""
                                : currentlySelectedVehicle.imagem || "";
    }
    // Atualiza imagem principal e nome
    if (DOM.detailVehicleImg) {
        DOM.detailVehicleImg.src = currentlySelectedVehicle.imagem || "placeholder.png";
        // O onerror no HTML já lida com falha ao carregar a imagem principal
    }
    if (DOM.detailVehicleName) {
        DOM.detailVehicleName.textContent = currentlySelectedVehicle.modelo || "Veículo sem Nome";
    }

    // Atualiza conteúdo das abas de informação
    // Verifica a existência dos elementos de conteúdo antes de atualizar
    if (DOM.infoDetailsContent) {
        // Chama o método polimórfico para obter as informações formatadas
        DOM.infoDetailsContent.innerHTML = currentlySelectedVehicle.getDisplayInfo();
    } else { console.warn("displaySelectedVehicleDetails: Elemento #info-details-content não encontrado."); }

    if (DOM.infoHistoryContent) {
        DOM.infoHistoryContent.innerHTML = generateMaintenanceListHtml(
            currentlySelectedVehicle.getPastMaintenances(), // Assumindo que este método existe em Veiculo
            "maintenance-list",
            "Nenhuma manutenção registrada no histórico." // Mensagem mais clara
        );
    } else { console.warn("displaySelectedVehicleDetails: Elemento #info-history-content não encontrado."); }

    if (DOM.infoScheduleContent) {
        DOM.infoScheduleContent.innerHTML = generateMaintenanceListHtml(
            currentlySelectedVehicle.getFutureMaintenances(), // Assumindo que este método existe em Veiculo
            "schedule-list",
            "Nenhum serviço futuro agendado." // Mensagem mais clara
        );
        // Verifica agendamentos próximos APÓS renderizar a lista
        verificarAgendamentosProximos(currentlySelectedVehicle);
    } else { console.warn("displaySelectedVehicleDetails: Elemento #info-schedule-content não encontrado."); }


    // Mostra/Esconde fieldsets de ações específicas baseadas no tipo de veículo
    document.querySelectorAll(".specific-actions").forEach((el) => el.classList.add("hidden")); // Esconde todos primeiro

    if (currentlySelectedVehicle instanceof CarroEsportivo && DOM.actionsEsportivo) {
        DOM.actionsEsportivo.classList.remove("hidden");
    } else if (currentlySelectedVehicle instanceof Caminhao && DOM.actionsCaminhao) {
        DOM.actionsCaminhao.classList.remove("hidden");
    }

    // Limpa os formulários de manutenção/agendamento ao exibir detalhes
    const formFieldsToClear = [
      DOM.manutTipo, DOM.manutCusto, DOM.manutDesc,
      DOM.agendamentoData, DOM.agendamentoTipo, DOM.agendamentoDesc // Corrigido para usar camelCase
    ];
    formFieldsToClear.forEach((input) => {
      if (input) {
        input.value = ""; // Limpa valor
        input.classList.remove("error"); // Remove classe de erro
      }
    });

    // Garante que a primeira aba ("Informações") esteja ativa ao selecionar um novo veículo
    const firstTabButton = DOM.vehicleTabsNav?.querySelector(".tab-link"); // Pega o primeiro botão de aba
    if (firstTabButton) {
      activateTab(firstTabButton);
    }
     console.log("Vehicle details displayed successfully."); // Log Adicionado

  } catch (error) {
    console.error(`Erro fatal ao exibir detalhes do veículo ${currentlySelectedVehicle?.modelo}:`, error);
    showNotification("❌ Erro grave ao exibir detalhes. Verifique o console (F12).", "error", 0);
     if (typeof playSound === 'function') playSound(soundMap.error);
    // Talvez voltar ao placeholder seja uma boa ideia em caso de erro grave
    // showPanelContent("placeholder");
  }
}


/** @description Gera HTML para listas de manutenção. @param {Manutencao[]} maintenances @param {string} listClass @param {string} emptyMessage @returns {string} */
function generateMaintenanceListHtml(maintenances, listClass, emptyMessage) {
  // Validação robusta da entrada
  if (!Array.isArray(maintenances)) {
    console.warn("generateMaintenanceListHtml: 'maintenances' não é um array.", maintenances);
    return `<p>Erro ao carregar lista.</p>`; // Mensagem de erro
  }
  if (maintenances.length === 0) {
    return `<p>${emptyMessage}</p>`; // Mensagem de vazio padrão
  }

  // Mapeia e filtra garantindo que são instâncias válidas e chamando getDetalhesFormatados
  const listItemsHtml = maintenances
    .filter(m => m instanceof Manutencao) // Garante que é uma instância de Manutencao
    .map((m) => {
        try {
            // Adiciona o ID como data attribute para referência futura, se necessário
            return `<li data-maint-id="${m.id}">${m.getDetalhesFormatados()}</li>`;
        } catch (e) {
            console.error(`Erro ao formatar manutenção ${m.id}:`, e);
            return `<li>Erro ao exibir este item.</li>`; // Fallback para item individual
        }
    })
    .join(""); // Junta os LIs em uma única string

  // Retorna a lista completa ou mensagem de erro se algo falhou no map/join
  return listItemsHtml ? `<ul class="${listClass}">${listItemsHtml}</ul>` : `<p>Erro ao gerar lista de manutenção.</p>`;
}

/** @description Ativa aba e mostra conteúdo. @param {HTMLButtonElement} tabButton */
function activateTab(tabButton) {
  // Validações iniciais
  if (!(tabButton instanceof HTMLButtonElement) || !tabButton.classList.contains('tab-link')) {
      console.warn("activateTab: Argumento inválido, esperado um botão com classe 'tab-link'.", tabButton);
      return;
  }
  if (!DOM.vehicleTabsNav || !DOM.tabContentContainer) {
      console.error("activateTab: Elementos de navegação por abas (nav ou container) não encontrados.");
      return;
  }

  // Desativa todas as outras abas e painéis de conteúdo
  DOM.vehicleTabsNav.querySelectorAll(".tab-link").forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-selected", "false");
  });
  DOM.tabContentContainer.querySelectorAll(".tab-content").forEach((contentPanel) => {
    contentPanel.classList.remove("active"); // Ou display: none
     contentPanel.hidden = true; // Melhor para acessibilidade
  });

  // Ativa o botão clicado
  tabButton.classList.add("active");
  tabButton.setAttribute("aria-selected", "true");

  // Mostra o painel de conteúdo correspondente
  const targetContentId = tabButton.dataset.target; // Ex: "#tab-info"
  if (targetContentId) {
    try {
        // Usa querySelector para pegar o ID (que começa com #)
        const targetContent = DOM.tabContentContainer.querySelector(targetContentId);
        if (targetContent) {
            targetContent.classList.add("active"); // Ou display: block
            targetContent.hidden = false; // Torna visível
             console.log(`Activated tab: ${targetContentId}`); // Log Adicionado
        } else {
            console.warn(`activateTab: Painel de conteúdo com ID "${targetContentId}" não encontrado.`);
        }
    } catch (e) {
        console.error(`activateTab: Erro ao tentar encontrar/ativar painel "${targetContentId}":`, e);
    }
  } else {
      console.warn("activateTab: Botão de aba não possui atributo 'data-target'.", tabButton);
  }
}

/** @description Exibe notificação. @param {string} message @param {'info'|'success'|'warning'|'error'} [type='info'] @param {number} [duration=4000] */
function showNotification(message, type = "info", duration = 4000) {
  if (!DOM.notificationArea) {
    // Se a área de notificação não existe, loga no console como fallback
    const logType = type === 'error' ? 'error' : (type === 'warning' ? 'warn' : 'log');
    console[logType](`Notification (UI element missing): [${type.toUpperCase()}] ${message}`);
    return;
  }

  const notificationElement = document.createElement("div");
  notificationElement.className = `notification notification-${type}`;
  notificationElement.setAttribute("role", "alert"); // Papel semântico
  // aria-live="assertive" para erros/sucessos importantes, "polite" para info/warnings
  notificationElement.setAttribute("aria-live", (type === 'error' || type === 'success') ? "assertive" : "polite");

  const messageSpan = document.createElement("span");
  // CUIDADO: Usar innerHTML pode ser arriscado se 'message' vier de input do usuário.
  // Se a mensagem puder conter HTML intencional (como <b>), sanitize antes se necessário.
  // Se for só texto, prefira textContent. Assumindo que pode ter HTML simples:
  messageSpan.innerHTML = message;

  const closeButton = document.createElement("button");
  closeButton.className = "close-btn";
  closeButton.innerHTML = "×"; // Entidade HTML para 'x'
  closeButton.setAttribute("aria-label", "Fechar notificação");
  closeButton.title = "Fechar"; // Dica de ferramenta

  notificationElement.appendChild(messageSpan);
  notificationElement.appendChild(closeButton);

  let timeoutId = null; // Para guardar o ID do setTimeout

  // Função para remover a notificação
  const removeNotification = () => {
    clearTimeout(timeoutId); // Limpa o timeout se o botão for clicado antes
    // Animação de saída (opcional)
    notificationElement.style.opacity = '0';
    notificationElement.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
        // Verifica se o elemento ainda é filho da área antes de remover
        if (notificationElement.parentNode === DOM.notificationArea) {
            DOM.notificationArea.removeChild(notificationElement);
        }
    }, 300); // Tempo da animação
  };

  // Event listener para o botão de fechar
  closeButton.addEventListener("click", removeNotification);

  // Adiciona a notificação no início da área (mais novas em cima)
  DOM.notificationArea.insertBefore(notificationElement, DOM.notificationArea.firstChild);
   console.log(`Showing notification: [${type}] ${message}`); // Log Adicionado

  // Define timeout para remover automaticamente, se duration > 0
  if (duration > 0) {
    timeoutId = setTimeout(removeNotification, duration);
  }
}

/** @description Verifica e notifica agendamentos próximos. @param {Veiculo} veiculo */
function verificarAgendamentosProximos(veiculo) {
   // Validações
   if (!veiculo || typeof veiculo.getFutureMaintenances !== 'function') return;

   const futureMaintenances = veiculo.getFutureMaintenances();
   if (!Array.isArray(futureMaintenances) || futureMaintenances.length === 0) return;

   console.log(`Checking upcoming appointments for ${veiculo.modelo}...`); // Log Adicionado

   const now = Date.now();
   const ONE_DAY = 24 * 60 * 60 * 1000;
   const ONE_WEEK = 7 * ONE_DAY;
   let notificationShown = false; // Flag para evitar spam se vários forem próximos

   futureMaintenances.forEach((maint) => {
     // Valida cada item da manutenção
     if (!(maint instanceof Manutencao) || !(maint.data instanceof Date) || maint._notifiedRecently) {
         return; // Pula item inválido ou já notificado
     }

     const timeDifference = maint.data.getTime() - now;
     let notify = false;
     let message = "";
     const vehicleName = `<b>${veiculo.modelo || "Veículo"}</b>`; // Nome em negrito
     const maintType = `"${maint.tipo || "Serviço"}"`; // Tipo entre aspas

     // Formata data e hora localmente
     const dateFormatted = maint.data.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
     const timeFormatted = maint.data.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

     // Lógica de notificação (Ajuste os limites conforme necessário)
     // Notifica se for <= 1.5 dias (Hoje ou Amanhã)
     if (timeDifference > 0 && timeDifference <= ONE_DAY * 1.5) {
       message = `⏰ HOJE/AMANHÃ: ${maintType} para ${vehicleName} às ${timeFormatted} (${dateFormatted}).`;
       notify = true;
     }
     // Notifica se for > 1.5 dias e <= 1 semana
     else if (timeDifference > ONE_DAY * 1.5 && timeDifference <= ONE_WEEK) {
       message = `🗓️ Próx. Semana: ${maintType} para ${vehicleName} em ${dateFormatted}.`;
       notify = true;
       // Poderia ter outras lógicas (ex: 2 semanas)
     }

     // Mostra a notificação e marca como notificado
     if (notify) {
       console.log(`Upcoming appointment found: ${message}`); // Log Adicionado
       showNotification(message, "warning", 10000); // Duração maior para avisos
       maint._notifiedRecently = true; // Marca para evitar repetição na sessão atual
       notificationShown = true;
     }
   });
    if (!notificationShown) {
        console.log("No immediate upcoming appointments found."); // Log Adicionado
    }
 }

/** @description Toca um som. @param {HTMLAudioElement} audioObject */
function playSound(audioObject) {
  if (!(audioObject instanceof HTMLAudioElement)) {
      // console.warn("playSound: Tentativa de tocar objeto que não é de áudio.", audioObject); // Pode ser muito verboso
      return;
  }
  // Verifica se o áudio está pronto (readyState > 0) - opcional, mas pode ajudar
  // if (audioObject.readyState === 0) {
  //     console.warn(`playSound: Áudio ${audioObject.src} não está pronto.`);
  //     // Poderia tentar carregar: audioObject.load();
  //     return;
  // }

  // Pausa, reseta e toca. O catch lida com erros comuns (ex: interação do usuário necessária)
  audioObject.pause();
  audioObject.currentTime = 0;
  audioObject.play().catch((error) => {
    // Ignora erro "NotAllowedError" que ocorre se o usuário não interagiu com a página ainda
    if (error.name !== "NotAllowedError") {
      console.warn(`Erro ao tentar tocar o som (${audioObject.src}): ${error.message}`);
    } else {
      // Log informativo se o autoplay for bloqueado
      // console.log("Playback bloqueado pelo navegador. Interação do usuário necessária para tocar sons.");
    }
  });
}

/** @description Toca som correspondente à ação/veículo. @param {Veiculo|null} veiculo @param {string} acao */
function tocarSomCorrespondente(veiculo, acao) {
  if (!veiculo) return; // Sai se não há veículo

  let soundToPlay = null;

  switch (acao) {
    case "ligar":           soundToPlay = soundMap.ligar; break;
    case "desligar":        soundToPlay = soundMap.desligar; break;
    case "acelerar":        soundToPlay = soundMap.acelerar; break;
    case "frear":           soundToPlay = soundMap.frear; break;
    case "buzinar":
      if (veiculo instanceof Caminhao)        soundToPlay = soundMap.buzinar_caminhao;
      else if (veiculo instanceof CarroEsportivo) soundToPlay = soundMap.buzinar_esportivo;
      else if (veiculo instanceof Carro)     soundToPlay = soundMap.buzinar_carro;
      // Adicione fallback se necessário: else soundToPlay = soundMap.buzinar_default;
      break;
    // Adicione outros sons se mapeados em soundMap
    case "add_vehicle":     soundToPlay = soundMap.add_vehicle; break;
    case "delete_vehicle":  soundToPlay = soundMap.delete_vehicle; break;
    case "save":            soundToPlay = soundMap.save; break; // Ex: para quick edit
    case "error":           soundToPlay = soundMap.error; break; // Som genérico de erro
    // default: // Não toca som para ações não mapeadas
  }

  if (soundToPlay) {
    console.log(`Playing sound for action: ${acao}`); // Log Adicionado
    playSound(soundToPlay);
  }
}

// ==========================================================================
//                  FUNÇÃO CENTRAL DE INTERAÇÃO + FEEDBACK VISUAL
// ==========================================================================

/** @description Função central para interagir com veículo. @param {string} acao @param {Event|null} event @param {...any} args @returns {Promise<boolean>} */
async function interagir(acao, event = null, ...args) {
   // 1. Valida se há um veículo selecionado
  if (!currentlySelectedVehicle || !(currentlySelectedVehicle instanceof Veiculo)) {
    console.warn("interagir: Tentativa de interação sem um veículo válido selecionado.");
    showNotification("❗ Nenhum veículo selecionado ou veículo inválido!", "warning");
    playSound(soundMap.error); // Toca som de erro
    return false; // Falha
  }

  const veiculo = currentlySelectedVehicle; // Referência ao veículo atual
  console.log(`Interacting with ${veiculo.modelo}: Action = ${acao}, Args =`, args); // Log Adicionado

  // 2. Encontra o botão que disparou a ação (se houver) para feedback visual
  let button = null;
  if (event && event.target instanceof Element) {
      button = event.target.closest("button");
  }

  // 3. Desabilita o botão e mostra estado de processamento
  if (button) {
    button.disabled = true;
    button.classList.add("processing");
  }

  let sucesso = false; // Flag para indicar se a ação foi bem-sucedida

  // 4. Verifica se o método da ação existe no objeto veículo
  if (typeof veiculo[acao] !== "function") {
    const errorMessage = `Ação inválida "${acao}" não encontrada para o tipo de veículo "${veiculo.constructor.name}".`;
    console.error(`interagir: ${errorMessage}`);
    showNotification(`❌ ${errorMessage}`, "error");
    playSound(soundMap.error);
    // Reabilita o botão se existir
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
    return false; // Falha
  }

  // 5. Executa a ação do veículo dentro de um try...catch
  try {
    // Pequeno delay simulado para melhor percepção da UI (opcional)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Chama o método da ação no veículo, passando os argumentos
    const result = veiculo[acao](...args);

    // Assume sucesso se o método não retornar explicitamente 'false'
    // Métodos que retornam 'false' indicam falha (ex: tentar desligar em movimento)
    sucesso = (result !== false);
    console.log(`Action "${acao}" executed. Result: ${result}, Success: ${sucesso}`); // Log Adicionado

  } catch (error) {
    // Captura erros lançados pelos métodos do veículo (ex: validação em Manutencao)
    console.error(`Erro durante a execução da ação "${acao}" em ${veiculo.modelo}:`, error);
    // Mostra a mensagem de erro da exceção, se disponível, senão uma genérica
    const errorMsgToShow = error instanceof Error ? error.message : `Erro ao ${acao}.`;
    showNotification(`❌ Erro: ${errorMsgToShow}`, "error", 0); // Duração 0
    playSound(soundMap.error);
    sucesso = false; // Garante que é falha

  } finally {
    // 6. Reabilita o botão e remove estado de processamento, independentemente do resultado
    if (button) {
      button.disabled = false;
      button.classList.remove("processing");
    }
  }

  // 7. Atualiza a exibição dos detalhes do veículo na UI (sempre, para refletir mudanças ou falhas)
  // É importante que displaySelectedVehicleDetails seja robusto e não gere erros
  displaySelectedVehicleDetails();

  // 8. Se a ação foi bem-sucedida, toca o som correspondente e salva no LocalStorage se necessário
  if (sucesso) {
    tocarSomCorrespondente(veiculo, acao); // Toca som de sucesso (se houver)

    // Lista de ações que modificam o estado persistente do veículo
    const actionsToPersist = [
      "ligar", "desligar", "rodar", "ativarTurbo", "desativarTurbo",
      "carregar", "descarregar", "registrarManutencao", "updateProperties",
      // Adicionar outras ações aqui se necessário
    ];

    // Salva se a ação realizada estiver na lista de persistência
    if (actionsToPersist.includes(acao)) {
      console.log(`Action "${acao}" requires persistence. Saving garage...`); // Log Adicionado
      salvarGaragemNoLocalStorage();
    }
  } else {
       console.log(`Action "${acao}" failed or returned false. No sound played, no data saved.`); // Log Adicionado
       // Poderia tocar um som de erro genérico aqui também, se não for tratado no catch
       // playSound(soundMap.error);
  }

  // 9. Retorna o status de sucesso da operação
  return sucesso;
}

// ==========================================================================
//                  HANDLERS DE EVENTOS DA UI
// ==========================================================================
// Observação: Todos os handlers agora chamam 'interagir'

/** @param {Event} event */ function handleLigarClick(event) {
  console.log("Handler: Ligar Click"); interagir("ligar", event); // Log Adicionado
}
/** @param {Event} event */ function handleDesligarClick(event) {
  console.log("Handler: Desligar Click"); interagir("desligar", event); // Log Adicionado
}
/** @param {Event} event */ function handleBuzinarClick(event) {
  console.log("Handler: Buzinar Click"); interagir("buzinar", event); // Log Adicionado
}

/** @param {Event} event */ function handleAcelerarClick(event) {
  console.log("Handler: Acelerar Click"); // Log Adicionado
  let incremento = 10; // Padrão
  if (currentlySelectedVehicle instanceof CarroEsportivo) incremento = 25;
  else if (currentlySelectedVehicle instanceof Caminhao) incremento = 8;
  interagir("acelerar", event, incremento);
}

/** @param {Event} event */ function handleFrearClick(event) {
  console.log("Handler: Frear Click"); // Log Adicionado
  let decremento = 10; // Padrão
  if (currentlySelectedVehicle instanceof CarroEsportivo) decremento = 20;
  else if (currentlySelectedVehicle instanceof Caminhao) decremento = 8;
  interagir("frear", event, decremento);
}

/** @param {Event} event */ function handleRodarClick(event) {
  console.log("Handler: Rodar Click"); // Log Adicionado
  const distanciaInput = document.getElementById("distanciaRodar"); // Pega o input diretamente

  // Validação robusta do input
  if (!distanciaInput || !distanciaInput.checkValidity() || Number(distanciaInput.value) <= 0) {
    console.warn("handleRodarClick: Input de distância inválido ou não encontrado.");
    showNotification("❗ Distância inválida. Insira um valor positivo.", "warning");
    playSound(soundMap.error);
    distanciaInput?.classList.add("error"); // Adiciona classe de erro se o input existe
    distanciaInput?.focus(); // Foca no input se existe
    return; // Interrompe a execução
  }
  distanciaInput.classList.remove("error"); // Remove erro se válido

  // Chama interagir com o valor validado
  interagir("rodar", event, Number(distanciaInput.value));
}

/** @param {Event} event */ function handleTurboOnClick(event) {
  console.log("Handler: Turbo ON Click"); interagir("ativarTurbo", event); // Log Adicionado
}
/** @param {Event} event */ function handleTurboOffClick(event) {
  console.log("Handler: Turbo OFF Click"); interagir("desativarTurbo", event); // Log Adicionado
}

/** @param {Event} event */ function handleCarregarClick(event) {
  console.log("Handler: Carregar Click"); // Log Adicionado
  const pesoInput = document.getElementById("pesoCarga");

  // Validação
  if (!pesoInput || !pesoInput.checkValidity() || Number(pesoInput.value) <= 0) {
    console.warn("handleCarregarClick: Input de peso inválido ou não encontrado.");
    showNotification("❗ Peso inválido para carregar. Insira um valor positivo.", "warning");
    playSound(soundMap.error);
    pesoInput?.classList.add("error");
    pesoInput?.focus();
    return;
  }
  pesoInput.classList.remove("error");

  interagir("carregar", event, Number(pesoInput.value));
}

/** @param {Event} event */ function handleDescarregarClick(event) {
  console.log("Handler: Descarregar Click"); // Log Adicionado
   const pesoInput = document.getElementById("pesoCarga"); // Reutiliza o mesmo input

  // Validação
  if (!pesoInput || !pesoInput.checkValidity() || Number(pesoInput.value) <= 0) {
    console.warn("handleDescarregarClick: Input de peso inválido ou não encontrado.");
    showNotification("❗ Peso inválido para descarregar. Insira um valor positivo.", "warning");
    playSound(soundMap.error);
    pesoInput?.classList.add("error");
    pesoInput?.focus();
    return;
  }
   pesoInput.classList.remove("error");

  interagir("descarregar", event, Number(pesoInput.value));
}

/** @description Handler p/ registrar manutenção realizada. @param {Event} event */
function handleRegistrarManutencao(event) {
  console.log("Handler: Registrar Manutenção"); // Log Adicionado
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione um veículo para registrar a manutenção.", "warning");
    playSound(soundMap.error);
    return;
  }

  // Referências diretas aos elementos do DOM (assumindo que estão no objeto DOM)
  const tipoInput = DOM.manutTipo;
  const custoInput = DOM.manutCusto;
  const descInput = DOM.manutDesc; // Opcional

  // Verifica se os inputs obrigatórios existem
  if (!tipoInput || !custoInput) {
    console.error("handleRegistrarManutencao: Inputs de Tipo ou Custo não encontrados no DOM.");
    showNotification("❌ Erro interno: Campos do formulário não encontrados.", "error");
    return;
  }

  // Limpa erros anteriores
  tipoInput.classList.remove("error");
  custoInput.classList.remove("error");

  // Validações
  let isValid = true;
  const tipo = tipoInput.value.trim();
  const custoString = custoInput.value.replace(",", ".").trim(); // Normaliza para ponto decimal
  const custo = parseFloat(custoString);
  const descricao = descInput ? descInput.value.trim() : ""; // Pega descrição se existir

  if (!tipo) {
    console.warn("handleRegistrarManutencao: Tipo é obrigatório.");
    showNotification("❗ O campo 'Tipo' da manutenção é obrigatório.", "warning");
    tipoInput.classList.add("error");
    tipoInput.focus();
    isValid = false;
  }

  // Validação mais robusta do custo: não vazio, é número, não negativo, formato correto
  if (custoString === "" || isNaN(custo) || custo < 0 || !/^\d+(\.\d{1,2})?$/.test(custoString)) {
     console.warn("handleRegistrarManutencao: Custo inválido.", custoString);
    showNotification("❗ Custo inválido. Use números, ex: 150 ou 150.00.", "warning");
    custoInput.classList.add("error");
    if (isValid) custoInput.focus(); // Foca aqui só se o tipo estiver ok
    isValid = false;
  }

  if (!isValid) {
    playSound(soundMap.error);
    return; // Interrompe se a validação falhou
  }

  // Se tudo for válido, chama 'interagir' para registrar
  // Passa um novo objeto Date() para a data atual
  interagir(
    "registrarManutencao",
    event, // Passa o evento original para 'interagir' pegar o botão
    new Date(), // Data atual para registro
    tipo,
    custo,
    descricao
  ).then((success) => {
    if (success) {
      console.log("Manutenção registrada com sucesso.");
      showNotification(`✅ Manutenção "${tipo}" registrada!`, "success");
      // Limpa os campos do formulário apenas se o registro for bem-sucedido
      tipoInput.value = "";
      custoInput.value = "";
      if (descInput) descInput.value = "";
    } else {
        console.warn("handleRegistrarManutencao: A função 'interagir' retornou falha.");
        // A notificação de erro já deve ter sido mostrada por 'interagir' ou pelo método da classe
    }
  });
}

/** @description Handler p/ agendar serviço futuro. @param {Event} event */
function handleAgendarManutencao(event) {
  console.log("Handler: Agendar Manutenção"); // Log Adicionado
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione um veículo para agendar o serviço.", "warning");
    playSound(soundMap.error);
    return;
  }

  // Referências DOM (assumindo que estão no objeto DOM)
  const dataInput = DOM.agendamentoData; // Corrigido para camelCase
  const tipoInput = DOM.agendamentoTipo;   // Corrigido para camelCase
  const descInput = DOM.agendamentoDesc;   // Corrigido para camelCase (Opcional)

  if (!dataInput || !tipoInput) {
    console.error("handleAgendarManutencao: Inputs de Data/Hora ou Tipo não encontrados no DOM.");
     showNotification("❌ Erro interno: Campos do formulário de agendamento não encontrados.", "error");
    return;
  }

  // Limpa erros
  dataInput.classList.remove("error");
  tipoInput.classList.remove("error");

  // Validações
  let isValid = true;
  const dataString = dataInput.value;
  const tipo = tipoInput.value.trim();
  const descricao = descInput ? descInput.value.trim() : "";
  let dataAgendamento = null;

  if (!dataString) {
     console.warn("handleAgendarManutencao: Data/Hora é obrigatória.");
    showNotification("❗ O campo 'Data/Hora' do agendamento é obrigatório.", "warning");
    dataInput.classList.add("error");
    dataInput.focus();
    isValid = false;
  } else {
      dataAgendamento = new Date(dataString);
      // Verifica se a data é válida E se é no futuro
      if (isNaN(dataAgendamento.getTime())) {
          console.warn("handleAgendarManutencao: Data/Hora inválida.");
          showNotification("❗ Data/Hora inválida. Verifique o formato.", "warning");
          dataInput.classList.add("error");
          if (isValid) dataInput.focus();
          isValid = false;
          dataAgendamento = null; // Reseta se inválida
      } else if (dataAgendamento <= new Date()) {
          console.warn("handleAgendarManutencao: Data do agendamento não está no futuro.");
          showNotification("❗ A data do agendamento deve ser no futuro.", "warning");
          dataInput.classList.add("error");
          if (isValid) dataInput.focus();
          isValid = false;
      }
  }

  if (!tipo) {
    console.warn("handleAgendarManutencao: Tipo é obrigatório.");
    showNotification("❗ O campo 'Tipo Serviço' do agendamento é obrigatório.", "warning");
    tipoInput.classList.add("error");
    if (isValid) tipoInput.focus(); // Foca aqui se data ok
    isValid = false;
  }

  if (!isValid) {
    playSound(soundMap.error);
    return;
  }

  // Chama 'interagir' com custo 0 para agendamento
  interagir(
    "registrarManutencao", // Usa a mesma ação, a data futura diferencia
    event,
    dataAgendamento, // Data futura validada
    tipo,
    0, // Custo zero para agendamentos
    descricao
  ).then((success) => {
    if (success) {
      console.log("Agendamento realizado com sucesso.");
      showNotification(`🗓️ Serviço "${tipo}" agendado!`, "success");
      // Limpa formulário
      dataInput.value = "";
      tipoInput.value = "";
      if (descInput) descInput.value = "";
    } else {
       console.warn("handleAgendarManutencao: A função 'interagir' retornou falha.");
    }
  });
}

/** @description Handler p/ salvar quick edit (modelo, cor, imagem). @param {Event} event */
function handleQuickEditSave(event) {
  console.log("Handler: Quick Edit Save"); // Log Adicionado
  if (!currentlySelectedVehicle) {
    showNotification("❗ Selecione um veículo para editar.", "warning");
    playSound(soundMap.error);
    return;
  }

  const modelInput = DOM.quickEditModel; // Corrigido para camelCase
  const colorInput = DOM.quickEditColor; // Corrigido para camelCase
  const imageInput = DOM.quickEditImage; // Corrigido para camelCase (Opcional)

  if (!modelInput || !colorInput) {
     console.error("handleQuickEditSave: Inputs de Modelo ou Cor não encontrados no DOM.");
     showNotification("❌ Erro interno: Campos de edição rápida não encontrados.", "error");
    return;
  }

  // Limpa erros
  modelInput.classList.remove("error");
  colorInput.classList.remove("error");

  // Validações
  let isValid = true;
  const novoModelo = modelInput.value.trim();
  const novaCor = colorInput.value.trim();
  // Imagem é opcional, mas pegamos o valor (pode ser vazio)
  const novaImagem = imageInput ? imageInput.value.trim() : null;

  if (!novoModelo) {
    console.warn("handleQuickEditSave: Modelo é obrigatório.");
    showNotification("❗ O campo 'Modelo' é obrigatório.", "warning");
    modelInput.classList.add("error");
    modelInput.focus();
    isValid = false;
  }

  if (!novaCor) {
    console.warn("handleQuickEditSave: Cor é obrigatória.");
    showNotification("❗ O campo 'Cor' é obrigatório.", "warning");
    colorInput.classList.add("error");
    if (isValid) colorInput.focus();
    isValid = false;
  }

  if (!isValid) {
    playSound(soundMap.error);
    return;
  }

  // Chama interagir com a ação 'updateProperties'
  // O quarto argumento (null) é para a capacidade, que não é editada aqui
  interagir(
      "updateProperties",
       event,
       novoModelo,
       novaCor,
       novaImagem, // Pode ser string vazia ou null
       null // Argumento para capacidade (relevante só para Caminhao.updateProperties)
    ).then( (success) => {
        if (success) {
          console.log("Quick edit salvo com sucesso.");
          showNotification("✅ Propriedades do veículo atualizadas!", "success");
          // Atualiza a lista da sidebar para refletir a mudança de nome/imagem
          renderVehicleList();
        } else {
           console.warn("handleQuickEditSave: A função 'interagir' retornou falha (talvez nada tenha mudado?).");
           // Notificação geralmente não é necessária se nada mudou
        }
    });
}

/** @description Handler p/ submit do form de adicionar novo veículo. @param {Event} event */
function handleAddFormSubmit(event) {
  event.preventDefault(); // Previne o envio padrão do formulário
  console.log("handleAddFormSubmit triggered"); // Log Adicionado

  const form = event.target;
  // Verifica se o evento veio do formulário correto
  if (!form || form.id !== 'add-vehicle-form') {
      console.error("handleAddFormSubmit: Evento não originado do formulário esperado (#add-vehicle-form).");
      return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  console.log("Validating form inputs..."); // Log Adicionado

  // Referências diretas aos elementos (assumindo que DOM está populado)
  const tipoSelect = DOM.addVehicleType; // Corrigido para camelCase
  const modeloInput = DOM.addModelo;
  const corInput = DOM.addCor;
  const imagemInput = DOM.addImagem; // Opcional
  const capacidadeInput = DOM.addCapacidade; // Opcional, só para Caminhao

  // Verificações básicas de existência dos elementos obrigatórios
  if (!tipoSelect || !modeloInput || !corInput) {
      console.error("handleAddFormSubmit: Elementos essenciais do formulário (tipo, modelo, cor) não encontrados no DOM.");
       showNotification("❌ Erro interno: Campos do formulário não encontrados.", "error");
      return;
  }

  // Validação
  let isValid = true;
  const tipo = tipoSelect.value; // Pega o valor selecionado
  const modelo = modeloInput.value.trim();
  const cor = corInput.value.trim();
  const imagem = imagemInput ? imagemInput.value.trim() : "";
  let capacidade = null; // Será definido apenas se for Caminhao

  // Inputs a serem validados (variável dependendo do tipo)
  const inputsToValidate = [tipoSelect, modeloInput, corInput];
  if (tipo === "Caminhao") {
      if (capacidadeInput) {
          inputsToValidate.push(capacidadeInput); // Adiciona capacidade à validação
      } else {
           console.error("handleAddFormSubmit: Input de capacidade não encontrado para tipo Caminhão.");
           showNotification("❌ Erro interno: Campo de capacidade não encontrado.", "error");
           isValid = false; // Falha se o campo obrigatório não existe
      }
  }

  // Loop de validação
  inputsToValidate.forEach((input) => {
    if (!input) return; // Pula se o elemento não existe (já logado antes)

    input.classList.remove("error"); // Limpa erro anterior
    let isEmpty = !input.value || input.value.trim() === "";
    let isInvalidNumber = false;

    // Validação específica para número (capacidade)
    if (input.type === "number") {
        const numValue = Number(input.value);
        // Considera inválido se não for número OU se for negativo (capacidade não pode ser negativa)
        if (isNaN(numValue) || numValue < 0) {
           isInvalidNumber = true;
        } else {
            // Atualiza a variável 'capacidade' se for o input correto e válido
            if(input === capacidadeInput) {
                capacidade = numValue;
            }
        }
    }

    // Marca como inválido se estiver vazio e for obrigatório, ou se for número inválido
    if ((isEmpty && input.hasAttribute("required")) || isInvalidNumber) {
      isValid = false;
      input.classList.add("error");
      // Foca no primeiro campo inválido encontrado
      if (isValid === false && !document.querySelector('#add-vehicle-form .error:focus')) {
           input.focus();
      }
    }
  });

  if (!isValid) {
    console.error("Form validation failed."); // Log Adicionado
    showNotification("❗ Preencha corretamente todos os campos obrigatórios.", "warning");
    playSound(soundMap.error);
    return; // Interrompe se inválido
  }

   console.log("Validation passed. Setting timeout for processing..."); // Log Adicionado

  // Desabilita botão durante processamento
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("processing");
  }

  // Usa setTimeout para simular um pequeno delay (pode ser removido se não necessário)
  setTimeout(() => {
    console.log("Inside setTimeout - Starting vehicle creation..."); // Log Adicionado
    let novoVeiculo = null;
    try {
       console.log(`Attempting to create vehicle of type: ${tipo}`); // Log Adicionado
      // Cria a instância da classe correta
      switch (tipo) {
        case "Carro":
          novoVeiculo = new Carro(modelo, cor, imagem);
          break;
        case "CarroEsportivo":
          novoVeiculo = new CarroEsportivo(modelo, cor, imagem);
          break;
        case "Caminhao":
          // 'capacidade' já foi validada e convertida para número
          novoVeiculo = new Caminhao(modelo, cor, capacidade, imagem);
          break;
        default:
          // Embora o select deva impedir isso, adiciona um fallback
          throw new Error("Tipo de veículo selecionado é inválido.");
      }

      // Se a instância foi criada com sucesso
      if (novoVeiculo instanceof Veiculo) {
        console.log("Vehicle instance created:", novoVeiculo); // Log Adicionado
        garage.push(novoVeiculo); // Adiciona à garagem em memória
        salvarGaragemNoLocalStorage(); // Persiste a mudança
        renderVehicleList(); // Atualiza a lista na UI
        form.reset(); // Limpa o formulário
        handleAddTypeChange(); // Reseta a visibilidade do campo capacidade
        showPanelContent("placeholder"); // Volta para a visão inicial
        showNotification(`✅ ${tipo} "${modelo}" adicionado com sucesso!`, "success");
        tocarSomCorrespondente(null, "add_vehicle"); // Toca som de adicionar
      } else {
          // Isso não deveria acontecer se o switch/case estiver correto
           throw new Error("Falha inesperada ao criar a instância do veículo.");
      }

    } catch (error) {
      // Captura erros da instanciação ou lógica posterior
      console.error("Erro durante a criação ou adição do veículo:", error);
      showNotification(`❌ Erro ao criar veículo: ${error.message}`, "error", 0);
      playSound(soundMap.error);
    } finally {
       console.log("Processing finished."); // Log Adicionado
      // Reabilita o botão, independentemente do resultado
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("processing");
      }
    }
  }, 150); // Delay simulado
}

/** @description Mostra/esconde campo capacidade no form add ao mudar o tipo. */
function handleAddTypeChange() {
    const selectedType = DOM.addVehicleType?.value; // Pega o tipo selecionado
    const capacityGroup = DOM.addCapacidadeGroup;
    const capacityInput = DOM.addCapacidade;

    if (!capacityGroup || !capacityInput) {
        // Se os elementos não existem, não faz nada (erro já logado no cache)
        // console.warn("handleAddTypeChange: Elementos de capacidade não encontrados.");
        return;
    }

    if (selectedType === "Caminhao") {
        capacityGroup.classList.remove("hidden"); // Mostra o grupo
        capacityInput.setAttribute("required", "required"); // Torna obrigatório
        // Não define valor padrão aqui, deixa o HTML ou o usuário preencher
    } else {
        capacityGroup.classList.add("hidden"); // Esconde o grupo
        capacityInput.removeAttribute("required"); // Remove obrigatoriedade
        capacityInput.classList.remove("error"); // Limpa erro visual se houver
        capacityInput.value = capacityInput.defaultValue || "10000"; // Reseta para valor padrão do HTML ou 10000
    }
    console.log(`Add form type changed to: ${selectedType}. Capacity field visibility updated.`); // Log Adicionado
}

/** @description Handler p/ excluir veículo selecionado. @param {Event} event */
function handleDeleteVehicle(event) {
  console.log("Handler: Delete Vehicle"); // Log Adicionado
  // Verifica se há um veículo selecionado e se o índice é válido
  if (!currentlySelectedVehicle || currentlySelectedVehicleIndex < 0 || currentlySelectedVehicleIndex >= garage.length) {
    showNotification("❗ Selecione um veículo para excluir.", "warning");
    playSound(soundMap.error);
    return;
  }

  // Confirmação com o usuário
  const vehicleName = currentlySelectedVehicle.modelo || "este veículo";
  // Usa \n para quebra de linha na caixa de confirmação
  if (confirm(`❓ Tem certeza que deseja excluir "${vehicleName}"?\n\nEsta ação não pode ser desfeita.`)) {
    console.log(`User confirmed deletion for ${vehicleName}`); // Log Adicionado

    const button = event?.target?.closest("button"); // Pega o botão (se houver)
    if (button) {
        button.disabled = true;
        button.classList.add("processing");
    }

    // Simula processamento (pode remover o setTimeout se não necessário)
    setTimeout(() => {
        try {
            const indexToRemove = currentlySelectedVehicleIndex; // Guarda o índice
             const deletedModelName = currentlySelectedVehicle.modelo; // Guarda o nome para a notificação

            // Dupla verificação para evitar race conditions (improvável aqui, mas boa prática)
            if (indexToRemove >= 0 && indexToRemove < garage.length && garage[indexToRemove] === currentlySelectedVehicle)
            {
                garage.splice(indexToRemove, 1); // Remove do array em memória

                // Reseta seleção atual
                currentlySelectedVehicle = null;
                currentlySelectedVehicleIndex = -1;

                salvarGaragemNoLocalStorage(); // Persiste a remoção
                renderVehicleList(); // Atualiza a lista na UI
                showPanelContent("placeholder"); // Volta ao estado inicial
                showNotification(`🗑️ "${deletedModelName}" foi excluído com sucesso.`, "info");
                tocarSomCorrespondente(null, "delete_vehicle"); // Toca som de exclusão
                 console.log(`Vehicle at index ${indexToRemove} deleted successfully.`); // Log Adicionado
            } else {
                // Se algo deu errado entre a confirmação e a exclusão
                 throw new Error("Inconsistência de estado ao tentar excluir o veículo.");
            }
        } catch (error) {
             console.error("Erro durante a exclusão do veículo:", error);
             showNotification("❌ Erro ao excluir o veículo. Tente novamente.", "error");
             playSound(soundMap.error);
             // É prudente recarregar a lista e resetar a seleção em caso de erro
             currentlySelectedVehicle = null;
             currentlySelectedVehicleIndex = -1;
             renderVehicleList();
             showPanelContent("placeholder");
        } finally {
            // Reabilita o botão
            if (button) {
                button.disabled = false;
                button.classList.remove("processing");
            }
        }
    }, 150); // Delay simulado

  } else {
    // Usuário cancelou a exclusão
     console.log("User cancelled deletion."); // Log Adicionado
    showNotification("Exclusão cancelada.", "info");
  }
}

/** @description Limpa classe 'error' do input ao digitar. @param {Event} event */
function clearInputErrorOnInput(event) {
    // Verifica se o alvo é um input ou select e se tem a classe 'error'
  if (event.target instanceof Element && event.target.classList.contains("error")) {
    event.target.classList.remove("error");
    // console.log(`Cleared error class from input: ${event.target.id || event.target.name}`); // Log pode ser muito verboso
  }
}

// ==========================================================================
//                         INICIALIZAÇÃO E LISTENERS GERAIS
// ==========================================================================

/** @description Configura todos os event listeners da aplicação. */
function setupEventListeners() {
  console.log("Setting up event listeners..."); // Log Adicionado

  // Botão para mostrar formulário de adicionar
  DOM.btnShowAddVehicleForm?.addEventListener("click", () => {
    console.log("Handler: Show Add Form Click"); // Log Adicionado
    // Reseta o formulário antes de mostrar
    if (DOM.addVehicleForm) {
        DOM.addVehicleForm.reset();
        // Remove classes de erro de todos os campos dentro do form
        DOM.addVehicleForm.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
    }
    handleAddTypeChange(); // Garante que campo de capacidade está no estado correto
    showPanelContent("addForm");
  });

  // Botão para cancelar adição
  DOM.btnCancelAddVehicle?.addEventListener("click", () => { // Corrigido para camelCase
      console.log("Handler: Cancel Add Click"); // Log Adicionado
      showPanelContent("placeholder");
  });

  // Botão para excluir veículo
  DOM.btnDeleteVehicle?.addEventListener("click", handleDeleteVehicle); // Corrigido para camelCase

  // Botão para salvar edição rápida
  DOM.btnSaveQuickEdit?.addEventListener("click", handleQuickEditSave); // Corrigido para camelCase

  // Listener para submit do formulário de adição (Verificação explícita)
  if (DOM.addVehicleForm) {
      DOM.addVehicleForm.addEventListener("submit", handleAddFormSubmit);
      console.log("Submit listener attached to #add-vehicle-form."); // Log Adicionado
  } else {
      // Log de erro se o formulário não foi encontrado durante o cache
      // A mensagem de erro já deve ter aparecido em cacheDOMElements
  }

  // Listener para mudança no tipo de veículo no formulário de adição
  DOM.addVehicleType?.addEventListener("change", handleAddTypeChange); // Corrigido para camelCase

  // Listener para limpar erros de validação ao digitar em qualquer input/select/textarea
  // Delegação de eventos no corpo pode ser mais eficiente, mas isso funciona
  const allInputs = document.querySelectorAll("input, select, textarea");
  allInputs.forEach((inputElement) =>
    inputElement.addEventListener("input", clearInputErrorOnInput)
  );
   console.log(`Attached 'input' listener to ${allInputs.length} form elements to clear errors.`);

  // Listener para cliques na navegação por abas (delegação de evento)
  DOM.vehicleTabsNav?.addEventListener("click", (event) => {
    // Verifica se o clique foi realmente em um botão de aba
    if (event.target instanceof HTMLButtonElement && event.target.classList.contains("tab-link")) {
       console.log(`Handler: Tab Nav Click on button: ${event.target.dataset.target}`); // Log Adicionado
      activateTab(event.target);
    }
  });

  // Adiciona listeners para os BOTÕES DE AÇÃO específicos (ligar, desligar, etc.)
  // É melhor adicionar listeners aqui do que usar onclick="" no HTML
  // Exemplo:
  document.getElementById("btn-ligar")?.addEventListener('click', handleLigarClick);
  document.getElementById("btn-desligar")?.addEventListener('click', handleDesligarClick);
  document.getElementById("btn-acelerar")?.addEventListener('click', handleAcelerarClick);
  document.getElementById("btn-frear")?.addEventListener('click', handleFrearClick);
  document.getElementById("btn-buzinar")?.addEventListener('click', handleBuzinarClick);
  document.getElementById("btn-rodar")?.addEventListener('click', handleRodarClick);
  // Esportivo
  document.getElementById("btn-turbo-on")?.addEventListener('click', handleTurboOnClick);
  document.getElementById("btn-turbo-off")?.addEventListener('click', handleTurboOffClick);
  // Caminhão
  document.getElementById("btn-carregar")?.addEventListener('click', handleCarregarClick);
  document.getElementById("btn-descarregar")?.addEventListener('click', handleDescarregarClick);
  // Manutenção / Agendamento (Botões dentro dos forms)
  // É melhor pegar pelo form e ouvir o clique no botão específico
   document.querySelector("#register-maint-form button")?.addEventListener('click', handleRegistrarManutencao);
   document.querySelector("#schedule-maint-form button")?.addEventListener('click', handleAgendarManutencao);


  console.log("Event listeners setup finished."); // Log Adicionado
}


// --- Ponto de Entrada Principal ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed."); // Log Adicionado
  // Primeiro, faz cache dos elementos. Sai se elementos críticos faltarem.
  if (!cacheDOMElements()) {
      alert("Erro crítico: Elementos essenciais da página não foram encontrados. A aplicação não pode iniciar. Verifique o console (F12).");
      return; // Impede o resto da inicialização
  }

  console.log("Setting up application..."); // Log Adicionado
  setupEventListeners(); // Configura os listeners depois que o DOM está pronto
  carregarGaragemDoLocalStorage(); // Carrega dados salvos
  renderVehicleList(); // Renderiza a lista inicial
  showPanelContent("placeholder"); // Mostra o estado inicial da UI

  console.log("✅ Garagem Inteligente PRO Inicializada e Pronta!"); // Log Final
});

// --- FIM DO SCRIPT ---