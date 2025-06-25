// js/Manutencao.js
export default class Manutencao {
  id;
  data;
  tipo;
  custo;
  descricao;

  constructor(data, tipo, custo, descricao = "") {
    if (!(data instanceof Date) || isNaN(data.getTime())) throw new Error("Data inválida para Manutencao.");
    if (typeof tipo !== "string" || tipo.trim() === "") throw new Error("Tipo de manutenção inválido.");
    if (typeof custo !== "number" || isNaN(custo) || custo < 0) throw new Error("Custo de manutenção inválido.");
    
    this.id = `maint_${Date.now()}`;
    this.data = data;
    this.tipo = tipo.trim();
    this.custo = custo;
    this.descricao = descricao.trim();
  }

  getDetalhesFormatados() { /* ... Lógica existente ... */ }

  static fromPlainObject(obj) {
    if (!obj || !obj.data || !obj.tipo) return null;
    try {
        const m = new Manutencao(new Date(obj.data), obj.tipo, obj.custo, obj.descricao);
        m.id = obj.id;
        return m;
    } catch (e) {
        return null;
    }
  }
}