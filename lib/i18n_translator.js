import * as translations from '../config/i18n/pt-br.json';

export class I18nTranslator {
  traduzir(termo) {
    const termoNormalizado = termo.toLowerCase();

    // Itera sobre cada grupo de traduções (tipos, habitats, etc.)
    for (const categoria in translations) {
      const grupoDeTraducoes = translations[categoria];
      
      for (const [termoEmPortugues, termoEmIngles] of Object.entries(grupoDeTraducoes)) {
        // Verifica se o termo corresponde ao termo em português ou ao termo em inglês
        if (termoEmPortugues === termoNormalizado || termoEmIngles === termoNormalizado) {
          return termoEmIngles; // Sempre retorna o termo em inglês
        }
      }
    }

    return termo; // Retorna o termo original se não encontrar uma tradução
  }
}
