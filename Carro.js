import Veiculo from './Veiculo.js';

/**
 * Representa um Carro comum, herdando de Veiculo.
 */
export default class Carro extends Veiculo {
    constructor(data) {
        super(data);
        this.quilometragem = data.quilometragem || 0;
    }

    getDisplayInfo() {
        let baseInfo = super.getDisplayInfo();
        baseInfo += `<div class="info-item"><strong>Quilometragem:</strong> ${this.quilometragem.toLocaleString("pt-BR")} km</div>`;
        return baseInfo;
    }
}