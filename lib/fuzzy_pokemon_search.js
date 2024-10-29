import Fuse from 'fuse.js';

export class FuzzyPokemonSearch {
  constructor(dadosDePokemon, itensPorPagina = 10, chavesDeBusca = ['name', 'habitat', 'type'], precisaoDaBusca = 0.2) {
    this.dadosDePokemon = dadosDePokemon;
    this.itensPorPagina = itensPorPagina;
    this.chavesDeBusca = chavesDeBusca;
    this.precisaoDaBusca = precisaoDaBusca;
    this.configuracaoDeBusca = this.configurarOpcoesDeBusca(); // Variável de configuração fixa para Fuse.js
  }

  // Configura opções para o Fuse.js e armazena a configuração
  configurarOpcoesDeBusca() {
    return { keys: this.chavesDeBusca, threshold: this.precisaoDaBusca };
  }

  realizarBuscasIndividuais(criterios) {
    return criterios.map(([chave, termo]) => {
      const mecanismoDeBusca = new Fuse(this.dadosDePokemon, { keys: [chave], threshold: this.precisaoDaBusca });
      return mecanismoDeBusca.search(termo).map(resultado => resultado.item);
    });
  }

  encontrarIntersecaoDeResultados(resultados) {
    return resultados.reduce((resultadosAcumulados, resultadosAtuais) =>
      resultadosAcumulados.filter(item =>
        resultadosAtuais.some(resultado => resultado.name === item.name)
      )
    );
  }

  filtrarResultadosUnicosPorNome(resultados) {
    const nomesUnicos = new Set();
    return resultados.filter(resultado => {
      if (nomesUnicos.has(resultado.name)) return false;
      nomesUnicos.add(resultado.name);
      return true;
    });
  }

  paginarResultados(resultados, pagina = 1) {
    const inicio = (pagina - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const total_count = resultados.length;
    const total_pages = Math.ceil(total_count / this.itensPorPagina);
    const itensNaPaginaAtual = resultados.slice(inicio, fim);

    return {
      data: itensNaPaginaAtual,
      meta: {
        current_page: pagina,
        total_pages: total_pages,
        total_count: total_count,
        items_in_current_page: itensNaPaginaAtual.length
      }
    };
  }

  async buscar({ criterioDeBusca, usarClausulaANDParaBusca = false, pagina = 1 }) {
    const criteriosAtivos = Object.entries(criterioDeBusca).filter(([, termo]) => termo);

    let resultados;

    if (usarClausulaANDParaBusca) {
      const resultadosPorCriterio = this.realizarBuscasIndividuais(criteriosAtivos);
      resultados = this.encontrarIntersecaoDeResultados(resultadosPorCriterio);
    } else {
      const resultadosPorCriterio = this.realizarBuscasIndividuais(criteriosAtivos);
      const resultadosCombinados = resultadosPorCriterio.flat();
      resultados = this.filtrarResultadosUnicosPorNome(resultadosCombinados);
    }

    return this.paginarResultados(resultados, pagina);
  }
}
