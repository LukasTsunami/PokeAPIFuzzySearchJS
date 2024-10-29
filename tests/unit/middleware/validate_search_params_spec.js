import validateSearchParams from "../../../src/middleware/validate_search_params"; 

describe("validateSearchParams Middleware", () => {
  const mockReq = (query = {}) => ({ query: query || {}, body: {} }); // Garante que `query` e `body` sejam sempre objetos
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar 400 se criterioDeBusca for vazio", () => {
    const req = mockReq({});
    const res = mockRes();

    validateSearchParams(req, res, mockNext);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Critério de busca deve ser um objeto válido." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para parâmetro não permitido", () => {
    const req = mockReq({ nome: "exemplo", invalidParam: "nao_permitido" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Parâmetro 'invalidParam' não é permitido." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve normalizar os campos nome e tipo para name e type", () => {
    const req = mockReq({ nome: "leao", tipo: "mamifero" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(req.body.criterioDeBusca).toEqual({ name: "leao", type: "mamifero" });
    expect(mockNext).toHaveBeenCalled();
  });

  it("deve converter precisaoDaBusca para float e verificar limites válidos", () => {
    const req = mockReq({ precisaoDaBusca: "0.5" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(req.body.precisaoDaBusca).toBe(0.5);
    expect(mockNext).toHaveBeenCalled();
  });

  it("deve retornar 400 para precisaoDaBusca fora dos limites", () => {
    const req = mockReq({ precisaoDaBusca: "1.5" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "A precisão deve ser um número float válido em 0 e 1." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para precisaoDaBuscaTraduzidaFloat fora dos limites", () => {
    const req = mockReq({ precisaoDaBuscaTraduzidaFloat: "2" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "A precisão da busca traduzida deve ser um número float válido em 0 e 1." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve converter usarClausulaANDParaBusca para boolean", () => {
    const req = mockReq({ usarClausulaANDParaBusca: "true" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(req.body.usarClausulaANDParaBusca).toBe(true);
    expect(mockNext).toHaveBeenCalled();
  });

  it("deve configurar a paginação corretamente", () => {
    const req = mockReq({ page: "1", limit: "10" });
    const res = mockRes();

    validateSearchParams(req, res, mockNext);

    expect(req.body.criterioDePaginacao).toEqual({ pagina: "1", itensPorPagina: "10" });
    expect(mockNext).toHaveBeenCalled();
  });
});
