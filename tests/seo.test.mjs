import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {after, test} from "node:test";
import worker from "../dist/server/index.js";

const origin = process.env.SITE_ORIGIN || "https://area-mestalla.lamunecadesal.chatgpt.site";
const archive = "/hemeroteca/";
const seedStory = "/noticias/harvey-elliott-cesion-valencia/";
const finalSeedStory = "/noticias/arnau-martinez-fichaje-valencia/";
const publishedAt = "2026-11-12T08:02:06.846Z";
const modifiedAt = "2026-11-12T23:30:00.000Z";
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("../drizzle/0000_ediciones.sql", import.meta.url), "utf8"));

const insert = sqlite.prepare("INSERT INTO editorial_articles VALUES (?, ?, ?, ?, ?, ?)");
for (let index = 1; index <= 14; index++) {
  const article = {
    slug: `pieza-${index}`,
    title: `Pieza de prueba ${index}`,
    summary: "Una publicación de prueba de la hemeroteca.",
    paragraphs: ["Texto de prueba."],
    sources: ["https://www.valenciacf.com/noticia-de-prueba"],
    sourceDate: "2026-11-11",
    date: "2026-11-12",
    publishedAt,
    category: "noticia",
    img: "mestalla",
    ...(index === 1 ? {modifiedAt} : {}),
  };
  insert.run(article.slug, article.slug, article.category, article.date, publishedAt, JSON.stringify(article));
}

const db = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    const withArguments = args => ({
      all: async () => ({results: statement.all(...args)}),
      first: async () => statement.get(...args),
    });
    return {...withArguments([]), bind: (...args) => withArguments(args)};
  },
};

const fetchPage = (path, options) => worker.fetch(new Request(new URL(path, origin), options), {DB: db});
const canonical = html => html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
const robots = html => html.match(/<meta name="robots" content="([^"]+)">/)?.[1];
const schemaOf = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
  .flatMap(([, json]) => {
    const data = JSON.parse(json);
    return data["@graph"] ?? [data];
  })
  .find(data => data["@type"] === "NewsArticle");

after(() => sqlite.close());

test("los artículos distinguen la publicación, la fuente y la revisión", async () => {
  const initial = await (await fetchPage(seedStory)).text();
  assert.match(initial, /Publicado: <time datetime="2026-11-12">/);
  assert.match(initial, /Fecha de la fuente: <time datetime="2026-09-01">/);
  assert.equal(schemaOf(initial).datePublished, "2026-11-12");
  assert.equal(schemaOf(initial).dateModified, undefined);

  const article = await (await fetchPage("/noticias/pieza-1/")).text();
  assert.ok(article.includes(`Publicado: <time datetime="${publishedAt}">12 de noviembre de 2026`));
  assert.ok(article.includes(`Actualizado: <time datetime="${modifiedAt}">13 de noviembre de 2026`));
  assert.match(article, /Fecha de la fuente principal: <time datetime="2026-11-11">/);
  assert.equal(schemaOf(article).datePublished, publishedAt);
  assert.equal(schemaOf(article).dateModified, modifiedAt);
});

test("la hemeroteca publica canonicals propios y normaliza la paginación", async () => {
  const first = await fetchPage(archive);
  const firstHtml = await first.text();
  assert.equal(first.status, 200);
  assert.equal(canonical(firstHtml), origin + archive);
  assert.match(firstHtml, /href="\/hemeroteca\/\?pagina=2">Página siguiente/);
  assert.ok(!firstHtml.includes(finalSeedStory));

  const second = await fetchPage(archive + "?pagina=2");
  const secondHtml = await second.text();
  assert.equal(second.status, 200);
  assert.equal(canonical(secondHtml), origin + archive + "?pagina=2");
  assert.equal(robots(secondHtml), "index,follow,max-image-preview:large");
  assert.match(secondHtml, /href="\/hemeroteca\/">Página anterior/);
  assert.ok(secondHtml.includes(finalSeedStory));

  for (const [from, to] of [["?pagina=1", archive], ["?pagina=02", archive + "?pagina=2"]]) {
    const response = await fetchPage(archive + from);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), to);
  }

  for (const query of ["?pagina=3", "?pagina=0", "?pagina=2x", "?pagina=2&tipo=fichajes"]) {
    const response = await fetchPage(archive + query);
    assert.equal(response.status, 404, query);
    const html = await response.text();
    assert.equal(robots(html), "noindex,follow");
    assert.equal(canonical(html), undefined);
  }
  const head = await fetchPage(archive + "?pagina=2", {method: "HEAD"});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("las búsquedas y filtros funcionan sin solicitar indexación", async () => {
  for (const query of ["?tipo=fichajes", "?mes=2026-11", "?q=harvey", "?q=sin-coincidencias"]) {
    const response = await fetchPage(archive + query);
    assert.equal(response.status, 200, query);
    const html = await response.text();
    assert.equal(robots(html), "noindex,follow");
    assert.equal(canonical(html), undefined);
    if (query === "?mes=2026-11" || query === "?q=harvey") assert.ok(html.includes(seedStory));
  }
});

test("el sitemap incluye URLs únicas, enlazadas, indexables y canónicas", async () => {
  const sitemap = await fetchPage("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type"), /application\/xml/);
  const xml = await sitemap.text();
  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)];
  const urls = new Set(entries.map(([, url]) => url));
  assert.equal(entries.length, urls.size);
  assert.ok(urls.has(origin + "/"));
  assert.ok(urls.has(origin + archive));
  assert.ok(!urls.has(origin + "/abonados/"));

  const links = new Set();
  for (const [, url, lastmod] of entries) {
    const response = await fetchPage(url);
    assert.equal(response.status, 200, url);
    assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i);
    const html = await response.text();
    assert.equal(canonical(html), url);
    assert.equal(robots(html), "index,follow,max-image-preview:large");
    for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) links.add(href);
    if (url === origin + seedStory) assert.equal(lastmod, "2026-11-12");
    if (url === origin + "/noticias/pieza-1/") assert.equal(lastmod, modifiedAt);
    if (url === origin + "/noticias/pieza-2/") assert.equal(lastmod, "2026-11-12");
    if (url === origin + archive) assert.equal(lastmod, undefined);
  }

  const second = await (await fetchPage(archive + "?pagina=2")).text();
  for (const [, href] of second.matchAll(/href="(\/noticias\/[^"]+)"/g)) links.add(href);
  for (const url of urls) assert.ok(links.has(new URL(url).pathname), `Sin enlace interno: ${url}`);
});
