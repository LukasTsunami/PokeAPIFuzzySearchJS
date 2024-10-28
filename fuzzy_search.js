const configureFuzzySearch = (keys, fuzzySearchPrecision = 0.2) => ({
  keys: keys,
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

const getPokemonsByHabitatMap = async () => {
  const pokemonHabitats = await fetchData('https://pokeapi.co/api/v2/pokemon-habitat/', 'pokemonHabitatListCache');
  const pokemonHabitatUrls = pokemonHabitats.map(habitat => habitat.url);

  try {
    const pokemonHabitatResponses = await Promise.all(pokemonHabitatUrls.map(url => axios.get(url)));
    const pokemonHabitatMap = new Map();

    pokemonHabitatResponses.forEach(response => {
      const pokemonHabitatName = response.data.name;
      response.data.pokemon_species.forEach(species => {
        pokemonHabitatMap.set(species.name, pokemonHabitatName);
      });
    });

    return pokemonHabitatMap;
  } catch (error) {
    console.error("Erro ao buscar habitats detalhados de Pokémon:", error);
    return new Map();
  }
}

const getPokemonsByTypeMap = async () => {
  const pokemonTypes = await fetchData('https://pokeapi.co/api/v2/type/', 'pokemonTypeListCache');
  const pokemonTypeUrls = pokemonTypes.map(type => type.url);

  try {
    const pokemonTypeResponses = await Promise.all(pokemonTypeUrls.map(url => axios.get(url)));
    const pokemonTypeMap = new Map();

    pokemonTypeResponses.forEach(response => {
      const pokemonTypeName = response.data.name;
      response.data.pokemon.forEach(pokemonEntry => {
        const pokemonName = pokemonEntry.pokemon.name;
        const currentTypes = pokemonTypeMap.get(pokemonName) || [];
        pokemonTypeMap.set(pokemonName, [...currentTypes, pokemonTypeName]);
      });
    });

    return pokemonTypeMap;
  } catch (error) {
    console.error("Erro ao buscar tipos detalhados de Pokémon:", error);
    return new Map();
  }
}

const getPokemonListWithHabitatAndType = async () => {
  const cacheKey = 'pokemonListWithHabitatAndTypeCache';
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) return cachedData;

  const [pokemonList, pokemonHabitatMap, pokemonTypeMap] = await Promise.all([
    getPokemonList(),
    getPokemonsByHabitatMap(),
    getPokemonsByTypeMap()
  ]);

  const pokemonWithHabitatAndType = pokemonList.map(pokemon => ({
    ...pokemon,
    habitat: pokemonHabitatMap.get(pokemon.name) || 'unknown',
    type: pokemonTypeMap.get(pokemon.name)?.join(', ') || 'unknown'
  }));

  setCachedData(cacheKey, pokemonWithHabitatAndType);
  return pokemonWithHabitatAndType;
}

const fuzzySearchFilter = async ({ searchTerm, useAnd = false }) => {
  const results = await getPokemonListWithHabitatAndType();

  if (useAnd) {
    // Para `AND`, faça uma busca individual para cada critério e encontre a interseção dos resultados
    const searchCriteria = Object.entries(searchTerm).filter(([, term]) => term);
    const searchResults = searchCriteria.map(([key, term]) => {
      const options = configureFuzzySearch([key]);
      const fuse = new Fuse(results, options);
      return fuse.search(term).map(result => result.item);
    });

    // Encontra a interseção dos arrays de resultados para cada critério
    const intersectResults = searchResults.reduce((acc, curr) =>
      acc.filter(item => curr.some(result => result.name === item.name))
    );

    return intersectResults;
  } else {
    // Para `OR`, fazer uma busca combinada sem restrições
    const options = configureFuzzySearch(Object.keys(searchTerm));
    const fuse = new Fuse(results, options);
    return fuse.search(Object.values(searchTerm).join(" ")).map(result => result.item);
  }
}

// Exemplo de uso: Busca *fuzzy* com critério AND por nome e habitat
const result = await fuzzySearchFilter({
  searchTerm: { name: "nose", habitat: "cave" },
  useAnd: true
});
console.log(result);
