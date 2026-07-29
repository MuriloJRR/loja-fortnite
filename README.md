# Loja do Fortnite

**Consulte a loja diária do Fortnite sem abrir o jogo.**

Em português, organizada por conjuntos como no jogo — com foto de cada item, preço em V-Bucks, contagem regressiva e prévia animada.

**Acesse:** [fortnite-paticular.netlify.app](https://fortnite-paticular.netlify.app)

![HTML](https://img.shields.io/badge/HTML-100%25-e34f26?style=flat-square&logo=html5&logoColor=white)
![Netlify](https://img.shields.io/badge/deploy-Netlify-00c7b7?style=flat-square&logo=netlify&logoColor=white)
![Licença](https://img.shields.io/badge/licença-MIT-8b5cf6?style=flat-square)

---

## Por que existe

Para ver a loja dentro do jogo é preciso abrir o launcher, esperar atualização e carregar o lobby — vários minutos só para conferir se saiu uma skin.

Este site resolve isso em um clique: abre no navegador, no celular ou no PC, e mostra exatamente o que está na loja naquele momento. Sem login, sem instalar nada, sem esperar.

## O que ele faz

A loja se atualiza **sozinha**. A cada visita a página busca os dados atuais direto da API pública, então o link sempre mostra a loja do dia — sem precisar republicar nada.

### Loja

- Itens agrupados **por conjunto**, na mesma ordem em que aparecem no jogo
- Foto de cada item, com **cor de fundo conforme a raridade**
- Preço em **V-Bucks**, destacando desconto quando houver
- **Quanto tempo falta** para cada item sair da loja
- Contador do **reset diário** (21h, horário de Brasília)
- **Filtros por tipo**: skins, gestos, picaretas, mochilas, ajudantes, músicas…
- Busca por nome ou conjunto, e ordenação por preço ou alfabética

### Detalhe do item

- **Prévia animada** (vídeo de showcase), quando o item tiver
- **Visual completo** da skin, com miniaturas para alternar entre as artes
- **Estilos alternativos** listados com nome e miniatura clicável
- Data e hora exatas de saída da loja

### Novidades

- Feed oficial do jogo em português, o mesmo da tela de novidades
- Atalhos para as notas de atualização oficiais

---

## Como funciona

```
Navegador do visitante  ──▶  API pública (fortnite-api.com)  ──▶  página monta a loja
        │
        └── HTML servido pelo Netlify (arquivo único, ~60 KB)
```

O site é um **único arquivo HTML**, sem framework e sem build. Todo o CSS e JavaScript estão embutidos, e as imagens vêm direto dos servidores do jogo — por isso é leve e rápido.

Há uma cópia local dos dados dentro do arquivo, usada só como reserva: se a API estiver fora do ar, a página ainda abre e avisa que está mostrando uma amostra.

---

## Tecnologias

- **HTML, CSS e JavaScript puros** — sem dependências
- **Fontes**: Bebas Neue e Chakra Petch (Google Fonts)
- **Ícones**: SVG desenhados à mão, sem biblioteca
- **Hospedagem**: Netlify, com publicação automática a cada envio
- **Releases**: GitHub Actions publica automaticamente a partir de tags `v*`

---

## Estrutura

```
.
├── index.html                      # o site inteiro
└── .github/workflows/release.yml   # publica a release a partir da tag
```

---

## Publicando uma nova versão

O site vai ao ar sozinho a cada alteração no `index.html`. Para registrar uma versão:

```bash
git tag -a v1.2.0 -m "Versão 1.2 — título aqui

- primeira mudança
- segunda mudança"
git push origin v1.2.0
```

A primeira linha da mensagem vira o **título** da release; o resto vira as **notas**.

---

## Créditos

Dados da loja e das novidades: [fortnite-api.com](https://fortnite-api.com) (API pública e gratuita da comunidade).

Código sob licença [MIT](LICENSE). Projeto pessoal, sem vínculo com a Epic Games. Fortnite e os nomes de itens são marcas da Epic Games, Inc. Preços exibidos em **V-Bucks**, a moeda do jogo — não em dinheiro real.
