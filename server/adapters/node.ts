// §7.7: the Node adapter. `tsx server/adapters/node.ts` serves every route on SERVER_PORT, bound to loopback.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadServerConfig, routeRequest, type Route } from '../core/index.ts';

function toRequest(inc: IncomingMessage, port: number): Request {
  const headers = new Headers();
  for (const [k, v] of Object.entries(inc.headers)) {
    if (Array.isArray(v)) for (const item of v) headers.append(k, item);
    else if (v !== undefined) headers.set(k, v);
  }
  const url = `http://${inc.headers.host ?? `127.0.0.1:${port}`}${inc.url ?? '/'}`;
  const hasBody = inc.method !== 'GET' && inc.method !== 'HEAD';
  return new Request(url, {
    method: inc.method, headers,
    ...(hasBody ? { body: Readable.toWeb(inc) as ReadableStream<Uint8Array>, duplex: 'half' } : {}),
  } as RequestInit);
}

async function send(res: Response, out: ServerResponse): Promise<void> {
  const headers: Record<string, string | string[]> = {};
  res.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
  const cookies = res.headers.getSetCookie();
  if (cookies.length) headers['set-cookie'] = cookies;
  out.writeHead(res.status, headers);
  out.end(Buffer.from(await res.arrayBuffer()));
}

export function startNodeServer(routes: Route[]): Server {
  const { port } = loadServerConfig();
  const server = createServer((inc, out) => {
    routeRequest(toRequest(inc, port), routes)
      .then((res) => send(res, out))
      .catch(() => { if (!out.headersSent) out.writeHead(500); out.end(); });
  });
  server.listen(port, '127.0.0.1', () => console.log(`api listening on 127.0.0.1:${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return server;
}

/** The deploy-time environment is `.generated/server.env` (§8.3); the stamped version comes from `.generated/.env`. */
function loadGeneratedEnv(): void {
  const server = fileURLToPath(new URL('../../.generated/server.env', import.meta.url));
  if (!existsSync(server)) throw new Error('.generated/server.env is missing: run node scripts/resolve-env.mjs');
  process.loadEnvFile(server);
  const client = fileURLToPath(new URL('../../.generated/.env', import.meta.url));
  if (existsSync(client)) process.loadEnvFile(client);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadGeneratedEnv();
  const { allRoutes } = await import('./routes.ts');
  startNodeServer(allRoutes);
}
