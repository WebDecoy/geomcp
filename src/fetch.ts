import { lookup } from 'node:dns/promises';
import http, { type IncomingHttpHeaders } from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';

export const USER_AGENT = 'GEOMCP/0.1 (+https://github.com/WebDecoy/geomcp)';
export const MAX_BYTES = 2 * 1024 * 1024;
export type PageResponse = { url: string; status: number; headers: IncomingHttpHeaders; body: string; bytes: number; elapsedMs: number; redirects: string[] };
export type Lookup = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
export function isPublicAddress(address: string): boolean {
  try {
    const ip = ipaddr.process(address);
    return ip.range() === 'unicast';
  } catch { return false; }
}
export function validateUrl(input: string): URL {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Only ports 80 and 443 are supported.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.') && !isIP(host)) throw new Error('Public internet hosts only.');
  if (isIP(host) && !isPublicAddress(host)) throw new Error('Private, loopback, link-local and reserved IP addresses are blocked.');
  url.hash = '';
  return url;
}
export async function resolvePublic(hostname: string, resolver: Lookup = host => lookup(host, { all: true, verbatim: true })) {
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await resolver(host);
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error('Host resolves to a non-public address.');
  return addresses[0]!;
}

/** Each redirect is revalidated; the checked DNS answer is pinned to the socket. */
export async function fetchPublic(input: string, accept = 'text/html, application/xhtml+xml', signal?: AbortSignal): Promise<PageResponse> {
  const started = Date.now();
  const deadline = AbortSignal.timeout(15_000);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
  let url = validateUrl(input);
  const redirects: string[] = [];
  for (let hop = 0; hop <= 4; hop++) {
    combined.throwIfAborted();
    const pinned = await Promise.race([
      resolvePublic(url.hostname),
      new Promise<never>((_, reject) => {
        if (combined.aborted) reject(combined.reason);
        else combined.addEventListener('abort', () => reject(combined.reason), { once: true });
      })
    ]);
    const page = await new Promise<Omit<PageResponse, 'elapsedMs' | 'redirects'>>((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request(url, {
        method: 'GET', agent: false, signal: combined,
        headers: { 'user-agent': USER_AGENT, accept, 'accept-encoding': 'identity' },
        // Preserve hostname/SNI/certificate validation while pinning the connection address.
        lookup: ((_host: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
          if (options.all) callback(null, [pinned]);
          else callback(null, pinned.address, pinned.family);
        }) as NonNullable<http.RequestOptions['lookup']>
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0)) {
          res.destroy();
          resolve({ url: url.href, status: res.statusCode!, headers: res.headers, body: '', bytes: 0 });
          return;
        }
        if (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') {
          res.destroy(); reject(new Error('Unexpected compressed response; server must honor Accept-Encoding: identity.')); return;
        }
        const length = Number(res.headers['content-length']);
        if (length > MAX_BYTES) { res.destroy(); reject(new Error('Response exceeds the 2 MiB limit.')); return; }
        const chunks: Buffer[] = []; let bytes = 0;
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) { res.destroy(new Error('Response exceeds the 2 MiB limit.')); return; }
          chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('aborted', () => reject(new Error('Response ended before the body was complete.')));
        res.on('end', () => resolve({ url: url.href, status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8'), bytes }));
      });
      req.on('error', reject); req.end();
    });
    if ([301, 302, 303, 307, 308].includes(page.status)) {
      const location = page.headers.location;
      if (!location) throw new Error('Redirect did not provide a Location header.');
      const next = validateUrl(new URL(location, url).href);
      if (url.protocol === 'https:' && next.protocol === 'http:') throw new Error('HTTPS-to-HTTP redirects are blocked.');
      redirects.push(url.href); url = next; continue;
    }
    return { ...page, elapsedMs: Date.now() - started, redirects };
  }
  throw new Error('Too many redirects (maximum 4).');
}
