// ==========================================================================
//                 GARAGEM INTELIGENTE PRO - SCRIPT FINAL E LIMPO
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
        showNotification("Não foi possível conectar ao servidor. Verifique se ele está rodando.", "error");
        console.error("ERRO NA API:", error);
        throw error;
    }
}

async function initializeGarage() {
    try {
        const vehiclesData = await fetchAPI('/veiculos');
        garage = vehiclesData.map(data => {
            if (data.tipo === 'CarroEsportivo') return new CarroEsportivo(data);
            if (data.tipo === 'Caminhao') return new Caminhao(data);
            return new Veiculo(data);
        });
        renderVehicleList();
    } catch (error) {
        DOM.vehicleList.innerHTML = '<li class="placeholder">Falha ao carregar.</li>';
    }
}

// --- Funções de DOM ---
function cacheDOMElements() {
    const ids = ["vehicle-list","panel-placeholder","vehicle-details-view","add-vehicle-form-view","notification-area","add-vehicle-form","add-vehicle-type","add-modelo","add-cor","add-imagem","add-capacidade","btn-show-add-vehicle-form","btn-cancel-add-vehicle","detail-vehicle-img","detail-vehicle-name","quick-edit-model","quick-edit-color","quick-edit-image","btn-save-quick-edit","base-vehicle-details","tab-content-container","btn-delete-vehicle","maintenance-history-list","schedule-list","register-maint-form","schedule-maint-form","cidade-input","btn-buscar-previsao","previsao-tempo-resultado","detail-status","detail-speed","btn-toggle-engine","btn-accelerate","btn-brake","turbo-controls","btn-toggle-turbo","cargo-controls","detail-cargo","cargo-amount","btn-load-cargo","btn-unload-cargo"];
    ids.forEach(id => DOM[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = document.getElementById(id));
    DOM.addCapacidadeGroup = DOM.addVehicleForm.querySelector('.specific-field');
    DOM.tabNav = document.querySelector('.tab-nav');
}

function renderVehicleList() {
    DOM.vehicleList.innerHTML = garage.length === 0 ? '<li class="placeholder">Garagem vazia.</li>' : garage.map(v => `<li data-vehicle-id="${v.id}" class="${currentlySelectedVehicle?.id === v.id ? 'selected' : ''}" role="button"><img src="${v.imagem || 'placeholder.png'}" class="vehicle-list-img" onerror="this.src='placeholder.png'"> <span>${v.modelo}</span></li>`).join('');
    DOM.vehicleList.querySelectorAll('li[data-vehicle-id]').forEach(li => li.addEventListener('click', () => handleVehicleSelection(li.dataset.vehicleId)));
}

function displaySelectedVehicleDetails() {
    if (!currentlySelectedVehicle) return;
    const v = currentlySelectedVehicle;
    DOM.detailVehicleImg.src = v.imagem || 'placeholder.png';
    DOM.detailVehicleName.textContent = v.modelo;
    DOM.quickEditModel.value = v.modelo;
    DOM.quickEditColor.value = v.cor;
    DOM.quickEditImage.value = v.imagem || '';
    DOM.baseVehicleDetails.innerHTML = v.getDisplayInfo();
    renderMaintenanceLists();
    renderVehicleState();
}

function renderMaintenanceLists() {
    const v = currentlySelectedVehicle;
    if(!v) return;
    const past = (v.historicoManutencoes || []).filter(m => !m.isFuture());
    const future = (v.historicoManutencoes || []).filter(m => m.isFuture());
    const render = (list, placeholder) => list.length ? list.map(item =>`<li>${item.getDetalhesFormatados()}</li>`).join('') : `<li class="placeholder">${placeholder}</li>`;
    DOM.maintenanceHistoryList.innerHTML = render(past, 'Sem histórico.');
    DOM.scheduleList.innerHTML = render(future, 'Sem agendamentos.');
}

function showPanelContent(contentType) {
    [DOM.panelPlaceholder, DOM.vehicleDetailsView, DOM.addVehicleFormView].forEach(p => p.classList.add("hidden"));
    const panelToShow = contentType === 'details' ? DOM.vehicleDetailsView : contentType === 'addForm' ? DOM.addVehicleFormView : DOM.panelPlaceholder;
    panelToShow.classList.remove("hidden");
    if (contentType !== "details") { currentlySelectedVehicle = null; renderVehicleList(); }
}

function showNotification(message, type = "success", duration = 4000) {
    const el = document.createElement("div");
    el.className = `notification notification-${type}`;
    el.textContent = message;
    DOM.notificationArea.appendChild(el);
    setTimeout(() => el.remove(), duration);
}

// --- Handlers ---
function handleVehicleSelection(id) {
    const vehicle = garage.find(v => v.id === id);
    if (!vehicle) return;
    // Reset state for the newly selected vehicle
    vehicle.ligado = false;
    vehicle.velocidade = 0;
    currentlySelectedVehicle = vehicle;
    renderVehicleList();
    displaySelectedVehicleDetails();
    showPanelContent("details");
    activateTab(DOM.tabNav.querySelector('.tab-link'));
}

async function handleAddFormSubmit(event) {
    event.preventDefault();
    const data = {
        tipo: DOM.addVehicleType.value,
        modelo: DOM.addModelo.value.trim(),
        cor: DOM.addCor.value.trim(),
        imagem: DOM.addImagem.value.trim() || 'placeholder.png',
        ...(DOM.addVehicleType.value === 'Caminhao' && { capacidadeCarga: Number(DOM.addCapacidade.value) })
    };
    if (!data.tipo || !data.modelo || !data.cor) return showNotification("Preencha todos os campos.", "error");
    try {
        await fetchAPI('/veiculos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        showNotification('Veículo adicionado!', 'success');
        DOM.addVehicleForm.reset();
        showPanelContent('placeholder');
        await initializeGarage();
    } catch (e) {}
}

async function handleUpdateQuickEdit() {
    if (!currentlySelectedVehicle) return;
    const data = { modelo: DOM.quickEditModel.value.trim(), cor: DOM.quickEditColor.value.trim(), imagem: DOM.quickEditImage.value.trim() || 'placeholder.png' };
    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        await initializeGarage();
        currentlySelectedVehicle = garage.find(v => v.id === currentlySelectedVehicle.id);
        displaySelectedVehicleDetails();
        showNotification("Veículo atualizado!", "success");
    } catch (e) {}
}

async function handleDeleteVehicle() {
    if (!currentlySelectedVehicle || !confirm('Excluir?')) return;
    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}`, { method: 'DELETE' });
        showPanelContent('placeholder');
        await initializeGarage();
    } catch (e) {}
}

async function handleMaintenanceSubmit(event, isFuture) {
    event.preventDefault();
    if (!currentlySelectedVehicle) return;
    const form = event.target;
    const data = {
        data: new Date(form.querySelector('[type=date]').value + "T12:00:00"),
        tipo: form.querySelector('[type=text]').value.trim(),
        custo: isFuture ? 0 : parseFloat(form.querySelector('[type=number]').value)
    };
    try {
        await fetchAPI(`/veiculos/${currentlySelectedVehicle.id}/manutencoes`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)});
        await initializeGarage();
        currentlySelectedVehicle = garage.find(v => v.id === currentlySelectedVehicle.id);
        renderMaintenanceLists();
        form.reset();
        showNotification('Serviço salvo!', 'success');
    } catch (e) {}
}

function handleAddTypeChange() {
    DOM.addCapacidadeGroup.classList.toggle('hidden', DOM.addVehicleType.value !== 'Caminhao');
}

function activateTab(tabElement) {
    if (!tabElement) return;
    DOM.tabNav.querySelector('.active')?.classList.remove('active');
    tabElement.classList.add('active');
    const targetId = tabElement.dataset.target;
    DOM.tabContentContainer.querySelectorAll('.tab-content').forEach(tab => tab.classList.toggle('hidden', `#${tab.id}` !== targetId));
}

// --- Funções de Interatividade ---
function renderVehicleState() {
    if (!currentlySelectedVehicle) return;
    const v = currentlySelectedVehicle;
    DOM.detailStatus.textContent = v.ligado ? 'Ligado' : 'Desligado';
    DOM.detailSpeed.textContent = v.velocidade;
    DOM.btnToggleEngine.textContent = v.ligado ? 'Desligar' : 'Ligar';
    DOM.btnAccelerate.disabled = !v.ligado;
    DOM.btnBrake.disabled = !v.ligado || v.velocidade === 0;

    DOM.turboControls.classList.toggle('hidden', !(v instanceof CarroEsportivo));
    if (v instanceof CarroEsportivo) DOM.btnToggleTurbo.textContent = v.turboAtivado ? 'Desativar Turbo' : 'Ativar Turbo';
    
    DOM.cargoControls.classList.toggle('hidden', !(v instanceof Caminhao));
    if (v instanceof Caminhao) DOM.detailCargo.textContent = v.cargaAtual;
}

function setupInteractionListeners() {
    DOM.btnToggleEngine.addEventListener('click', () => { if (currentlySelectedVehicle) { currentlySelectedVehicle.ligado ? currentlySelectedVehicle.desligar() : currentlySelectedVehicle.ligar(); renderVehicleState(); } });
    DOM.btnAccelerate.addEventListener('click', () => { if (currentlySelectedVehicle) { currentlySelectedVehicle.acelerar(); renderVehicleState(); } });
    DOM.btnBrake.addEventListener('click', () => { if (currentlySelectedVehicle) { currentlySelectedVehicle.frear(); renderVehicleState(); } });
    DOM.btnToggleTurbo.addEventListener('click', () => { if (currentlySelectedVehicle instanceof CarroEsportivo) { currentlySelectedVehicle.toggleTurbo(); renderVehicleState(); } });
    DOM.btnLoadCargo.addEventListener('click', () => { if (currentlySelectedVehicle instanceof Caminhao) { const amount = parseInt(DOM.cargoAmount.value); if(!isNaN(amount)) currentlySelectedVehicle.carregar(amount); renderVehicleState(); DOM.cargoAmount.value = ''; } });
    DOM.btnUnloadCargo.addEventListener('click', () => { if (currentlySelectedVehicle instanceof Caminhao) { const amount = parseInt(DOM.cargoAmount.value); if(!isNaN(amount)) currentlySelectedVehicle.descarregar(amount); renderVehicleState(); DOM.cargoAmount.value = ''; } });
}

// --- Funções de Clima ---
function renderForecast(processedData, days) {
    DOM.previsaoTempoResultado.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'forecast-days-container';
    container.innerHTML = processedData.slice(0, days).map(day => `<div class="forecast-day-card" role="button"><h5>${new Date(day.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}</h5><img src="https://openweathermap.org/img/wn/${day.iconeRepresentativo}@2x.png" alt="${day.descricaoRepresentativa}"><div><span class="temp-max">${day.temp_max.toFixed(0)}°</span><span class="temp-min">${day.temp_min.toFixed(0)}°</span></div><div class="description hidden">${day.descricaoRepresentativa}</div></div>`).join('');
    DOM.previsaoTempoResultado.appendChild(container);
}

function toggleForecastDetails(card) {
    card.classList.toggle('expanded');
    card.querySelector('.description')?.classList.toggle('hidden');
}

async function handleFetchWeather() {
    const cidade = DOM.cidadeInput.value.trim();
    if (!cidade) return showNotification("Digite uma cidade.", "error");
    const resultArea = DOM.previsaoTempoResultado;
    const filterContainer = document.getElementById('weather-filter-buttons');
    resultArea.innerHTML = "<p>Buscando...</p>";
    if (filterContainer) filterContainer.innerHTML = '';
    try {
        const rawData = await fetchAPI(`/weather?city=${encodeURIComponent(cidade)}`);
        const processedData = processarDadosForecast(rawData);
        if (!processedData) throw new Error("Cidade não encontrada ou dados inválidos.");
        renderForecast(processedData, 5);
        const daysFilters = [{ label: 'Hoje', days: 1 }, { label: '3 Dias', days: 3 }, { label: '5 Dias', days: 5 }];
        daysFilters.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'btn btn-info'; button.textContent = filter.label; button.dataset.days = filter.days;
            if (filter.days === 5) button.classList.add('active');
            filterContainer.appendChild(button);
        });
        filterContainer.onclick = (e) => {
            if (e.target.matches('button')) {
                filterContainer.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
                renderForecast(processedData, Number(e.target.dataset.days));
            }
        };
    } catch (error) { resultArea.innerHTML = `<p style="color:var(--danger-color);">${error.message}</p>`; }
}

function processarDadosForecast(apiData) {
    if (!apiData || apiData.cod !== "200" || !apiData.list) return null;
    const p = {};
    apiData.list.forEach(i => {
        const d = i.dt_txt.split(' ')[0];
        if (!p[d]) p[d] = { data: d, temps: [], weathers: [] };
        p[d].temps.push(i.main.temp);
        p[d].weathers.push({ icon: i.weather[0].icon, description: i.weather[0].description });
    });
    return Object.values(p).map(d => {
        const r = d.weathers.find(w => w.icon.includes('d')) || d.weathers[0];
        return { data: d.data, temp_min: Math.min(...d.temps), temp_max: Math.max(...d.temps), iconeRepresentativo: r.icon, descricaoRepresentativa: r.description };
    }).slice(0, 5);
}

// --- Inicialização ---
function setupEventListeners() {
    DOM.btnShowAddVehicleForm.addEventListener("click", () => { DOM.addVehicleForm.reset(); handleAddTypeChange(); showPanelContent("addForm"); });
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
    DOM.previsaoTempoResultado.addEventListener('click', (e) => { const card = e.target.closest('.forecast-day-card'); if (card) toggleForecastDetails(card); });
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