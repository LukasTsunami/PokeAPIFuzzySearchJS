// index.test.js
import app from '../../src/app.js'; 

describe('Inicialização do Servidor', () => {
  it('não deve iniciar o servidor na porta real', () => {
    // Mocka o app.listen para evitar que o servidor inicie
    const listenMock = jest.spyOn(app, 'listen').mockImplementation(() => {});


    // Carrega `index.js`, que vai tentar chamar `listen`
    require('../../src/server.js');

    // Verifica se `listen` foi chamado com a porta e função de callback
    expect(listenMock).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
    
    listenMock.mockRestore();  // Restaura o comportamento original após o teste
  });
});
