import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('real stdio client negotiates tools, calls audit, reads methodology and prompt', async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['dist/cli.js'], stderr: 'pipe' });
  const client = new Client({ name: 'geomcp-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 5);
    const response = await client.callTool({ name: 'audit_html', arguments: { url: 'https://example.com', html: '<title>Hello</title><h1>Hello</h1><main>Useful guide</main>' } });
    assert.equal(response.isError, undefined);
    assert.equal((response.structuredContent as { rulesVersion: string }).rulesVersion, '0.1.0');
    const bad = await client.callTool({ name: 'audit_url', arguments: { url: 'http://127.0.0.1' } });
    assert.equal(bad.isError, true);
    const prompt = await client.getPrompt({ name: 'improve-page', arguments: { url: 'https://example.com' } });
    assert.equal(prompt.messages.length, 1);
    const resource = await client.readResource({ uri: 'geomcp://methodology' });
    assert.equal(resource.contents.length, 1);
  } finally { await client.close(); }
});
