# Recorrido para Lenguajes de Marcas

Abre la [vista local](http://localhost:3000/) después de iniciar el proyecto según el [README](../README.md). La [versión pública](https://area-mestalla.lamunecadesal.chatgpt.site/) permite comparar la edición inicial con los contenidos de producción.

## 1. Sigue una tabla desde el dato hasta la página

Abre **Clasificación**. En [contenido.py](../contenido.py), busca `CLASIFICACION` y localiza la fila del Valencia CF. En [generar.py](../generar.py), busca `stats_pages()` y sigue esa fila hasta el HTML.

Inspecciona `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">` y `<th scope="row">`. Comprueba que el encabezado de cada columna identifica el dato y que el nombre del equipo actúa como encabezado de fila. La edición publicada puede generar la misma tabla a partir de D1 en `standingsHtml()`, dentro de [worker/editorial.js](../worker/editorial.js).

## 2. Lee el HTML que recibe el navegador

En la página de partidos, usa la opción **Ver código fuente** del navegador. También puedes guardarlo desde la terminal.

```bash
curl -fsS http://localhost:3000/partidos/ -o partidos-local.html
```

Busca el `<title>`, el `<h1>`, el elemento `<time>`, las tarjetas de partido y el enlace canónico. El HTML ya contiene el calendario. El JavaScript de [sitio.js](../public/assets/sitio.js) aplica el filtro de localía al seleccionar una opción.

## 3. Compara HTML, XML e iCalendar

| Recurso | Qué representa |
| --- | --- |
| `/partidos/` | HTML para leer y navegar por el calendario. |
| `/sitemap.xml` | XML con URLs editoriales. Busca `<urlset>`, `<url>` y `<loc>`. |
| Enlace **Añadir al calendario** de un partido | Archivo iCalendar. Busca `BEGIN:VEVENT`, `SUMMARY` y `DTSTART`. |

Comprueba que el sitemap incluye la misma dirección canónica que aparece en el HTML de partidos. La vista previa añade `noindex` a sus páginas. Para el sitemap servido en producción, abre el [XML público](https://area-mestalla.lamunecadesal.chatgpt.site/sitemap.xml).

## 4. Haz un cambio pequeño

Edita el resumen de una noticia en `contenido.py`. Reinicia `npm run dev` y localiza el texto nuevo en la noticia y en la tarjeta que enlaza a ella. Después busca la misma URL en el sitemap. Puedes seguir la transformación desde el dato hasta cada representación con los nombres `ARTICULOS`, `articles()` y `finish()`.
