// js/Caminhao.js
import Carro from './Carro.js';

/**
 * @class Caminhao
 * @extends Carro
 * @classdesc Representa um caminhão, uma especialização de `Carro`.
 *              Possui propriedades adicionais para gerenciar carga (`capacidadeCarga`, `cargaAtual`).
 *              Aceleração e frenagem são modificadas para serem influenciadas pelo peso da carga atual.
 *              Possui métodos específicos para `carregar` e `descarregar` peso.
 *              Normalmente tem uma `maxVelocidade` menor que a de um carro.
 */
export default class Caminhao extends Carro {
    /**
     * @property {number} capacidadeCarga A capacidade máxima de carga, em quilogramas (kg),
     *                              que este caminhão pode transportar. Definido no construtor.
     */
    capacidadeCarga;
    /**
     * @property {number} cargaAtual O peso atual da carga, em quilogramas (kg),
     *                         que o caminhão está transportando no momento.
     *                         Não pode exceder `capacidadeCarga`. Inicializa em 0.
     */
    cargaAtual;

    /**
     * Cria uma instância de Caminhao.
     * Chama o construtor da classe pai (`Carro`), define uma `maxVelocidade` padrão mais baixa,
     * e inicializa as propriedades `capacidadeCarga` (validando para ser não negativa) e `cargaAtual`.
     *
     * @param {string} modelo O modelo específico do caminhão (ex: "Scania R450", "Mercedes Actros").
     * @param {string} cor A cor do caminhão.
     * @param {number} [capacidadeCarga=5000] A capacidade máxima de carga em kg. Padrão 5000. Será ajustado para 0 se um valor negativo for fornecido.
     * @param {string} [imagem='placeholder.png'] URL opcional da imagem do caminhão.
     */
    constructor(modelo, cor, capacidadeCarga = 5000, imagem = 'placeholder.png') {
        super(modelo, cor, imagem);
        this.capacidadeCarga = Math.max(0, Number(capacidadeCarga) || 0); // Garante não negativo
        this.cargaAtual = 0;
        this.maxVelocidade = 120; // Velocidade padrão mais baixa
    }

    /**
     * Tenta aumentar a velocidade do caminhão, considerando a influência da carga.
     * A força de aceleração (incremento efetivo) é reduzida à medida que a carga aumenta.
     * Um fator de carga é calculado (variando de ~0.3 a 1.0) e multiplica o incremento base.
     * Usa um incremento base padrão menor que o do carro.
     *
     * @override Sobrescreve `Carro.acelerar` com lógica de fator de carga e valor padrão diferente.
     * @description Atualiza `velocidade` considerando a carga. Feedback externo.
     * @param {number} [incremento=8] O valor base (em km/h) a ser adicionado à velocidade. Padrão 8.
     * @returns {boolean} Retorna `true` se a velocidade foi aumentada, `false` se impedido.
     */
    acelerar(inc = 8) {
        const n = Number(inc);
        if (isNaN(n) || n <= 0) {
            console.warn(`Caminhao ${this.modelo}: Incremento inválido ${inc}`);
            return false;
        }
        if (!this.ligado) {
             console.warn(`Caminhao ${this.modelo}: Tentativa de acelerar desligado.`);
            // showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (this.velocidade >= this.maxVelocidade) {
            console.info(`Caminhao ${this.modelo}: Velocidade máxima (${this.maxVelocidade}) atingida.`);
            // showNotification(`Velocidade máx (${this.maxVelocidade}) atingida.`, "info"); // REMOVIDO
            return false;
        }
        // Calcula fator de carga
        const f = this.capacidadeCarga > 0 ? Math.max(0.3, 1 - this.cargaAtual / (this.capacidadeCarga * 1.5)) : 1;
        this.velocidade = Math.min(this.velocidade + n * f, this.maxVelocidade);
        console.log(`Caminhao ${this.modelo} (Carga: ${this.cargaAtual}kg) acelerou para ${this.velocidade.toFixed(0)} km/h (Fator: ${f.toFixed(2)}).`);
        return true;
    }

    /**
     * Tenta diminuir a velocidade do caminhão, considerando a influência da carga.
     * A força de frenagem (decremento efetivo) é reduzida à medida que a carga aumenta (simulando maior inércia).
     * Um fator de carga é calculado (variando de ~0.4 a 1.0) e multiplica o decremento base.
     * Usa um decremento base padrão menor.
     *
     * @override Sobrescreve `Carro.frear` com lógica de fator de carga e valor padrão diferente.
     * @description Atualiza `velocidade` considerando a carga. Feedback externo.
     * @param {number} [decremento=8] O valor base (em km/h) a ser subtraído da velocidade. Padrão 8.
     * @returns {boolean} Retorna `true` se a velocidade foi diminuída, `false` caso contrário.
     */
    frear(dec = 8) {
        const n = Number(dec);
        if (isNaN(n) || n <= 0) {
             console.warn(`Caminhao ${this.modelo}: Decremento inválido ${dec}`);
             return false;
        }
        // Não precisa de feedback se já parado, apenas retorna false.
        if (this.velocidade === 0) {
             console.info(`Caminhao ${this.modelo}: Já está parado.`);
             return false;
        }
        // Calcula fator de carga para frenagem
        const f = this.capacidadeCarga > 0 ? Math.max(0.4, 1 - this.cargaAtual / (this.capacidadeCarga * 2)) : 1;
        this.velocidade = Math.max(0, this.velocidade - n * f);
        console.log(`Caminhao ${this.modelo} (Carga: ${this.cargaAtual}kg) freou para ${this.velocidade.toFixed(0)} km/h (Fator: ${f.toFixed(2)}).`);
        return true;
    }

    /**
     * Tenta adicionar uma quantidade de peso à carga atual do caminhão.
     * Realiza validações para garantir que o peso é positivo, que o caminhão
     * tem capacidade de carga, e que a nova carga não excederá a capacidade máxima.
     *
     * @description Atualiza `cargaAtual`. Feedback e persistência externos.
     * @param {number} peso O peso (em kg) a ser adicionado à carga. Deve ser um número positivo.
     * @returns {boolean} Retorna `true` se a carga foi adicionada com sucesso.
     *                    Retorna `false` se o peso for inválido, se o caminhão não tiver capacidade,
     *                    ou se adicionar o peso exceder a `capacidadeCarga`.
     */
    carregar(peso) {
        const p = Number(peso);
        if (isNaN(p) || p <= 0) {
            console.warn(`Caminhao ${this.modelo}: Peso inválido para carregar: ${peso}`);
            // showNotification("Peso inválido (> 0).", "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (this.capacidadeCarga <= 0) {
            console.warn(`Caminhao ${this.modelo}: Não pode carregar (capacidade <= 0).`);
            // showNotification(`${this.modelo} não pode carregar.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (this.cargaAtual + p > this.capacidadeCarga) {
            const disp = this.capacidadeCarga - this.cargaAtual;
            console.warn(`Caminhao ${this.modelo}: Carga excedida ao tentar carregar ${p}kg. Disponível: ${disp}kg.`);
            // showNotification(`Carga excedida! Máx: ${this.capacidadeCarga}kg. Disp: ${disp}kg.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        this.cargaAtual += p;
        console.log(`📦 Caminhao ${this.modelo}: Carregou +${p}kg. Total: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);
        // showNotification(`📦 +${p}kg carregados. Total: ${this.cargaAtual}kg.`, "success", 3000); // REMOVIDO
        return true;
    }

    /**
     * Tenta remover uma quantidade de peso da carga atual do caminhão.
     * Realiza validações para garantir que o peso é positivo e que
     * há carga suficiente para remover a quantidade solicitada.
     *
     * @description Atualiza `cargaAtual`. Feedback e persistência externos.
     * @param {number} peso O peso (em kg) a ser removido da carga. Deve ser um número positivo.
     * @returns {boolean} Retorna `true` se a carga foi removida com sucesso.
     *                    Retorna `false` se o peso for inválido ou se tentar remover mais peso do que a `cargaAtual`.
     */
    descarregar(peso) {
        const p = Number(peso);
        if (isNaN(p) || p <= 0) {
            console.warn(`Caminhao ${this.modelo}: Peso inválido para descarregar: ${peso}`);
            // showNotification("Peso inválido (> 0).", "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (p > this.cargaAtual) {
            console.warn(`Caminhao ${this.modelo}: Tentativa de descarregar ${p}kg, mas só tem ${this.cargaAtual}kg.`);
            // showNotification(`Carga insuficiente (${this.cargaAtual}kg).`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        this.cargaAtual -= p;
        console.log(`📦 Caminhao ${this.modelo}: Descarregou -${p}kg. Restante: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);
        // showNotification(`📦 -${p}kg descarregados. Restante: ${this.cargaAtual}kg.`, "success", 3000); // REMOVIDO
        return true;
    }

    /**
     * Atualiza as propriedades do caminhão, incluindo a capacidade de carga.
     * Se a capacidade for alterada, ajusta a carga atual para não excedê-la.
     * Delega a atualização das propriedades base (modelo, cor, imagem) para `super.updateProperties`.
     *
     * @override Sobrescreve `Veiculo.updateProperties` para adicionar o parâmetro `novaCapacidade`.
     * @description Modifica o estado. Feedback e persistência externos.
     * @param {string|null} nM O novo modelo.
     * @param {string|null} nC A nova cor.
     * @param {string|null} nI A nova URL da imagem.
     * @param {number|null} [nCap=null] A nova capacidade de carga em kg. Se `null` ou inválido, mantém a capacidade atual.
     * @returns {boolean} Retorna `true` se alguma propriedade (incluindo capacidade) foi alterada, `false` caso contrário.
     */
    updateProperties(nM, nC, nI, nCap = null) {
        const baseAlterada = super.updateProperties(nM, nC, nI); // Atualiza modelo, cor, imagem
        let capacidadeAlterada = false;

        // Verifica e atualiza a capacidade de carga se um valor válido foi fornecido
        if (nCap !== null && !isNaN(Number(nCap))) {
            const numC = Math.max(0, Number(nCap)); // Garante não negativo
            if (this.capacidadeCarga !== numC) {
                 console.log(`Caminhao ${this.modelo}: Capacidade alterada de ${this.capacidadeCarga}kg para ${numC}kg.`);
                this.capacidadeCarga = numC;
                // Ajusta carga atual se exceder a nova capacidade
                if (this.cargaAtual > this.capacidadeCarga) {
                    console.warn(`Caminhao ${this.modelo}: Carga atual (${this.cargaAtual}kg) ajustada para nova capacidade (${this.capacidadeCarga}kg).`);
                    this.cargaAtual = this.capacidadeCarga;
                }
                capacidadeAlterada = true;
            }
        }

        // O som de salvar só toca se algo realmente mudou (base OU capacidade)
        // if (baseAlterada || capacidadeAlterada) {
        //     playSound(soundMap.save); // Movido para 'interagir'
        // }
        return baseAlterada || capacidadeAlterada; // Informa se houve qualquer alteração
    }

    /**
     * Gera uma representação HTML das informações do caminhão.
     * Inclui todos os detalhes de `Carro` (via `super.getDisplayInfo()`) e adiciona
     * linhas mostrando a Capacidade de Carga total e a Carga Atual, incluindo
     * o percentual de ocupação da capacidade.
     *
     * @override Sobrescreve `Carro.getDisplayInfo` para adicionar informações de carga.
     * @returns {string} Uma string HTML formatada com os detalhes completos do caminhão.
     */
    getDisplayInfo() {
        let bI = super.getDisplayInfo(); // Pega HTML de Carro (ID, Modelo, Cor, Status, KM, Velocidade)
        const cP = this.capacidadeCarga > 0 ? ((this.cargaAtual / this.capacidadeCarga) * 100).toFixed(1) : 0; // Calcula %
        // Adiciona informações de carga
        bI += `<div class="info-item"><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString("pt-BR")} kg</div>`;
        bI += `<div class="info-item"><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString("pt-BR")} kg (${cP}%)</div>`;
        return bI;
    }
}