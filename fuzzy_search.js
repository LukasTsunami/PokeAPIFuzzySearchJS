const configureFuzzySearch = ({ filterBy = ['name', 'habitat', 'type'], fuzzySearchPrecision = 0.2 } = {}) => ({
  keys: filterBy,
  threshold: fuzzySearchPrecision
});

const getCachedData = (key) => {
  const cachedData = localStorage.getItem(key);
  return cachedData ? JSON.parse(cachedData) : null;
}

const setCachedData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
}

const fetchData = async (url, cacheKey) => {
  const cachedData = getCachedData(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await axios.get(url);
    const data = response.data.results;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados de ${cacheKey}:`, error);
    return [];
  }
}

const getPokemonList = async () => {
  return await fetchData('https://pokeapi.co/api/v2/pokemon?limit=1302', 'pokemonListCache');
}

const getHabitatsMap = async () => {
  const habitats = await fetchData('https://pokeapi.co/api/v2/pokemon-habitat/', 'habitatListCache');
  const habitatUrls = habitats.map(habitat => habitat.url);

  try {
    const habitatResponses = await Promise.all(habitatUrls.map(url => axios.get(url)));
    const habitatMap = new Map();

    habitatResponses.forEach(response => {
      const habitatName = response.data.name;
      response.data.pokemon_species.forEach(species => {
        habitatMap.set(species.name, habitatName);
      });
    });

    return habitatMap;
  } catch (error) {
    console.error("Erro ao buscar habitats detalhados:", error);
    return new Map();
  }
}

const getTypesMap = async () => {
  const types = await fetchData('https://pokeapi.co/api/v2/type/', 'typeListCache');
  const typeUrls = types.map(type => type.url);

  try {
    const typeResponses = await Promise.all(typeUrls.map(url => axios.get(url)));
    const typeMap = new Map();

    typeResponses.forEach(response => {
      const typeName = response.data.name;
      response.data.pokemon.forEach(pokemonEntry => {
        const pokemonName = pokemonEntry.pokemon.name;
        const currentTypes = typeMap.get(pokemonName) || [];
        typeMap.set(pokemonName, [...currentTypes, typeName]);
      });
    });

    return typeMap;
  } catch (error) {
    console.error("Erro ao buscar tipos detalhados:", error);
    return new Map();
  }
}

const getPokemonListWithHabitatAndType = async () => {
  const [pokemonList, habitatMap, typeMap] = await Promise.all([
    getPokemonList(),
    getHabitatsMap(),
    getTypesMap()
  ]);

  return pokemonList.map(pokemon => ({
    ...pokemon,
    habitat: habitatMap.get(pokemon.name) || 'unknown',
    type: typeMap.get(pokemon.name)?.join(', ') || 'unknown'
  }));
}

const fuzzySearchFilter = async ({ searchTerm, options = configureFuzzySearch(), useAnd = false }) => {
  const results = await getPokemonListWithHabitatAndType();
  const fuse = new Fuse(results, options);

  if (typeof searchTerm === 'string') {
    return fuse.search(searchTerm); // Busca única se searchTerm for uma string simples
  }

  if (useAnd) {
    // AND: Retorna apenas os resultados que correspondem a todos os critérios
    const initialResults = fuse.search(Object.values(searchTerm).join(" "));
    const searchCriteria = Object.entries(searchTerm);

    return initialResults.filter(result => 
      searchCriteria.every(([key, term]) => 
        result.item[key] && result.item[key].toLowerCase().includes(term.toLowerCase())
      )
    );
  } else {
    // OR: Busca por cada critério e combina os resultados
    const searchTerms = Object.entries(searchTerm);
    const allResults = [];

    searchTerms.forEach(([key, term]) => {
      const singleSearchOptions = configureFuzzySearch({ filterBy: [key] });
      const singleFuse = new Fuse(results, singleSearchOptions);
      allResults.push(...singleFuse.search(term));
    });

    // Remove duplicatas usando um Set para IDs de resultados únicos
    const uniqueResults = Array.from(new Set(allResults.map(result => result.item.name)))
      .map(name => allResults.find(result => result.item.name === name));

    return uniqueResults;
  }
}

// Exemplo de uso: Busca *fuzzy* com critério AND por nome, habitat ou tipo
const result = await fuzzySearchFilter({
  searchTerm: { name: "char", habitat: "forest", type: "fire" },
  useAnd: true
});

console.log(result);
