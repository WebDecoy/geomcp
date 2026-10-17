#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
const arg = process.argv[2];
if (arg === '--help' || arg === '-h') {
  console.log('GEOMCP by WebDecoy\n\nUsage: geomcp [--help | --version]\n\nWithout arguments, serves Model Context Protocol over stdio.\nTools: audit_url, audit_html, inspect_robots, inspect_sitemap, compare_audits\nhttps://github.com/WebDecoy/geomcp');
} else if (arg === '--version' || arg === '-v') {
  console.log('0.1.0');
} else if (arg) {
  console.error(`Unknown option: ${arg}. Use --help.`); process.exitCode = 1;
} else {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
