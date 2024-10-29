import { LocalStorage } from "node-localstorage";
import configureCache from "../../../src/middleware/configure_cache"; 

jest.mock("node-localstorage", () => {
  return {
    LocalStorage: jest.fn().mockImplementation(() => ({
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    }))
  };
});

describe("configureCache Middleware", () => {
  it("deve criar uma instância de LocalStorage e chamar next()", () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    configureCache(req, res, next);

    // Verifica se a instância foi criada
    expect(LocalStorage).toHaveBeenCalledWith("./cache");
    expect(global.localStorage).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("deve permitir armazenamento e recuperação usando localStorage mockado", () => {
    // Configura um item no mock
    global.localStorage.setItem("testKey", "testValue");
    const value = global.localStorage.getItem("testKey");

    expect(global.localStorage.setItem).toHaveBeenCalledWith("testKey", "testValue");
    expect(global.localStorage.getItem).toHaveBeenCalledWith("testKey");
    expect(value).toBeUndefined(); // Como estamos usando um mock, não há armazenamento real.
  });
});
