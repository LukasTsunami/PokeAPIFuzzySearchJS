import request from "supertest";
import app from "../../src/app.js"; 

describe("Testes para o app Express", () => {
  it("deve responder com 404 para uma rota inexistente", async() => {
    const res = await request(app).get("/rota-nao-existente");
    expect(res.statusCode).toBe(404);
  });

  it("deve verificar se existe o endpoint /api/buscar", async() => {
    const res = await request(app).options("/api/buscar");  
    expect([200]).toContain(res.statusCode); 
    expect(["GET", "HEAD"]).toEqual(res.headers["allow"].split(",")); 
  });
});
