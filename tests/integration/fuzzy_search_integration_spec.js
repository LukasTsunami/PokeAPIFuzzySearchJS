import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { FuzzyPokemonSearch, PokemonDataFetcher, CacheManager } from '../../fuzzy_search';

const mock = new MockAdapter(axios);

describe('Integração FuzzyPokemonSearch com PokemonDataFetcher e CacheManager', () => {
  beforeEach(() => {
    localStorage.clear();
    mock.reset();
  });

  describe('Busca e Cache Básico', () => {
    test('deve buscar dados e armazenar no cache, e usar o cache em busca subsequente', async () => {
      const pokemonData = [{ name: 'bulbasaur' }, { name: 'pikachu' }];
      const url = 'https://pokeapi.co/api/v2/pokemon?limit=1302';
      mock.onGet(url).reply(200, { results: pokemonData });

      // 1. Buscar e armazenar no cache
      const fetchedData = await PokemonDataFetcher.obterListaDePokemon();
      expect(fetchedData).toEqual(pokemonData);
      expect(CacheManager.obterDadosDoCache('pokemonListCache')).toEqual(pokemonData);

      // 2. Realizar uma busca fuzzy no cache
      const mecanismoDeBusca = new FuzzyPokemonSearch(fetchedData, 2);
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'pikachu' },
        usarClausulaANDParaBusca: false
      });

      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu' })
      ]);
    });
  });

  describe('Busca com Dados de Habitat e Type', () => {
    test('deve buscar dados de habitat e type, armazenar no cache, e buscar fuzzy com critérios combinados', async () => {
      const pokemonListData = [{ name: 'zubat', url: '/pokemon/41/' }];
      const habitatData = [{ name: 'cave', url: '/habitat/1/' }];
      const typeData = [{ name: 'flying', url: '/type/1/' }];
      const pokemonListUrl = 'https://pokeapi.co/api/v2/pokemon?limit=1302';
      const habitatUrl = 'https://pokeapi.co/api/v2/pokemon-habitat/';
      const typeUrl = 'https://pokeapi.co/api/v2/type/';
      
      mock.onGet(pokemonListUrl).reply(200, { results: pokemonListData });
      mock.onGet(habitatUrl).reply(200, { results: habitatData });
      mock.onGet(typeUrl).reply(200, { results: typeData });
      mock.onGet('/habitat/1/').reply(200, {
        name: 'cave',
        pokemon_species: [{ name: 'zubat' }]
      });
      mock.onGet('/type/1/').reply(200, {
        name: 'flying',
        pokemon: [{ pokemon: { name: 'zubat' } }]
      });
  
      // 1. Buscar e combinar dados de habitat e type
      const fetchedData = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
  
      // Verifica se os dados de retorno têm a estrutura correta, incluindo URL, habitat e type
      expect(fetchedData).toMatchObject([
        expect.objectContaining({
          name: 'zubat',
          url: '/pokemon/41/',
          habitat: 'cave',
          type: 'flying'
        })
      ]);
  
      expect(CacheManager.obterDadosDoCache('pokemonListWithHabitatAndTypeCache')).toEqual(fetchedData);
  
      // 2. Realizar uma busca fuzzy com critérios AND
      const mecanismoDeBusca = new FuzzyPokemonSearch(fetchedData, 2);
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'cave', type: 'flying' },
        usarClausulaANDParaBusca: true
      });  

      expect(resultado.data).toMatchObject([
        expect.objectContaining({ name: 'zubat', url: '/pokemon/41/', habitat: 'cave', type: 'flying' })
      ]);
    });
  });
  
  
  describe('Paginação de Resultados após Busca Fuzzy', () => {
    test('deve retornar dados paginados corretamente após busca fuzzy', async () => {
      const pokemonData = [
        { name: 'bulbasaur', habitat: 'forest', type: 'grass' },
        { name: 'ivysaur', habitat: 'forest', type: 'grass' },
        { name: 'venusaur', habitat: 'forest', type: 'grass' },
        { name: 'charmander', habitat: 'mountain', type: 'fire' },
        { name: 'charmeleon', habitat: 'mountain', type: 'fire' }
      ];

      // 1. Definir dados diretamente no cache para simular busca completa
      CacheManager.definirDadosNoCache('pokemonListWithHabitatAndTypeCache', pokemonData);

      // 2. Realizar busca fuzzy e verificar paginação
      const mecanismoDeBusca = new FuzzyPokemonSearch(pokemonData, 2);
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'forest' },
        usarClausulaANDParaBusca: false,
        pagina: 1
      });

      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'bulbasaur' }),
        expect.objectContaining({ name: 'ivysaur' })
      ]);
      expect(resultado.meta).toEqual({
        current_page: 1,
        total_pages: 2,
        total_count: 3,
        items_in_current_page: 2
      });
    });

    test('deve retornar dados vazios e meta correta para página sem resultados', async () => {
      const pokemonData = [
        { name: 'bulbasaur', habitat: 'forest', type: 'grass' },
        { name: 'ivysaur', habitat: 'forest', type: 'grass' }
      ];

      CacheManager.definirDadosNoCache('pokemonListWithHabitatAndTypeCache', pokemonData);
      const mecanismoDeBusca = new FuzzyPokemonSearch(pokemonData, 2);

      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'forest' },
        usarClausulaANDParaBusca: false,
        pagina: 2
      });

      expect(resultado.data).toEqual([]);
      expect(resultado.meta).toEqual({
        current_page: 2,
        total_pages: 1,
        total_count: 2,
        items_in_current_page: 0
      });
    });
  });
});
