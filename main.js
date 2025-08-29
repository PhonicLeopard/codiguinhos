console.log

import Veiculo from './Veiculo.js';
import Carro from './Carro.js';
import CarroEsportivo from './CarroEsportivo.js';
import Caminhao from './Caminhao.js';
import Manutencao from './Manutencao.js';
import weatherService from './weatherService.js';

// --- Estado da Aplicação e Constantes ---
const backendUrl = "http://localhost:3001/api";
let garage = [];
let currentlySelectedVehicle = null;

// --- Cache Centralizado de Elementos DOM ---
const DOM = {};

// ==========================================================================
//                      FUNÇÃO DE API CENTRALIZADA
// ==========================================================================
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${backendUrl}${endpoint}`, options);
        if (response.status === 204) return null; // Para DELETE bem-sucedido
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Erro do Servidor: ${response.status}`);
        }
        return data;
    } catch (error) {
        showNotification(error.message, "error");
        console.error(`ERRO NA API: ${error.message}`);
        throw error;
    }
}

// ==========================================================================
//                  FUNÇÕES DE INICIALIZAÇÃO E RENDERIZAÇÃO
// ==========================================================================

async function initializeGarage() {
    try {
        const vehiclesData = await fetchAPI('/veiculos');
        garage = vehiclesData.map(data => instantiateVehicle(data));
        renderVehicleList();
    } catch (error) {
        DOM.vehicleList.innerHTML = '<li class="placeholder">Falha ao carregar a garagem.</li>';
    }
}

function instantiateVehicle(data) {
    let vehicle;
    // Usa o _id do MongoDB como o ID principal
    data.id = data._id; 
    
    switch (data.tipo) {
        case "CarroEsportivo": vehicle = new CarroEsportivo(data); break;
        case "Caminhao": vehicle = new Caminhao(data); break;
        default: vehicle = new Carro(data); break;
    }
    // Converte os dados puros de manutenção em objetos da classe Manutencao
    vehicle.historicoManutencoes = (data.historicoManutencoes || []).map(m => Manutencao.fromPlainObject(m));
    return vehicle;
}

function renderVehicleList() {
    DOM.vehicleList.innerHTML = "";
    if (garage.length === 0) {
        DOM.vehicleList.innerHTML = '<li class="placeholder">Garagem vazia.</li>';
        return;
    }
    garage.forEach(v => {
        const li = document.createElement("li");
        li.dataset.vehicleId = v.id;
        li.innerHTML = `<img src="${v.imagem || 'placeholder.png'}" alt="${v.modelo}" class="vehicle-list-img" onerror="this.src='placeholder.png';"> <span>${v.modelo} (${v.cor})</span>`;
        if (currentlySelectedVehicle?.id === v.id) li.classList.add("selected");
        li.addEventListener("click", () => handleVehicleSelection(v.id));
        DOM.vehicleList.appendChild(li);
    });
}

function displaySelectedVehicleDetails() {
    if (!currentlySelectedVehicle) return;
    const v = currentlySelectedVehicle;
    DOM.detailVehicleImg.src = v.imagem || 'placeholder.png';
    DOM.detailVehicleName.textContent = v.modelo;
    DOM.quickEditModel.value = v.modelo;
    DOM.quickEditColor.value = v.cor;
    DOM.quickEditImage.value = v.imagem;
    DOM.baseVehicleDetails.innerHTML = v.getDisplayInfo();
    renderMaintenanceLists();
}

function renderMaintenanceLists() {
    if (!currentlySelectedVehicle) return;
    renderList(DOM.maintenanceHistoryList, currentlySelectedVehicle.getPastMaintenances(), "Nenhum serviço no histórico.");
    renderList(DOM.scheduleList, currentlySelectedVehicle.getFutureMaintenances(), "Nenhum serviço agendado.");
}

function renderList(ulElement, items, placeholder) {
    ulElement.innerHTML = '';
    if (items.length === 0) {
        ulElement.innerHTML = `<li class="placeholder">${placeholder}</li>`;
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item.getDetalhesFormatados();
        ulElement.appendChild(li);
    });
}

// ==========================================================================
//               MANIPULADORES DE PAINEL E NOTIFICAÇÕES
// ==========================================================================

function showPanelContent(contentType) {
    [DOM.panelPlaceholder, DOM.vehicleDetailsView, DOM.addVehicleFormView].forEach(p => p.classList.add("hidden"));
    
    let panelToShow;
    if (contentType === 'details') panelToShow = DOM.vehicleDetailsView;
    else if (contentType === 'addForm') panelToShow = DOM.addVehicleFormView;
    else panelToShow = DOM.panelPlaceholder;
    
    panelToShow.classList.remove("hidden");
    
    if (contentType !== "details") {
        currentlySelectedVehicle = null;
        renderVehicleList(); // Remove a seleção da lista
    }
}

function showNotification(message, type = "success", duration = 4000) {
    const el = document.createElement("div");
    el.className = `notification notification-${type}`;
    el.textContent = message;
    DOM.notificationArea.appendChild(el);
    setTimeout(() => el.remove(), duration);
}

// ==========================================================================
//                 HANDLERS DE EVENTOS (AÇÕES DO USUÁRIO)
// ==========================================================================

function handleVehicleSelection(id) {
    currentlySelectedVehicle = garage.find(v => v.id === id);
    if (!currentlySelectedVehicle) return;
    renderVehicleList();
    displaySelectedVehicleDetails();
    showPanelContent("details");
    activateTab(DOM.tabNav.querySelector('.tab-link')); // Ativa a primeira aba
}

async function handleAddFormSubmit(event) {
    event.preventDefault();
    const vehicleData = {
        tipo: DOM.addVehicleType.value,
        modelo: DOM.addModelo.value.trim(),
        cor: DOM.addCor.value.trim(),
        imagem: DOM.addImagem.value.trim() || 'placeholder.png',
    };
    if (vehicleData.tipo === 'Caminhao') {
        vehicleData.capacidadeCarga = Number(DOM.addCapacidade.value);
    }
    try {
        await fetchAPI('/veiculos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData),
        });
        showNotification(`Veículo "${vehicleData.modelo}" adicionado com sucesso!`, 'success');
        DOM.addVehicleForm.reset();
        handleAddTypeChange();
        showPanelContent('placeholder');
        await initializeGarage(); // Busca a lista atualizada do servidor
    } catch (error) {
        console.error("Falha ao adicionar veículo.");
    }
}

async function handleUpdateQuickEdit() {
    if (!currentlySelectedVehicle) return;
    const updatedData = {
        modelo: DOM.quickEditModel.value.trim(),
        cor: DOM.quickEditColor.value.trim(),
        imagem: DOM.quickEditImage.value.trim() || 'placeholder.png'
    };
    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        await initializeGarage();
        currentlySelectedVehicle = garage.find(v => v.id === currentlySelectedVehicle.id);
        displaySelectedVehicleDetails();
        showNotification("Veículo atualizado!", "success");
    } catch (error) {
        console.error("Falha ao atualizar veículo.");
    }
}

async function handleDeleteVehicle() {
    if (!currentlySelectedVehicle || !confirm(`Tem certeza que deseja excluir o ${currentlySelectedVehicle.modelo}?`)) return;
    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}`, { method: 'DELETE' });
        showPanelContent('placeholder');
        showNotification('Veículo excluído com sucesso.', 'success');
        await initializeGarage();
    } catch (error) {
        console.error("Falha ao excluir veículo.");
    }
}

async function handleMaintenanceSubmit(event, isFuture) {
    event.preventDefault();
    if (!currentlySelectedVehicle) return;
    const form = event.target;
    let maintenanceData;

    try {
        if (isFuture) {
            const data = DOM.agendamentoData.value;
            const tipo = DOM.agendamentoProblema.value.trim();
            if (!data || !tipo) throw new Error("Data e Serviço são obrigatórios.");
            maintenanceData = { data: new Date(data + "T12:00:00"), tipo: tipo, custo: 0 };
        } else {
            const data = DOM.registroData.value;
            const tipo = DOM.registroProblema.value.trim();
            const custo = parseFloat(DOM.registroCusto.value);
            if (!data || !tipo) throw new Error("Data e Serviço são obrigatórios.");
            if (isNaN(custo) || custo < 0) throw new Error("O custo é inválido.");
            maintenanceData = { data: new Date(data + "T12:00:00"), tipo: tipo, custo: custo };
        }
    } catch (error) {
        showNotification(error.message, "error");
        return;
    }

    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}/manutencoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(maintenanceData),
        });
        await initializeGarage();
        currentlySelectedVehicle = garage.find(v => v.id === currentlySelectedVehicle.id);
        renderMaintenanceLists();
        form.reset();
        showNotification(`Serviço ${isFuture ? 'agendado' : 'registrado'} com sucesso!`, 'success');
    } catch (error) {
        console.error("Falha ao submeter manutenção.");
    }
}

async function handleFetchWeather() {
    const cidade = DOM.cidadeInput.value.trim();
    if (!cidade) return showNotification("Por favor, digite uma cidade.", "error");
    DOM.previsaoTempoResultado.innerHTML = "<p>Buscando previsão...</p>";
    try {
        const rawData = await weatherService.buscarPrevisaoDetalhada(cidade);
        const processedData = weatherService.processarDadosForecast(rawData);
        DOM.previsaoTempoResultado.innerHTML = '';
        if (!processedData) throw new Error("Não foi possível processar os dados.");
        const container = document.createElement('div');
        container.className = 'forecast-days-container';
        processedData.forEach(day => {
            container.innerHTML += `<div class="forecast-day-card"><h5>${new Date(day.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}</h5><img src="https://openweathermap.org/img/wn/${day.iconeRepresentativo}@2x.png" alt="${day.descricaoRepresentativa}"><div><span class="temp-max">${day.temp_max.toFixed(0)}°</span><span class="temp-min">${day.temp_min.toFixed(0)}°</span></div><div class="description">${day.descricaoRepresentativa}</div></div>`;
        });
        DOM.previsaoTempoResultado.appendChild(container);
    } catch (error) {
        DOM.previsaoTempoResultado.innerHTML = `<p style="color:var(--danger-color);">${error.message}</p>`;
    }
}

function handleAddTypeChange() {
    DOM.addCapacidadeGroup.classList.toggle('hidden', DOM.addVehicleType.value !== 'Caminhao');
}

function activateTab(tabElement) {
    if (!tabElement) return;
    DOM.tabNav.querySelector('.active')?.classList.remove('active');
    tabElement.classList.add('active');
    const targetId = tabElement.dataset.target;
    DOM.tabContentContainer.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('hidden', `#${tab.id}` !== targetId);
    });
}

// ==========================================================================
//                     SETUP E INICIALIZAÇÃO
// ==========================================================================

function cacheDOMElements() {
    const ids = ["vehicle-list", "panel-placeholder", "vehicle-details-view", "add-vehicle-form-view", "notification-area", "add-vehicle-form", "add-vehicle-type", "add-modelo", "add-cor", "add-imagem", "add-capacidade", "btn-show-add-vehicle-form", "btn-cancel-add-vehicle", "detail-vehicle-img", "detail-vehicle-name", "quick-edit-model", "quick-edit-color", "quick-edit-image", "btn-save-quick-edit", "base-vehicle-details", "tab-content-container", "btn-delete-vehicle", "maintenance-history-list", "schedule-list", "register-maint-form", "registroData", "registroProblema", "registroCusto", "schedule-maint-form", "agendamentoData", "agendamentoProblema", "cidade-input", "btn-buscar-previsao", "previsao-tempo-resultado"];
    ids.forEach(id => {
        const camelCaseId = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
        DOM[camelCaseId] = document.getElementById(id);
    });
    DOM.addCapacidadeGroup = DOM.addVehicleForm.querySelector('.specific-field[data-type="Caminhao"]');
    DOM.tabNav = document.querySelector('.tab-nav');
}

function setupEventListeners() {
    DOM.btnShowAddVehicleForm.addEventListener("click", () => showPanelContent("addForm"));
    DOM.btnCancelAddVehicle.addEventListener("click", () => showPanelContent("placeholder"));
    DOM.addVehicleForm.addEventListener("submit", handleAddFormSubmit);
    DOM.addVehicleType.addEventListener("change", handleAddTypeChange);
    DOM.btnSaveQuickEdit.addEventListener("click", handleUpdateQuickEdit);
    DOM.btnDeleteVehicle.addEventListener("click", handleDeleteVehicle);
    DOM.registerMaintForm.addEventListener("submit", (e) => handleMaintenanceSubmit(e, false));
    DOM.scheduleMaintForm.addEventListener("submit", (e) => handleMaintenanceSubmit(e, true));
    DOM.btnBuscarPrevisao.addEventListener("click", handleFetchWeather);
    DOM.cidadeInput.addEventListener("keyup", (e) => { if (e.key === 'Enter') handleFetchWeather(); });
    DOM.tabNav.addEventListener('click', (e) => { if (e.target.matches('.tab-link')) activateTab(e.target); });
}

// Ponto de entrada da aplicação
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado. Iniciando Garagem Inteligente PRO...");
    cacheDOMElements();
    setupEventListeners();
    initializeGarage();
    showPanelContent("placeholder");
    console.log("✅ Aplicação pronta e estável!");
});