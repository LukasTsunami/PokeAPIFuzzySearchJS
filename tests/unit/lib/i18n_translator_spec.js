import { I18nTranslator } from '../../../src/lib/i18n_translator';
import * as translations from '../../../config/i18n/pt-br.json';

describe('I18nTranslator', () => {
  let tradutor;

  beforeAll(() => {
    tradutor = new I18nTranslator();
  });

  describe('tradução de termos para inglês', () => {
    test('deve traduzir um termo em português para o termo em inglês correspondente', () => {
      const termo = 'fogo'; // Português para "fire"
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('fire');
    });

    test('deve retornar o termo em inglês se já estiver em inglês', () => {
      const termo = 'fire'; // Já está em inglês
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('fire');
    });

    test('deve retornar o termo original se não houver tradução disponível', () => {
      const termo = 'inexistente';
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('inexistente');
    });
  });

  describe('tradução de diferentes categorias', () => {
    test('deve traduzir um habitat em português para inglês', () => {
      const termo = 'floresta'; // Português para "forest"
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('forest');
    });

    test('deve traduzir um tipo de Pokémon em português para inglês', () => {
      const termo = 'elétrico'; // Português para "electric"
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('electric');
    });
  });

  describe('tradução insensível a maiúsculas e minúsculas', () => {
    test('deve traduzir um termo em português para inglês, ignorando maiúsculas e minúsculas', () => {
      const termo = 'FOGO'; // Maiúsculo
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('fire');
    });

    test('deve traduzir um termo em inglês, ignorando maiúsculas e minúsculas', () => {
      const termo = 'Electric'; // Com inicial maiúscula
      const traducao = tradutor.traduzir(termo);
      expect(traducao).toBe('electric');
    });
  });

  describe('casos com termos que possuem múltiplas traduções', () => {
    test('deve retornar o termo correspondente à tradução certa quando existirem múltiplas traduções', () => {
      const termoPortugues = 'grama'; // Português para "grass"
      const traducao = tradutor.traduzir(termoPortugues);
      expect(traducao).toBe('grass');

      const termoIngles = 'grass';
      const traducaoIngles = tradutor.traduzir(termoIngles);
      expect(traducaoIngles).toBe('grass');
    });
  });
});
