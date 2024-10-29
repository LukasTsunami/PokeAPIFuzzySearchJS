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
    test('deve configurar opções de busca corretamente', () => {
      const opcoes = mecanismoDeBusca.configurarOpcoesDeBusca();
      expect(opcoes).toEqual({
        keys: ['name', 'habitat'],
        threshold: 0.2,
        ignoreLocation: true
      });
    });

    test('deve permitir alteração de threshold nas opções de busca', () => {
      mecanismoDeBusca.precisaoDaBusca = 0.4;
      const opcoes = mecanismoDeBusca.configurarOpcoesDeBusca();
      expect(opcoes.threshold).toBe(0.4);
    });
  });

  describe('Busca Fuzzy com Erros de Digitação', () => {
    test('deve retornar resultado para erro de digitação em "name" (ex: "picachu" -> "pikachu")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'picachu' },
        usarClausulaANDParaBusca: false
      });

      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu' })
      ]);
    });

    test('deve conter o objeto pikachu na resposta', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'forest' },
        usarClausulaANDParaBusca: false
      });
    
      console.log(resultado);
    
      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'pikachu',
            habitat: 'forest',
            type: expect.any(Array) // Verifica que 'type' é um array sem se preocupar com os detalhes
          })
        ])
      );
    });    

    test('deve retornar resultado para erro de digitação em "type" (ex: "electrik" -> "electric")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'electrik' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu', type: ['electric'] })
      ]);
    });

    test('deve retornar resultado vazio para erro de digitação muito distante', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'xyz' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([]);
    });
  });

  describe('Combinações de Fuzzy Search', () => {
    test('1 - apenas nome', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'pikachu' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'pikachu' })]);
    });

    test('2 - apenas tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'fire' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'charmander', type: ['fire'] })]);
    });

    test('3 - apenas habitat', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'cave' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'zubat', habitat: 'cave' })]);
    });

    test('4 - nome e tipo', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'charmander', type: 'fire' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'charmander', type: ['fire'] })]);
    });

    test('5 - nome e habitat', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'bulbasaur', habitat: 'grassland' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'bulbasaur', habitat: 'grassland' })]);
    });

    test('6 - habitat e tipo', async () => {
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
        
      expect(resultado.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'venusaur',
            habitat: 'grassland',
            type: expect.arrayContaining(['grass', 'poison'])
          })
        ])
      );
    });

    test('8 - ordem diferente dos critérios', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'grassland', type: 'grass', name: 'bulbasaur' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'bulbasaur', habitat: 'grassland', type: ['grass'] })]);
    });

    test('9 - tipo como primeira posição do array de tipos', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'bug' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([expect.objectContaining({ name: 'scyther', type: ['bug', 'flying'] })]);
    });

    test('10 - tipo como segunda posição do array de tipos', async () => {
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

  describe('Busca com Lógica AND e OR', () => {
    test('deve retornar resultados de busca fuzzy com lógica OR para múltiplos critérios', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'picachu', habitat: 'forest' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'pikachu' })
      ]));
    });

    test('deve retornar resultados de busca fuzzy com lógica AND para múltiplos critérios', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'zubat', habitat: 'cave' },
        usarClausulaANDParaBusca: true
      });
      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'zubat', habitat: 'cave' })
      ]);
    });

    test('deve retornar vazio quando nenhum critério coincide para lógica OR', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'invalid', habitat: 'invalid' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([]);
    });

    test('deve retornar todos os resultados que atendem a qualquer critério com lógica OR', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'zubat', type: 'fire' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'zubat' }),
        expect.objectContaining({ name: 'charmander' })
      ]));
    });
  });

  describe('Paginação de Resultados', () => {
    test('deve paginar corretamente os resultados fuzzy', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'a' }, // Critério genérico para garantir que retorne todos os itens
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
  
    test('deve retornar meta correta para página sem resultados', async () => {
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
  
    test('deve ajustar total de páginas corretamente para diferentes tamanhos de página', async () => {
      const buscaComItensPorPagina3 = new FuzzyPokemonSearch(dadosDePokemon, 3);
      const resultado = await buscaComItensPorPagina3.buscar({
        criterioDeBusca: { name: 'a' }, // Critério genérico para garantir que retorne todos os itens
        usarClausulaANDParaBusca: false,
        pagina: 1
      });
    
      expect(resultado.meta.total_pages).toBe(2); 
    });
  });
});
