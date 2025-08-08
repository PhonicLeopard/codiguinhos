// ==========================================================================
//                 GARAGEM INTELIGENTE PRO - SCRIPT DEFINITIVO
//         (v5.0 - Full CRUD com Backend Node.js/Express/MongoDB)
// ==========================================================================

// --- Importações de Classes (para simulação de comportamento no frontend) ---
import Carro from "./Carro.js";
import CarroEsportivo from "./CarroEsportivo.js";
import Caminhao from "./Caminhao.js";

// --- Constantes e Variáveis de Estado ---
const backendUrl = "http://localhost:3001/api";
let garage = [];
let currentlySelectedVehicle = null;

// --- Cache de Elementos DOM ---
const DOM = {};

// ==========================================================================
//                      FUNÇÕES DE API (CRUD - Frontend)
// ==========================================================================

/** Busca todos os veículos do backend e renderiza a lista. */
async function fetchAndRenderVehicles() {
    try {
        const response = await fetch(`${backendUrl}/veiculos`);
        if (!response.ok) throw new Error(`Falha ao carregar veículos: ${response.statusText}`);
        
        const vehiclesData = await response.json();
        
        garage = vehiclesData.map(data => {
            data.id = data._id; // Mapeia o _id do MongoDB para o nosso id
            let vehicle;
            switch (data.tipo) {
                case "CarroEsportivo": vehicle = new CarroEsportivo(data.modelo, data.cor, data.imagem); break;
                case "Caminhao": vehicle = new Caminhao(data.modelo, data.cor, data.capacidadeCarga, data.imagem); break;
                default: vehicle = new Carro(data.modelo, data.cor, data.imagem); break;
            }
            Object.assign(vehicle, data);
            return vehicle;
        });

        renderVehicleList();
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        showNotification(error.message, "error");
    }
}

/** Envia um novo veículo para ser criado no backend. */
async function createVehicle(vehicleData) {
    try {
        const response = await fetch(`${backendUrl}/veiculos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData),
        });

        if (!response.ok) throw new Error((await response.json()).message || 'Erro ao salvar o veículo.');
        
        await fetchAndRenderVehicles();
        showNotification(`Veículo "${vehicleData.modelo}" adicionado!`, 'success');
        showPanelContent('placeholder');
        DOM.addVehicleForm.reset();
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// NOVO: Envia dados atualizados de um veículo para o backend.
async function updateVehicle(id, vehicleData) {
    try {
        const response = await fetch(`${backendUrl}/veiculos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData),
        });

        if (!response.ok) throw new Error((await response.json()).message || 'Erro ao atualizar o veículo.');
        
        await fetchAndRenderVehicles(); // Recarrega tudo para garantir consistência
        const updatedVehicle = garage.find(v => v.id === id);
        if (updatedVehicle) {
            currentlySelectedVehicle = updatedVehicle;
            displaySelectedVehicleDetails(); // Atualiza os detalhes do painel
        }
        showNotification(`Veículo "${vehicleData.modelo}" atualizado!`, 'success');
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// NOVO: Solicita a exclusão de um veículo no backend.
async function deleteVehicle(id) {
    if (!confirm(`Tem certeza que deseja excluir o veículo "${currentlySelectedVehicle.modelo}"?\nEsta ação é permanente!`)) {
        return;
    }
    try {
        const response = await fetch(`${backendUrl}/veiculos/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message || 'Erro ao deletar o veículo.');
        
        await fetchAndRenderVehicles();
        showPanelContent('placeholder');
        showNotification('Veículo excluído com sucesso.', 'info');
    } catch (error) {
        showNotification(error.message, "error");
    }
}

// ==========================================================================
//                      FUNÇÕES DE MANIPULAÇÃO DO DOM
// ==========================================================================
// (Funções como cacheDOMElements, showPanelContent, showNotification permanecem as mesmas)
function cacheDOMElements() {
    const ids = [ "vehicle-list", "panel-placeholder", "vehicle-details-view", "add-vehicle-form-view", "notification-area", "add-vehicle-form", "add-vehicle-type", "add-modelo", "add-cor", "add-imagem", "add-capacidade", "detail-vehicle-img", "detail-vehicle-name", "quick-edit-model", "quick-edit-color", "quick-edit-image", "base-vehicle-details", "btn-delete-vehicle", "btn-save-quick-edit", "btn-show-add-vehicle-form", "btn-cancel-add-vehicle", ];
    ids.forEach(id => DOM[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = document.getElementById(id));
    DOM.addCapacidadeGroup = DOM.addVehicleForm?.querySelector('.specific-field[data-type="Caminhao"]');
}
function showPanelContent(contentType) { [DOM.panelPlaceholder, DOM.vehicleDetailsView, DOM.addVehicleFormView].forEach(p => p?.classList.add("hidden")); let panelToShow = DOM.panelPlaceholder; if (contentType === 'details') panelToShow = DOM.vehicleDetailsView; if (contentType === 'addForm') panelToShow = DOM.addVehicleFormView; panelToShow?.classList.remove("hidden"); if (contentType !== "details") { deselectAllVehiclesInList(); currentlySelectedVehicle = null; } }
function showNotification(message, type = "info", duration = 4000) { const el = document.createElement("div"); el.className = `notification notification-${type}`; el.innerHTML = `<span>${message}</span><button class="close-btn">×</button>`; DOM.notificationArea.appendChild(el); const removeNotif = () => { if (el.parentNode) el.parentNode.removeChild(el); }; el.querySelector('.close-btn').addEventListener('click', removeNotif); setTimeout(removeNotif, duration); }
function deselectAllVehiclesInList() { DOM.vehicleList?.querySelectorAll("li.selected").forEach(li => li.classList.remove("selected")); }

// ALTERADO: A renderização agora se baseia no `v.id` (que é o `_id` do MongoDB)
function renderVehicleList() {
    if (!DOM.vehicleList) return;
    DOM.vehicleList.innerHTML = "";
    if (garage.length === 0) {
        DOM.vehicleList.innerHTML = '<li class="placeholder">Sua garagem está vazia.</li>';
        return;
    }
    garage.forEach(v => {
        const li = document.createElement("li");
        li.dataset.vehicleId = v.id; // Usa o ID do banco de dados
        li.setAttribute("role", "button");
        li.innerHTML = `<img src="${v.imagem || 'placeholder.png'}" alt="" class="vehicle-list-img"> <span>${v.modelo}</span>`;
        if (currentlySelectedVehicle && v.id === currentlySelectedVehicle.id) li.classList.add("selected");
        li.addEventListener("click", () => handleVehicleSelection(v.id));
        DOM.vehicleList.appendChild(li);
    });
}

function displaySelectedVehicleDetails() {
    if (!currentlySelectedVehicle) return;
    DOM.detailVehicleImg.src = currentlySelectedVehicle.imagem || 'placeholder.png';
    DOM.detailVehicleName.textContent = currentlySelectedVehicle.modelo;
    DOM.quickEditModel.value = currentlySelectedVehicle.modelo;
    DOM.quickEditColor.value = currentlySelectedVehicle.cor;
    DOM.quickEditImage.value = currentlySelectedVehicle.imagem === 'placeholder.png' ? '' : currentlySelectedVehicle.imagem;
    DOM.baseVehicleDetails.innerHTML = currentlySelectedVehicle.getDisplayInfo(); 
}

// ==========================================================================
//                  HANDLERS DE EVENTOS (AÇÕES DO USUÁRIO)
// ==========================================================================
// ALTERADO: A seleção agora encontra o veículo pelo ID no array local 'garage'
function handleVehicleSelection(id) {
    currentlySelectedVehicle = garage.find(v => v.id === id);
    if (!currentlySelectedVehicle) return;
    renderVehicleList(); // Re-renderiza para destacar a seleção
    displaySelectedVehicleDetails();
    showPanelContent("details");
}
function handleAddTypeChange() { const show = DOM.addVehicleType.value === 'Caminhao'; DOM.addCapacidadeGroup.classList.toggle('hidden', !show); DOM.addCapacidade.required = show; }
function handleAddFormSubmit(event) {
    event.preventDefault();
    const vehicleData = { tipo: DOM.addVehicleType.value, modelo: DOM.addModelo.value.trim(), cor: DOM.addCor.value.trim(), imagem: DOM.addImagem.value.trim() || 'placeholder.png' };
    if (!vehicleData.tipo || !vehicleData.modelo || !vehicleData.cor) return showNotification("Tipo, Modelo e Cor são obrigatórios.", "error");
    if (vehicleData.tipo === 'Caminhao') {
        const capacidade = Number(DOM.addCapacidade.value);
        if (isNaN(capacidade) || capacidade < 0) return showNotification("Capacidade do caminhão é inválida.", "error");
        vehicleData.capacidadeCarga = capacidade;
    }
    createVehicle(vehicleData);
}

// NOVO: Handler para o botão de salvar edições
function handleUpdateFormSubmit() {
    if (!currentlySelectedVehicle) return;
    const updatedData = {
        modelo: DOM.quickEditModel.value.trim(),
        cor: DOM.quickEditColor.value.trim(),
        imagem: DOM.quickEditImage.value.trim() || 'placeholder.png',
    };
    if (!updatedData.modelo || !updatedData.cor) return showNotification("Modelo e Cor não podem ser vazios.", "error");
    // Passamos o ID e os dados para a função de API
    updateVehicle(currentlySelectedVehicle.id, updatedData);
}

// NOVO: Handler para o botão de deletar
function handleDeleteButtonClick() {
    if (!currentlySelectedVehicle) return showNotification("Nenhum veículo selecionado para excluir.", "warning");
    deleteVehicle(currentlySelectedVehicle.id);
}

// ==========================================================================
//                         INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================================
function setupEventListeners() {
    DOM.btnShowAddVehicleForm.addEventListener("click", () => { DOM.addVehicleForm.reset(); handleAddTypeChange(); showPanelContent("addForm"); });
    DOM.btnCancelAddVehicle.addEventListener("click", () => showPanelContent("placeholder"));
    DOM.addVehicleType.addEventListener("change", handleAddTypeChange);
    DOM.addVehicleForm.addEventListener("submit", handleAddFormSubmit);
    // ALTERADO: Conectando os botões de Update e Delete aos seus handlers
    DOM.btnSaveQuickEdit.addEventListener("click", handleUpdateFormSubmit);
    DOM.btnDeleteVehicle.addEventListener("click", handleDeleteButtonClick);
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado. Iniciando Garagem Inteligente PRO...");
  cacheDOMElements();
  setupEventListeners();
  fetchAndRenderVehicles(); // Carrega os dados do backend ao iniciar
  showPanelContent("placeholder");
  console.log("✅ Aplicação pronta para uso!");
});