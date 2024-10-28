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

const fuzzySearchFilter = async ({ searchTerm, options = configureFuzzySearch() }) => {
  const results = await getPokemonListWithHabitatAndType();
  const fuse = new Fuse(results, options);
  return fuse.search(searchTerm);
}

const result = await fuzzySearchFilter({ searchTerm: "fire" });
console.log(result);
