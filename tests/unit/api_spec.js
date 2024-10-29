import request from 'supertest';
import express from 'express';

let FuzzyPokemonSearch;
let PokemonDataFetcher;
let validateSearchParams;
let router;
let app;

beforeEach(() => {
  // Resetando o cache de módulos para isolar completamente os mocks
  jest.resetModules();

  // Mockando os módulos necessários
  jest.mock('../../src/fuzzy_search.js', () => ({
    FuzzyPokemonSearch: jest.fn(),
    PokemonDataFetcher: {
      obterListaDePokemonComHabitatETipo: jest.fn(),
    },
  }));

  jest.mock('../../src/middleware/validate_search_params.js', () =>
    jest.fn((req, res, next) => {
      req.body = {
        criterioDeBusca: { name: req.query.nome || '' },
        criterioDePaginacao: { pagina: req.query.page || '1', itensPorPagina: req.query.itensPorPagina || '10' },
        precisaoDaBusca: parseFloat(req.query.precisaoDaBusca) || 0.5,
        usarClausulaANDParaBusca: req.query.usarClausulaANDParaBusca === 'true',
      };
      next();
    })
  );

  // Carregando os módulos isoladamente para aplicar mocks em cada teste
  jest.isolateModules(() => {
    ({ FuzzyPokemonSearch, PokemonDataFetcher } = require('../../src/fuzzy_search.js'));
    validateSearchParams = require('../../src/middleware/validate_search_params.js');
    router = require('../../src/api').default;

    app = express();
    app.use(express.json());
    app.use('/api', router);
  });
});

describe('GET /api/buscar', () => {
  it('deve retornar resultados de busca com parâmetros válidos', async () => {
    const mockData = [
      { name: 'Pikachu', type: 'Electric', habitat: 'Forest' },
      { name: 'Charmander', type: 'Fire', habitat: 'Mountain' },
    ];

    PokemonDataFetcher.obterListaDePokemonComHabitatETipo.mockResolvedValue(mockData);
    const mockBuscar = jest.fn().mockResolvedValue({ results: mockData });
    FuzzyPokemonSearch.mockImplementation(() => ({ buscar: mockBuscar }));

    const res = await request(app)
      .get('/api/buscar')
      .query({
        nome: 'Pikachu',
        page: '1',
        precisaoDaBusca: '0.5',
        itensPorPagina: '10',
      });

    expect(PokemonDataFetcher.obterListaDePokemonComHabitatETipo).toHaveBeenCalled();
    expect(mockBuscar).toHaveBeenCalledWith({
      criterioDeBusca: { name: 'Pikachu' },
      usarClausulaANDParaBusca: false,
      pagina: '1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ results: mockData });
  });

  it('deve retornar 400 se o parâmetro criterioDeBusca estiver faltando ou vazio', async () => {
    validateSearchParams.mockImplementation((req, res) => {
      res.status(400).json({ error: "Critério de busca deve ser um objeto válido." });
    });

    const res = await request(app).get('/api/buscar').query({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Critério de busca deve ser um objeto válido." });
  });

  it('deve retornar 500 se ocorrer um erro na busca', async () => {
    PokemonDataFetcher.obterListaDePokemonComHabitatETipo.mockRejectedValue(new Error('Erro ao buscar dados de Pokémon'));

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .get('/api/buscar')
      .query({
        nome: 'Pikachu',
        page: '1',
        precisaoDaBusca: '0.5',
        itensPorPagina: '10',
      });

    expect(validateSearchParams).toHaveBeenCalled();
    expect(PokemonDataFetcher.obterListaDePokemonComHabitatETipo).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Erro ao realizar busca" });

    consoleErrorMock.mockRestore();
  });

  it('deve retornar 400 se houver parâmetros não permitidos', async () => {
    validateSearchParams.mockImplementation((req, res) => {
      res.status(400).json({ error: "Parâmetro 'invalidParam' não é permitido." });
    });

    const res = await request(app)
      .get('/api/buscar')
      .query({
        invalidParam: 'notAllowed',
        nome: 'Pikachu',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Parâmetro 'invalidParam' não é permitido." });
  });
});
