import express from 'express';
import { FuzzyPokemonSearch, PokemonDataFetcher } from './fuzzy_search.js';
import validateSearchParams from './middleware/validate_search_params.js';
import configureCache from './middleware/configure_cache.js';

const router = express.Router();

router.get('/buscar', configureCache, validateSearchParams, async (req, res) => {
  try {
    const dadosDePokemonComDetalhes = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
    const mecanismoDeBusca = new FuzzyPokemonSearch({
      dadosDePokemon: dadosDePokemonComDetalhes,
      itensPorPagina: req.body.criterioDePaginacao.itensPorPagina,
      chavesDeBusca: req.body.chavesDeBusca,
      precisaoDaBusca: req.body.precisaoDaBusca,
      precisaoDaBuscaTraduzida: req.body.precisaoDaBuscaTraduzida || req.body.precisaoDaBusca,
    });

    const resultados = await mecanismoDeBusca.buscar({
      criterioDeBusca: req.body.criterioDeBusca,
      usarClausulaANDParaBusca: req.body.usarClausulaANDParaBusca,
      pagina: req.body.criterioDePaginacao.pagina || 1,
    });

    res.json(resultados);
  } catch (error) {
    console.error("Erro na busca:", error);
    res.status(500).json({ error: "Erro ao realizar busca" });
  }
});

export default router;
