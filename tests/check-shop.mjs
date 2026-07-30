#!/usr/bin/env node
/**
 * Validação da loja — roda todo dia pelo GitHub Actions.
 *
 * Confere se os dados da API continuam no formato que o site espera.
 * Se a Epic ou a API mudarem algo, isso falha e avisa ANTES de o site
 * aparecer quebrado para quem acessa.
 *
 * Uso:
 *   node check-shop.mjs                 → valida a loja ao vivo
 *   node check-shop.mjs arquivo.json    → valida um arquivo local
 */

const URL_API = "https://fortnite-api.com/v2/shop?language=pt-BR";
const falhas = [];
const avisos = [];

function falha(msg) { falhas.push(msg); }
function aviso(msg) { avisos.push(msg); }

/* ---------- mesma extração usada pelo site ---------- */
function extrairCards(data) {
  const entries = (data && data.data && data.data.entries) || [];
  const out = [];
  for (const e of entries) {
    let items = [];
    for (const k of ["brItems", "tracks", "instruments", "cars", "legoKits"]) {
      if (Array.isArray(e[k])) items = items.concat(e[k]);
    }
    const b = e.bundle || {}, p = items[0] || {}, L = e.layout || {};
    let icon = "", feat = "";
    for (const it of items) {
      const im = it.images || {};
      icon = im.icon || im.smallIcon || im.small || it.albumArt || "";
      feat = im.featured || icon;
      if (icon) break;
    }
    if (!icon && b.image) { icon = feat = b.image; }

    const nda = e.newDisplayAsset || {};
    const renders = [];
    for (const r of (nda.renderImages || [])) if (r && r.image) renders.push(r.image);

    const styleGroups = [], styles = [];
    for (const va of (p.variants || [])) {
      const ops = [];
      (va.options || []).forEach((op, i) => {
        if (op && op.image) ops.push({ name: op.name || ("Opção " + (i + 1)), image: op.image });
      });
      if (ops.length) {
        styleGroups.push({ label: (va.type || va.channel || "").trim(), options: ops, channel: va.channel });
        for (const o of ops) styles.push(o);
      }
    }

    const isTrack = !!(p.title && (p.albumArt || p.artist));
    const title = b.name || p.name || p.title || e.devName || "";

    out.push({
      title, price: e.finalPrice, regularPrice: e.regularPrice,
      section: L.name || "", sIndex: L.index,
      rarity: (p.rarity && p.rarity.value) || "",
      type: (p.type && p.type.value) || (isTrack ? "song" : (b.name ? "bundle" : "")),
      image: icon, featured: feat, renders, styles, styleGroups,
      variantes: (p.variants || []).filter(v => (v.options || []).some(o => o && o.image)).length,
      opcoesNaFonte: (p.variants || []).reduce((n, v) => n + (v.options || []).filter(o => o && o.image).length, 0),
      outDate: e.outDate || "", video: p.showcaseVideo || "",
    });
  }
  return out;
}

/* galeria do site: só artes de verdade, nunca amostras de estilo */
function galeria(c) {
  const p = [];
  for (const r of (c.renders || [])) if (!p.includes(r)) p.push(r);
  if (c.featured && !p.includes(c.featured)) p.push(c.featured);
  if (c.image && !p.includes(c.image)) p.push(c.image);
  if (!p.length && c.styles.length) p.push(c.styles[0].image);
  return p;
}

/* ---------- execução ---------- */
const arquivo = process.argv[2];
let data;

if (arquivo) {
  const { readFileSync } = await import("node:fs");
  const bruto = readFileSync(arquivo, "utf8");
  data = JSON.parse(bruto.slice(bruto.indexOf('{"status"')));
  console.log(`Validando arquivo local: ${arquivo}`);
} else {
  console.log(`Consultando ${URL_API}`);
  const r = await fetch(URL_API);
  if (!r.ok) { console.error(`ERRO: API respondeu HTTP ${r.status}`); process.exit(1); }
  data = await r.json();
}

/* 1. estrutura básica */
if (data.status !== 200) falha(`campo status veio "${data.status}", esperado 200`);
const entries = (data.data && data.data.entries) || [];
if (!Array.isArray(entries) || entries.length === 0) falha("data.entries vazio ou ausente");
if (!data.data || !data.data.date) falha("data.date ausente (data da loja)");

const cards = extrairCards(data);
console.log(`Itens encontrados: ${cards.length}`);

/* 2. cada item precisa do mínimo para o site funcionar */
let semFoto = 0, semPreco = 0, semTitulo = 0, semSecao = 0, semValidade = 0;
let amostraVazando = 0;

for (const c of cards) {
  if (!c.title) semTitulo++;
  if (typeof c.price !== "number") semPreco++;
  if (!c.section) semSecao++;
  if (!c.outDate || isNaN(new Date(c.outDate))) semValidade++;

  const fotos = galeria(c);
  if (!fotos.length) { semFoto++; continue; }

  // regressão que já aconteceu: amostra de cor virando foto principal
  const amostras = new Set(c.styles.map(s => s.image));
  if (fotos.some(f => amostras.has(f)) && (c.renders.length || c.featured)) amostraVazando++;
  if (fotos.some(f => /\/variants\//.test(f)) && c.renders.length) amostraVazando++;
}

/* 2b. estilos: nada pode ser perdido nem ficar sem rótulo de grupo */
let estiloPerdido = 0, grupoSemRotulo = 0;
for (const c of cards) {
  const naGaleria = c.styleGroups.reduce((n, g) => n + g.options.length, 0);
  if (naGaleria !== c.opcoesNaFonte) estiloPerdido++;
  if (c.styleGroups.length !== c.variantes) estiloPerdido++;
  for (const g of c.styleGroups) if (!g.label) grupoSemRotulo++;
}
if (estiloPerdido) falha(`${estiloPerdido} item(ns) perdendo opções de estilo entre a fonte e a exibição`);
if (grupoSemRotulo) falha(`${grupoSemRotulo} grupo(s) de estilo sem rótulo — o usuário não saberia o que a opção altera`);

if (semTitulo) falha(`${semTitulo} item(ns) sem nome`);
if (semPreco) falha(`${semPreco} item(ns) sem preço numérico`);
if (semFoto) falha(`${semFoto} item(ns) sem nenhuma imagem — apareceriam vazios no site`);
if (amostraVazando) falha(`${amostraVazando} item(ns) com amostra de cor entrando na galeria de fotos`);
if (semSecao) aviso(`${semSecao} item(ns) sem seção (vão cair em "Outros")`);
if (semValidade) aviso(`${semValidade} item(ns) sem data de saída válida`);

/* 3. campos que alimentam recursos do site */
const comVideo = cards.filter(c => c.video).length;
const comRender = cards.filter(c => c.renders.length).length;
const comEstilo = cards.filter(c => c.styles.length).length;
const secoes = new Set(cards.map(c => c.section)).size;

console.log(`Seções: ${secoes} · com vídeo: ${comVideo} · com arte de render: ${comRender} · com estilos: ${comEstilo}`);

if (secoes < 2) aviso("menos de 2 seções — o agrupamento por conjunto pode ter mudado de formato");
if (comRender === 0) aviso("nenhum item com arte de render — o campo newDisplayAsset pode ter mudado");

/* 4. as imagens realmente existem? (amostra, para não pesar) */
const amostraUrls = [...new Set(cards.flatMap(c => galeria(c)).slice(0, 12))];
let quebradas = 0;
if (!arquivo) {
  for (const u of amostraUrls) {
    try {
      const r = await fetch(u, { method: "HEAD" });
      if (!r.ok) { quebradas++; console.error(`  imagem inacessível (HTTP ${r.status}): ${u}`); }
    } catch { quebradas++; console.error(`  imagem inacessível: ${u}`); }
  }
  console.log(`Imagens testadas: ${amostraUrls.length} · quebradas: ${quebradas}`);
  if (quebradas > amostraUrls.length / 4) falha(`${quebradas} de ${amostraUrls.length} imagens inacessíveis`);
}

/* ---------- resultado ---------- */
console.log("");
if (avisos.length) {
  console.log("AVISOS (não bloqueiam):");
  for (const a of avisos) console.log(`  - ${a}`);
}
if (falhas.length) {
  console.error("FALHAS:");
  for (const f of falhas) console.error(`  - ${f}`);
  console.error("\nValidação REPROVADA — o site pode estar exibindo algo errado.");
  process.exit(1);
}
console.log("Validação aprovada: os dados estão no formato que o site espera.");
