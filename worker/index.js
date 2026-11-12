// PUBLIC_FILES, MEMBER_HTML and INDEXABLE are generated in generar.py.
const COOKIE = "__Secure-sempre_amunt_member";
const SESSION_SECONDS = 8 * 60 * 60;
const ENCODER = new TextEncoder();
const CONTENT_TYPES = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8", txt: "text/plain; charset=utf-8",
  ics: "text/calendar; charset=utf-8", woff2: "font/woff2",
  webp: "image/webp", png: "image/png", jpg: "image/jpeg",
};

function headers(extra = {}) {
  return new Headers({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'",
    ...extra,
  });
}

function protectedHeaders(extra = {}) {
  return headers({"Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow", ...extra});
}

function redirect(location, extra = {}) {
  return new Response(null, {status: 303, headers: protectedHeaders({Location: location, ...extra})});
}

function base64Bytes(encoded) {
  return Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
}

function constantEquals(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", ENCODER.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, ENCODER.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function validSession(request, secret) {
  if (!secret) return false;
  const { name } = cookieConfig(new URL(request.url));
  const cookie = request.headers.get("Cookie")?.split(/;\s*/).find(part => part.startsWith(name + "="));
  const token = cookie?.slice(name.length + 1);
  if (!token || !/^\d{10}\.[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiry, nonce, signature] = token.split(".");
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  return constantEquals(signature, await sign(expiry + "." + nonce, secret));
}

function cookieConfig(url) {
  const secure = url.protocol === "https:" || url.hostname !== "localhost" ? "; Secure" : "";
  return {name: secure ? COOKIE : COOKIE.replace("__Secure-", ""), secure};
}

function cookieHeader(value, maxAge, url) {
  const {name, secure} = cookieConfig(url);
  return `${name}=${value}; Max-Age=${maxAge}; Path=/abonados/; HttpOnly; SameSite=Lax${secure}`;
}

function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  return !origin || origin === url.origin;
}

async function handleMembership(request, env, url) {
  const {pathname} = url;
  const secret = env.MEMBER_PREVIEW_CODE;
  if (pathname === "/abonados/acceso/" || pathname === "/abonados/salir/") {
    if (request.method !== "POST") return new Response(null, {status:405,headers:protectedHeaders({Allow:"POST"})});
    if (!sameOrigin(request, url)) return new Response(null, {status:403,headers:protectedHeaders()});
    if (pathname.endsWith("/salir/")) return redirect("/abonados/", {"Set-Cookie":cookieHeader("",0,url)});
    if (!secret) return redirect("/abonados/?acceso=no-disponible");
    const form = await request.formData().catch(() => null);
    const code = form?.get("code");
    if (typeof code !== "string" || !constantEquals(code.trim().toUpperCase(), secret)) return redirect("/abonados/?acceso=incorrecto");
    const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const value = expiry + "." + crypto.randomUUID();
    const token = value + "." + await sign(value, secret);
    return redirect("/abonados/comunidad/", {"Set-Cookie":cookieHeader(token,SESSION_SECONDS,url)});
  }

  if (pathname === "/abonados/comunidad/") {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, {status:405,headers:protectedHeaders({Allow:"GET, HEAD"})});
    if (!(await validSession(request, secret))) return redirect("/abonados/");
    return new Response(request.method === "HEAD" ? null : MEMBER_HTML, {
      headers: protectedHeaders({"Content-Type":CONTENT_TYPES.html}),
    });
  }
  return null;
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/mcp" || path === "/api/editorial/edition") return editorialRpc(request,env,path);
    if (path.startsWith("/abonados/")) {
      const result = await handleMembership(request, env, url);
      if (result) return result;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {status:405,headers:headers({Allow:"GET, HEAD"})});
    }

    if (!path.endsWith("/") && PUBLIC_FILES[path + "/index.html"]) {
      return new Response(null, {status:308,headers:headers({Location:path + "/" + url.search})});
    }
    if (path.endsWith("/index.html") && PUBLIC_FILES[path]) {
      return new Response(null, {status:308,headers:headers({Location:path.slice(0,-10) + url.search})});
    }
    try {
      const edition = await editorialPage(request,env,url);
      if (edition) return edition;
    } catch (error) {
      console.error("Error al consultar la edición", error);
      if (!PUBLIC_FILES[path.endsWith("/") ? path+"index.html" : path]) {
        return new Response("Edición temporalmente no disponible.",{status:503,headers:protectedHeaders()});
      }
    }
    const lookup = path.endsWith("/") ? path + "index.html" : path;
    const data = Object.hasOwn(PUBLIC_FILES,lookup) ? PUBLIC_FILES[lookup] : null;
    const extension = data ? lookup.split(".").at(-1) : "html";
    const options = {"Content-Type":CONTENT_TYPES[extension] ?? "application/octet-stream"};
    if (!INDEXABLE || !data || path.startsWith("/abonados/")) options["X-Robots-Tag"] = "noindex, follow";
    if (path.startsWith("/abonados/")) options["Cache-Control"] = "private, no-store";
    if (path.startsWith("/assets/")) options["Cache-Control"] = "public, max-age=3600";
    return new Response(request.method === "HEAD" ? null : base64Bytes(data ?? PUBLIC_FILES["/404.html"]), {
      status:data ? 200 : 404, headers:headers(options),
    });
  },
};
