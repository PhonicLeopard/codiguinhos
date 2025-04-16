// js/Carro.js
import Veiculo from './Veiculo.js';

/**
 * @class Carro
 * @extends Veiculo
 * @classdesc Representa um carro comum na garagem. Herda as propriedades e métodos
 *              básicos de `Veiculo` e adiciona características específicas de carros,
 *              como controle de velocidade, quilometragem, e métodos para acelerar,
 *              frear e simular rodagem. Sobrescreve `getDisplayInfo` e `desligar`
 *              para incluir detalhes e regras específicas do carro.
 */
export default class Carro extends Veiculo {
    /**
     * @property {number} velocidade A velocidade atual do carro em km/h. Inicializa em 0.
     *                            Modificada pelos métodos `acelerar` e `frear`.
     */
    velocidade;
    /**
     * @property {number} maxVelocidade A velocidade máxima que este carro pode atingir em km/h.
     *                             Usada como limite superior no método `acelerar`. Padrão: 180.
     */
    maxVelocidade;
    /**
     * @property {number} quilometragem O total de quilômetros registrados como rodados por este carro.
     *                              Incrementada pelo método `rodar`. Inicializa em 0.
     */
    quilometragem;

    /**
     * Cria uma instância de Carro.
     * Chama o construtor da classe pai (`Veiculo`) para inicializar as propriedades comuns
     * e depois define os valores iniciais para as propriedades específicas do carro (`velocidade`, `maxVelocidade`, `quilometragem`).
     *
     * @param {string} modelo O modelo específico do carro (ex: "Gol", "Civic"). Herdado de Veiculo.
     * @param {string} cor A cor do carro. Herdado de Veiculo.
     * @param {string} [imagem='placeholder.png'] URL opcional da imagem do carro. Herdado de Veiculo.
     */
    constructor(modelo, cor, imagem = 'placeholder.png') {
        super(modelo, cor, imagem); // Inicializa a parte Veiculo
        this.velocidade = 0;
        this.maxVelocidade = 180;
        this.quilometragem = 0;
    }

    /**
     * Tenta aumentar a velocidade atual do carro.
     * A ação só é executada se o carro estiver ligado (`this.ligado === true`)
     * e se a velocidade atual for menor que a `maxVelocidade`.
     * A nova velocidade é limitada pela `maxVelocidade`.
     *
     * @description Atualiza o estado `velocidade` do carro. O feedback visual/sonoro
     *              e a notificação de falha são tratados externamente (pela função `interagir`).
     * @param {number} [incremento=10] O valor (em km/h) a ser adicionado à velocidade.
     *                                 Deve ser um número positivo. Padrão é 10.
     * @returns {boolean} Retorna `true` se a velocidade foi aumentada com sucesso.
     *                    Retorna `false` se o carro estava desligado, já na velocidade máxima,
     *                    ou se o `incremento` fornecido era inválido.
     */
    acelerar(inc = 10) {
        const n = Number(inc);
        if (isNaN(n) || n <= 0) {
             console.warn(`Carro ${this.modelo}: Incremento inválido para acelerar: ${inc}`);
             return false; // Falha de validação
        }
        if (!this.ligado) {
            console.warn(`Carro ${this.modelo}: Tentativa de acelerar desligado.`);
            // showNotification(`Ligue ${this.modelo} p/ acelerar.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false; // Falha de pré-condição
        }
        if (this.velocidade >= this.maxVelocidade) {
            console.info(`Carro ${this.modelo}: Velocidade máxima (${this.maxVelocidade} km/h) já atingida.`);
            // showNotification(`Velocidade máx (${this.maxVelocidade}) atingida.`, "info"); // REMOVIDO
            return false; // Falha de condição
        }
        this.velocidade = Math.min(this.velocidade + n, this.maxVelocidade);
        console.log(`Carro ${this.modelo}: Acelerou para ${this.velocidade.toFixed(0)} km/h.`);
        return true; // Sucesso
    }

    /**
     * Tenta diminuir a velocidade atual do carro.
     * A ação só tem efeito se o carro estiver em movimento (`this.velocidade > 0`).
     * A nova velocidade nunca será menor que 0.
     *
     * @description Atualiza o estado `velocidade`. Feedback externo.
     * @param {number} [decremento=10] O valor (em km/h) a ser subtraído da velocidade.
     *                                 Deve ser um número positivo. Padrão é 10.
     * @returns {boolean} Retorna `true` se a velocidade foi diminuída com sucesso.
     *                    Retorna `false` se o carro já estava parado ou se o `decremento` era inválido.
     */
    frear(dec = 10) {
        const n = Number(dec);
        if (isNaN(n) || n <= 0) {
             console.warn(`Carro ${this.modelo}: Decremento inválido para frear: ${dec}`);
            return false; // Falha de validação
        }
        // Validação de estado: só freia se estiver em movimento.
        // Retorna false silenciosamente se já estiver parado (comportamento esperado).
        if (this.velocidade === 0) {
             console.info(`Carro ${this.modelo}: Já está parado, não freou.`);
             return false;
        }
        this.velocidade = Math.max(0, this.velocidade - n);
        console.log(`Carro ${this.modelo}: Freou para ${this.velocidade.toFixed(0)} km/h.`);
        return true; // Sucesso
    }

    /**
     * Simula o carro percorrendo uma distância especificada, atualizando a quilometragem total.
     * Requer que o carro esteja ligado para poder rodar.
     *
     * @description Atualiza o estado `quilometragem`. Feedback e persistência externos.
     * @param {number} distancia A distância (em km) a ser adicionada à quilometragem.
     *                           Deve ser um número positivo.
     * @returns {boolean} Retorna `true` se a quilometragem foi atualizada com sucesso.
     *                    Retorna `false` se o carro estava desligado ou se a `distancia` era inválida.
     */
    rodar(distancia) {
        const dist = Number(distancia);
        if (isNaN(dist) || dist <= 0) {
            console.warn(`Carro ${this.modelo}: Distância inválida para rodar: ${distancia}`);
            // showNotification("Distância inválida (> 0).", "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false; // Falha de validação
        }
        if (!this.ligado) {
             console.warn(`Carro ${this.modelo}: Tentativa de rodar desligado.`);
            // showNotification(`${this.modelo} precisa estar ligado.`, "warning"); // REMOVIDO
            // playSound(soundMap.error); // REMOVIDO
            return false; // Falha de pré-condição
        }
        this.quilometragem += dist;
        console.log(`Carro ${this.modelo}: Rodou ${dist.toFixed(0)} km. Quilometragem total: ${this.quilometragem.toFixed(0)} km.`);
        // showNotification(`${this.modelo} rodou ${dist} km. Total: ${this.quilometragem.toFixed(0)} km.`, "info", 3000); // REMOVIDO
        return true; // Sucesso
    }

    /**
     * Gera uma representação HTML mais detalhada das informações do carro,
     * incluindo os dados básicos de `Veiculo` e adicionando a Quilometragem
     * e uma barra visual indicando a Velocidade atual em relação à máxima.
     * Chama `super.getDisplayInfo()` para obter a base HTML da classe pai.
     *
     * @override Sobrescreve o método `getDisplayInfo` de `Veiculo`.
     * @returns {string} Uma string HTML formatada com os detalhes completos do carro.
     */
    getDisplayInfo() {
        let bI = super.getDisplayInfo(); // Pega HTML base (ID, Modelo, Cor, Status)
        bI += `<div class="info-item"><strong>KM Rodados:</strong> ${this.quilometragem.toFixed(0)}</div>`; // Adiciona KM
        // Adiciona barra de velocidade
        if (typeof this.maxVelocidade === "number" && this.maxVelocidade > 0) {
            const sP = Math.max(0, Math.min(100, (this.velocidade / this.maxVelocidade) * 100));
            bI += `<div class="speed-bar-container"><div class="speed-bar-label">Velocidade (${this.velocidade.toFixed(0)} / ${this.maxVelocidade} km/h):</div><div class="speed-bar"><div class="speed-bar-fill" style="width: ${sP.toFixed(2)}%;"></div></div></div>`;
        } else {
            // Fallback se maxVelocidade for inválida
            bI += `<div class="info-item"><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h</div>`;
        }
        return bI;
    }

     /**
      * Tenta desligar o motor do carro, adicionando uma verificação de segurança:
      * o carro só pode ser desligado se a sua velocidade atual for 0.
      * Se estiver em movimento, a ação é impedida. Caso contrário, delega a ação
      * para o método `desligar` da classe pai (`Veiculo`).
      *
      * @override Sobrescreve o método `desligar` de `Veiculo` para adicionar a regra de velocidade.
      * @description Impede o desligamento se velocidade > 0. Feedback de erro tratado externamente.
      * @returns {boolean} Retorna `true` se o carro foi desligado com sucesso (estava ligado e parado).
      *                    Retorna `false` se o carro estava em movimento ou já desligado.
      */
     desligar() {
         if (this.velocidade > 0) {
             console.warn(`Carro ${this.modelo}: Tentativa de desligar em movimento bloqueada (Velocidade: ${this.velocidade.toFixed(0)} km/h).`);
             // A notificação de erro é responsabilidade da função 'interagir'
             return false;
         }
         // Se velocidade é 0, chama a implementação da classe pai
         return super.desligar();
     }
}