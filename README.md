# SEMPRE AMUNT

Ejercicio web de Lenguajes de Marcas del ciclo DAM, realizado por **Sergio Devece (SerxDev)**. Es un diario independiente sobre el Valencia CF con portada, fichajes, entrenamientos, partidos, clasificación, estadísticas, hemeroteca y zona de abonados de demostración.

[Web pública](https://area-mestalla.lamunecadesal.chatgpt.site/) · [Hemeroteca](https://area-mestalla.lamunecadesal.chatgpt.site/hemeroteca/) · [Sitemap XML](https://area-mestalla.lamunecadesal.chatgpt.site/sitemap.xml)

## Abrirlo en clase

Instala **Python 3.9 o superior** y **Node.js 22 o superior**. El proyecto usa las bibliotecas estándar y los recursos incluidos en el repositorio.

```bash
git clone https://github.com/sergiodevece/sempre-amunt-web.git
cd sempre-amunt-web
npm run dev
```

Abre [http://localhost:3000/](http://localhost:3000/). También puedes descargar el ZIP de GitHub y ejecutar el último comando dentro de la carpeta descomprimida.

En PowerShell, usa estos comandos desde la carpeta del proyecto.

```powershell
$env:SITE_INDEXABLE = '0'
python generar.py
node worker/preview.mjs
```

La vista local usa la edición inicial incluida en el código y permite probar las rutas, la hemeroteca, los filtros y la zona de abonados. Su código de demostración es `PREVIEW-LOCAL`. La edición diaria y sus publicaciones están disponibles en la web pública.

## Dónde mirar en el código

| Archivo | Qué puedes estudiar |
| --- | --- |
| [contenido.py](contenido.py) | Noticias y datos de partida, fechas y fuentes. |
| [generar.py](generar.py) | HTML semántico, metadatos, datos estructurados, sitemap y calendario. |
| [public/assets/estilos.css](public/assets/estilos.css) | Diseño adaptable, jerarquía editorial, tablas y tarjetas. |
| [public/assets/sitio.js](public/assets/sitio.js) | Buscador, filtros y orden de estadísticas en el navegador. |
| [worker/index.js](worker/index.js) | Enrutamiento HTTP y sesión del área de abonados. |
| [worker/editorial.js](worker/editorial.js) | Publicación, validación, hemeroteca y actualización de datos deportivos. |
| [drizzle/0000_ediciones.sql](drizzle/0000_ediciones.sql) | Tablas e índices de la base de datos D1. |
| [worker/preview.mjs](worker/preview.mjs) | Servidor Node.js para la vista previa local. |
| [tests/seo.test.mjs](tests/seo.test.mjs) | Pruebas de fechas, paginación y URLs del sitemap con SQLite en memoria. |

Ejecuta `npm run test:seo` para comprobar el HTML, los datos estructurados y las rutas indexables con una edición de prueba.

## Documentación

- [Recorrido de Lenguajes de Marcas](docs/clase-lm.md). Ejemplos para seguir desde una página abierta en el navegador hasta su plantilla y sus datos.
- [Arquitectura, edición diaria y SEO](docs/arquitectura-y-operacion.md). Flujo de publicación, fuentes, persistencia, despliegue y validaciones.

## Versión de referencia

El código de aplicación corresponde a la versión 7 desplegada el **12 de noviembre de 2026**. Revisión del sitio de origen `a4f68b2330fc786109988263dc21beb29c525015`. Esta copia usa un manifiesto portátil. Las credenciales, el archivo de verificación de Search Console y los datos de producción se gestionan en el sitio publicado.

Las imágenes editoriales son ilustraciones generadas para el proyecto. Los espacios publicitarios y las actividades de abonados son demostraciones. Las tipografías conservan sus archivos de licencia.
