// ==========================================================================
//                 GARAGEM INTELIGENTE PRO - SCRIPT COMPLETO (V8.2 - CORRIGIDO)
// ==========================================================================

// --- Classes POO do Frontend ---
class Veiculo {
    constructor(data) {
        Object.assign(this, data);
        this.id = data._id;
        this.ligado = false;
        this.velocidade = 0;
    }
    getDisplayInfo() { return `<div class="info-item"><strong>Modelo:</strong> ${this.modelo}</div><div class="info-item"><strong>Cor:</strong> ${this.cor}</div><div class="info-item"><strong>Tipo:</strong> ${this.tipo}</div>`; }
    ligar() { if (!this.ligado) { this.ligado = true; showNotification(`${this.modelo} ligado!`, 'info'); } }
    desligar() { if (this.ligado && this.velocidade === 0) { this.ligado = false; showNotification(`${this.modelo} desligado.`, 'info'); } else if (this.velocidade > 0) { showNotification('Pare o veículo antes de desligar!', 'warning'); } }
    acelerar() { if (this.ligado) this.velocidade = Math.min(this.velocidade + 10, 180); }
    frear() { this.velocidade = Math.max(0, this.velocidade - 10); }
}
class CarroEsportivo extends Veiculo {
    constructor(data) { super(data); this.turboAtivado = false; }
    toggleTurbo() { this.turboAtivado = !this.turboAtivado; showNotification(`Turbo ${this.turboAtivado ? 'ATIVADO' : 'desativado'}!`, 'info'); }
    acelerar() { if (this.ligado) this.velocidade = Math.min(this.velocidade + (this.turboAtivado ? 30 : 15), 320); }
}
class Caminhao extends Veiculo {
    constructor(data) { super(data); this.cargaAtual = this.cargaAtual || 0; }
    carregar(peso) {
        if (this.cargaAtual + peso <= this.capacidadeCarga) { this.cargaAtual += peso; showNotification(`Carga de ${peso}kg adicionada.`, 'success'); }
        else { showNotification('Capacidade de carga excedida!', 'error'); }
    }
    descarregar(peso) { this.cargaAtual = Math.max(0, this.cargaAtual - peso); showNotification(`Carga de ${peso}kg removida.`, 'success'); }
    acelerar() { if (this.ligado) this.velocidade = Math.min(this.velocidade + 5, 120); }
}
class Manutencao {
    constructor(data) { Object.assign(this, data); }
    isFuture() { const hoje = new Date(); hoje.setHours(0,0,0,0); return new Date(this.data) >= hoje; }
    getDetalhesFormatados() { const d = new Date(this.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}); return this.isFuture() ? `<strong>${this.tipo}</strong> - Agendado: ${d}` : `<strong>${this.tipo}</strong> - ${d} - <strong>${(this.custo||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong>`;}
}

// --- Estado da Aplicação e Constantes ---
const backendUrl = "http://localhost:3001/api";
let garage = [];
let currentlySelectedVehicle = null;
const DOM = {};

// --- Funções de API ---
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${backendUrl}${endpoint}`, options);
        if (response.status === 204) return null;
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro do Servidor');
        return data;
    } catch (error) {
        showNotification(error.message, "error");
        console.error("ERRO NA API:", error);
        throw error;
    }
}

async function initializeGarage() {
    DOM.vehicleList.innerHTML = '<li class="placeholder">Faça login para ver seus veículos.</li>';
}

// --- Funções de DOM ---
function cacheDOMElements() {
    const ids = [
        "vehicle-list","panel-placeholder","vehicle-details-view","add-vehicle-form-view","notification-area","add-vehicle-form","add-vehicle-type","add-modelo","add-cor","add-imagem","add-capacidade","btn-show-add-vehicle-form","btn-cancel-add-vehicle","detail-vehicle-img","detail-vehicle-name","quick-edit-model","quick-edit-color","quick-edit-image","btn-save-quick-edit","base-vehicle-details","tab-content-container","btn-delete-vehicle","maintenance-history-list","schedule-list","register-maint-form","schedule-maint-form","cidade-input","btn-buscar-previsao","previsao-tempo-resultado","detail-status","detail-speed","btn-toggle-engine","btn-accelerate","btn-brake","turbo-controls","btn-toggle-turbo","cargo-controls","detail-cargo","cargo-amount","btn-load-cargo","btn-unload-cargo",
        "btn-show-register", "modal-backdrop", "register-modal", "register-form", "register-modal-close-btn",
        "register-name", "register-email", "register-password", "register-photo", "btn-show-login"
    ];
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            DOM[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = element;
        }
    });
    if (DOM.addVehicleForm) DOM.addCapacidadeGroup = DOM.addVehicleForm.querySelector('.specific-field');
    DOM.tabNav = document.querySelector('.tab-nav');
}

function renderVehicleList() {
    if (!DOM.vehicleList) return;
    DOM.vehicleList.innerHTML = garage.length === 0 ? '<li class="placeholder">Garagem vazia.</li>' : garage.map(v => `<li data-vehicle-id="${v.id}" class="${currentlySelectedVehicle?.id === v.id ? 'selected' : ''}" role="button"><img src="${v.imagem || 'placeholder.png'}" class="vehicle-list-img" onerror="this.src='placeholder.png'"> <span>${v.modelo}</span></li>`).join('');
    DOM.vehicleList.querySelectorAll('li[data-vehicle-id]').forEach(li => li.addEventListener('click', () => handleVehicleSelection(li.dataset.vehicleId)));
}

function displaySelectedVehicleDetails() { /* ... (Função original sem alterações) ... */ }
function renderMaintenanceLists() { /* ... (Função original sem alterações) ... */ }

function showPanelContent(contentType) {
    [DOM.panelPlaceholder, DOM.vehicleDetailsView, DOM.addVehicleFormView].forEach(p => p && p.classList.add("hidden"));
    const panelToShow = contentType === 'details' ? DOM.vehicleDetailsView : contentType === 'addForm' ? DOM.addVehicleFormView : DOM.panelPlaceholder;
    if (panelToShow) panelToShow.classList.remove("hidden");
    if (contentType !== "details") { currentlySelectedVehicle = null; renderVehicleList(); }
}

function showNotification(message, type = "success", duration = 4000) {
    if (!DOM.notificationArea) return;
    const el = document.createElement("div");
    el.className = `notification notification-${type}`;
    el.textContent = message;
    DOM.notificationArea.appendChild(el);
    setTimeout(() => el.remove(), duration);
}

// --- Handlers ---

function handleVehicleSelection(id) { /* ... (Função original sem alterações) ... */ }
async function handleAddFormSubmit(event) {
    event.preventDefault();
    showNotification("Você precisa estar logado para adicionar um veículo.", "warning");
}
async function handleUpdateQuickEdit() { /* ... (Função original sem alterações) ... */ }
async function handleDeleteVehicle() { /* ... (Função original sem alterações) ... */ }
async function handleMaintenanceSubmit(event, isFuture) { /* ... (Função original sem alterações) ... */ }
function handleAddTypeChange() { /* ... (Função original sem alterações) ... */ }
function activateTab(tabElement) { /* ... (Função original sem alterações) ... */ }

// --- Handlers de Autenticação ---
function showRegisterModal() {
    DOM.modalBackdrop.classList.remove('hidden');
    DOM.registerModal.classList.remove('hidden');
}

function hideModal() {
    DOM.modalBackdrop.classList.add('hidden');
    DOM.registerModal.classList.add('hidden');
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const userData = {
        name: DOM.registerName.value.trim(),
        email: DOM.registerEmail.value.trim(),
        password: DOM.registerPassword.value.trim(),
        photo: DOM.registerPhoto.value.trim() || undefined
    };

    if (!userData.name || !userData.email || !userData.password) {
        return showNotification("Nome, e-mail e senha são obrigatórios.", "error");
    }

    try {
        const response = await fetch(`http://localhost:3001/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao registrar.');
        }
        showNotification('Conta criada com sucesso! Agora você pode fazer login.', 'success');
        hideModal();
        DOM.registerForm.reset();
    } catch (error) {
        showNotification(error.message, "error");
        console.error("ERRO NO REGISTRO:", error);
    }
}

// --- Funções de Interatividade e Clima ---
function renderVehicleState() { /* ... (Função original sem alterações) ... */ }
function setupInteractionListeners() { /* ... (Função original sem alterações) ... */ }
function renderForecast(processedData, days) { /* ... (Função original sem alterações) ... */ }
function toggleForecastDetails(card) { /* ... (Função original sem alterações) ... */ }
async function handleFetchWeather() { /* ... (Função original sem alterações) ... */ }
function processarDadosForecast(apiData) { /* ... (Função original sem alterações) ... */ }

// --- Inicialização ---
function setupEventListeners() {
    // Listeners da Garagem (verificando se os elementos existem)
    if (DOM.btnShowAddVehicleForm) DOM.btnShowAddVehicleForm.addEventListener("click", () => { DOM.addVehicleForm.reset(); handleAddTypeChange(); showPanelContent("addForm"); });
    if (DOM.btnCancelAddVehicle) DOM.btnCancelAddVehicle.addEventListener("click", () => showPanelContent("placeholder"));
    if (DOM.addVehicleForm) DOM.addVehicleForm.addEventListener("submit", handleAddFormSubmit);
    if (DOM.addVehicleType) DOM.addVehicleType.addEventListener("change", handleAddTypeChange);
    if (DOM.btnSaveQuickEdit) DOM.btnSaveQuickEdit.addEventListener("click", handleUpdateQuickEdit);
    if (DOM.btnDeleteVehicle) DOM.btnDeleteVehicle.addEventListener("click", handleDeleteVehicle);
    if (DOM.registerMaintForm) DOM.registerMaintForm.addEventListener("submit", (e) => handleMaintenanceSubmit(e, false));
    if (DOM.scheduleMaintForm) DOM.scheduleMaintForm.addEventListener("submit", (e) => handleMaintenanceSubmit(e, true));
    if (DOM.btnBuscarPrevisao) DOM.btnBuscarPrevisao.addEventListener("click", handleFetchWeather);
    if (DOM.cidadeInput) DOM.cidadeInput.addEventListener("keyup", (e) => { if (e.key === 'Enter') handleFetchWeather(); });
    if (DOM.tabNav) DOM.tabNav.addEventListener('click', (e) => { if (e.target.matches('.tab-link')) activateTab(e.target); });
    if (DOM.previsaoTempoResultado) DOM.previsaoTempoResultado.addEventListener('click', (e) => { const card = e.target.closest('.forecast-day-card'); if (card) toggleForecastDetails(card); });

    // Listeners de Autenticação
    if (DOM.btnShowRegister) DOM.btnShowRegister.addEventListener('click', showRegisterModal);
    if (DOM.modalBackdrop) DOM.modalBackdrop.addEventListener('click', hideModal);
    if (DOM.registerModalCloseBtn) DOM.registerModalCloseBtn.addEventListener('click', hideModal);
    if (DOM.registerForm) DOM.registerForm.addEventListener('submit', handleRegisterSubmit);
    // Adicionar listener para o botão de login quando ele existir
    // if (DOM.btnShowLogin) DOM.btnShowLogin.addEventListener('click', showLoginModal);

    setupInteractionListeners();
}

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado. Iniciando Garagem Inteligente PRO...");
    cacheDOMElements();
    setupEventListeners();
    initializeGarage();
    showPanelContent("placeholder");
    console.log("✅ Aplicação pronta!");
});

// Nota: As funções que estão como "/* ... */" são as que você já tinha e não precisavam de alteração. Se você copiar este arquivo inteiro, elas estarão faltando. Cole o conteúdo delas de volta se necessário, mas a estrutura principal e a correção estão aqui.