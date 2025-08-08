/**
 * Classe para representar um registro de manutenção, seja passado ou futuro (agendamento).
 */
export default class Manutencao {
    constructor(data, tipo, custo = 0) {
        if (!(data instanceof Date) || isNaN(data)) throw new Error("A data fornecida para o serviço é inválida.");
        if (!tipo || typeof tipo !== 'string' || tipo.trim() === '') throw new Error("A descrição do serviço é obrigatória.");
    
        this.id = `maint_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.data = data;
        this.tipo = tipo.trim();
        this.custo = custo;
    }
    
    /**
     * Verifica se a data da manutenção é no futuro.
     * @returns {boolean}
     */
    isFuture() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas o dia
        return this.data >= hoje;
    }

    /**
     * Formata os detalhes da manutenção para exibição em HTML.
     * @returns {string}
     */
    getDetalhesFormatados() {
        const dataFormatada = this.data.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        
        // Se for um agendamento futuro
        if (this.isFuture()) {
            return `<strong>${this.tipo}</strong> - <span>Agendado para: ${dataFormatada}</span>`;
        }
        
        // Se for um registro passado
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `<strong>${this.tipo}</strong> - <span>${dataFormatada}</span> - <strong style="color:var(--danger-color);">${custoFormatado}</strong>`;
    }

    /**
     * Cria uma instância de Manutencao a partir de um objeto simples (vindo da API/JSON).
     * @param {object} obj
     * @returns {Manutencao | null}
     */
    static fromPlainObject(obj) {
        if (!obj || !obj.data || !obj.tipo) return null;
        return new Manutencao(new Date(obj.data), obj.tipo, obj.custo);
    }
}