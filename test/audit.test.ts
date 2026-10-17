import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditHTML } from '../src/audit.js';
import { compareAudits } from '../src/compare.js';
const url = 'https://example.com/guide';
const check = (html: string, id: string) => auditHTML(html, url).checks.find(c => c.id === id)!;
test('empty documents fail extractable content and title; transport remains unknown', () => {
  const report = auditHTML('', url);
  assert.equal(report.checks.find(c => c.id === 'extractable-content')?.status, 'fail');
  assert.equal(report.checks.find(c => c.id === 'http-success')?.status, 'unknown');
  assert.equal(report.coverage.total, report.coverage.evaluated + report.coverage.unknown);
});
test('script-only content is not treated as server-rendered text', () => {
  assert.equal(check('<script>document.write("useful content")</script>', 'extractable-content').status, 'fail');
});
test('detect malformed JSON-LD and canonical conflicts', () => {
  assert.equal(check('<script type="application/ld+json">{bad}</script>', 'jsonld-syntax').status, 'fail');
  assert.equal(check('<link rel="canonical" href="/a"><link rel="canonical" href="/b">', 'canonical-url').status, 'fail');
  assert.equal(check('<link rel="canonical" href="javascript:alert(1)">', 'canonical-url').status, 'fail');
});
test('recognize entities inside JSON-LD graphs without accepting invented proof', () => {
  const report = auditHTML('<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"}]}</script>', url);
  assert.deepEqual(report.facts.structuredDataTypes, ['Organization']);
  assert.equal(report.checks.find(c => c.id === 'structured-entities')?.status, 'pass');
});
test('HTTP robots directives are included and intentional exclusion is a warning', () => {
  const report = auditHTML('<title>Private dashboard</title>', url, { status: 200, headers: { 'x-robots-tag': 'googlebot: noindex' }, bytes: 32, elapsedMs: 12, redirects: [] });
  assert.equal(report.checks.find(c => c.id === 'index-directives')?.status, 'warn');
  assert.equal(check('<meta name="robots" content="none">', 'index-directives').status, 'warn');
});
test('absent optional media is unknown, decorative alt is accepted', () => {
  assert.equal(check('<main><img src="a" alt=""></main>', 'image-alternatives').status, 'pass');
  assert.equal(check('<main><img src="a"></main>', 'image-alternatives').status, 'warn');
  assert.equal(check('<main>Hello</main>', 'image-alternatives').status, 'unknown');
});
test('form labels handle unusual IDs without selector injection', () => {
  assert.equal(check('<main><label for="a:b">Email</label><input id="a:b"></main>', 'form-labels').status, 'pass');
  assert.equal(check('<main><input aria-labelledby="nonexistent"></main>', 'form-labels').status, 'warn');
});
test('scores exactly follow published weighting with unknowns excluded', () => {
  const report = auditHTML('<title>A useful guide</title><h1>Guide</h1>', url);
  const evaluated = report.checks.filter(c => c.status !== 'unknown');
  const weighted = evaluated.reduce((n, c) => n + c.weight * ({ pass: 1, warn: 0.5, fail: 0, unknown: 0 }[c.status]), 0);
  assert.equal(report.score, Math.round(weighted / evaluated.reduce((n, c) => n + c.weight, 0) * 100));
});
test('comparison separates regressions from coverage changes', () => {
  const before = { rulesVersion: '0.1.0' as const, url, checks: [{ id: 'a', status: 'pass' as const }, { id: 'b', status: 'unknown' as const }] };
  const after = { ...before, checks: [{ id: 'a', status: 'fail' as const }, { id: 'b', status: 'pass' as const }] };
  const diff = compareAudits(before, after);
  assert.equal(diff.regressed.length, 1); assert.equal(diff.coverageChanges.length, 1); assert.equal(diff.improved.length, 0);
  assert.throws(() => compareAudits({ ...before, checks: [before.checks[0]!, before.checks[0]!] }, after), /Duplicate/);
});
