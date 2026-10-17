import { createRequire } from 'node:module';
interface Robot { isAllowed(url: string, ua: string): boolean | undefined; getCrawlDelay(ua: string): number | undefined; getSitemaps(): string[] }
const robotsParser = createRequire(import.meta.url)('robots-parser') as (url: string, text: string) => Robot;
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { fetchPublic } from './fetch.js';

export const AGENTS = [
  { agent: 'Googlebot', purpose: 'search' },
  { agent: 'Bingbot', purpose: 'search' },
  { agent: 'OAI-SearchBot', purpose: 'AI search' },
  { agent: 'ChatGPT-User', purpose: 'user-triggered retrieval' },
  { agent: 'Claude-SearchBot', purpose: 'AI search' },
  { agent: 'Claude-User', purpose: 'user-triggered retrieval' },
  { agent: 'PerplexityBot', purpose: 'AI search' },
  { agent: 'GPTBot', purpose: 'training' },
  { agent: 'ClaudeBot', purpose: 'training' },
];
export function inspectRobots(text: string, pageUrl: string) {
  const page = new URL(pageUrl);
  const robotsUrl = new URL('/robots.txt', page.origin).href;
  const parser = robotsParser(robotsUrl, text);
  return {
    pageUrl: page.href, robotsUrl,
    policies: AGENTS.map(({ agent, purpose }) => {
      const allowed = parser.isAllowed(page.href, agent);
      return { agent, purpose, policy: allowed === undefined ? 'unknown' : allowed ? 'allowed' : 'disallowed', crawlDelay: parser.getCrawlDelay(agent) ?? null };
    }),
    sitemaps: parser.getSitemaps().slice(0, 100),
    limitations: ['This parses declared robots.txt policy only; it does not make requests under vendor identities or verify enforcement.', 'An allowed policy does not prove accessibility, indexing or citation. User-triggered fetchers may follow different policies.', 'Training preferences are reported separately from search access. A training disallow is not scored as an error.']
  };
}
export async function fetchRobots(pageUrl: string, signal?: AbortSignal) {
  const url = new URL(pageUrl);
  const result = await fetchPublic(new URL('/robots.txt', url.origin).href, 'text/plain', signal);
  if (result.status !== 200) return { pageUrl: url.href, robotsUrl: result.url, status: result.status, policies: [], limitations: ['No 200 robots.txt response; policies are not inferred from missing or failed responses.'] };
  if (/^\s*(?:<!doctype\s+html|<html)/i.test(result.body) || /text\/html/i.test(String(result.headers['content-type']))) throw new Error('robots.txt returned HTML rather than a policy file.');
  return { ...inspectRobots(result.body, url.href), status: result.status, finalUrl: result.url };
}

const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
export function inspectSitemap(xml: string, sitemapUrl: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entity declarations are not accepted.');
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid sitemap XML.');
  const doc = new XMLParser({ ignoreAttributes: false, processEntities: true, parseTagValue: false, removeNSPrefix: true }).parse(xml);
  const kind = Object.hasOwn(doc, 'urlset') ? 'urlset' : Object.hasOwn(doc, 'sitemapindex') ? 'sitemapindex' : null;
  if (!kind) throw new Error('Expected a urlset or sitemapindex document.');
  const rows = array<Record<string, unknown>>(kind === 'urlset' ? doc.urlset?.url : doc.sitemapindex?.sitemap);
  let invalidLocations = 0; let invalidDates = 0; const crossOrigin: string[] = []; const seen = new Set<string>(); let duplicates = 0;
  const sample: Array<{ loc: string; lastmod: string | null }> = [];
  for (const row of rows) {
    const loc = typeof row?.loc === 'string' ? row.loc : '';
    try {
      const url = new URL(loc);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
      if (url.origin !== new URL(sitemapUrl).origin && crossOrigin.length < 10) crossOrigin.push(loc);
    } catch { invalidLocations++; }
    if (seen.has(loc)) duplicates++; seen.add(loc);
    const lastmod = typeof row?.lastmod === 'string' ? row.lastmod : null;
    if (lastmod && (!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(lastmod) || !Number.isFinite(Date.parse(lastmod)))) invalidDates++;
    if (sample.length < 20) sample.push({ loc: loc.slice(0, 2000), lastmod });
  }
  return { url: sitemapUrl, kind, entries: rows.length, invalidLocations, invalidDates, duplicates, crossOriginSample: crossOrigin, overProtocolEntryLimit: rows.length > 50_000, sample, limitations: ['Single XML document inspection only; child sitemaps and listed URLs are not fetched.', 'A sitemap is a discovery hint and does not establish indexing, accessibility or citation.', 'The network body limit is 2 MiB; larger sitemaps must be split for this tool.'] };
}
export async function fetchSitemap(url: string, signal?: AbortSignal) {
  const result = await fetchPublic(url, 'application/xml, text/xml', signal);
  if (result.status !== 200) throw new Error(`Sitemap returned HTTP ${result.status}.`);
  return { ...inspectSitemap(result.body, result.url), status: result.status };
}
