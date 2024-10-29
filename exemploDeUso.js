import { LocalStorage } from 'node-localstorage';

import { FuzzyPokemonSearch, PokemonDataFetcher } from './fuzzy_search.js';

// Necessário apenas se rodar no Node.js
global.localStorage = new LocalStorage('./cache');

async function principal() {
  const dadosDePokemonComDetalhes = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
  const mecanismoDeBusca = new FuzzyPokemonSearch(dadosDePokemonComDetalhes, 5);

  // === Cenário 1: Buscar por Nome Exato (Pikachu) ===
  const buscaPorNomeExato = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'pikachu' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 1 - Busca por Nome Exato (Pikachu):", buscaPorNomeExato.data);
  console.warn("------------------------------------------------------");

  // === Cenário 2: Busca com Erro de Digitação no Nome (Picachu) ===
  const buscaPorNomeComErro = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'picachu' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 2 - Busca com Erro de Digitação (Picachu):", buscaPorNomeComErro.data);
  console.warn("------------------------------------------------------");

  // === Cenário 3: Buscar por Tipo Exato (Fogo) ===
  const buscaPorTipoExato = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'fire' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 3 - Busca por Tipo Exato (Fogo):", buscaPorTipoExato.data);
  console.warn("------------------------------------------------------");

  // === Cenário 4: Buscar por Habitat Exato (Montanha) ===
  const buscaPorHabitatExato = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'mountain' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 4 - Busca por Habitat Exato (Montanha):", buscaPorHabitatExato.data);
  console.warn("------------------------------------------------------");

  // === Cenário 5: Buscar por Habitat e Tipo (Montanha e Pedra) com Lógica AND ===
  const buscaPorHabitatETipo = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'mountain', type: 'rock' },
    usarClausulaANDParaBusca: true,
    pagina: 1
  });
  console.log("Cenário 5 - Busca por Habitat e Tipo (Montanha, Pedra):", buscaPorHabitatETipo.data);
  console.warn("------------------------------------------------------");

  // === Cenário 6: Busca Paginada com Filtro de Habitat (Floresta) - Página 1 ===
  const buscaPaginadaPagina1 = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 6 - Busca Paginada (Página 1, Habitat Floresta):", buscaPaginadaPagina1.data);
  console.warn("------------------------------------------------------");

  // === Cenário 7: Busca Paginada com Filtro de Habitat (Floresta) - Página 2 ===
  const buscaPaginadaPagina2 = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 2
  });
  console.log("Cenário 7 - Busca Paginada (Página 2, Habitat Floresta):", buscaPaginadaPagina2.data);
  console.warn("------------------------------------------------------");

  // === Cenário 8: Buscar Pokémon que não se Encontram no Cache ===
  const buscaPorNomeNaoEncontrado = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'missingno' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 8 - Busca por Nome Não Encontrado (MissingNo):", buscaPorNomeNaoEncontrado.data);
  console.warn("------------------------------------------------------");

  // === Cenário 9: Buscar por Tipo e Habitat com Lógica OR (Fogo ou Floresta) ===
  const buscaPorTipoOuHabitat = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'fire', habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 9 - Busca por Tipo e Habitat com Lógica OR (Fogo ou Floresta):", buscaPorTipoOuHabitat.data);
  console.warn("------------------------------------------------------");

  // === Cenário 10: Busca com Todos os Critérios Vazios (Retorna Todos) ===
  const buscaSemCriterios = await mecanismoDeBusca.buscar({
    criterioDeBusca: {},
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 10 - Busca sem Critérios (Retorna Todos):", buscaSemCriterios.data);
  console.warn("------------------------------------------------------");

  // === Cenário 11: Busca com Erro de Digitação em Habitat (Mountaon) ===
  const buscaPorHabitatComErro = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'mountaon' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 11 - Busca com Erro de Digitação em Habitat (Mountaon):", buscaPorHabitatComErro.data);
  console.warn("------------------------------------------------------");

  // === Cenário 12: Busca por Tipo Inexistente (Ex: "Espaço") ===
  const buscaPorTipoInexistente = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'space' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 12 - Busca por Tipo Inexistente (Espaço):", buscaPorTipoInexistente.data);
  console.warn("------------------------------------------------------");

  // === Cenário 13: Busca por Nome e Tipo Inexistentes com Lógica OR ===
  const buscaPorNomeETipoInexistentes = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'unknownmon', type: 'space' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 13 - Busca por Nome e Tipo Inexistentes com Lógica OR:", buscaPorNomeETipoInexistentes.data);
  console.warn("------------------------------------------------------");

  // === Cenário 14: Busca Paginada com Critérios Vazios - Página 2 ===
  const buscaPaginadaTodosPagina2 = await mecanismoDeBusca.buscar({
    criterioDeBusca: {},
    usarClausulaANDParaBusca: false,
    pagina: 2
  });
  console.log("Cenário 14 - Busca Paginada com Critérios Vazios (Página 2):", buscaPaginadaTodosPagina2.data);
  console.warn("------------------------------------------------------");

  // === Cenário 15: Busca com Critério Complexo - Habitat, Tipo e Nome Parciais ===
  const buscaComplexa = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'mountain', type: 'fire', name: 'char' },
    usarClausulaANDParaBusca: true,
    pagina: 1
  });
  console.log("Cenário 15 - Busca Complexa (Montanha, Fogo, Char):", buscaComplexa.data);
  console.warn("------------------------------------------------------");
}

principal().catch(error => console.error("Erro:", error));
