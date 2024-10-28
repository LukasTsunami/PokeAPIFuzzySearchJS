class CacheManager {
  // Obtém dados do cache local para uma determinada chave
  static obterDadosDoCache(chave) {
    const dadosEmCache = localStorage.getItem(chave);
    return dadosEmCache ? JSON.parse(dadosEmCache) : null;
  }

  // Armazena dados no cache local para uma determinada chave
  static definirDadosNoCache(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }
}

class PokemonDataFetcher {
  // Realiza a busca dos dados e armazena em cache para evitar buscas repetidas
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

  static async obterListaCompletaDePokemon() {
    return await this.buscarDados('https://pokeapi.co/api/v2/pokemon?limit=1302', 'pokemonListCache');
  }

  // Cria um mapa dos habitats associados a cada Pokémon
  static async obterMapaDeHabitatsDePokemon() {
    const habitatsDePokemon = await this.buscarDados('https://pokeapi.co/api/v2/pokemon-habitat/', 'pokemonHabitatListCache');
    const urlsDeHabitats = habitatsDePokemon.map(habitat => habitat.url);

    try {
      const respostasDeHabitats = await Promise.all(urlsDeHabitats.map(url => axios.get(url)));
      const mapaHabitats = new Map();

      respostasDeHabitats.forEach(resposta => {
        const nomeHabitat = resposta.data.name;
        resposta.data.pokemon_species.forEach(especie => {
          mapaHabitats.set(especie.name, nomeHabitat);
        });
      });

      return mapaHabitats;
    } catch (erro) {
      console.error("Erro ao buscar habitats detalhados de Pokémon:", erro);
      return new Map();
    }
  }

  // Cria um mapa dos tipos associados a cada Pokémon
  static async obterMapaDeTiposDePokemon() {
    const tiposDePokemon = await this.buscarDados('https://pokeapi.co/api/v2/type/', 'pokemonTypeListCache');
    const urlsDeTipos = tiposDePokemon.map(tipo => tipo.url);

    try {
      const respostasDeTipos = await Promise.all(urlsDeTipos.map(url => axios.get(url)));
      const mapaTipos = new Map();

      respostasDeTipos.forEach(resposta => {
        const tipoNome = resposta.data.name;
        resposta.data.pokemon.forEach(entrada => {
          const nomePokemon = entrada.pokemon.name;
          const tiposAtuais = mapaTipos.get(nomePokemon) || [];
          mapaTipos.set(nomePokemon, [...tiposAtuais, tipoNome]);
        });
      });

      return mapaTipos;
    } catch (erro) {
      console.error("Erro ao buscar tipos detalhados de Pokémon:", erro);
      return new Map();
    }
  }

  // Obtém a lista de Pokémon completa com informações de habitat e tipo
  static async obterListaDePokemonComHabitatETipo() {
    const chaveDoCache = 'pokemonListWithHabitatAndTypeCache';
    const dadosEmCache = CacheManager.obterDadosDoCache(chaveDoCache);

    if (dadosEmCache) return dadosEmCache;

    const [listaDePokemon, mapaDeHabitats, mapaDeTipos] = await Promise.all([
      this.obterListaCompletaDePokemon(),
      this.obterMapaDeHabitatsDePokemon(),
      this.obterMapaDeTiposDePokemon()
    ]);

    const listaPokemonDetalhada = listaDePokemon.map(pokemon => ({
      ...pokemon,
      habitat: mapaDeHabitats.get(pokemon.name) || 'unknown',
      tipo: mapaDeTipos.get(pokemon.name)?.join(', ') || 'unknown'
    }));

    CacheManager.definirDadosNoCache(chaveDoCache, listaPokemonDetalhada);
    return listaPokemonDetalhada;
  }
}

class FuzzyPokemonSearch {
  constructor(dadosDePokemon, opcoes = { chavesBusca: ['name', 'habitat', 'type'], precisaoBusca: 0.2 }) {
    this.dadosDePokemon = dadosDePokemon;
    this.chavesBusca = opcoes.chavesBusca;
    this.precisaoBusca = opcoes.precisaoBusca;
    this.configuracaoBusca = { keys: this.chavesBusca, threshold: this.precisaoBusca };
  }

  // Configura as opções de busca para cada critério
  configurarOpcoesDeBusca(chavesBusca) {
    return { keys: chavesBusca, threshold: this.precisaoBusca };
  }

  // Realiza a busca em cada critério separadamente
  realizarBuscaPorCriterio(criterios) {
    return criterios.map(([chave, termo]) => {
      const opcoes = this.configurarOpcoesDeBusca([chave]);
      const mecanismoDeBusca = new Fuse(this.dadosDePokemon, opcoes);
      return mecanismoDeBusca.search(termo).map(resultado => resultado.item);
    });
  }

  // Retorna apenas os Pokémon que atendem a todos os critérios (lógica AND)
  aplicarLogicaAND(resultados) {
    return resultados.reduce((resultadosAcumulados, resultadosAtuais) =>
      resultadosAcumulados.filter(item =>
        resultadosAtuais.some(resultado => resultado.name === item.name)
      )
    );
  }

  // Remove duplicatas para que cada Pokémon apareça uma única vez (lógica OR)
  aplicarLogicaOR(resultados) {
    const nomesUnicos = new Set();
    return resultados.filter(resultado => {
      if (nomesUnicos.has(resultado.name)) return false;
      nomesUnicos.add(resultado.name);
      return true;
    });
  }

  // Busca Pokémon de acordo com os critérios e lógica de busca especificados
  async buscar({ criterioBusca, usarLogicaAND = false }) {
    const criteriosAtivos = Object.entries(criterioBusca).filter(([, termo]) => termo);
    const resultadosPorCriterio = this.realizarBuscaPorCriterio(criteriosAtivos);

    if (usarLogicaAND) {
      return this.aplicarLogicaAND(resultadosPorCriterio);
    } else {
      const resultadosCombinados = resultadosPorCriterio.flat();
      return this.aplicarLogicaOR(resultadosCombinados);
    }
  }
}

// Exemplo de uso
const dadosDePokemon = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
const mecanismoDeBusca = new FuzzyPokemonSearch(dadosDePokemon, { chavesBusca: ['name', 'habitat'] });

const resultadosDaBusca = await mecanismoDeBusca.buscar({
  criterioBusca: { name: "nose", habitat: "cave" },
  usarLogicaAND: false
});
console.log(resultadosDaBusca);
