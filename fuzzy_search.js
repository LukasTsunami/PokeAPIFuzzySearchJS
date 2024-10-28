class CacheManager {
  static obterDadosDoCache(chave) {
    const dadosEmCache = localStorage.getItem(chave);
    return dadosEmCache ? JSON.parse(dadosEmCache) : null;
  }

  static definirDadosNoCache(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }
}

class PokemonDataFetcher {
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
      tipo: mapaDeTipos.get(pokemon.name)?.join(', ') || 'unknown'
    }));

    CacheManager.definirDadosNoCache(chaveDoCache, listaDePokemonComDetalhes);
    return listaDePokemonComDetalhes;
  }
}

class FuzzyPokemonSearch {
  constructor(dadosDePokemon) {
    this.dadosDePokemon = dadosDePokemon;
  }

  configurarOpcoesDeBusca(chavesDeBusca, precisaoDaBusca = 0.2) {
    return { keys: chavesDeBusca, threshold: precisaoDaBusca };
  }

  realizarBuscasIndividuais(criterios) {
    return criterios.map(([chave, termo]) => {
      const opcoes = this.configurarOpcoesDeBusca([chave]);
      const mecanismoDeBusca = new Fuse(this.dadosDePokemon, opcoes);
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

  async buscar({ criterioDeBusca, usarClausulaANDParaBusca = false }) {
    const criteriosAtivos = Object.entries(criterioDeBusca).filter(([, termo]) => termo);

    if (usarClausulaANDParaBusca) {
      const resultadosPorCriterio = this.realizarBuscasIndividuais(criteriosAtivos);
      return this.encontrarIntersecaoDeResultados(resultadosPorCriterio);
    } else {
      const resultadosPorCriterio = this.realizarBuscasIndividuais(criteriosAtivos);
      const resultadosCombinados = resultadosPorCriterio.flat();
      return this.filtrarResultadosUnicosPorNome(resultadosCombinados);
    }
  }
}

// Exemplo de uso
const dadosDePokemon = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
const mecanismoDeBusca = new FuzzyPokemonSearch(dadosDePokemon);

const resultadosDaBusca = await mecanismoDeBusca.buscar({
  criterioDeBusca: { name: "nose", habitat: "cave" },
  usarClausulaANDParaBusca: false
});
console.log(resultadosDaBusca);
