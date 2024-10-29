function validateSearchParams(req, res, next) {
  const criterioDeBusca = req.query;

  if (!criterioDeBusca || typeof criterioDeBusca !== "object" || Object.keys(criterioDeBusca).length === 0) {
    return res.status(400).json({ error: "Critério de busca deve ser um objeto válido." });
  }

  const camposPermitidos = [
    "name", 
    "type", 
    "habitat", 
    "nome", 
    "tipo", 
    "page",
    "limit",
    "usarClausulaANDParaBusca",
    "precisaoDaBusca",
    "precisaoDaBuscaTraduzidaFloat"
  ];

  const criteriosNormalizados = {};
  for (const [chave, valor] of Object.entries(criterioDeBusca)) {
    if (!camposPermitidos.includes(chave)) {
      return res.status(400).json({ error: `Parâmetro '${chave}' não é permitido.` });
    }
    const chaveNormalizada = chave === "nome" ? "name" : chave === "tipo" ? "type" : chave;
    criteriosNormalizados[chaveNormalizada] = valor;
  }

  const {
    page, 
    limit, 
    usarClausulaANDParaBusca, 
    precisaoDaBusca, 
    precisaoDaBuscaTraduzidaFloat, 
    
    // Cria um novo objeto sem as chaves anteriores
    ...criterios
  } = criteriosNormalizados;

  
  let precisaoDaBuscaFloat = precisaoDaBusca ? parseFloat(precisaoDaBusca) : undefined;
  let usarClausulaANDParaBuscaBool = usarClausulaANDParaBusca ? usarClausulaANDParaBusca === "true" : undefined;

  if (precisaoDaBuscaFloat && (typeof precisaoDaBuscaFloat !== "number" || !Number.isFinite(precisaoDaBuscaFloat) || precisaoDaBuscaFloat < 0 || precisaoDaBuscaFloat > 1)) {
    return res.status(400).json({ error: "A precisão deve ser um número float válido em 0 e 1." });
  }
  
  if (precisaoDaBuscaTraduzidaFloat && (typeof precisaoDaBuscaTraduzidaFloat !== "number" || !Number.isFinite(precisaoDaBuscaTraduzidaFloat) || precisaoDaBuscaTraduzidaFloat < 0 || precisaoDaBuscaTraduzidaFloat > 1)) {
    return res.status(400).json({ error: "A precisão da busca traduzida deve ser um número float válido em 0 e 1." });
  }
  
  req.body.criterioDeBusca = criterios;
  req.body.criterioDePaginacao = { pagina: page, itensPorPagina: limit };
  req.body.usarClausulaANDParaBusca = usarClausulaANDParaBuscaBool;
  req.body.precisaoDaBusca = precisaoDaBuscaFloat;
  req.body.precisaoDaBuscaTraduzida = precisaoDaBuscaTraduzidaFloat;
  next();
}

export default validateSearchParams;
