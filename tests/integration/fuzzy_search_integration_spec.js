import { FuzzyPokemonSearch } from '../../fuzzy_search';
import { I18nTranslator } from '../../lib/i18n_translator';

describe('FuzzyPokemonSearch - Integração Completa', () => {
  let dadosDePokemon;
  let mecanismoDeBusca;

  beforeAll(() => {
    dadosDePokemon = [
      { name: 'charizard', habitat: 'mountain', type: ['fire', 'flying'] },
      { name: 'gyarados', habitat: 'sea', type: ['water', 'flying'] },
      { name: 'venusaur', habitat: 'grassland', type: ['grass', 'poison'] },
      { name: 'gengar', habitat: 'urban', type: ['ghost', 'poison'] },
      { name: 'scyther', habitat: 'forest', type: ['bug', 'flying'] },
      { name: 'dragonite', habitat: 'rare', type: ['dragon', 'flying'] },
      { name: 'pikachu', habitat: 'forest', type: ['electric'] }
    ];
    mecanismoDeBusca = new FuzzyPokemonSearch({ dadosDePokemon, itensPorPagina: 3 });
  });

  describe('Busca com Tradução e Mistura de Termos em Português e Inglês', () => {
    
    test('Busca por "habitat" em português e "type" em inglês com fuzzy search', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'floresta', type: 'flying' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'scyther', habitat: 'forest', type: expect.arrayContaining(['bug', 'flying']) })
        ])
      );
    });

    test('Busca por "name" e "type" em inglês com habitat em português ("mar")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'gyarados', type: 'water', habitat: 'mar' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'gyarados', habitat: 'sea', type: expect.arrayContaining(['water', 'flying']) })
        ])
      );
    });

    test('Busca fuzzy com "name" em inglês, "type" em português e habitat em português', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'pikchu', type: 'elétrico', habitat: 'floresta' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'pikachu', habitat: 'forest', type: expect.arrayContaining(['electric']) })
        ])
      );
    });

    test('Busca combinada com erro de digitação em português para "type" e "habitat"', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'muntanho', type: 'fgo' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'charizard', habitat: 'mountain', type: expect.arrayContaining(['fire', 'flying']) })
        ])
      );
    });

    test('Busca com todos os critérios em português ("tipo", "habitat" e nome)', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'dragonite', habitat: 'raro', type: 'dragão' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'dragonite', habitat: 'rare', type: expect.arrayContaining(['dragon', 'flying']) })
        ])
      );
    });

    test('Busca com "name" em português e combinação de "type" e "habitat" em inglês com erro de digitação', async () => {
      // Instancia um mecanismo de busca temporário com precisão 0.4 por causa de sciter
      // const mecanismoDeBuscaCustom = new FuzzyPokemonSearch(dadosDePokemon, 3, ['name', 'habitat', 'type'], 0.4, 0.4);
      
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'sciter', type: 'bug', habitat: 'forest' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'scyther', habitat: 'forest', type: expect.arrayContaining(['bug', 'flying']) })
        ])
      );
    });

    test('Busca combinada com "type" e "habitat" mistos e nome fuzzy', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'venusar', habitat: 'grassland', type: 'grama' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'venusaur', habitat: 'grassland', type: expect.arrayContaining(['grass', 'poison']) })
        ])
      );
    });
  });

  describe('Busca com Fuzzy e Erros de Digitação em Critérios Mistos', () => {
    
    test('Busca com todos os critérios fuzzy em português e inglês com pequenos erros', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'gngar', type: 'venenoso', habitat: 'urbano' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'gengar', habitat: 'urban', type: expect.arrayContaining(['ghost', 'poison']) })
        ])
      );
    });

    test('Busca com combinação de "type" e "habitat" em inglês e "name" em português com erro de digitação', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'pikatchu', type: 'electric', habitat: 'forest' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'pikachu', habitat: 'forest', type: expect.arrayContaining(['electric']) })
        ])
      );
    });

    test('Busca com habitat em inglês e tipo em português com erro de digitação', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'mountain', type: 'fog' },
        usarClausulaANDParaBusca: true,
        pagina: 1
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'charizard', habitat: 'mountain', type: expect.arrayContaining(['fire', 'flying']) })
        ])
      );
    });
  });
});
