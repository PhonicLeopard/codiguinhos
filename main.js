// ==========================================================================
//           GARAGEM INTELIGENTE PRO - SCRIPT FINAL (V10.0 - AUTENTICAÇÃO COMPLETA)
// ==========================================================================

// --- Classes POO do Frontend ---
class Veiculo {
    constructor(data) { Object.assign(this, data); this.id = data._id; this.ligado = false; this.velocidade = 0; }
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
    carregar(peso) { if (this.cargaAtual + peso <= this.capacidadeCarga) { this.cargaAtual += peso; showNotification(`Carga de ${peso}kg adicionada.`, 'success'); } else { showNotification('Capacidade de carga excedida!', 'error'); } }
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
let authToken = null;
let currentUser = null;
const DOM = {};

// --- Funções de API ---
async function fetchAPI(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    try {
        const response = await fetch(`${backendUrl}${endpoint}`, { ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro do Servidor');
        return data;
    } catch (error) {
        showNotification(error.message, "error");
        console.error("ERRO NA API:", error);
        if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
            handleLogout();
        }
        throw error;
    }
}

async function fetchAndRenderVehicles() {
    if (!authToken) {
        garage = [];
        renderVehicleList();
        return;
    }
    try {
        const vehiclesData = await fetchAPI('/veiculos');
        garage = vehiclesData.map(data => {
            let vehicle;
            switch (data.tipo) {
                case "CarroEsportivo": vehicle = new CarroEsportivo(data); break;
                case "Caminhao": vehicle = new Caminhao(data); break;
                default: vehicle = new Veiculo(data); break;
            }
            return vehicle;
        });
        renderVehicleList();
    } catch (error) {
        console.error("Não foi possível buscar os veículos:", error);
    }
}

// --- Funções de DOM ---
function cacheDOMElements() {
    const ids = [ "vehicle-list","panel-placeholder","vehicle-details-view","add-vehicle-form-view","notification-area","add-vehicle-form","add-vehicle-type","add-modelo","add-cor","add-imagem","add-capacidade","btn-show-add-vehicle-form","btn-cancel-add-vehicle","detail-vehicle-img","detail-vehicle-name","quick-edit-model","quick-edit-color","quick-edit-image","btn-save-quick-edit","base-vehicle-details","tab-content-container","btn-delete-vehicle","maintenance-history-list","schedule-list","register-maint-form","schedule-maint-form","cidade-input","btn-buscar-previsao","previsao-tempo-resultado","detail-status","detail-speed","btn-toggle-engine","btn-accelerate","btn-brake","turbo-controls","btn-toggle-turbo","cargo-controls","detail-cargo","cargo-amount","btn-load-cargo","btn-unload-cargo", "btn-show-register", "modal-backdrop", "register-modal", "register-form", "register-modal-close-btn", "register-name", "register-email", "register-password", "register-photo", "btn-show-login", "login-modal", "login-form", "login-email", "login-password", "login-modal-close-btn", "auth-links" ];
    ids.forEach(id => { const element = document.getElementById(id); if (element) DOM[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = element; });
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
function handleAddTypeChange() { /* ... (Função original sem alterações) ... */ }
function activateTab(tabElement) { /* ... (Função original sem alterações) ... */ }

// --- Handlers ---
function handleVehicleSelection(id) { /* ... (Função original sem alterações) ... */ }
async function handleAddFormSubmit(event) {
    event.preventDefault();
    if (!authToken) return showNotification("Você precisa estar logado para adicionar um veículo.", "warning");
    const vehicleData = { tipo: DOM.addVehicleType.value, modelo: DOM.addModelo.value.trim(), cor: DOM.addCor.value.trim(), imagem: DOM.addImagem.value.trim() || undefined };
    if (vehicleData.tipo === 'Caminhao') vehicleData.capacidadeCarga = DOM.addCapacidade.value;
    try {
        await fetchAPI('/veiculos', { method: 'POST', body: JSON.stringify(vehicleData) });
        await fetchAndRenderVehicles();
        showPanelContent('placeholder');
        DOM.addVehicleForm.reset();
        showNotification('Veículo adicionado com sucesso!', 'success');
    } catch (error) {}
}
async function handleUpdateQuickEdit() { /* ... (Função original sem alterações) ... */ }
async function handleDeleteVehicle() { /* ... (Função original sem alterações) ... */ }
async function handleMaintenanceSubmit(event, isFuture) { /* ... (Função original sem alterações) ... */ }

// --- Handlers de Autenticação ---
function showLoginModal() { hideModals(); DOM.modalBackdrop.classList.remove('hidden'); DOM.loginModal.classList.remove('hidden'); }
function showRegisterModal() { hideModals(); DOM.modalBackdrop.classList.remove('hidden'); DOM.registerModal.classList.remove('hidden'); }
function hideModals() {
    DOM.modalBackdrop.classList.add('hidden');
    if (DOM.registerModal) DOM.registerModal.classList.add('hidden');
    if (DOM.loginModal) DOM.loginModal.classList.add('hidden');
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const userData = { name: DOM.registerName.value.trim(), email: DOM.registerEmail.value.trim(), password: DOM.registerPassword.value.trim(), photo: DOM.registerPhoto.value.trim() || undefined };
    if (!userData.name || !userData.email || !userData.password) return showNotification("Nome, e-mail e senha são obrigatórios.", "error");
    try {
        await fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
        showNotification('Conta criada! Agora faça o login.', 'success');
        hideModals();
        DOM.registerForm.reset();
    } catch (error) {}
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const loginData = { email: DOM.loginEmail.value.trim(), password: DOM.loginPassword.value.trim() };
    if (!loginData.email || !loginData.password) return showNotification("E-mail e senha são obrigatórios.", "error");
    try {
        const data = await fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(loginData) });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
    } catch (error) {}
}

function onLoginSuccess(token, user) {
    authToken = token;
    currentUser = user;
    hideModals();
    if(DOM.loginForm) DOM.loginForm.reset();
    showNotification(`Bem-vindo de volta, ${user.name}!`, 'success');
    updateUIForAuthState(true);
    fetchAndRenderVehicles();
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    garage = [];
    currentlySelectedVehicle = null;
    showPanelContent('placeholder');
    renderVehicleList();
    updateUIForAuthState(false);
    showNotification('Você foi desconectado com segurança.', 'info');
}

function updateUIForAuthState(isLoggedIn) {
    if (isLoggedIn) {
        DOM.authLinks.innerHTML = `<span style="color: black; align-self: center; font-weight: 500;">Olá, ${currentUser.name}</span><button id="btn-logout" class="btn btn-danger">Sair</button>`;
        document.getElementById('btn-logout').addEventListener('click', handleLogout);
        DOM.vehicleList.innerHTML = '<li class="placeholder">Carregando sua garagem...</li>';
    } else {
        DOM.authLinks.innerHTML = `<button id="btn-show-login" class="btn btn-secondary">Login</button><button id="btn-show-register" class="btn btn-info">Registrar</button>`;
        document.getElementById('btn-show-login').addEventListener('click', showLoginModal);
        document.getElementById('btn-show-register').addEventListener('click', showRegisterModal);
        DOM.vehicleList.innerHTML = '<li class="placeholder">Faça login para ver seus veículos.</li>';
    }
}

function checkInitialAuthState() {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
        const user = JSON.parse(userString);
        onLoginSuccess(token, user);
    } else {
        updateUIForAuthState(false);
    }
}

// --- Funções de Interatividade e Clima ---
function setupInteractionListeners() { /* ... (Função original sem alterações) ... */ }
async function handleFetchWeather() { /* ... (Função original sem alterações) ... */ }

// --- Inicialização ---
function setupEventListeners() {
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
    
    // Listeners dos Modais
    DOM.modalBackdrop.addEventListener('click', hideModals);
    if (DOM.registerModalCloseBtn) DOM.registerModalCloseBtn.addEventListener('click', hideModals);
    if (DOM.loginModalCloseBtn) DOM.loginModalCloseBtn.addEventListener('click', hideModals);
    if (DOM.registerForm) DOM.registerForm.addEventListener('submit', handleRegisterSubmit);
    if (DOM.loginForm) DOM.loginForm.addEventListener('submit', handleLoginSubmit);

    setupInteractionListeners();
}

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado. Iniciando Garagem Inteligente PRO...");
    cacheDOMElements();
    setupEventListeners();
    checkInitialAuthState();
    console.log("✅ Aplicação pronta! O TESOURO É NOSSO!");
});