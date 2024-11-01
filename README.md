# <img src="https://cdn-icons-png.flaticon.com/512/1033/1033083.png" width="40" height="40" /> FuzzyPokemonSearch API

Bem-vindo(a)! 

Este guia vai te ensinar a usar o `FuzzyPokemonSearch`, uma ferramenta poderosa para buscar Pokémon e suas características usando busca aproximada (fuzzy search). 

O mecanismo permite encontrar itens mesmo com erros de digitação, misturando critérios de busca em inglês e português.

Você pode subir a api pela docker com o comando

`docker compose up app-dev`

Uma vez que a API estiver em pé, você pode consumir ela pela URI

`/api/buscar?`

Passando como parâmetro os critérios de busca (por hora só estão implementados tipo, habitat e nome)

Usar a API é bem similar à usar os objetos javascript (a forma que consome a API usando a fuzzy search, portanto não vou cobrir essa parte na documentação da API, use os exemplos abaixo como base para o consumo da api também)

| Critério  | Variações dele que funcionam |O que ele representa|
| ------------- | ------------- |-----------|
| name  | nome  |Nome do Pokémon|
| type  | tipo  |Tipo do Pokémon|
| habitat  | habitat  |Onde ele habita|
| page  | page  |Página Atual|
| limit  | limit  |Quantidade de Itens por Página|
| usarClausulaANDParaBusca  | usarClausulaANDParaBusca  |Se true, faz uma busca usando operador lógico AND, padrão é OR|
| precisaoDaBusca  | precisaoDaBusca  |Um valor de 0 a 1 que refina quantas variações da mesma palavra pode trazer|
| precisaoDaBuscaTraduzidaFloat  | precisaoDaBuscaTraduzidaFloat  |Um valor de 0 a 1 que refina quantas variações da mesma palavra pode trazer, pra termos traduzidos|

Para Rodar os testes simplesmente rode o comando

`docker compose run app-dev npm run test `

ou simplesmente, se for rodar da sua máquina:

`npm run dev`

As traduções ficam na pasta 
`config/i18n/abreviação_linguagem.json`

___


# FuzzyPokemonSearch - Guia Completo de Uso dos objetos JS:

## Pré-requisitos

Certifique-se de instalar as dependências necessárias e configurar o cache se estiver no node:
```javascript
import { LocalStorage } from 'node-localstorage';
import { FuzzyPokemonSearch, PokemonDataFetcher } from './fuzzy_search.js';

global.localStorage = new LocalStorage('./cache');
```

## 1. Como Configurar o Mecanismo de Busca

Primeiro, obtemos os dados dos Pokémon e instanciamos a busca:
```javascript
const dadosDePokemonComDetalhes = await PokemonDataFetcher.obterListaDePokemonComHabitatETipo();
const mecanismoDeBusca = new FuzzyPokemonSearch({ dadosDePokemon: dadosDePokemonComDetalhes, itensPorPagina: 20 });
```

## 2. Exemplos de Uso

### 2.1. Busca por Nome Exato
Para buscar por um Pokémon com nome exato:
```javascript
const buscaPorNomeExato = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'pikachu' },
    usarClausulaANDParaBusca: false,
    pagina: 1
});
console.log("Resultado - Busca por Nome Exato (Pikachu):", buscaPorNomeExato.data);
```

### 2.2. Busca por Tipo e Habitat com Erro de Digitação

A ferramenta é ideal para buscar informações aproximadas:
```javascript
const buscaPorHabitatETipo = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'montanha', type: 'foga' },
    usarClausulaANDParaBusca: true,
    pagina: 1
});
console.log("Resultado - Busca com Erro de Digitação (Montanha e Fogo):", buscaPorHabitatETipo.data);
```

### 2.3. Busca com Lógica OR e AND

#### Lógica OR
Combina os critérios sem rigor, buscando por um ou outro termo:
```javascript
const buscaOr = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'fire', habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
});
console.log("Resultado - Busca por Tipo Fogo ou Habitat Floresta:", buscaOr.data);
```

#### Lógica AND
Combina os critérios de forma rigorosa:
```javascript
const buscaAnd = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'fire', habitat: 'mountain' },
    usarClausulaANDParaBusca: true,
    pagina: 1
});
console.log("Resultado - Busca com Tipo Fogo e Habitat Montanha:", buscaAnd.data);
```

### 2.4. Busca em Português e Misturada com Inglês

É possível misturar idiomas nos critérios de busca, e o sistema faz a tradução automaticamente:
```javascript
const buscaMista = await mecanismoDeBusca.buscar({
    criterioDeBusca: { type: 'fogo', habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 1
});
console.log("Resultado - Busca Mista com Termos em Português e Inglês:", buscaMista.data);
```

### 2.5. Paginação dos Resultados

Para buscar em páginas específicas e controlar a quantidade de itens:
```javascript
const buscaPaginada = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'forest' },
    usarClausulaANDParaBusca: false,
    pagina: 2
});
console.log("Resultado - Página 2, Habitat Floresta:", buscaPaginada.data);
```

## 3. Cenários Adicionais de Busca

### 3.1. Busca Complexa com Critérios Combinados
Busque por múltiplos critérios e com fuzzy search:
```javascript
const buscaComplexa = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'mountain', type: 'fire', name: 'char' },
    usarClausulaANDParaBusca: true,
    pagina: 1
});
console.log("Resultado - Busca Complexa com Nome, Tipo e Habitat:", buscaComplexa.data);
```

### 3.2. Busca por Termos Inexistentes
Verifique o comportamento ao buscar por termos que não estão no cache:
```javascript
const buscaInexistente = await mecanismoDeBusca.buscar({
    criterioDeBusca: { name: 'unknownmon', type: 'space' },
    usarClausulaANDParaBusca: false,
    pagina: 1
});
console.log("Resultado - Busca por Termos Inexistentes:", buscaInexistente.data);
```

### 3.3. Busca com Erros de Digitação
```javascript
const buscaComErro = await mecanismoDeBusca.buscar({
    criterioDeBusca: { habitat: 'muntanha', type: 'foga' },
    usarClausulaANDParaBusca: true,
    pagina: 1
});
console.log("Resultado - Busca com Erro de Digitação (Montanha e Fogo):", buscaComErro.data);
```

## 4. Conclusão

A `FuzzyPokemonSearch` é uma ferramenta versátil que permite buscas flexíveis e eficientes, até mesmo com erros de digitação e misturas de idiomas. Configure o critério de busca conforme a necessidade e ajuste a lógica `AND/OR` para obter resultados mais específicos ou amplos. Divirta-se explorando o universo Pokémon com este mecanismo de busca!
