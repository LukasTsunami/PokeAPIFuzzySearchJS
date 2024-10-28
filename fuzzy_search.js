const configureFuzzySearch = (filter_by = 'name', fuzzy_search_precision = 0.2) => ({
  keys: [filter_by],
  threshold: fuzzy_search_precision
});

const getCachedPokemonList = () => {
  const pokemonListCache = localStorage.getItem('pokemonListCache');
  return pokemonListCache ? JSON.parse(pokemonListCache) : null;
}

const setPokemonListCache = (data) => {
  localStorage.setItem('pokemonListCache', JSON.stringify(data));
}

const getPokemonList = async () => {
  const cachedData = getCachedPokemonList();

  if (cachedData) return cachedData;

  try {
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1302');
    const pokemonData = response.data.results;
    
    setPokemonListCache(pokemonData);

    return pokemonData;
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return [];
  }
}

const fuzzySearchFilter = async (searchTerm, options = configureFuzzySearch()) => {
  const results = await getPokemonList();
  const fuse = new Fuse(results, options);
  return fuse.search(searchTerm);
}

const result = await fuzzySearchFilter("picachu");
console.log(result);
