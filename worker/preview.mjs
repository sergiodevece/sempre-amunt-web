import {createServer} from "node:http";
import worker from "../dist/server/index.js";

const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const hostIndex = args.indexOf("--host");
const port = Number(portIndex >= 0 ? args[portIndex+1] : process.env.PORT || 3000);
const host = hostIndex >= 0 ? args[hostIndex+1] : "0.0.0.0";
createServer(async (incoming, outgoing) => {
  try {
    const protocol = incoming.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const url = new URL(incoming.url, `${protocol}://${incoming.headers["x-forwarded-host"] || incoming.headers.host || "localhost"}`);
    const parts = [];
    for await (const part of incoming) parts.push(part);
    const request = new Request(url, {method:incoming.method, headers:incoming.headers,
      body:parts.length ? Buffer.concat(parts) : undefined});
    const response = await worker.fetch(request, {MEMBER_PREVIEW_CODE:process.env.MEMBER_PREVIEW_CODE || "PREVIEW-LOCAL"});
    outgoing.writeHead(response.status,Object.fromEntries(response.headers));
    outgoing.end(response.body ? Buffer.from(await response.arrayBuffer()) : undefined);
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end("Error de vista previa");
  }
}).listen(port,host, () => console.log(`SEMPRE AMUNT listening on ${port}`));
