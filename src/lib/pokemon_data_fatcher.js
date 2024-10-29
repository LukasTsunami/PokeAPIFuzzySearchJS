import axios from "axios";
import axiosRetry from "axios-retry";
import { CacheManager } from "./cache_manager";

// A API vai bloquear muitas chamadas consecutivas, então fazemos isso de uma forma segura:
axiosRetry(axios, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay, // Aumenta o tempo entre tentativas exponencialmente
  retryCondition: error => {
    return error.code === "ETIMEDOUT" || error.response?.status === 429; // Re-tenta no caso de timeout ou erro 429
  }
});

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
    return await this.buscarDados("https://pokeapi.co/api/v2/pokemon?limit=1302", "pokemonListCache");
  }

  static async obterMapaDePokemonPorHabitat() {
    const habitatsDePokemon = await this.buscarDados("https://pokeapi.co/api/v2/pokemon-habitat/", "pokemonHabitatListCache");
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
    const tiposDePokemon = await this.buscarDados("https://pokeapi.co/api/v2/type/", "pokemonTypeListCache");
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
    const chaveDoCache = "pokemonListWithHabitatAndTypeCache";
    const dadosEmCache = CacheManager.obterDadosDoCache(chaveDoCache);

    if (dadosEmCache) return dadosEmCache;

    const [listaDePokemon, mapaDeHabitats, mapaDeTipos] = await Promise.all([
      this.obterListaDePokemon(),
      this.obterMapaDePokemonPorHabitat(),
      this.obterMapaDePokemonPorTipo()
    ]);

    const listaDePokemonComDetalhes = listaDePokemon.map(pokemon => ({
      ...pokemon,
      habitat: mapaDeHabitats.get(pokemon.name) || "unknown",
      type: mapaDeTipos.get(pokemon.name)?.join(", ") || "unknown"
    }));

    CacheManager.definirDadosNoCache(chaveDoCache, listaDePokemonComDetalhes);
    return listaDePokemonComDetalhes;
  }
}