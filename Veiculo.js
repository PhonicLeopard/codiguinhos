// js/Veiculo.js
import Manutencao from './Manutencao.js'; // Necessário para type hints e métodos de manutenção

/**
 * @class Veiculo
 * @classdesc Classe base (abstrata conceitualmente) para todos os tipos de veículos na garagem.
 *              Define as propriedades e comportamentos fundamentais compartilhados por todos os veículos,
 *              como identificação (ID, modelo, cor, imagem), estado operacional (ligado/desligado)
 *              e o gerenciamento do histórico de manutenções e agendamentos.
 *              Esta classe é destinada a ser estendida por classes mais específicas (Carro, Caminhao, etc.).
 */
export default class Veiculo {
    /**
     * @property {string} id Identificador único e imutável para esta instância de veículo.
     *                      Gerado automaticamente no formato 'v_<timestamp>_<random_string>'.
     */
    id;
    /**
     * @property {string} modelo O nome ou descrição do modelo do veículo (ex: "Fusca", "Volvo FH").
     *                         É uma propriedade essencial e obrigatória.
     */
    modelo;
    /**
     * @property {string} cor A cor principal do veículo (ex: "Vermelho", "Prata Metálico").
     *                      É uma propriedade essencial e obrigatória.
     */
    cor;
    /**
     * @property {string} imagem URL (absoluta ou relativa) da imagem que representa o veículo.
     *                         Se uma URL inválida ou vazia for fornecida no construtor,
     *                         o valor padrão 'placeholder.png' será utilizado.
     */
    imagem;
    /**
     * @property {boolean} ligado Estado atual do motor do veículo. `true` se está ligado, `false` se desligado.
     *                        Inicializa como `false`.
     */
    ligado;
    /**
     * @property {Manutencao[]} historicoManutencoes Array que armazena todas as instâncias de `Manutencao`
     *                                             associadas a este veículo, tanto as passadas quanto as futuras.
     *                                             É mantido ordenado pela data (mais recente primeiro) após cada adição.
     *                                             Inicializa como um array vazio.
     */
    historicoManutencoes;

    /**
     * Construtor da classe base Veiculo. Responsável por inicializar as propriedades
     * comuns a todos os veículos e validar os dados essenciais.
     *
     * @param {string} modelo O modelo do veículo. Deve ser uma string não vazia.
     * @param {string} cor A cor do veículo. Deve ser uma string não vazia.
     * @param {string} [imagem='placeholder.png'] URL opcional para a imagem do veículo. Se omitido ou inválido, usa 'placeholder.png'.
     *
     * @throws {Error} Se `modelo` não for uma string ou estiver vazia após trim().
     * @throws {Error} Se `cor` não for uma string ou estiver vazia após trim().
     */
    constructor(modelo, cor, imagem = "placeholder.png") {
        if (typeof modelo !== "string" || modelo.trim() === "") {
            throw new Error("Modelo do veículo é obrigatório e não pode ser vazio.");
        }
        if (typeof cor !== "string" || cor.trim() === "") {
            throw new Error("Cor do veículo é obrigatória e não pode ser vazia.");
        }
        this.id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.imagem = typeof imagem === "string" && imagem.trim() !== "" ? imagem.trim() : "placeholder.png";
        this.ligado = false;
        this.historicoManutencoes = [];
    }

    /**
     * Tenta ligar o motor do veículo, alterando a propriedade `ligado` para `true`.
     * A ação só tem efeito se o veículo estiver desligado.
     *
     * @description Este método modifica diretamente o estado `ligado` do veículo.
     *              O feedback visual/sonoro é responsabilidade da camada de UI (função `interagir`).
     * @returns {boolean} Retorna `true` se o estado foi alterado (veículo foi ligado),
     *                    ou `false` se o veículo já estava ligado (nenhuma alteração ocorreu).
     */
    ligar() {
        if (this.ligado) {
            console.info(`Veiculo ${this.modelo}: Tentativa de ligar motor que já está ligado.`);
            return false;
        }
        this.ligado = true;
        console.log(`Veiculo ${this.modelo}: Motor ligado.`);
        return true;
    }

    /**
     * Tenta desligar o motor do veículo, alterando a propriedade `ligado` para `false`.
     * **Importante:** Esta implementação base **NÃO** verifica se o veículo está em movimento.
     * Subclasses como `Carro` **DEVEM** sobrescrever (`@override`) este método para adicionar
     * a verificação de `velocidade > 0` e impedir o desligamento se necessário.
     *
     * @description Modifica o estado `ligado`. A verificação de segurança crucial (movimento)
     *              é esperada na sobrescrita das subclasses. O feedback visual/sonoro
     *              (incluindo o aviso de não desligar em movimento) é responsabilidade da UI.
     * @returns {boolean} Retorna `true` se o estado foi alterado (veículo foi desligado),
     *                    `false` se já estava desligado. (Subclasses podem retornar `false` também se impedirem por velocidade).
     */
    desligar() {
        // Verificação de velocidade DEVE ser feita na subclasse que a implementa (Carro, etc.)
        const velocidadeAtual = this.velocidade ?? 0; // Tenta acessar velocidade, fallback para 0
        if (velocidadeAtual > 0) {
            // Este log indica que a lógica da *subclasse* deveria ter retornado false antes.
            // A UI (interagir) é quem deve mostrar a notificação ao usuário.
            console.warn(`Veiculo ${this.modelo}: Método desligar() base chamado com velocidade > 0. A subclasse deveria ter impedido.`);
             // Mesmo assim, retornamos false para consistência com a regra esperada.
            return false;
        }

        if (!this.ligado) {
            console.info(`Veiculo ${this.modelo}: Tentativa de desligar motor que já está desligado.`);
            return false;
        }
        this.ligado = false;
        console.log(`Veiculo ${this.modelo}: Motor desligado.`);
        return true;
    }

    /**
     * Simula a ação de usar a buzina do veículo. Não altera o estado interno do veículo.
     *
     * @description Apenas registra a ação no console. O som específico e a notificação
     *              visual são de responsabilidade da UI (função `tocarSomCorrespondente` e `showNotification`).
     * @returns {boolean} Retorna sempre `true`, indicando que a ação foi processada pela classe.
     */
    buzinar() {
        // A notificação e o som são tratados externamente pela função 'interagir' e 'tocarSomCorrespondente'
        console.log(`Veiculo ${this.modelo}: Acionou a buzina.`);
        return true; // Ação sempre "bem-sucedida" do ponto de vista da classe
    }

    /**
     * Gera uma representação HTML básica das informações do veículo.
     * Inclui ID, Modelo, Cor e o Status atual (Ligado/Desligado) com classes CSS apropriadas.
     * Este método é **destinado a ser sobrescrito (`@override`)** por subclasses
     * para incluir detalhes específicos daquele tipo de veículo (ex: KM, velocidade, carga, turbo).
     *
     * @description Usa `document.createElement` e `textContent` para uma sanitização básica
     *              e evitar XSS simples ao inserir modelo e cor no HTML.
     * @returns {string} Uma string HTML contendo os detalhes básicos formatados.
     */
    getDisplayInfo() {
        const statusClass = this.ligado ? "status-ligado" : "status-desligado";
        const statusText = this.ligado ? "Ligado" : "Desligado";
        const safeM = document.createElement("span"); safeM.textContent = this.modelo;
        const safeC = document.createElement("span"); safeC.textContent = this.cor;
        // Monta o HTML básico. Subclasses adicionarão mais itens.
        return (
            `<div class="info-item"><strong>ID:</strong> <span style="font-family: monospace; font-size: 0.9em;">${this.id}</span></div>` +
            `<div class="info-item"><strong>Modelo:</strong> ${safeM.innerHTML}</div>` + // Usa innerHTML do span seguro
            `<div class="info-item"><strong>Cor:</strong> ${safeC.innerHTML}</div>` + // Usa innerHTML do span seguro
            `<div class="info-item"><strong>Status:</strong> <span class="status ${statusClass}">${statusText}</span></div>`
        );
    }

    /**
     * Adiciona um novo registro de manutenção ou agendamento ao histórico do veículo.
     * Cria uma instância de `Manutencao` com os dados fornecidos (que valida os dados),
     * a adiciona ao array `historicoManutencoes` e reordena o array por data decrescente.
     *
     * @description Lida com a criação da instância `Manutencao` e atualização do array interno.
     *              O feedback ao usuário (sucesso/erro) e a persistência são tratados externamente.
     * @param {Date} data A data/hora em que o serviço ocorreu ou está agendado.
     * @param {string} tipo O tipo de serviço realizado/agendado.
     * @param {number} custo O custo do serviço (usar 0 para agendamentos).
     * @param {string} [descricao=''] Descrição ou observações adicionais (opcional).
     * @returns {boolean} Retorna `true` se o registro foi criado e adicionado com sucesso.
     *                    Retorna `false` se ocorreu um erro durante a criação da instância de `Manutencao`
     *                    (o erro será logado no console e a UI mostrará notificação de falha).
     */
    registrarManutencao(data, tipo, custo, descricao = "") {
        try {
            const nM = new Manutencao(data, tipo, custo, descricao); // Construtor valida
            if (!Array.isArray(this.historicoManutencoes)) {
                this.historicoManutencoes = [];
            }
            this.historicoManutencoes.push(nM);
            // Reordena: mais recentes primeiro
            this.historicoManutencoes.sort((a, b) => b.data.getTime() - a.data.getTime());
            console.log(`Veiculo ${this.modelo}: Registro [${nM.id}] tipo "${tipo}" adicionado.`);
            // playSound(soundMap.save); // Movido para 'interagir'
            return true;
        } catch (error) {
            // Erro provavelmente veio do construtor de Manutencao
            console.error(`Veiculo ${this.modelo}: Falha ao registrar manutenção - ${error.message}`);
            // showNotification(`Erro registrar: ${error.message}`, "error"); // Movido para 'interagir'
            // playSound(soundMap.error); // Movido para 'interagir'
            return false;
        }
    }

    /**
     * Filtra e retorna todas as manutenções do histórico que já ocorreram
     * (cuja data é menor ou igual à data/hora atual).
     * Os resultados são ordenados da mais recente para a mais antiga.
     *
     * @returns {Manutencao[]} Um array contendo as instâncias de `Manutencao` passadas,
     *                         ordenado decrescentemente por data. Pode retornar um array vazio.
     */
    getPastMaintenances() {
        const agora = new Date();
        return (this.historicoManutencoes || [])
            .filter((m) => m instanceof Manutencao && m.data <= agora)
            .sort((a, b) => b.data.getTime() - a.data.getTime());
    }

    /**
     * Filtra e retorna todos os serviços agendados que ocorrerão no futuro
     * (cuja data é maior que a data/hora atual).
     * Os resultados são ordenados do agendamento mais próximo para o mais distante.
     *
     * @returns {Manutencao[]} Um array contendo as instâncias de `Manutencao` futuras (agendamentos),
     *                         ordenado crescentemente por data. Pode retornar um array vazio.
     */
    getFutureMaintenances() {
        const agora = new Date();
        return (this.historicoManutencoes || [])
            .filter((m) => m instanceof Manutencao && m.data > agora)
            .sort((a, b) => a.data.getTime() - b.data.getTime());
    }

    /**
     * Atualiza as propriedades básicas (modelo, cor, imagem) do veículo.
     * Aplica trim() aos novos valores de string e usa 'placeholder.png' como fallback para a imagem.
     * Só altera a propriedade se o novo valor for diferente do atual e não for vazio/inválido.
     * Subclasses podem sobrescrever este método para incluir a atualização de propriedades adicionais.
     *
     * @description Modifica o estado do objeto. O feedback e a persistência são tratados externamente.
     * @param {string|null} newModel O novo modelo para o veículo. Se `null` ou string vazia/só espaços, o modelo atual é mantido.
     * @param {string|null} newColor A nova cor para o veículo. Se `null` ou string vazia/só espaços, a cor atual é mantida.
     * @param {string|null} newImage A nova URL da imagem. Se `null` ou string vazia/só espaços, o valor é revertido para 'placeholder.png'.
     * @returns {boolean} Retorna `true` se pelo menos uma das propriedades (modelo, cor ou imagem) foi efetivamente alterada.
     *                    Retorna `false` se nenhum dos novos valores resultou em uma mudança no estado do objeto (a UI pode usar isso para notificar "nenhuma alteração").
     */
    updateProperties(newModel, newColor, newImage) {
        let foiAlterado = false;
        const clM = newModel?.trim();
        if (clM && this.modelo !== clM) {
            this.modelo = clM; foiAlterado = true;
            console.log(`Veiculo ${this.id}: Modelo atualizado para "${this.modelo}"`);
        }
        const clC = newColor?.trim();
        if (clC && this.cor !== clC) {
            this.cor = clC; foiAlterado = true;
            console.log(`Veiculo ${this.id}: Cor atualizada para "${this.cor}"`);
        }
        const pI = typeof newImage === "string" && newImage.trim() !== "" ? newImage.trim() : "placeholder.png";
        if (this.imagem !== pI) {
            this.imagem = pI; foiAlterado = true;
            console.log(`Veiculo ${this.id}: Imagem atualizada para "${this.imagem}"`);
        }

        // if (!foiAlterado) {
        //     showNotification("Nenhuma alteração detectada.", "info"); // Movido para 'interagir'
        // } else {
        //     playSound(soundMap.save); // Movido para 'interagir'/'tocarSomCorrespondente'
        // }
        return foiAlterado; // Informa se houve mudança para a função 'interagir'
    }
}