import { FuzzyPokemonSearch } from '../../fuzzy_search';

describe('FuzzyPokemonSearch', () => {
  let dadosDePokemon;
  let mecanismoDeBusca;

  beforeAll(() => {
    dadosDePokemon = [
      { name: 'pikachu', habitat: 'forest', type: 'electric' },
      { name: 'charmander', habitat: 'mountain', type: 'fire' },
      { name: 'bulbasaur', habitat: 'grassland', type: 'grass' },
      { name: 'zubat', habitat: 'cave', type: 'flying' }
    ];
    mecanismoDeBusca = new FuzzyPokemonSearch(dadosDePokemon, 2);
  });

  describe('Configuração de Opções de Busca', () => {
    test('deve configurar opções de busca corretamente', () => {
      const opcoes = mecanismoDeBusca.configurarOpcoesDeBusca();
      expect(opcoes).toEqual({ keys: ['name', 'habitat', 'type'], threshold: 0.2 });
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

    test('deve retornar resultado para erro de digitação em "habitat" (ex: "fores" -> "forest")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { habitat: 'fores' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu', habitat: 'forest' })
      ]);
    });

    test('deve retornar resultado para erro de digitação em "type" (ex: "electrik" -> "electric")', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { type: 'electrik' },
        usarClausulaANDParaBusca: false
      });
      expect(resultado.data).toEqual([
        expect.objectContaining({ name: 'pikachu', type: 'electric' })
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

  describe('Interseção e Filtragem de Resultados Únicos', () => {
    test('deve encontrar interseção de resultados para múltiplos critérios', () => {
      const criterios = [['name', 'zubat'], ['habitat', 'cave']];
      const resultados = mecanismoDeBusca.realizarBuscasIndividuais(criterios);
      const intersecao = mecanismoDeBusca.encontrarIntersecaoDeResultados(resultados);

      expect(intersecao).toEqual([
        expect.objectContaining({ name: 'zubat', habitat: 'cave' })
      ]);
    });

    test('deve filtrar resultados únicos por nome com lógica OR', () => {
      const criterios = [['name', 'bulbasaur'], ['habitat', 'cave']];
      const resultados = mecanismoDeBusca.realizarBuscasIndividuais(criterios);
      const resultadosCombinados = resultados.flat();
      const filtradosUnicos = mecanismoDeBusca.filtrarResultadosUnicosPorNome(resultadosCombinados);

      expect(filtradosUnicos).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'bulbasaur' }),
        expect.objectContaining({ name: 'zubat' })
      ]));
    });

    test('deve retornar todos os resultados para lógica OR sem duplicatas', () => {
      const criterios = [['name', 'charmander'], ['type', 'fire']];
      const resultados = mecanismoDeBusca.realizarBuscasIndividuais(criterios);
      const resultadosCombinados = resultados.flat();
      const filtradosUnicos = mecanismoDeBusca.filtrarResultadosUnicosPorNome(resultadosCombinados);

      expect(filtradosUnicos).toEqual([
        expect.objectContaining({ name: 'charmander', type: 'fire' })
      ]);
    });
  });

  describe('Paginação de Resultados', () => {
    test('deve paginar corretamente os resultados fuzzy', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'a' }, // Critério genérico para garantir que retorne todos os itens
        usarClausulaANDParaBusca: false,
        pagina: 1
      });
      
      console.log(resultado); // Log para verificar o conteúdo dos resultados
  
      expect(resultado.meta).toEqual({
        current_page: 1,
        total_pages: 2, // Total ajustado para corresponder ao total de 4 itens com 2 itens por página
        total_count: dadosDePokemon.length,
        items_in_current_page: 2
      });
    });
  
    test('deve retornar meta correta para página sem resultados', async () => {
      const resultado = await mecanismoDeBusca.buscar({
        criterioDeBusca: { name: 'zubat' },
        usarClausulaANDParaBusca: false,
        pagina: 10 // Página sem resultados, pois `dadosDePokemon` tem poucos itens
      });
  
      console.log(resultado); // Log para verificar o conteúdo dos resultados
  
      expect(resultado.data).toEqual([]);
      expect(resultado.meta).toEqual({
        current_page: 10,
        total_pages: 1,
        total_count: 1, // Apenas um item corresponde ao critério "zubat"
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
  
      console.log(resultado); // Log para verificar o conteúdo dos resultados
  
      expect(resultado.meta.total_pages).toBe(2); // Total ajustado para refletir 4 itens com 3 itens por página
    });
  });
  
  
});
