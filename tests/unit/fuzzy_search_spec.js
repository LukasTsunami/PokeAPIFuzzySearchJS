import { FuzzyPokemonSearch } from '../../fuzzy_search';

describe('FuzzyPokemonSearch', () => {
  let dadosDePokemon;
  let mecanismoDeBusca;

  beforeAll(() => {
    dadosDePokemon = [
      { name: 'pikachu', habitat: 'forest', type: ['electric'] },
      { name: 'charmander', habitat: 'mountain', type: ['fire'] },
      { name: 'bulbasaur', habitat: 'grassland', type: ['grass'] },
      { name: 'zubat', habitat: 'cave', type: ['flying'] },
      { name: 'venusaur', habitat: 'grassland', type: ['grass', 'poison'] },
      { name: 'scyther', habitat: 'forest', type: ['bug', 'flying'] }
    ];
    mecanismoDeBusca = new FuzzyPokemonSearch(dadosDePokemon, 2);
  });

  describe('Configuração de Opções de Busca', () => {
    test('configura opções de busca corretamente', () => {
      const opcoes = mecanismoDeBusca.configurarOpcoesDeBusca();
      expect(opcoes).toEqual({
        keys: ['name', 'habitat'],
        threshold: 0.2,
        ignoreLocation: true
      });
    });

    test('permite alteração de threshold nas opções de busca', () => {
      mecanismoDeBusca.precisaoDaBusca = 0.4;
      const opcoes = mecanismoDeBusca.configurarOpcoesDeBusca();
      expect(opcoes.threshold).toBe(0.4);
    });
  });

  describe('Busca Fuzzy com Erros de Digitação', () => {
    test('retorna resultado para erro de digitação em "name" (ex: "picachu" -> "pikachu")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'picachu' },
        usarClausulaANDParaBusca: false
      });

      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu' })
      ]);
    });

    test('verifica presença do objeto pikachu no habitat "forest"', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'forest' },
        usarClausulaANDParaBusca: false
      });

      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'pikachu',
            habitat: 'forest',
            type: expect.any(Array)
          })
        ])
      );
    });

    test('retorna resultado para erro de digitação em "type" (ex: "electrik" -> "electric")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'electrik' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu', type: ['electric'] })
      ]);
    });

    test('retorna resultado vazio para erro de digitação muito distante', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'xyz' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([]);
    });
  });

  describe('Combinações de Fuzzy Search', () => {
    test('apenas nome', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'pikachu' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'pikachu' })]);
    });

    test('apenas tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'fire' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'charmander', type: ['fire'] })]);
    });

    test('apenas habitat', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'cave' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'zubat', habitat: 'cave' })]);
    });

    test('nome e tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'charmander', type: 'fire' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'charmander', type: ['fire'] })]);
    });

    test('nome e habitat', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'bulbasaur', habitat: 'grassland' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'bulbasaur', habitat: 'grassland' })]);
    });

    test('habitat e tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'forest', type: 'electric' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'pikachu', habitat: 'forest', type: ['electric'] })]);
    });

    test('7 - nome, habitat e tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'venusaur', type: 'grass', habitat: 'grassland' },
        usarClausulaANDParaBusca: true
      });
    
      expect(resultado.data).toEqual([
        expect.objectContaining({
          name: 'venusaur',
          habitat: 'grassland',
          type: expect.arrayContaining(['grass', 'poison'])
        })
      ]);
    });

    test('ordem diferente dos critérios', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'grassland', type: 'grass', name: 'bulbasaur' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'bulbasaur', habitat: 'grassland', type: ['grass'] })]);
    });

    test('tipo como primeira posição do array de tipos', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'bug' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'scyther', type: ['bug', 'flying'] })]);
    });

    test('tipo como segunda posição do array de tipos', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'flying' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'zubat', type: ['flying'] }),
        expect.objectContaining({ name: 'scyther', type: ['bug', 'flying'] })
      ]));
    });
  });

  describe('Paginação de Resultados', () => {
    test('pagina corretamente os resultados fuzzy', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'a' },
        usarClausulaANDParaBusca: false,
        pagina: 1
      });
      expect(resultado.meta).toEqual({
        current_page: 1,
        total_pages: 3,
        total_count: 5,
        items_in_current_page: 2
      });
    });

    test('retorna meta correta para página sem resultados', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'zubat' },
        usarClausulaANDParaBusca: false,
        pagina: 10 
      });
      expect(resultado.data).toEqual([]);
      expect(resultado.meta).toEqual({
        current_page: 10,
        total_pages: 1,
        total_count: 1,
        items_in_current_page: 0
      });
    });

    test('ajusta total de páginas corretamente para diferentes tamanhos de página', async () => {
      const buscaComItensPorPagina3 = new FuzzyPokemonSearch(dadosDePokemon, 3);
      const resultado = await buscaComItensPorPagina3.buscar({
        criterioDeBusca: { name: 'a' },
        usarClausulaANDParaBusca: false,
        pagina: 1
      });
      expect(resultado.meta.total_pages).toBe(2);
    });
  });
});
