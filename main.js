// exampleUsage.js

import { LocalStorage } from 'node-localstorage';

import { FuzzyPokemonSearch, PokemonDataFetcher } from './fuzzy_search.js';

// Necessário apenas se rodar no node
global.localStorage = new LocalStorage('./scratch');

async function runExample() {
  const pokemonDataWithDetails = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
  const searchEngine = new FuzzyPokemonSearch(pokemonDataWithDetails, 5);

  // === Cenário 1: Buscar por Nome Exato (Pikachu) ===
  const searchByExactName = await searchEngine.buscar({
    criterioDeBusca: { name: 'pikachu' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 1 - Busca por Nome Exato (Pikachu):", searchByExactName.data);
  console.warn("------------------------------------------------------");

  // === Cenário 2: Busca com Erro de Digitação no Nome (Picachu) ===
  const searchByNameTypo = await searchEngine.buscar({
    criterioDeBusca: { name: 'picachu' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 2 - Busca com Erro de Digitação (Picachu):", searchByNameTypo.data);
  console.warn("------------------------------------------------------");

  // === Cenário 3: Buscar por Tipo Exato (Fogo) ===
  const searchByExactType = await searchEngine.buscar({
    criterioDeBusca: { type: 'fire' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 3 - Busca por Tipo Exato (Fogo):", searchByExactType.data);
  console.warn("------------------------------------------------------");

  // === Cenário 4: Buscar por Habitat Exato (Montanha) ===
  const searchByExactHabitat = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'mountain' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 4 - Busca por Habitat Exato (Montanha):", searchByExactHabitat.data);
  console.warn("------------------------------------------------------");

  // === Cenário 5: Buscar por Habitat e Tipo (Montanha e Pedra) com Lógica AND ===
  const searchByHabitatAndType = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'mountain', type: 'rock' },
    usarClausulaANDParaBusca: true,
    pagina: 1
  });
  console.log("Cenário 5 - Busca por Habitat e Tipo (Montanha, Pedra):", searchByHabitatAndType.data);
  console.warn("------------------------------------------------------");

  // === Cenário 6: Busca Paginada com Filtro de Habitat (Floresta) - Página 1 ===
  const paginatedSearchPage1 = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 6 - Busca Paginada (Página 1, Habitat Floresta):", paginatedSearchPage1.data);
  console.warn("------------------------------------------------------");

  // === Cenário 7: Busca Paginada com Filtro de Habitat (Floresta) - Página 2 ===
  const paginatedSearchPage2 = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 2
  });
  console.log("Cenário 7 - Busca Paginada (Página 2, Habitat Floresta):", paginatedSearchPage2.data);
  console.warn("------------------------------------------------------");

  // === Cenário 8: Buscar Pokémon que não se Encontram no Cache ===
  const searchByNameNotCached = await searchEngine.buscar({
    criterioDeBusca: { name: 'missingno' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 8 - Busca por Nome Não Encontrado (MissingNo):", searchByNameNotCached.data);
  console.warn("------------------------------------------------------");

  // === Cenário 9: Buscar por Tipo e Habitat com Lógica OR (Fogo ou Floresta) ===
  const searchByTypeOrHabitat = await searchEngine.buscar({
    criterioDeBusca: { type: 'fire', habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 9 - Busca por Tipo e Habitat com Lógica OR (Fogo ou Floresta):", searchByTypeOrHabitat.data);
  console.warn("------------------------------------------------------");

  // === Cenário 10: Busca com Todos os Critérios Vazios (Retorna Todos) ===
  const searchWithNoCriteria = await searchEngine.buscar({
    criterioDeBusca: {},
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 10 - Busca sem Critérios (Retorna Todos):", searchWithNoCriteria.data);
  console.warn("------------------------------------------------------");

  // === Cenário 11: Busca com Erro de Digitação em Habitat (Mountaon) ===
  const searchByHabitatTypo = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'mountaon' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 11 - Busca com Erro de Digitação em Habitat (Mountaon):", searchByHabitatTypo.data);
  console.warn("------------------------------------------------------");

  // === Cenário 12: Busca por Tipo Inexistente (Ex: "Espaço") ===
  const searchByNonExistentType = await searchEngine.buscar({
    criterioDeBusca: { type: 'space' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 12 - Busca por Tipo Inexistente (Espaço):", searchByNonExistentType.data);
  console.warn("------------------------------------------------------");

  // === Cenário 13: Busca por Nome e Tipo Inexistentes com Lógica OR ===
  const searchByNonExistentNameAndType = await searchEngine.buscar({
    criterioDeBusca: { name: 'unknownmon', type: 'space' },
    usarClausulaANDParaBusca: false,
    pagina: 1
  });
  console.log("Cenário 13 - Busca por Nome e Tipo Inexistentes com Lógica OR:", searchByNonExistentNameAndType.data);
  console.warn("------------------------------------------------------");

  // === Cenário 14: Busca Paginada com Critérios Vazios - Página 2 ===
  const paginatedAllPage2 = await searchEngine.buscar({
    criterioDeBusca: {},
    usarClausulaANDParaBusca: false,
    pagina: 2
  });
  console.log("Cenário 14 - Busca Paginada com Critérios Vazios (Página 2):", paginatedAllPage2.data);
  console.warn("------------------------------------------------------");

  // === Cenário 15: Busca com Critério Complexo - Habitat, Tipo e Nome Parciais ===
  const complexSearch = await searchEngine.buscar({
    criterioDeBusca: { habitat: 'mountain', type: 'fire', name: 'char' },
    usarClausulaANDParaBusca: true,
    pagina: 1
  });
  console.log("Cenário 15 - Busca Complexa (Montanha, Fogo, Char):", complexSearch.data);
  console.warn("------------------------------------------------------");
}

runExample().catch(error => console.error("Erro:", error));
