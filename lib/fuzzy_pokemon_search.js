import Fuse from 'fuse.js';
import { I18nTranslator } from './i18n_translator';

export class FuzzyPokemonSearch {
  constructor(dadosDePokemon, itensPorPagina = 10, chavesDeBusca = ['name', 'habitat', 'type'], precisaoDaBusca = 0.2) {
    this.tradutor = new I18nTranslator();
    this.dadosDePokemon = this.prepararDados(dadosDePokemon);
    this.itensPorPagina = itensPorPagina;
    this.chavesDeBusca = chavesDeBusca;
    this.precisaoDaBusca = precisaoDaBusca;
    this.fuse = new Fuse(this.dadosDePokemon, this.configurarOpcoesDeBusca());
    this.fuseType = new Fuse(this.dadosDePokemon, { keys: ['type'], threshold: this.precisaoDaBusca, ignoreLocation: true });
  }

  configurarOpcoesDeBusca() {
    return {
      keys: this.chavesDeBusca.filter(chave => chave !== 'type'),
      threshold: this.precisaoDaBusca,
      ignoreLocation: true,
    };
  }

  splitType(type) {
    return typeof type === 'string' ? type.split(',').map(t => t.trim()) : type;
  }

  prepararDados(dados) {
    return dados.map(item => ({
      ...item,
      habitat: this.tradutor.traduzir(item.habitat),
      type: Array.isArray(item.type) 
        ? item.type.map(t => this.tradutor.traduzir(t))
        : this.splitType(this.tradutor.traduzir(item.type)),
    }));
  }

  traduzirECorrigirCriterios(criterioDeBusca) {
    const criteriosCorrigidos = {};
    for (const [campo, termo] of Object.entries(criterioDeBusca)) {
      criteriosCorrigidos[campo] = this.tradutor.traduzir(termo);
    }
    return criteriosCorrigidos;
  }

  async buscar({ criterioDeBusca, usarClausulaANDParaBusca = false, pagina = 1 }) {
    const criteriosTraduzidos = this.traduzirECorrigirCriterios(criterioDeBusca);
  
    let resultados;
    if (usarClausulaANDParaBusca) {
      // Começamos com todos os dados e filtramos rigorosamente para cada critério
      resultados = this.dadosDePokemon.filter(item =>
        Object.entries(criteriosTraduzidos).every(([campo, valor]) => {
          const fuseBusca = campo === 'type' ? this.fuseType : this.fuse;
          const resultadoFuse = fuseBusca.search(valor).map(res => res.item);
          
          // Verifica se o item atual está entre os resultados para o critério específico
          return resultadoFuse.some(res => res.name === item.name);
        })
      );
    } else {
      const buscasIndividuais = Object.entries(criteriosTraduzidos).map(([campo, valor]) => {
        const fuseBusca = campo === 'type' ? this.fuseType : new Fuse(this.dadosDePokemon, { keys: [campo], threshold: this.precisaoDaBusca });
        return fuseBusca.search(valor).map(result => result.item);
      });
      resultados = [...new Set(buscasIndividuais.flat())];
    }
  
    return this.paginarResultados(resultados, pagina);
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
}
