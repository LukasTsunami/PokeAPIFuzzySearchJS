export class CacheManager {
  static obterDadosDoCache(chave) {
    const dadosEmCache = localStorage.getItem(chave);
    return dadosEmCache ? JSON.parse(dadosEmCache) : null;
  }

  static definirDadosNoCache(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }
}
