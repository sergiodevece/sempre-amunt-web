const EDITORIAL_CATEGORIES = {
  noticia:"Actualidad", cronica:"Crónica", fichajes:"Fichajes",
  entrenamientos:"Entrenamientos", entrevista:"Entrevista", opinion:"Opinión",
};
const EDITORIAL_MEDIA = {
  "valenciacf.com":"Valencia CF", "laliga.com":"LaLiga", "rfef.es":"RFEF",
  "superdeporte.es":"Superdeporte", "plazadeportiva.valenciaplaza.com":"Plaza Deportiva",
  "marca.com":"MARCA Valencia", "deportevalenciano.com":"Deporte Valenciano",
};
const SPORTS_SECTIONS = ["fixtures", "results", "standings", "players"];
const EDITORIAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EDITORIAL_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MADRID = "Europe/Madrid";
const dayFormat = new Intl.DateTimeFormat("en-CA", {timeZone:MADRID,year:"numeric",month:"2-digit",day:"2-digit"});
const editionFormat = new Intl.DateTimeFormat("es-ES", {timeZone:MADRID,dateStyle:"long"});
const matchTime = new Intl.DateTimeFormat("es-ES", {timeZone:MADRID,hour:"2-digit",minute:"2-digit"});
const plain = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pagePath = article => "/noticias/" + article.slug + "/";
const initialArticles = EDITORIAL_SEED.map(a => ({...a, sources:[a.source]}));
const dateText = date => editionFormat.format(new Date(date+"T12:00:00Z"));
const media = url => EDITORIAL_MEDIA[new URL(url).hostname.replace(/^www\./,"")];
const parseText = (value, max) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error("Texto vacío o demasiado largo.");
  return value.trim();
};

function knownDate(date) {
  if (typeof date !== "string" || !EDITORIAL_DATE.test(date) ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) {
    throw new Error("Fecha inválida. Usa AAAA-MM-DD.");
  }
  return date;
}

function editorialUrl(raw, official = false) {
  const url = new URL(raw);
  const name = media(url);
  if (url.protocol !== "https:" || url.port || url.username || url.password || !name ||
      (official && !["Valencia CF","LaLiga","RFEF"].includes(name))) throw new Error("Fuente fuera de la lista autorizada.");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || key === "fbclid") url.searchParams.delete(key);
  }
  return url.href;
}

function countValue(value, max = 999) {
  if (!Number.isInteger(value) || value < 0 || value > max) throw new Error("Dato deportivo numérico inválido.");
  return value;
}

function teamIsValencia(team) { return /^(valencia(?: cf)?)$/i.test(team); }

function normalizeSport(section, block, editionDate) {
  const source = editorialUrl(block?.source, true);
  const max = {fixtures:30,results:30,standings:20,players:60}[section];
  if (!Array.isArray(block.rows) || block.rows.length < 1 || block.rows.length > max ||
      (section === "standings" && block.rows.length !== 20) ||
      (section === "players" && block.rows.length < 11)) throw new Error("La sección " + section + " está incompleta.");
  const widths = {fixtures:8,results:7,standings:8,players:7};
  const rows = block.rows.map(row => {
    if (!Array.isArray(row) || row.length !== widths[section]) throw new Error("Formato de fila inválido en " + section + ".");
    if (section === "standings") {
      const [team,points,pj,pg,pe,pp,gf,gc] = row;
      if (pg + pe + pp !== pj) throw new Error("La clasificación tiene partidos incoherentes.");
      return [parseText(team,70),...([points,pj,pg,pe,pp,gf,gc].map(n=>countValue(n)))];
    }
    if (section === "players") {
      const [dorsal,name,position,min,pj,starts,goals] = row;
      if (!["Portero","Defensa","Centrocampista","Delantero"].includes(position) || starts > pj) throw new Error("Estadísticas incoherentes.");
      return [countValue(dorsal),parseText(name,70),position,countValue(min,10000),countValue(pj),countValue(starts),countValue(goals)];
    }
    const date = knownDate(row[0]);
    if (section === "fixtures") {
      const [,kickoff,home,away,competition,venue,tv,link] = row;
      if (date < editionDate || ![home,away].some(teamIsValencia)) throw new Error("Partido futuro incoherente.");
      if (kickoff !== null && (typeof kickoff !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(kickoff) ||
          !Number.isFinite(Date.parse(kickoff)) || dayFormat.format(new Date(kickoff)) !== date)) throw new Error("Hora de partido inválida.");
      return [date,kickoff,parseText(home,70),parseText(away,70),parseText(competition,80),
              venue ? parseText(venue,90) : "",tv ? parseText(tv,80) : "",editorialUrl(link || source,true)];
    }
    const [,home,away,homeGoals,awayGoals,competition,link] = row;
    if (date > editionDate || ![home,away].some(teamIsValencia)) throw new Error("Resultado incoherente.");
    return [date,parseText(home,70),parseText(away,70),countValue(homeGoals,99),countValue(awayGoals,99),
            parseText(competition,80),editorialUrl(link || source,true)];
  });
  if (section === "standings" && (new Set(rows.map(r=>r[0])).size !== 20 || !rows.some(r=>teamIsValencia(r[0])))) throw new Error("Clasificación sin los 20 equipos.");
  if (section === "players" && new Set(rows.map(r=>r[0])).size !== rows.length) throw new Error("Dorsales duplicados.");
  if (section === "fixtures" || section === "results") rows.sort((a,b)=>section === "fixtures" ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]));
  return {source,rows,date:editionDate};
}

async function normalizeArticle(article, now, date) {
  const {category} = article;
  if (!Object.hasOwn(EDITORIAL_CATEGORIES, category)) throw new Error("Categoría editorial inválida.");
  const title = parseText(article.title, 110);
  const summary = parseText(article.summary, 260);
  if (!Array.isArray(article.paragraphs) || article.paragraphs.length < 1 || article.paragraphs.length > 6 ||
      !Array.isArray(article.sources) || article.sources.length < 1 || article.sources.length > 5) throw new Error("Cada pieza debe tener texto y fuentes.");
  const sources = [...new Set(article.sources.map(url=>editorialUrl(url)))];
  const paragraphs = article.paragraphs.map(p=>parseText(p,900));
  const sourceDate = knownDate(article.source_date);
  if (sourceDate > date) throw new Error("La fuente tiene una fecha posterior a la edición.");
  const sourceKey = category + "\n" + sources[0];
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", ENCODER.encode(sourceKey)));
  const hash = Array.from(digest.slice(0,6),n=>n.toString(16).padStart(2,"0")).join("");
  const stem = title.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/[^a-z0-9]+/g,"-").slice(0,65).replace(/^-|-$/g,"");
  const img = {entrevista:"jugador",opinion:"grada",entrenamientos:"paterna",fichajes:"jugador"}[category] || "mestalla";
  return {slug:(stem || category)+"-"+hash,category,title,summary,paragraphs,sources,sourceDate,date,
          publishedAt:now.toISOString(),sourceKey,img};
}

async function publishEdition(db, edition) {
  if (!db) throw new Error("La base editorial no está disponible.");
  if (!edition || typeof edition !== "object") throw new Error("Edición inválida.");
  const now = new Date();
  const today = dayFormat.format(now);
  const date = knownDate(edition.edition_date);
  if (date !== today) throw new Error("Usa la fecha actual de València: " + today + ".");
  if (!Array.isArray(edition.articles) || edition.articles.length > 12) throw new Error("Máximo de 12 piezas por edición.");
  const sports = edition.sports ?? {};
  if (typeof sports !== "object" || Array.isArray(sports) || Object.keys(sports).some(key=>!SPORTS_SECTIONS.includes(key))) throw new Error("Bloques deportivos inválidos.");
  const snapshots = Object.entries(sports).map(([section,block])=>[section,normalizeSport(section,block,date)]);
  const articles = (await Promise.all(edition.articles.map(article=>normalizeArticle(article,now,date))))
    .filter(a=>!initialArticles.some(seed=>seed.category===a.category && seed.source===a.sources[0]));
  if (!snapshots.length && !articles.length) return {date, published:0, sections:[], message:"La edición se conserva sin cambios."};
  const time = now.toISOString();
  const commands = [db.prepare("INSERT OR IGNORE INTO editorial_runs VALUES (?, ?)").bind(date,time)];
  for (const [section,snapshot] of snapshots) {
    commands.push(db.prepare("INSERT INTO editorial_sports VALUES (?, ?, ?, ?) ON CONFLICT(section, edition_date) DO UPDATE SET checked_at=excluded.checked_at, payload=excluded.payload WHERE excluded.checked_at >= editorial_sports.checked_at")
      .bind(section,date,time,JSON.stringify(snapshot)));
  }
  for (const article of articles) {
    commands.push(db.prepare("INSERT OR IGNORE INTO editorial_articles VALUES (?, ?, ?, ?, ?, ?)")
      .bind(article.slug,article.sourceKey,article.category,date,time,JSON.stringify(article)));
  }
  const result = await db.batch(commands);
  const published = articles.filter((_,i)=>result[1+snapshots.length+i].meta.changes > 0);
  return {date, published:published.length, urls:published.map(a=>EDITORIAL_ORIGIN+pagePath(a)), sections:snapshots.map(([section])=>section)};
}

const EDITION_TOOL = {
  name:"publicar_edicion",
  description:"Publica una edición diaria verificada de SEMPRE AMUNT. Ejecuta los cambios en la web pública. Requiere la identidad de su propietario.",
  inputSchema:{type:"object",required:["edition_date","articles"],properties:{
    edition_date:{type:"string",description:"Fecha actual en Europe/Madrid (AAAA-MM-DD)."},
    articles:{type:"array",maxItems:12,items:{type:"object",required:["category","title","summary","paragraphs","sources","source_date"],
      properties:{category:{type:"string",enum:Object.keys(EDITORIAL_CATEGORIES)},title:{type:"string",maxLength:110},summary:{type:"string",maxLength:260},
      paragraphs:{type:"array",items:{type:"string"},minItems:1,maxItems:6},sources:{type:"array",items:{type:"string"},minItems:1,maxItems:5},source_date:{type:"string"}}}},
    sports:{type:"object",description:"Incluye solo bloques completos comprobados. Cada bloque tiene source (URL oficial) y rows (filas en el orden indicado).",
      properties:Object.fromEntries(Object.entries({
        fixtures:"[fecha, ISO con zona horaria o null, local, visitante, competición, estadio o vacío, TV o vacío, enlace oficial]",
        results:"[fecha, local, visitante, goles local, goles visitante, competición, enlace oficial]",
        standings:"20 filas ordenadas: [equipo, puntos, PJ, PG, PE, PP, GF, GC]",
        players:"plantilla completa: [dorsal, nombre, posición (Portero/Defensa/Centrocampista/Delantero), minutos, PJ, titularidades, goles]"
      }).map(([name,description])=>[name,{type:"object",required:["source","rows"],properties:{source:{type:"string"},
        rows:{type:"array",description,items:{type:"array",items:{type:["string","integer","null"]}}}}}]))}
  }},
};
const STATE_TOOL = {name:"estado_editorial",description:"Consulta las últimas piezas y fechas de los datos de SEMPRE AMUNT para evitar duplicados.",inputSchema:{type:"object",properties:{}}};

function editorialJson(data,status=200) {
  return Response.json(data,{status,headers:protectedHeaders()});
}

async function readBoundedJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Envía un objeto JSON.");
  const decoder = new TextDecoder();
  let text = "", count = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    count += value.byteLength;
    if (count > 100000) {
      await reader.cancel();
      throw new Error("Edición demasiado grande.");
    }
    text += decoder.decode(value,{stream:true});
  }
  return JSON.parse(text + decoder.decode());
}

function ownerCanWrite(request, env) {
  const supplied = request.headers.get("X-Sempre-Editorial-Token");
  const email = request.headers.get("oai-authenticated-user-email");
  if (env.EDITORIAL_SERVICE_TOKEN && supplied && constantEquals(supplied,env.EDITORIAL_SERVICE_TOKEN)) return true;
  return Boolean(env.EDITORIAL_OWNER_EMAIL && email && constantEquals(email.toLowerCase(),env.EDITORIAL_OWNER_EMAIL.toLowerCase()));
}

async function getEditorialState(db) {
  const [recent,sports,last] = await Promise.all([recentArticles(db,15),sportsData(db),
    db ? db.prepare("SELECT MAX(edition_date) AS date FROM editorial_runs").first() : {date:null}]);
  return {date:last?.date, articles:recent.map(a=>({title:a.title,url:EDITORIAL_ORIGIN+pagePath(a),source:a.sources[0],category:a.category})),
          sports:Object.fromEntries(Object.entries(sports).map(([key,entry])=>[key,{date:entry.date,source:entry.source}]))};
}

async function editorialRpc(request, env, path) {
  if (request.method !== "POST") return editorialJson({error:"Método no permitido."},405);
  if (path === "/api/editorial/edition") {
    const supplied = request.headers.get("X-Sempre-Editorial-Token");
    if (!supplied || !env.EDITORIAL_SERVICE_TOKEN || !constantEquals(supplied,env.EDITORIAL_SERVICE_TOKEN)) return editorialJson({error:"Acceso no autorizado."},403);
    try { return editorialJson(await publishEdition(env.DB,await readBoundedJson(request))); }
    catch(error) { return editorialJson({error:error.message},400); }
  }
  let rpc;
  try { rpc = await readBoundedJson(request); }
  catch { return editorialJson({jsonrpc:"2.0",id:null,error:{code:-32700,message:"JSON inválido."}},400); }
  const {id,method,params} = rpc ?? {};
  if (typeof method !== "string") return editorialJson({jsonrpc:"2.0",id:id??null,error:{code:-32600,message:"Petición inválida."}},400);
  if (method.startsWith("notifications/")) return new Response(null,{status:202});
  const result = value => editorialJson({jsonrpc:"2.0",id:id??null,result:value});
  if (method === "server/discover") return result({supportedVersions:["2026-07-28"],capabilities:{tools:{}}});
  if (method === "initialize") return result({protocolVersion:params?.protocolVersion??"2025-06-18",
    capabilities:{tools:{}},serverInfo:{name:"SEMPRE AMUNT",version:"1.0.0"}});
  if (method === "ping") return result({});
  if (method === "tools/list") return result({tools:[STATE_TOOL,EDITION_TOOL]});
  if (method === "tools/call") {
    const toolResult = (body,isError=false) => result({content:[{type:"text",text:JSON.stringify(body)}],isError});
    if (!ownerCanWrite(request,env)) return toolResult({error:"Se requiere la cuenta propietaria."},true);
    try {
      if (params?.name === STATE_TOOL.name) return toolResult(await getEditorialState(env.DB));
      if (params?.name === EDITION_TOOL.name) return toolResult(await publishEdition(env.DB,params.arguments));
      return toolResult({error:"Herramienta desconocida."},true);
    } catch(error) { return toolResult({error:error.message},true); }
  }
  return editorialJson({jsonrpc:"2.0",id:id??null,error:{code:-32601,message:"Método no disponible."}});
}

async function recentArticles(db,limit,category=null) {
  if (!db) return [];
  const query = category
    ? db.prepare("SELECT payload FROM editorial_articles WHERE category = ? ORDER BY published_date DESC, published_at DESC, slug DESC LIMIT ?").bind(category,limit)
    : db.prepare("SELECT payload FROM editorial_articles ORDER BY published_date DESC, published_at DESC, slug DESC LIMIT ?").bind(limit);
  return (await query.all()).results.map(row=>JSON.parse(row.payload));
}

async function sportsData(db) {
  if (!db) return {};
  const rows = await db.prepare("SELECT s.section,s.payload FROM editorial_sports s JOIN (SELECT section,MAX(edition_date) AS edition_date FROM editorial_sports GROUP BY section) l USING(section,edition_date)").all();
  return Object.fromEntries(rows.results.map(row=>[row.section,JSON.parse(row.payload)]));
}

const editorLink = (url,label,classes="text-link") => `<a class="${classes}" href="${plain(url)}">${plain(label)} <span aria-hidden="true">↗</span></a>`;
const editorDate = date => `<time datetime="${date}">${dateText(date)}</time>`;
const editorSection = title => `<div class="section-title"><h2>${plain(title)}</h2></div>`;
const editorPhoto = (a,leading=false) => `<img src="/assets/${a.img}.webp" alt="Ilustración editorial de fútbol" width="768" height="512" ${leading?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
const editorLabel = a => EDITORIAL_CATEGORIES[a.category];
const xmlDate = s => s.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
const htmlText = value => new TextDecoder().decode(base64Bytes(value));

function slot(html,name,value) {
  const start = "<!--"+name+"-->";
  const end = "<!--/"+name+"-->";
  const from = html.indexOf(start);
  const to = html.indexOf(end,from+start.length);
  if (from < 0 || to < 0) return html;
  return html.slice(0,from) + value + html.slice(to+end.length);
}

function editorialCard(a) {
  return `<article class="story-card"><div class="story-photo">${editorPhoto(a)}</div><div class="story-copy">
<span class="kicker">${editorLabel(a)}</span><h3><a href="${pagePath(a)}">${plain(a.title)}</a></h3><p>${plain(a.summary)}</p>
${editorDate(a.date)}</div></article>`;
}

function editorialList(title,articles) {
  if (!articles.length) return "";
  return `<section class="news-section">${editorSection(title)}<div class="cards">${articles.map(editorialCard).join("")}</div></section>`;
}

function leadingArticle(a) {
  return `<article class="lead-story">${editorPhoto(a,true)}<div class="lead-content"><span class="lead-tag">${editorLabel(a)}</span>
<h2><a href="${pagePath(a)}">${plain(a.title)}</a></h2><p>${plain(a.summary)}</p>${editorLink(pagePath(a),"Leer el artículo","lead-link")}</div></article>`;
}

function archiveQuery(url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0,100);
  const category = url.searchParams.get("tipo") || "";
  const month = url.searchParams.get("mes") || "";
  const page = Math.max(1,Math.min(10000,parseInt(url.searchParams.get("pagina"),10)||1));
  return {q,category:Object.hasOwn(EDITORIAL_CATEGORIES,category)?category:"",month:/^\d{4}-(0[1-9]|1[0-2])$/.test(month)?month:"",page};
}

async function archiveRows(db, query) {
  const {q,category,month,page} = query;
  const size = 18;
  if (!db) {
    const matches = initialArticles.filter(a=>(!category||a.category===category)&&(!month||a.date.startsWith(month))&&
      (!q||(a.title+" "+a.summary).toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es"))));
    return {items:matches.slice((page-1)*size,page*size),more:matches.length>page*size};
  }
  const sql = `SELECT payload FROM (
    SELECT payload, category, published_date, published_at, slug FROM editorial_articles
    UNION ALL SELECT value, json_extract(value,'$.category'), json_extract(value,'$.date'), '', json_extract(value,'$.slug') FROM json_each(?)
  )
  WHERE (? = '' OR category = ?) AND (? = '' OR substr(published_date,1,7) = ?)
    AND (? = '' OR instr(lower(json_extract(payload,'$.title') || ' ' || json_extract(payload,'$.summary')),lower(?)) > 0)
  ORDER BY published_date DESC, published_at DESC, slug DESC LIMIT ? OFFSET ?`;
  const found = (await db.prepare(sql).bind(JSON.stringify(initialArticles),category,category,month,month,q,q,size+1,(page-1)*size).all()).results;
  return {items:found.slice(0,size).map(row=>JSON.parse(row.payload)),more:found.length>size};
}

function archiveUrl(query,page) {
  const params = new URLSearchParams();
  if (query.q) params.set("q",query.q);
  if (query.category) params.set("tipo",query.category);
  if (query.month) params.set("mes",query.month);
  if (page>1) params.set("pagina",page);
  return "/hemeroteca/" + (params.size ? "?" + params : "");
}

function renderArchive(query, {items,more}) {
  const options = Object.entries(EDITORIAL_CATEGORIES).map(([key,label])=>
    `<option value="${key}"${key===query.category?" selected":""}>${label}</option>`).join("");
  const previous = query.page>1 ? editorLink(archiveUrl(query,query.page-1),"Página anterior") : "";
  const next = more ? editorLink(archiveUrl(query,query.page+1),"Página siguiente") : "";
  return `<form class="controls data-panel archive-form" method="get" action="/hemeroteca/">
<label>Buscar <input type="search" name="q" maxlength="100" value="${plain(query.q)}"></label>
<label>Tipo de pieza <select name="tipo"><option value="">Todos</option>${options}</select></label>
<label>Mes <input type="month" name="mes" value="${query.month}"></label><button class="member-button" type="submit">Filtrar</button>
<a class="text-link" href="/hemeroteca/">Limpiar filtros</a></form>
${items.length ? editorialList("Archivo editorial",items) : "<p>No hay piezas para esos filtros.</p>"}
<nav class="controls archive-pages" aria-label="Páginas de la hemeroteca">${previous}${next}</nav>`;
}

function renderEditorialArticle(article) {
  const href = EDITORIAL_ORIGIN + pagePath(article);
  const safeTitle = plain(article.title);
  const safeSummary = plain(article.summary);
  const hero = editorPhoto(article,true);
  const sources = article.sources.map(url=>"<li>"+editorLink(url,media(url))+"</li>").join("");
  const kindNote = article.category === "entrevista" ? "<p>Resumen de la entrevista publicada en la fuente enlazada.</p>" : "";
  const content = `<article class="article-page"><div class="page-heading">
<nav class="crumbs" aria-label="Ruta de navegación"><a href="/">Portada</a> / <a href="/hemeroteca/">Hemeroteca</a></nav>
<span class="kicker">${editorLabel(article)}</span><h1>${safeTitle}</h1><p>${safeSummary}</p></div>
<div class="byline"><span>Redacción SEMPRE AMUNT · Edición automática</span>${editorDate(article.date)}</div>
<figure>${hero}<figcaption>Ilustración editorial del proyecto.</figcaption></figure>
<div class="article-body">${kindNote}${article.paragraphs.map(p=>"<p>"+plain(p)+"</p>").join("")}
<section class="data-panel" aria-label="Fuentes"><strong>Fuentes consultadas</strong><ul>${sources}</ul><p class="source-note">Fecha de la fuente principal: ${editorDate(article.sourceDate)}</p></section>
<p>${editorLink("/hemeroteca/","Ver hemeroteca")}</p></div></article>`;
  const schema = {"@context":"https://schema.org","@type":article.category==="opinion"?"Article":"NewsArticle",
    headline:article.title,description:article.summary,datePublished:article.publishedAt,
    author:{"@type":"Organization",name:"Redacción SEMPRE AMUNT"},image:EDITORIAL_ORIGIN+"/assets/"+article.img+".webp",
    mainEntityOfPage:href,inLanguage:"es-ES"};
  const template = EDITORIAL_TEMPLATE.replaceAll("TITULO_EDICION",()=>safeTitle)
    .replaceAll("RESUMEN_EDICION",()=>safeSummary)
    .replaceAll(EDITORIAL_ORIGIN+"/noticias/edicion-dinamica/",()=>href);
  return slot(template,"articulo-dinamico",content).replace("</head>",
    '<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+"</script></head>");
}

function sportNote(snap, extra="") {
  return `<p class="source-note">${extra} Datos comprobados el ${editorDate(snap.date)}. ${editorLink(snap.source,media(snap.source))}</p>`;
}

function fixturesHtml(snapshot) {
  const today = dayFormat.format(new Date());
  const rows = snapshot.rows.map(([date,kickoff,home,away,competition,venue,tv,url],i)=>{
    if (date < today) return "";
    const kind = teamIsValencia(home)?"casa":"fuera";
    const details = [kickoff?matchTime.format(new Date(kickoff)):"Horario por confirmar",venue,tv].filter(Boolean).map(plain).join(" · ");
    const calendar = kickoff ? `<a class="text-link" download href="/calendario/edicion-${snapshot.date}-${i}.ics">Añadir al calendario ↓</a>` : "";
    return `<article class="match-row" data-kind="${kind}"><time datetime="${date}"><strong>${Number(date.slice(-2))}</strong><span>${date.slice(5,7)}/${date.slice(0,4)}</span></time>
<div><span class="kicker">${plain(competition)} · ${kind==="casa"?"EN CASA":"FUERA"}</span><h3>${plain(home)} – ${plain(away)}</h3><p>${details}</p></div>
<div class="match-actions">${editorLink(url,"Ficha oficial")}${calendar}</div></article>`;
  }).join("");
  return `<section class="data-panel" data-filter-group>${editorSection("Próximos partidos")}
<div class="controls"><label>Localía <select data-kind-select><option value="">Todos los partidos</option><option value="casa">En casa</option><option value="fuera">Fuera de casa</option></select></label><span class="filter-count" aria-live="polite"></span></div>
<div class="match-list">${rows || "<p>El próximo partido está pendiente de confirmación.</p>"}</div>${sportNote(snapshot,"Horarios peninsulares.")}</section>`;
}

function resultsHtml(snapshot) {
  const rows = snapshot.rows.map(([date,home,away,hg,ag,competition,url])=>
    `<tr><td>${editorDate(date)}</td><th scope="row">${plain(home)} – ${plain(away)}</th><td><strong>${hg}–${ag}</strong></td>
<td>${plain(competition)}</td><td>${editorLink(url,"Ficha oficial")}</td></tr>`).join("");
  return `<section class="data-panel news-section">${editorSection("Últimos resultados")}
<div class="table-scroll" tabindex="0" role="region" aria-label="Resultados del Valencia CF">
<table><caption class="sr-only">Resultados del Valencia CF</caption><thead><tr>
${["Fecha","Partido","Marcador","Competición","Fuente"].map(t=>`<th scope="col">${t}</th>`).join("")}
</tr></thead><tbody>${rows}</tbody></table></div>${sportNote(snapshot)}</section>`;
}

function shortFixture(snapshot) {
  const today = dayFormat.format(new Date());
  const upcoming = snapshot.rows.find(row=>row[0] >= today);
  if (!upcoming) return `<section class="fixture-widget"><header><h2>PRÓXIMO PARTIDO</h2></header>
<div class="fixture-body"><p>Pendiente de confirmación</p>${editorLink("/partidos/","Ver calendario","fixture-link")}</div></section>`;
  const [date,kickoff,home,away,competition,venue] = upcoming;
  const badge = team => `<span class="team-badge${teamIsValencia(team)?" valencia":""}" aria-hidden="true">${teamIsValencia(team)?"VCF":plain(team.split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,3).toUpperCase())}</span>`;
  return `<section class="fixture-widget" aria-labelledby="prox-title"><header><h2 id="prox-title">PRÓXIMO PARTIDO</h2><span>${plain(competition)}</span></header>
<div class="fixture-body"><div class="fixture-teams"><div>${badge(home)}<strong>${plain(home)}</strong></div><span class="versus">VS</span><div>${badge(away)}<strong>${plain(away)}</strong></div></div>
<div class="fixture-date">${editorDate(date)} · ${kickoff?matchTime.format(new Date(kickoff)):"Horario por confirmar"}</div>
<div class="fixture-place">${plain(venue)}</div>${editorLink("/partidos/","Ver calendario","fixture-link")}</div></section>`;
}

function shortResult(snapshot) {
  const [date,home,away,hg,ag,competition] = snapshot.rows[0];
  return `<div class="score-strip"><span class="score-label"><i></i> ÚLTIMO RESULTADO</span><span>${plain(home)} <strong>${hg}–${ag}</strong> ${plain(away)}</span>
<span class="score-competition">${plain(competition)} · ${editorDate(date)}</span>${editorLink("/partidos/#resultados","Resultados","score-link")}</div>`;
}

function standingsRows(snapshot,compact) {
  const place = snapshot.rows.findIndex(row=>teamIsValencia(row[0]));
  const first = compact ? Math.max(0,Math.min(snapshot.rows.length-5,place-2)):0;
  const rows = compact ? snapshot.rows.slice(first,first+5) : snapshot.rows;
  return rows.map(([team,pts,pj,pg,pe,pp,gf,gc],i)=>{
    const highlight = teamIsValencia(team) ? ' class="highlight"'+(!compact?' id="valencia-cf"':"") : "";
    const nums = compact ? [pj,pts] : [pj,pg,pe,pp,gf,gc,gf-gc,pts];
    return `<tr${highlight}><td>${first+i+1}</td><th scope="row">${plain(team)}</th>${nums.map(n=>`<td>${n}</td>`).join("")}</tr>`;
  }).join("");
}

function standingsHtml(snapshot,compact=false) {
  const labels = compact ? ["Pos.","Equipo","PJ","Pts."] : ["Pos.","Equipo","PJ","PG","PE","PP","GF","GC","DG","Pts."];
  const table = `<table${compact?"":' class="wide-table"'}><caption class="sr-only">Clasificación de LaLiga</caption>
<thead><tr>${labels.map(t=>`<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${standingsRows(snapshot,compact)}</tbody></table>`;
  if (compact) return `<section class="standings-widget"><div class="widget-heading"><h2>CLASIFICACIÓN</h2><span>LALIGA</span></div>
${table}<div class="widget-bottom">${editorLink("/clasificacion/","Ver clasificación completa")}</div></section>`;
  return `<section class="data-panel">${editorSection("Tabla de la competición")}<div class="controls">${editorLink("#valencia-cf","Ir a la fila del Valencia CF")}</div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Clasificación">${table}</div>${sportNote(snapshot)}</section>`;
}

function playersHtml(snapshot) {
  const rows = snapshot.rows.map(([n,name,position,min,pj,starts,goals])=>`<tr data-kind="${position}" data-name="${plain(name)}" data-dorsal="${n}" data-minutos="${min}" data-goles="${goals}">
<td>${n}</td><th scope="row">${plain(name)}</th><td>${position}</td><td>${min.toLocaleString("es-ES")}</td><td>${pj}</td><td>${starts}</td><td>${goals}</td></tr>`).join("");
  const positionOptions = ["Portero","Defensa","Centrocampista","Delantero"].map(p=>`<option>${p}</option>`).join("");
  return `<section class="data-panel" data-filter-group>${editorSection("Rendimiento por jugador")}
<div class="controls"><label>Jugador <input type="search" data-name-input placeholder="Buscar por nombre"></label><label>Posición <select data-kind-select><option value="">Todas</option>${positionOptions}</select></label>
<label>Ordenar por <select data-order-select><option value="dorsal">Dorsal</option><option value="minutos">Más minutos</option><option value="goles">Más goles</option></select></label><span class="filter-count" aria-live="polite"></span></div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Estadísticas por jugador"><table class="wide-table players"><caption class="sr-only">Estadísticas de LaLiga por futbolista</caption>
<thead><tr>${["Dorsal","Jugador","Posición","Minutos","PJ","Tit.","Goles"].map(t=>`<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
<p class="empty-state" hidden>No hay jugadores que coincidan con los filtros.</p>${sportNote(snapshot,"Solo partidos de Liga.")}</section>`;
}

function responseEdition(request, body, type="html") {
  return new Response(request.method==="HEAD"?null:body,{headers:headers({
    "Content-Type":CONTENT_TYPES[type],"Cache-Control":"public, max-age=0, must-revalidate",
    ...(!INDEXABLE?{"X-Robots-Tag":"noindex, follow"}:{}),
  })});
}

function calendarEsc(value) { return value.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,"); }

async function editionCalendar(request,db,match) {
  if (!db) return null;
  const record = await db.prepare("SELECT payload FROM editorial_sports WHERE section='fixtures' AND edition_date=?").bind(match[1]).first();
  const row = record && JSON.parse(record.payload).rows[Number(match[2])];
  if (!row?.[1]) return null;
  const [,kickoff,home,away,,venue,,url] = row;
  const start = new Date(kickoff);
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SEMPRE AMUNT//Calendario//ES","BEGIN:VEVENT",
    `UID:edicion-${match[1]}-${match[2]}@sempre-amunt`,`DTSTAMP:${xmlDate(new Date(match[1]+"T00:00:00Z"))}`,
    `DTSTART:${xmlDate(start)}`,`DTEND:${xmlDate(new Date(start.getTime()+7200000))}`,
    "SUMMARY:"+calendarEsc(home+" - "+away),"LOCATION:"+calendarEsc(venue),"URL:"+url,"END:VEVENT","END:VCALENDAR"];
  const folded = lines.map(line=>{
    let output="",count=0;
    for(const c of line) {
      const bytes=ENCODER.encode(c).length;
      if(count+bytes>75) {output+="\r\n ";count=1;}
      output+=c;count+=bytes;
    }
    return output;
  });
  return responseEdition(request,folded.join("\r\n")+"\r\n","ics");
}

async function editorialPage(request,env,url) {
  const {pathname:path} = url;
  const db = env.DB;
  const staticHtml = () => htmlText(PUBLIC_FILES[path+"index.html"]);
  const dateStamp = async html => {
    if (!db) return html;
    const row = await db.prepare("SELECT MAX(edition_date) AS date FROM editorial_runs").first();
    return row?.date ? slot(html,"fecha-edicion",editorDate(row.date)) : html;
  };
  if (path === "/hemeroteca/") {
    const query = archiveQuery(url);
    return responseEdition(request,await dateStamp(slot(staticHtml(),"archivo",renderArchive(query,await archiveRows(db,query)))));
  }
  if (path === "/sitemap.xml") {
    const base = htmlText(PUBLIC_FILES[path]);
    const {results} = db ? await db.prepare("SELECT slug,published_date FROM editorial_articles ORDER BY published_date DESC,slug DESC LIMIT 49000").all() : {results:[]};
    const extra = results.map(r=>`  <url><loc>${EDITORIAL_ORIGIN}/noticias/${r.slug}/</loc><lastmod>${r.published_date}</lastmod></url>\n`).join("");
    return responseEdition(request,base.replace("</urlset>",extra+"</urlset>"),"xml");
  }
  if (path === "/assets/busqueda.json") {
    const fresh = await recentArticles(db,100);
    const base = JSON.parse(htmlText(PUBLIC_FILES[path]));
    return responseEdition(request,JSON.stringify([...fresh.map(a=>({url:pagePath(a),title:a.title,description:a.summary})),...base]),"json");
  }
  const calendar = path.match(/^\/calendario\/edicion-(\d{4}-\d{2}-\d{2})-(\d{1,2})\.ics$/);
  if (calendar) return editionCalendar(request,db,calendar);
  if (path.startsWith("/noticias/") && !PUBLIC_FILES[path+"index.html"]) {
    const slug = path.split("/")[2];
    if (!EDITORIAL_SLUG.test(slug||"") || path !== "/noticias/"+slug+"/" || !db) return null;
    const row = await db.prepare("SELECT payload FROM editorial_articles WHERE slug=?").bind(slug).first();
    return row ? responseEdition(request,await dateStamp(renderEditorialArticle(JSON.parse(row.payload)))) : null;
  }
  if (!["/","/actualidad/","/fichajes/","/entrenamientos/","/partidos/","/clasificacion/","/estadisticas/"].includes(path)) return null;
  let html = staticHtml();
  if (path === "/") {
    const [fresh,sports] = await Promise.all([recentArticles(db,8),sportsData(db)]);
    if (fresh.length) {
      const primary = fresh.find(a=>a.category==="noticia"||a.category==="cronica") || fresh[0];
      html = slot(html,"principal",leadingArticle(primary));
      html = slot(html,"portada-noticias",[...fresh.filter(a=>a!==primary),...initialArticles].slice(0,3).map(editorialCard).join(""));
    }
    if (sports.results) html = slot(html,"marcador",shortResult(sports.results));
    if (sports.fixtures) html = slot(html,"proximo",shortFixture(sports.fixtures));
    if (sports.standings) html = slot(html,"tabla-breve",standingsHtml(sports.standings,true));
  } else if (path === "/actualidad/") {
    const recent = await recentArticles(db,12);
    if (recent.length) html = slot(html,"actualidad-noticias",[...recent,...initialArticles].map(editorialCard).join(""));
  } else if (path === "/fichajes/" || path === "/entrenamientos/") {
    const recent = await recentArticles(db,12,path.slice(1,-1));
    html = slot(html,"noticias-seccion",editorialList("Últimas publicaciones",recent));
  } else {
    const sports = await sportsData(db);
    if (path === "/partidos/") {
      if (sports.fixtures) html = slot(html,"datos",fixturesHtml(sports.fixtures));
      if (sports.results) html = html.replace("</main>",()=>'<div id="resultados">'+resultsHtml(sports.results)+"</div></main>");
    }
    if (path === "/clasificacion/" && sports.standings) html = slot(html,"datos",standingsHtml(sports.standings));
    if (path === "/estadisticas/" && sports.players) html = slot(html,"datos",playersHtml(sports.players));
  }
  return responseEdition(request,await dateStamp(html));
}
