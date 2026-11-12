"""Genera el HTML semántico y los recursos estáticos de SEMPRE AMUNT."""
import base64
import json
import os
import shutil
from datetime import datetime, timedelta, timezone
from html import escape as e
from pathlib import Path
from zoneinfo import ZoneInfo

from contenido import ARTICULOS, CALENDARIO, CLASIFICACION, CLUB, ESTADISTICAS, FICHAJES, JUGADORES, LIGA, PARTIDOS, TABLA

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
CLIENT = OUT / "client"
ORIGIN = os.getenv("SITE_ORIGIN", "https://area-mestalla.lamunecadesal.chatgpt.site").rstrip("/")
INDEXABLE = os.getenv("SITE_INDEXABLE", "1") == "1"
EDITION = "12 de noviembre de 2026"
TOUR = CLUB + "/mestalla-forever-tour"
MONTHS = "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split()
NAV = [
    ("/", "Portada"), ("/actualidad/", "Actualidad"), ("/fichajes/", "Fichajes"),
    ("/entrenamientos/", "Entrenamientos"), ("/partidos/", "Partidos"),
    ("/clasificacion/", "Clasificación"), ("/estadisticas/", "Estadísticas"),
    ("/hemeroteca/", "Hemeroteca"),
]
PAGES = []
SEARCH = []

def date_label(iso):
    value = datetime.fromisoformat(iso)
    return f"{value.day} de {MONTHS[value.month - 1]} de {value.year}"

def external(url, label, classes="text-link"):
    return f'<a class="{classes}" href="{e(url)}">{e(label)} <span aria-hidden="true">↗</span></a>'

def link(url, label, classes="text-link"):
    return f'<a class="{classes}" href="{e(url)}">{e(label)} <span aria-hidden="true">→</span></a>'

def symbol(name):
    icons = {
        "search": '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
        "lock": '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
        "menu": '<path d="M3 6h18M3 12h18M3 18h18"/>',
        "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
        "pin": '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    }
    return f'<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{icons[name]}</svg>'

def wordmark():
    return '<a class="brand" href="/" aria-label="SEMPRE AMUNT, portada"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>SEMPRE<span class="brand-accent"> AMUNT</span></span></a>'

def layout(path, title, description, body, current=None, schema=None, private=False, share="social.jpg"):
    current = path if current is None else current
    url = ORIGIN + path
    full_title = title + " | SEMPRE AMUNT"
    nav = "".join(f'<a href="{href}"' + (' aria-current="page"' if href == current else '') + f'>{label}</a>' for href, label in NAV)
    data = {"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":ORIGIN+"/#website",
        "url":ORIGIN+"/","name":"SEMPRE AMUNT","inLanguage":"es-ES"}] + (schema or [])}
    robots = "index,follow,max-image-preview:large" if INDEXABLE and not private else "noindex,follow"
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(description)}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{e(url)}">
<meta property="og:site_name" content="SEMPRE AMUNT">
<meta property="og:type" content="{'article' if path.startswith('/noticias/') else 'website'}">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(ORIGIN)}/assets/{share}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#191b19">
<link rel="icon" href="/assets/favicon.png" type="image/png">
<link rel="preload" href="/assets/barlow-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/assets/estilos.css">
<script type="application/ld+json">{json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")}</script>
<script src="/assets/sitio.js" defer></script>
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="site-header">
  <div class="utility"><div class="wrap utility-inner"><span>València <span class="dot">·</span> <!--fecha-edicion--><time datetime="2026-11-12">Jueves, 12 de noviembre de 2026</time><!--/fecha-edicion--></span><a href="/proyecto/">Sobre el proyecto</a></div></div>
  <div class="wrap masthead"><div>{wordmark()}<div class="tagline">DIARIO VALENCIANISTA INDEPENDIENTE</div></div>
  <div class="mast-actions"><button class="search-button" type="button" data-search-open aria-label="Buscar">{symbol("search")}<span>Buscar</span></button><a class="member-button" href="/abonados/" aria-label="Abonados">{symbol("lock")}<span>Abonados</span></a><button class="menu-button" type="button" aria-expanded="false" aria-controls="nav-principal" aria-label="Menú">{symbol("menu")}</button></div></div>
  <div class="nav-band"><nav id="nav-principal" class="wrap main-nav" aria-label="Navegación principal">{nav}</nav></div>
</header>
<main id="contenido" class="wrap main-content" tabindex="-1">{body}</main>
<footer class="site-footer"><div class="wrap footer-grid"><div>{wordmark()}<p>Proyecto de Lenguajes de Marcas · DAM</p><p>Medio independiente sin afiliación al Valencia CF.</p></div><div><h2>Secciones</h2><a href="/actualidad/">Actualidad</a><a href="/partidos/">Calendario</a><a href="/estadisticas/">Estadísticas</a><a href="/hemeroteca/">Hemeroteca</a><a href="/abonados/">Área de abonados</a></div><div><h2>Fuentes</h2>{external(CLUB,"Valencia CF")}{external(LIGA,"LaLiga")}{external("https://www.superdeporte.es/valencia-cf/","Superdeporte")}<a href="/proyecto/">Créditos y metodología</a></div></div><div class="wrap footer-bottom">© 2026 SEMPRE AMUNT <a href="#contenido">Volver arriba ↑</a></div></footer>
<dialog class="search-dialog" id="buscador" aria-labelledby="buscar-titulo"><div class="dialog-head"><h2 id="buscar-titulo">Buscar en SEMPRE AMUNT</h2><form method="dialog"><button class="icon-button" aria-label="Cerrar búsqueda">×</button></form></div><label class="sr-only" for="buscar">Término de búsqueda</label><input id="buscar" type="search" placeholder="Noticias, jugadores, partidos…" autocomplete="off"><p class="search-status" aria-live="polite"></p><ul class="search-results"></ul></dialog>
</body></html>'''

def save(path, title, description, body, *, searchable=True, **options):
    target = CLIENT / path.lstrip("/") / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    if path in ("/partidos/", "/clasificacion/", "/estadisticas/"):
        start = body.index("</div>") + len("</div>")
        body = body[:start] + "<!--datos-->" + body[start:] + "<!--/datos-->"
    if path in ("/fichajes/", "/entrenamientos/"):
        body += "<!--noticias-seccion--><!--/noticias-seccion-->"
    target.write_text(layout(path, title, description, body, **options), encoding="utf-8")
    if not options.get("private"):
        PAGES.append(path)
    if searchable:
        SEARCH.append({"url":path, "title":title, "description":description})

def heading(title, description, parent=None):
    trail = '<a href="/">Portada</a>'
    if parent:
        trail += f' <span aria-hidden="true">/</span> <a href="{parent[0]}">{parent[1]}</a>'
    return f'<div class="page-heading"><nav class="crumbs" aria-label="Ruta de navegación">{trail} <span aria-hidden="true">/</span> <span aria-current="page">{e(title)}</span></nav><h1>{e(title)}</h1><p>{e(description)}</p></div>'

def breadcrumb_data(*items):
    trail = [("/", "Portada"), *items]
    return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i,"name":name,"item":ORIGIN+path}
            for i,(path,name) in enumerate(trail,1)]}

def photo(article, *, priority=False):
    loading = 'fetchpriority="high"' if priority else 'loading="lazy"'
    return f'<img src="/assets/{article["img"]}.webp" alt="{e(article["alt"])}" width="768" height="512" {loading} decoding="async">'

def story_path(article):
    return f'/noticias/{article["slug"]}/'

def article_card(article):
    return f'''<article class="story-card"><a class="story-photo" href="{story_path(article)}" tabindex="-1" aria-hidden="true">{photo(article)}</a><div class="story-copy">
<span class="kicker">{article["tag"]}</span><h3><a href="{story_path(article)}">{e(article["title"])}</a></h3><p>{e(article["intro"])}</p>
<time datetime="{article["date"]}">{date_label(article["date"])}</time></div></article>'''

def section_title(title, url=None, label=None):
    action = link(url, label) if url else ""
    return f'<div class="section-title"><h2>{title}</h2>{action}</div>'

def ad(kind="tour"):
    if kind == "tour":
        return f'''<aside class="ad-box" aria-label="Espacio publicitario de demostración"><div class="ad-label">PUBLICIDAD DE MUESTRA</div><div class="ad-creative"><span>MESTALLA FOREVER TOUR</span><strong>La grada,<br>por dentro.</strong>{external(TOUR,"Descubrir el tour","ad-link")}</div></aside>'''
    return f'''<aside class="member-promo" aria-label="Autopromoción"><div><span class="kicker">ÁREA DE ABONADOS</span><h2>El fútbol también se vive en la grada.</h2><p>Entrevistas, sorteos, encuentros y viajes con la comunidad.</p></div>{link("/abonados/","Entrar al área","member-button")}</aside>'''

def team_badge(team):
    names = {"Valencia CF":("VCF","valencia"),"Rayo Vallecano":("RAY","rayo"),"CA Osasuna":("OSA","osasuna")}
    initials, style = names.get(team,("",""))
    return f'<span class="team-badge {style}" aria-hidden="true">{initials}</span>'

def match_widget():
    return f'''<section class="fixture-widget" aria-labelledby="prox-title"><header><h2 id="prox-title">{symbol("calendar")} PRÓXIMO PARTIDO</h2><span>JORNADA 13</span></header>
<div class="fixture-body"><div class="fixture-teams"><div>{team_badge("Rayo Vallecano")}<strong>Rayo Vallecano</strong></div><span class="versus">VS</span><div>{team_badge("Valencia CF")}<strong>Valencia CF</strong></div></div>
<div class="fixture-date"><time datetime="2026-11-21T16:15:00+01:00">Sáb. 21 nov. · 16:15</time></div><div class="fixture-place">{symbol("pin")} Estadio de Vallecas</div>{link("/partidos/","Ver calendario","fixture-link")}</div></section>'''

def table_short():
    rows = "".join(f'<tr class="{"highlight" if i == 19 else ""}"><td>{i}</td><th scope="row">{team}</th><td>{pj}</td><td><strong>{pts}</strong></td></tr>'
        for i,(team,pts,pj,*_) in enumerate(CLASIFICACION,1) if i >= 16)
    return f'''<section class="standings-widget" aria-labelledby="mini-title"><div class="widget-heading"><h2 id="mini-title">CLASIFICACIÓN</h2><span>LALIGA 26/27</span></div>
<table><caption class="sr-only">Últimas cinco posiciones de LaLiga</caption><thead><tr><th scope="col">POS</th><th scope="col">EQUIPO</th><th scope="col">PJ</th><th scope="col">PTS</th></tr></thead><tbody>{rows}</tbody></table>
<div class="widget-bottom">{link("/clasificacion/","Ver clasificación completa")}</div></section>'''

def homepage():
    story = ARTICULOS[0]
    body = f'''<!--marcador--><div class="score-strip"><span class="score-label"><i></i> ÚLTIMO RESULTADO</span><span>UE Tavernes <strong>0–6</strong> Valencia CF</span><span class="score-competition">Copa del Rey</span>{link(story_path(story),"Crónica","score-link")}</div><!--/marcador-->
<div class="front-heading"><div><span class="kicker">PORTADA</span><h1>El Valencia CF, al día</h1></div><div class="edition">TEMPORADA <strong>2026/27</strong></div></div>
<div class="front-grid"><div><!--principal--><article class="lead-story">{photo(story, priority=True)}<div class="lead-content"><span class="lead-tag">{story["tag"]}</span><h2><a href="{story_path(story)}">{e(story["title"])}</a></h2><p>{e(story["intro"])}</p>{link(story_path(story),"Leer la crónica","lead-link")}</div></article><!--/principal-->
<section class="news-section">{section_title("Últimas noticias","/actualidad/","Ver toda la actualidad")}<div class="cards"><!--portada-noticias-->{''.join(map(article_card,ARTICULOS[1:4]))}<!--/portada-noticias--></div></section></div>
<aside class="sidebar" aria-label="Datos del equipo y publicidad"><!--proximo-->{match_widget()}<!--/proximo--><!--tabla-breve-->{table_short()}<!--/tabla-breve-->{ad()}</aside></div>
<section class="quick-section">{section_title("El Valencia, en datos")}<div class="quick-grid"><a href="/partidos/"><span>CALENDARIO</span><strong>La agenda del equipo</strong><i aria-hidden="true">↗</i></a><a href="/estadisticas/"><span>PLANTILLA</span><strong>Jugador a jugador</strong><i aria-hidden="true">↗</i></a><a href="/fichajes/"><span>MERCADO</span><strong>Altas confirmadas</strong><i aria-hidden="true">↗</i></a></div></section>{ad("members")}'''
    save("/", "Valencia CF, noticias y actualidad", "Noticias del Valencia CF, fichajes, entrenamientos, próximos partidos, clasificación y estadísticas en un diario valencianista independiente.", body)

def sports_pages():
    summary = "Noticias y crónicas del primer equipo del Valencia CF, con enlaces a sus fuentes."
    body = heading("Actualidad del Valencia CF", summary) + f'''<section class="news-section">{section_title("Noticias y crónicas")}<div class="cards"><!--actualidad-noticias-->{''.join(map(article_card, ARTICULOS[:3]))}<!--/actualidad-noticias--></div></section>'''
    save("/actualidad/", "Actualidad del Valencia CF", summary, body,
         schema=[breadcrumb_data(("/actualidad/", "Actualidad"))])

    summary = "Incorporaciones confirmadas del Valencia CF en el mercado de verano 2026/27."
    transfers = [(ARTICULOS[3],"cesion","Cesión","Liverpool FC"),(ARTICULOS[4],"traspaso","Traspaso","Girona FC")]
    rows = "".join(f'''<tr data-kind="{kind}"><th scope="row"><a href="{story_path(article)}">{article["title"].split(",")[0] if kind == "cesion" else "Arnau Martínez"}</a></th><td>{club}</td><td><span class="pill">{name}</span></td><td><time datetime="{article["date"]}">{date_label(article["date"])}</time></td></tr>''' for article,kind,name,club in transfers)
    body = heading("Fichajes del Valencia CF", summary) + f'''<section class="data-panel" data-filter-group>
{section_title("Altas confirmadas")}<div class="controls"><label>Tipo de operación <select data-kind-select><option value="">Todas</option><option value="cesion">Cesiones</option><option value="traspaso">Traspasos</option></select></label><span class="filter-count" aria-live="polite"></span></div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de fichajes"><table><caption class="sr-only">Altas seleccionadas del Valencia CF</caption><thead><tr><th scope="col">Jugador</th><th scope="col">Procedencia</th><th scope="col">Operación</th><th scope="col">Anuncio</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="source-note">Selección editorial. {external(FICHAJES,"Ver todos los movimientos en LaLiga")}</p></section><section class="news-section">{section_title("Historias del mercado")}<div class="cards">{''.join(map(article_card,ARTICULOS[3:]))}</div></section>'''
    save("/fichajes/", "Fichajes del Valencia CF 2026/27", summary, body,
         schema=[breadcrumb_data(("/fichajes/", "Fichajes"))])

    summary = "Partes de trabajo y noticias de los entrenamientos del primer equipo."
    article = ARTICULOS[2]
    body = heading("Entrenamientos del Valencia CF", summary) + f'''<div class="feature-grid"><article class="photo-feature">{photo(article,priority=True)}<div><span class="kicker">PLAN DE TRABAJO</span><h2>{e(article["title"])}</h2><p>{e(article["intro"])}</p>{link(story_path(article),"Leer el artículo")}</div></article><aside class="data-panel"><span class="kicker">PRIMER EQUIPO</span><h2>Consulta las sesiones</h2><p>El club publica las sesiones y las condiciones de acceso en sus partes de trabajo.</p>{external(article["source"],"Ver el parte del Valencia CF")}</aside></div>'''
    save("/entrenamientos/", "Entrenamientos del Valencia CF", summary, body,
         schema=[breadcrumb_data(("/entrenamientos/", "Entrenamientos"))])

    summary = "Calendario del Valencia CF en LaLiga 2026/27 con horarios, estadios y televisión."
    fixtures = []
    for date, day, month, hour, round_no, home, away, venue, tv, kind, slug in PARTIDOS:
        match_url = LIGA + "/partido/temporada-2026-2027-laliga-ea-sports-" + slug
        facts = " · ".join(item for item in (hour or "Horario por confirmar", venue, tv) if item)
        download = f'<a class="text-link" href="/calendario/{slug}.ics" download>Añadir al calendario <span aria-hidden="true">↓</span></a>' if hour else ""
        fixtures.append(f'''<article class="match-row" data-kind="{kind}"><time datetime="{date}"><span>{day}</span><strong>{int(date[-2:])}</strong><span>{month}</span></time><div><span class="kicker">LALIGA · JORNADA {round_no} · {"EN CASA" if kind == "casa" else "FUERA"}</span><h3>{e(home)} <span>–</span> {e(away)}</h3><p>{e(facts)}</p></div><div class="match-actions">{external(match_url,"Ficha del partido")}{download}</div></article>''')
        if hour:
            write_ics(date,hour,home,away,venue,slug,match_url)
    body = heading("Próximos partidos del Valencia CF", summary) + f'''<section class="data-panel" data-filter-group>
{section_title("Calendario de LaLiga")}<div class="controls"><label>Localía <select data-kind-select><option value="">Todos los partidos</option><option value="casa">En casa</option><option value="fuera">Fuera de casa</option></select></label><span class="filter-count" aria-live="polite"></span></div><div class="match-list">{''.join(fixtures)}</div>
<p class="source-note">Horarios peninsulares. Corte del {EDITION}. {external(CALENDARIO,"Calendario oficial de LaLiga")}</p></section>'''
    save("/partidos/", "Próximos partidos del Valencia CF", summary, body,
         schema=[breadcrumb_data(("/partidos/", "Partidos"))])

def write_ics(date,hour,home,away,venue,slug,match_url):
    start = datetime.fromisoformat(f"{date}T{hour}").replace(tzinfo=ZoneInfo("Europe/Madrid")).astimezone(timezone.utc)
    fmt = "%Y%m%dT%H%M%SZ"
    target = CLIENT / "calendario" / (slug + ".ics")
    target.parent.mkdir(exist_ok=True)
    lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SEMPRE AMUNT//Calendario//ES","BEGIN:VEVENT",
             f"UID:{slug}@sempre-amunt", "DTSTAMP:20261112T000000Z", f"DTSTART:{start:{fmt}}",
             f"DTEND:{start+timedelta(hours=2):{fmt}}",f"SUMMARY:{home} - {away}",f"LOCATION:{venue}",
             f"URL:{match_url}","END:VEVENT","END:VCALENDAR",""]
    folded = []
    for line in lines:
        current = ""
        for character in line:
            if len((current + character).encode()) > 75:
                folded.append(current)
                current = " "
            current += character
        folded.append(current)
    target.write_bytes("\r\n".join(folded).encode())

def stats_pages():
    summary = "Tabla completa de LaLiga EA Sports 2026/27 con puntos, resultados y diferencia de goles."
    rows = []
    for i,(team,pts,pj,pg,pe,pp,gf,gc) in enumerate(CLASIFICACION,1):
        cells = "".join(f"<td>{v}</td>" for v in (pj,pg,pe,pp,gf,gc,f"{gf-gc:+d}" if gf!=gc else 0,pts))
        highlight = ' class="highlight" id="valencia-cf"' if i == 19 else ""
        rows.append(f"<tr{highlight}><td>{i}</td><th scope='row'>{e(team)}</th>{cells}</tr>")
    labels = ["Pos.","Equipo","PJ","PG","PE","PP","GF","GC","DG","Pts."]
    headers = "".join(f'<th scope="col">{l}</th>' for l in labels)
    body = heading("Clasificación de LaLiga 2026/27", summary) + f'''<section class="data-panel">
{section_title("Tabla de la competición")}<div class="controls">{link("#valencia-cf","Ir a la fila del Valencia CF")}</div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla completa de clasificación"><table class="wide-table"><caption class="sr-only">Clasificación de LaLiga EA Sports</caption><thead><tr>{headers}</tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<p class="source-note">Corte del {EDITION}. {external(TABLA,"Ver clasificación oficial actualizada")}</p></section>'''
    save("/clasificacion/", "Clasificación de LaLiga 2026/27 y posición del Valencia CF", summary, body,
         schema=[breadcrumb_data(("/clasificacion/", "Clasificación"))])

    summary = "Minutos, partidos, titularidades y goles de los jugadores del Valencia CF en LaLiga 2026/27."
    rows = []
    for number,name,position,mins,games,starts,goals in JUGADORES:
        rows.append(f'<tr data-kind="{position}" data-name="{e(name)}" data-dorsal="{number}" data-minutos="{mins}" data-goles="{goals}"><td>{number}</td><th scope="row">{e(name)}</th><td>{position}</td><td>{mins:,}'.replace(",","." ) + f'</td><td>{games}</td><td>{starts}</td><td>{goals}</td></tr>')
    labels = ["Dorsal","Jugador","Posición","Minutos","PJ","Tit.","Goles"]
    headers = "".join(f'<th scope="col">{l}</th>' for l in labels)
    options = "".join(f'<option>{p}</option>' for p in ("Portero","Defensa","Centrocampista","Delantero"))
    body = heading("Estadísticas del Valencia CF", summary) + f'''<section class="data-panel" data-filter-group>{section_title("Rendimiento por jugador")}
<div class="controls"><label>Jugador <input type="search" data-name-input placeholder="Buscar por nombre"></label><label>Posición <select data-kind-select><option value="">Todas</option>{options}</select></label><label>Ordenar por <select data-order-select><option value="dorsal">Dorsal</option><option value="minutos">Más minutos</option><option value="goles">Más goles</option></select></label><span class="filter-count" aria-live="polite"></span></div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Tabla de estadísticas por jugador"><table class="wide-table players"><caption class="sr-only">Estadísticas de LaLiga por futbolista</caption><thead><tr>{headers}</tr></thead><tbody>{''.join(rows)}</tbody></table></div><p class="empty-state" hidden>No hay jugadores que coincidan con los filtros.</p>
<p class="source-note">Solo partidos de Liga. Corte del {EDITION}. {external(ESTADISTICAS,"Ver datos completos en LaLiga")}</p></section>'''
    save("/estadisticas/", "Estadísticas por jugador del Valencia CF 2026/27", summary, body,
         schema=[breadcrumb_data(("/estadisticas/", "Estadísticas"))])

def articles():
    sections = {"Actualidad":"/actualidad/","Entrenamientos":"/entrenamientos/","Fichajes":"/fichajes/"}
    for article in ARTICULOS:
        path = story_path(article)
        parent = (sections[article["cat"]],article["cat"])
        paragraphs = "".join(f"<p>{e(line)}</p>" for line in article["paragraphs"])
        schema = [breadcrumb_data(parent,(path,article["title"])), {"@type":"NewsArticle","headline":article["title"],
                  "description":article["intro"],"datePublished":"2026-11-12",
                  "author":{"@type":"Organization","name":"Redacción SEMPRE AMUNT","url":ORIGIN+"/proyecto/"},
                  "publisher":{"@type":"Organization","name":"SEMPRE AMUNT"},
                  "image":ORIGIN+f'/assets/{article["img"]}.webp',"mainEntityOfPage":ORIGIN+path,"inLanguage":"es-ES"}]
        related = [a for a in ARTICULOS if a is not article][:2]
        body = f'''<article class="article-page">{heading(article["title"],article["intro"],parent)}
<div class="byline"><span>Redacción SEMPRE AMUNT</span><time datetime="2026-11-12">{EDITION}</time></div>
<figure>{photo(article,priority=True)}<figcaption>Ilustración editorial generada para este proyecto.</figcaption></figure>
<div class="article-body">{paragraphs}<p class="source-note">Fuente consultada: {external(article["source"],article["source_name"])}</p>{link(parent[0],f"Volver a {article['cat'].lower()}")}</div></article><section class="news-section">{section_title("Sigue leyendo")}<div class="cards">{''.join(map(article_card,related))}</div></section>'''
        save(path, article["title"], article["intro"], body, current=parent[0], schema=schema, share=article["img"]+".webp")

def members():
    summary = "Entrevistas, sorteos, eventos y viajes del área de abonados de SEMPRE AMUNT."
    body = f'''<section class="member-hero"><div><span class="kicker">SEMPRE AMUNT</span><h1>Área de abonados</h1><p>{summary}</p><p class="member-disclaimer">El acceso de revisión funciona con un código de prueba.</p></div></section>
<div class="member-login data-panel"><h2>Acceso de abonados</h2><form action="/abonados/acceso/" method="post"><label for="codigo">Código de acceso</label><input id="codigo" type="password" name="code" maxlength="64" required autocomplete="off" aria-describedby="acceso-aviso"><p id="acceso-aviso" class="login-error" role="alert" hidden></p><button class="member-button" type="submit">{symbol("lock")} Entrar</button></form></div>'''
    save("/abonados/", "Área de abonados", summary, body, private=True)
    activities = [
        ("entrevistas","ENTREVISTAS","La previa desde dentro","Guion de ejemplo para entrevistar a un jugador sobre su rutina antes de un partido.","¿Qué cambia en tu preparación cuando juegas fuera de casa? ¿Qué consejo darías a un canterano antes de su debut? ¿Qué detalles estudias del rival durante la semana?",""),
        ("sorteos","SORTEOS","Una bufanda para la grada","Ejemplo de sorteo de una bufanda de edición especial entre abonados.","La participación de prueba se guarda en este navegador. No hay adjudicación ni premio real.","Probar participación"),
        ("eventos","EVENTOS","Encuentro de peñas en València","Ejemplo de encuentro con una charla sobre la historia de Mestalla y un coloquio de aficionados.","Programa de ejemplo: bienvenida a las 17:00, charla a las 17:30 y coloquio a las 18:15. Fecha y lugar sin confirmar.","Marcar interés"),
        ("viajes","VIAJES","Viaje de la afición a Vallecas","Ejemplo de ficha para organizar un desplazamiento colectivo desde València.","La ficha sirve para ensayar la organización de puntos de salida, horarios y plazas. No existe una reserva real.","Marcar interés"),
    ]
    cards=[]
    for slug,label,title,desc,detail,button in activities:
        control = f'<button type="button" class="member-button" data-interest="{slug}" aria-pressed="false">{button}</button><p class="interest-status" aria-live="polite"></p>' if button else ""
        cards.append(f'''<article class="member-card" id="{slug}"><span class="kicker">{label}</span><h2>{title}</h2><p>{desc}</p><details><summary>Ver detalles</summary><p>{detail}</p>{control}</details></article>''')
    body = heading("Comunidad de abonados","Contenido de demostración. Los eventos, viajes y sorteos son ejemplos del proyecto.") + f'''<div class="member-tools"><nav aria-label="Categorías de abonados">{''.join(f'<a href="#{slug}">{label.title()}</a>' for slug,label,*_ in activities)}</nav><form action="/abonados/salir/" method="post"><button class="text-link" type="submit">Cerrar sesión</button></form></div><div class="member-grid">{''.join(cards)}</div>'''
    return layout("/abonados/comunidad/","Comunidad de abonados",summary,body,current="/abonados/",private=True)

def about():
    summary = "Créditos y fuentes del diario valencianista independiente creado para Lenguajes de Marcas."
    body = heading("Sobre SEMPRE AMUNT", summary) + f'''<div class="prose-card"><h2>El proyecto</h2><p>SEMPRE AMUNT es un proyecto académico de Lenguajes de Marcas del ciclo DAM. Toma como referencia la organización de un diario deportivo, con portada, secciones temáticas, fichas de actualidad y espacios publicitarios.</p>
<h2>Fuentes y actualización</h2><p>Los textos son originales y enlazan a las fuentes consultadas. Los datos de Liga corresponden al corte del {EDITION}. Las páginas de LaLiga enlazadas ofrecen los valores actualizados.</p>
<ul><li>{external(CLUB,"Valencia CF, noticias y comunicados")}</li><li>{external(CALENDARIO,"LaLiga, calendario del Valencia CF")}</li><li>{external(TABLA,"LaLiga, clasificación")}</li><li>{external(ESTADISTICAS,"LaLiga, estadísticas")}</li><li>{external("https://www.superdeporte.es/valencia-cf/","Superdeporte, referencia editorial")}</li></ul>
<h2>Imágenes, anuncios y abonados</h2><p>Las imágenes son ilustraciones generadas para el proyecto. Los espacios de publicidad son ejemplos sin contrato comercial. Los contenidos del área de abonados son demostraciones y los botones de interés guardan la selección en el navegador.</p></div>'''
    save("/proyecto/","Sobre SEMPRE AMUNT",summary,body,schema=[breadcrumb_data(("/proyecto/","Sobre el proyecto"))])

def finish(private_html):
    (CLIENT / "assets" / "busqueda.json").write_text(json.dumps(SEARCH, ensure_ascii=False), encoding="utf-8")
    urls = "".join(f"  <url><loc>{e(ORIGIN+path)}</loc></url>\n" for path in PAGES)
    (CLIENT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls+"</urlset>\n")
    robots = "User-agent: *\nAllow: /\n"
    if INDEXABLE:
        robots += f"Sitemap: {ORIGIN}/sitemap.xml\n"
    (CLIENT / "robots.txt").write_text(robots)
    not_found = layout("/404/","Página no encontrada","Vuelve a la portada de SEMPRE AMUNT.",
                       heading("Página no encontrada","El enlace que has abierto no está disponible.")+link("/","Volver a portada"),private=True)
    (CLIENT / "404.html").write_text(not_found,encoding="utf-8")

    entries = {}
    for file in sorted(CLIENT.rglob("*")):
        if file.is_file():
            path = "/"+file.relative_to(CLIENT).as_posix()
            entries[path] = base64.b64encode(file.read_bytes()).decode()
    # The static asset handler redirects .html URLs to extensionless paths.
    # Serve Google verification files from the Worker at their original URLs.
    for file in sorted((ROOT / "worker" / "verification").glob("google*.html")):
        entries["/" + file.name] = base64.b64encode(file.read_bytes()).decode()

    bundle = OUT / "server" / "index.js"
    bundle.parent.mkdir(parents=True,exist_ok=True)
    source = "\n".join((ROOT / "worker" / name).read_text() for name in ("editorial.js", "index.js"))
    seed = [{"slug": article["slug"], "title": article["title"], "summary": article["intro"],
             "date": article["date"], "source": article["source"], "img": article["img"],
             "category": {"Fichajes": "fichajes", "Entrenamientos": "entrenamientos"}.get(article["cat"], "noticia")}
            for article in ARTICULOS]
    dynamic_template = layout("/noticias/edicion-dinamica/", "TITULO_EDICION", "RESUMEN_EDICION",
                              "<!--articulo-dinamico--><!--/articulo-dinamico-->", current="/actualidad/")
    bundle.write_text("const PUBLIC_FILES = "+json.dumps(entries,separators=(",",":"))+";\n"+
                      "const MEMBER_HTML = "+json.dumps(private_html,ensure_ascii=False)+";\n"+
                      "const INDEXABLE = "+json.dumps(INDEXABLE)+";\n"+
                      "const EDITORIAL_ORIGIN = "+json.dumps(ORIGIN)+";\n"+
                      "const EDITORIAL_SEED = "+json.dumps(seed,ensure_ascii=False)+";\n"+
                      "const EDITORIAL_TEMPLATE = "+json.dumps(dynamic_template,ensure_ascii=False)+";\n"+source,encoding="utf-8")
    # Routes with live editorial content must reach the Worker on every request.
    for route in ("/", "/actualidad/", "/fichajes/", "/entrenamientos/", "/partidos/",
                  "/clasificacion/", "/estadisticas/", "/hemeroteca/"):
        (CLIENT / route.lstrip("/") / "index.html").unlink()
    (CLIENT / "sitemap.xml").unlink()
    (CLIENT / "assets" / "busqueda.json").unlink()
    manifest = OUT / ".openai"
    manifest.mkdir(exist_ok=True)
    shutil.copyfile(ROOT/".openai"/"hosting.json",manifest/"hosting.json")

if __name__ == "__main__":
    if CLIENT.exists():
        shutil.rmtree(CLIENT)
    shutil.copytree(ROOT / "public", CLIENT)
    homepage()
    sports_pages()
    stats_pages()
    articles()
    about()
    archive = "Noticias, crónicas, entrevistas y opinión de SEMPRE AMUNT, ordenadas por fecha."
    save("/hemeroteca/", "Hemeroteca del Valencia CF", archive,
         heading("Hemeroteca", archive) + "<!--archivo--><!--/archivo-->",
         schema=[breadcrumb_data(("/hemeroteca/", "Hemeroteca"))])
    finish(members())
