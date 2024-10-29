import axios from 'axios';
import Fuse from 'fuse.js';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay, // Aumenta o tempo entre tentativas exponencialmente
  retryCondition: (error) => {
    return error.code === 'ETIMEDOUT' || error.response?.status === 429; // Re-tenta no caso de timeout ou erro 429
  }
});

export class CacheManager {
  static obterDadosDoCache(chave) {
    const dadosEmCache = localStorage.getItem(chave);
    return dadosEmCache ? JSON.parse(dadosEmCache) : null;
  }

  static definirDadosNoCache(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }
}

export class PokemonDataFetcher {
  static async buscarDados(url, chaveDoCache) {
    const dadosEmCache = CacheManager.obterDadosDoCache(chaveDoCache);
    if (dadosEmCache) return dadosEmCache;

    try {
      const resposta = await axios.get(url);
      const dados = resposta.data.results;
      CacheManager.definirDadosNoCache(chaveDoCache, dados);
      return dados;
    } catch (erro) {
      console.error(`Erro ao buscar dados de ${chaveDoCache}:`, erro);
      return [];
    }
  }

  static async obterListaDePokemon() {
    return await this.buscarDados('https://pokeapi.co/api/v2/pokemon?limit=1302', 'pokemonListCache');
  }

  static async obterMapaDePokemonPorHabitat() {
    const habitatsDePokemon = await this.buscarDados('https://pokeapi.co/api/v2/pokemon-habitat/', 'pokemonHabitatListCache');
    const urlsDeHabitatsDePokemon = habitatsDePokemon.map(habitat => habitat.url);

    try {
      const respostasDeHabitats = await Promise.all(urlsDeHabitatsDePokemon.map(url => axios.get(url)));
      const mapaDeHabitatsDePokemon = new Map();

      respostasDeHabitats.forEach(resposta => {
        const nomeDoHabitat = resposta.data.name;
        resposta.data.pokemon_species.forEach(especie => {
          mapaDeHabitatsDePokemon.set(especie.name, nomeDoHabitat);
        });
      });

      return mapaDeHabitatsDePokemon;
    } catch (erro) {
      console.error("Erro ao buscar habitats detalhados de Pokémon:", erro);
      return new Map();
    }
  }

  static async obterMapaDePokemonPorTipo() {
    const tiposDePokemon = await this.buscarDados('https://pokeapi.co/api/v2/type/', 'pokemonTypeListCache');
    const urlsDeTiposDePokemon = tiposDePokemon.map(tipo => tipo.url);

    try {
      const respostasDeTipos = await Promise.all(urlsDeTiposDePokemon.map(url => axios.get(url)));
      const mapaDeTiposDePokemon = new Map();

      respostasDeTipos.forEach(resposta => {
        const nomeDoTipo = resposta.data.name;
        resposta.data.pokemon.forEach(entradaDePokemon => {
          const nomeDoPokemon = entradaDePokemon.pokemon.name;
          const tiposAtuais = mapaDeTiposDePokemon.get(nomeDoPokemon) || [];
          mapaDeTiposDePokemon.set(nomeDoPokemon, [...tiposAtuais, nomeDoTipo]);
        });
      });

      return mapaDeTiposDePokemon;
    } catch (erro) {
      console.error("Erro ao buscar tipos detalhados de Pokémon:", erro);
      return new Map();
    }
  }

  static async obterListaDePokemonComHabitatETipo() {
    const chaveDoCache = 'pokemonListWithHabitatAndTypeCache';
    const dadosEmCache = CacheManager.obterDadosDoCache(chaveDoCache);

    if (dadosEmCache) return dadosEmCache;

    const [listaDePokemon, mapaDeHabitats, mapaDeTipos] = await Promise.all([
      this.obterListaDePokemon(),
      this.obterMapaDePokemonPorHabitat(),
      this.obterMapaDePokemonPorTipo()
    ]);

    const listaDePokemonComDetalhes = listaDePokemon.map(pokemon => ({
      ...pokemon,
      habitat: mapaDeHabitats.get(pokemon.name) || 'unknown',
      type: mapaDeTipos.get(pokemon.name)?.join(', ') || 'unknown'
    }));

    CacheManager.definirDadosNoCache(chaveDoCache, listaDePokemonComDetalhes);
    return listaDePokemonComDetalhes;
  }
}

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
