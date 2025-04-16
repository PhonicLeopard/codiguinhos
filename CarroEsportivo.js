// js/CarroEsportivo.js
import Carro from './Carro.js';

/**
 * @class CarroEsportivo
 * @extends Carro
 * @classdesc Representa um carro esportivo, uma especialização de `Carro`.
 *              Possui características aprimoradas como maior velocidade máxima,
 *              aceleração e frenagem mais potentes (valores padrão diferentes nos métodos)
 *              e a funcionalidade adicional de um "Turbo" que, quando ativo,
 *              aumenta ainda mais a aceleração.
 */
export default class CarroEsportivo extends Carro {
    /**
     * @property {boolean} turboAtivado Indica o estado atual do turbo.
     *                            `true` se o turbo está ativo, `false` caso contrário.
     *                            Inicializa como `false`.
     */
    turboAtivado;

    /**
     * Cria uma instância de CarroEsportivo.
     * Chama o construtor da classe pai (`Carro`) e define valores específicos
     * para `maxVelocidade` (mais alta) e inicializa `turboAtivado` como `false`.
     *
     * @param {string} modelo O modelo específico do carro esportivo (ex: "Ferrari", "Porsche 911").
     * @param {string} cor A cor do carro esportivo.
     * @param {string} [imagem='placeholder.png'] URL opcional da imagem do carro esportivo.
     */
    constructor(modelo, cor, imagem = 'placeholder.png') {
        super(modelo, cor, imagem);
        this.turboAtivado = false;
        this.maxVelocidade = 350;
    }

    /**
     * Tenta aumentar a velocidade do carro esportivo.
     * A aceleração é mais potente que a do `Carro` base (incremento padrão maior).
     * Se o `turboAtivado` for `true`, o incremento de velocidade é multiplicado
     * por um fator de boost (1.8 neste caso).
     * As mesmas restrições de estar ligado e abaixo da velocidade máxima se aplicam.
     *
     * @override Sobrescreve `Carro.acelerar` com lógica de boost e valor padrão diferente.
     * @description Atualiza `velocidade` considerando o turbo. Feedback externo.
     * @param {number} [incremento=25] O valor base (em km/h) a ser adicionado à velocidade. Padrão 25.
     * @returns {boolean} Retorna `true` se a velocidade foi aumentada, `false` se impedido.
     */
    acelerar(inc = 25) {
        const n = Number(inc);
        if (isNaN(n) || n <= 0) {
             console.warn(`CarroEsportivo ${this.modelo}: Incremento inválido ${inc}`);
             return false;
        }
        if (!this.ligado) {
             console.warn(`CarroEsportivo ${this.modelo}: Tentativa de acelerar desligado.`);
            // showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (this.velocidade >= this.maxVelocidade) {
             console.info(`CarroEsportivo ${this.modelo}: Velocidade máxima (${this.maxVelocidade}) atingida.`);
            // showNotification(`Velocidade máx (${this.maxVelocidade}) atingida.`, "info"); // REMOVIDO
            return false;
        }
        const b = this.turboAtivado ? n * 1.8 : n; // Aplica boost
        this.velocidade = Math.min(this.velocidade + b, this.maxVelocidade);
         console.log(`CarroEsportivo ${this.modelo} ${this.turboAtivado ? '(TURBO ON) ' : ''}acelerou para ${this.velocidade.toFixed(0)} km/h.`);
        return true;
    }

    /**
     * Tenta diminuir a velocidade do carro esportivo.
     * Utiliza uma força de frenagem maior que a do `Carro` base (decremento padrão maior),
     * simulando freios mais eficientes. A lógica de cálculo é delegada ao `super.frear`.
     *
     * @override Sobrescreve `Carro.frear` passando um valor padrão diferente para `super.frear`.
     * @description Delega para `super.frear` com maior poder de frenagem. Feedback externo.
     * @param {number} [decremento=20] O valor (em km/h) a ser subtraído da velocidade. Padrão 20.
     * @returns {boolean} Retorna `true` se a velocidade foi diminuída, `false` caso contrário.
     */
    frear(dec = 20) {
        // Reutiliza a lógica da classe pai, mas com valor padrão maior
        return super.frear(dec);
    }

    /**
     * Tenta ativar o modo turbo do carro esportivo.
     * Requer que o carro esteja ligado para que o turbo possa ser ativado.
     * Só tem efeito se o turbo já não estiver ativo.
     *
     * @description Atualiza `turboAtivado` para `true`. Feedback e persistência externos.
     * @returns {boolean} Retorna `true` se o turbo foi ativado com sucesso (estado mudou para `true`).
     *                    Retorna `false` se o carro estava desligado ou se o turbo já estava ativo.
     */
    ativarTurbo() {
        if (!this.ligado) {
            console.warn(`CarroEsportivo ${this.modelo}: Não pode ativar turbo desligado.`);
            // showNotification("Ligue para ativar o turbo!", "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false;
        }
        if (this.turboAtivado) {
             console.info(`CarroEsportivo ${this.modelo}: Turbo já está ON.`);
            // showNotification("Turbo já ON.", "info"); // REMOVIDO
            return false;
        }
        this.turboAtivado = true;
        console.log(`🚀 CarroEsportivo ${this.modelo}: Turbo ATIVADO!`);
        // showNotification("🚀 Turbo ATIVADO!", "success", 2500); // REMOVIDO
        return true; // Estado alterado
    }

    /**
     * Tenta desativar o modo turbo do carro esportivo.
     * Só tem efeito se o turbo estiver atualmente ativo.
     *
     * @description Atualiza `turboAtivado` para `false`. Feedback e persistência externos.
     * @returns {boolean} Retorna `true` se o turbo foi desativado com sucesso (estado mudou para `false`).
     *                    Retorna `false` se o turbo já estava desativado.
     */
    desativarTurbo() {
        if (!this.turboAtivado) {
            console.info(`CarroEsportivo ${this.modelo}: Turbo já está OFF.`);
            // showNotification("Turbo já OFF.", "info"); // REMOVIDO
            return false;
        }
        this.turboAtivado = false;
        console.log(`CarroEsportivo ${this.modelo}: Turbo desativado.`);
        // showNotification("Turbo desativado.", "info"); // REMOVIDO
        return true; // Estado alterado
    }

    /**
     * Gera uma representação HTML das informações do carro esportivo.
     * Inclui todos os detalhes de `Carro` (obtidos via `super.getDisplayInfo()`)
     * e adiciona uma linha mostrando o estado atual do Turbo (Ativado ou Desativado),
     * com um destaque visual quando está ativo.
     *
     * @override Sobrescreve `Carro.getDisplayInfo` para adicionar o status do Turbo.
     * @returns {string} Uma string HTML formatada com os detalhes completos do carro esportivo.
     */
    getDisplayInfo() {
        let bI = super.getDisplayInfo(); // Pega HTML de Carro (que inclui Veiculo)
        const tS = this.turboAtivado
            ? '<span style="color: var(--accent-color, green); font-weight: bold; animation: pulse 1s infinite;">ATIVADO 🔥</span>'
            : "Desativado";
        bI += `<div class="info-item"><strong>Turbo:</strong> ${tS}</div>`; // Adiciona status do Turbo
        return bI;
    }
}