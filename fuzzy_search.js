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

const getPokemonsByHabitatMap = async () => {
  const habitats = await fetchData('https://pokeapi.co/api/v2/pokemon-habitat/', 'habitatListCache');
  const habitatUrls = habitats.map(habitat => habitat.url);

  try {
    const habitatResponses = await Promise.all(habitatUrls.map(url => axios.get(url)));
    const pokemonHabitatMap = new Map();

    habitatResponses.forEach(response => {
      const habitatName = response.data.name;
      response.data.pokemon_species.forEach(species => {
        pokemonHabitatMap.set(species.name, habitatName);
      });
    });

    return pokemonHabitatMap;
  } catch (error) {
    console.error("Erro ao buscar habitats detalhados:", error);
    return new Map();
  }
}

const getPokemonsByTypeMap = async () => {
  const types = await fetchData('https://pokeapi.co/api/v2/type/', 'typeListCache');
  const typeUrls = types.map(type => type.url);

  try {
    const typeResponses = await Promise.all(typeUrls.map(url => axios.get(url)));
    const pokemonTypeMap = new Map();

    typeResponses.forEach(response => {
      const typeName = response.data.name;
      response.data.pokemon.forEach(pokemonEntry => {
        const pokemonName = pokemonEntry.pokemon.name;
        const currentTypes = pokemonTypeMap.get(pokemonName) || [];
        pokemonTypeMap.set(pokemonName, [...currentTypes, typeName]);
      });
    });

    return pokemonTypeMap;
  } catch (error) {
    console.error("Erro ao buscar tipos detalhados:", error);
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

const fuzzySearchFilter = async ({ searchTerm, options = configureFuzzySearch(), useAnd = false }) => {
  const results = await getPokemonListWithHabitatAndType();
  const fuse = new Fuse(results, options);

  if (typeof searchTerm === 'string') {
    return fuse.search(searchTerm);
  }

  if (useAnd) {
    const initialResults = fuse.search(Object.values(searchTerm).join(" "));
    const searchCriteria = Object.entries(searchTerm);

    return initialResults.filter(result => 
      searchCriteria.every(([key, term]) => 
        result.item[key] && result.item[key].toLowerCase().includes(term.toLowerCase())
      )
    );
  } else {
    const searchTerms = Object.entries(searchTerm);
    const allResults = [];

    searchTerms.forEach(([key, term]) => {
      const singleSearchOptions = configureFuzzySearch({ filterBy: [key] });
      const singleFuse = new Fuse(results, singleSearchOptions);
      allResults.push(...singleFuse.search(term));
    });

    const uniqueResults = Array.from(new Set(allResults.map(result => result.item.name)))
      .map(name => allResults.find(result => result.item.name === name));

    return uniqueResults;
  }
}

// Exemplo de uso: Busca *fuzzy* com critério OR por nome, habitat ou tipo
const result = await fuzzySearchFilter({
  searchTerm: { name: "char", habitat: "forest", type: "fire" },
  useAnd: false
});
console.log(result);
