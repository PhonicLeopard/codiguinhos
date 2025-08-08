import Manutencao from './Manutencao.js';

/**
 * Classe base para todos os veículos da garagem.
 */
export default class Veiculo {
    constructor(data) {
        // Inicializa o objeto com os dados recebidos da API
        Object.assign(this, data);
        this.id = data._id || data.id; // Garante que o ID do MongoDB seja usado
    }

    /**
     * Gera o HTML com as informações básicas do veículo.
     * @returns {string} String HTML.
     */
    getDisplayInfo() {
        return `
            <div class="info-item"><strong>Modelo:</strong> ${this.modelo}</div>
            <div class="info-item"><strong>Cor:</strong> ${this.cor}</div>
            <div class="info-item"><strong>Tipo:</strong> ${this.tipo}</div>
        `;
    }
  
    /**
     * Retorna uma lista de manutenções passadas, ordenada da mais recente para a mais antiga.
     * @returns {Manutencao[]}
     */
    getPastMaintenances() {
        return (this.historicoManutencoes || [])
            .filter(m => !m.isFuture())
            .sort((a, b) => b.data - a.data);
    }

    /**
     * Retorna uma lista de agendamentos futuros, ordenada do mais próximo para o mais distante.
     * @returns {Manutencao[]}
     */
    getFutureMaintenances() {
        return (this.historicoManutencoes || [])
            .filter(m => m.isFuture())
            .sort((a, b) => a.data - b.data);
    }
}