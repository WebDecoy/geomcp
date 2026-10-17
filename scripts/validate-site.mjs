import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'validation-results');
await mkdir(output, { recursive: true });
const client = new Client({ name: 'geomcp-live-validation', version: '0.1.0' });
const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/cli.js')], stderr: 'pipe' });
const calls = [];
async function call(name, args) {
  const started = Date.now();
  const response = await client.callTool({ name, arguments: args });
  const data = response.structuredContent ?? JSON.parse(response.content[0].text);
  calls.push({ tool: name, elapsedMs: Date.now() - started, isError: response.isError ?? false });
  if (response.isError) throw new Error(`${name}: ${JSON.stringify(response.content)}`);
  return data;
}
let pages = [
  '/', '/shopify/', '/wordpress/', '/pricing/', '/features/', '/integrations/',
  '/comparisons/', '/blog/', '/product/fcaptcha-demo/',
  '/blog/cloud-hosted-ai-agents-real-browsers-bot-detection/',
  '/blog/webdecoy-shopify-app-store-launch/',
  '/blog/wtf-are-abliterated-models-uncensored-llms-explained/'
];
if (process.argv[3]) pages = JSON.parse(await readFile(process.argv[3], 'utf8')).map(value => new URL(value).pathname);
try {
  await client.connect(transport);
  const tools = await client.listTools();
  if (tools.tools.length !== 5) throw new Error('Unexpected tool count.');
  const audits = [];
  for (let i = 0; i < pages.length; i += 3) {
    const batch = await Promise.all(pages.slice(i, i + 3).map(async path => {
      const report = await call('audit_url', { url: `https://webdecoy.com${path}` });
      console.log(JSON.stringify({ path, score: report.score, coverage: report.coverage, status: report.facts.status, findings: report.checks.filter(c => c.status === 'warn' || c.status === 'fail').map(c => ({ id: c.id, status: c.status, evidence: c.evidence })) }));
      return report;
    }));
    audits.push(...batch);
  }
  const robots = await call('inspect_robots', { url: 'https://webdecoy.com/shopify/' });
  const sitemapIndex = await call('inspect_sitemap', { url: 'https://webdecoy.com/sitemap-index.xml' });
  const childUrl = sitemapIndex.sample[0]?.loc;
  if (!childUrl?.startsWith('https://webdecoy.com/')) throw new Error('Unexpected sitemap child location.');
  const sitemap = await call('inspect_sitemap', { url: childUrl });
  const fixture = await readFile('examples/page.html', 'utf8');
  const before = await call('audit_html', { url: 'https://example.com/guide', html: fixture.replace(/<title>.*?<\/title>/s, '').replace(/<h1>.*?<\/h1>/s, '') });
  const after = await call('audit_html', { url: 'https://example.com/guide', html: fixture });
  const comparison = await call('compare_audits', { before, after });
  if (!comparison.improved.some(c => c.id === 'page-title') || !comparison.improved.some(c => c.id === 'primary-heading')) throw new Error('Known defects were not detected and recovered.');
  const blocked = await client.callTool({ name: 'audit_url', arguments: { url: 'http://169.254.169.254/' } });
  if (!blocked.isError) throw new Error('Private-address safety validation failed.');
  const resource = await client.readResource({ uri: 'geomcp://methodology' });
  const prompt = await client.getPrompt({ name: 'improve-page', arguments: { url: 'https://webdecoy.com/' } });
  const report = { runAt: new Date().toISOString(), server: 'GEOMCP 0.1.0', method: 'SDK Client -> stdio transport -> built dist/cli.js; public HTTP requests', tools: tools.tools.map(t => t.name), audits, robots, sitemapIndex, sitemap, controlledFixture: { before, after, comparison, scope: 'Synthetic local fixture only; no production edits.' }, protocolValidation: { privateAddressRejected: blocked.isError === true, methodologyReadable: resource.contents.length > 0, promptAvailable: prompt.messages.length > 0 }, calls };
  await writeFile(resolve(output, 'live-audit.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output: resolve(output, 'live-audit.json'), sitemap, comparison, protocolValidation: report.protocolValidation }, null, 2));
} finally { await client.close(); }
