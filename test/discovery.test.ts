import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectRobots, inspectSitemap } from '../src/discovery.js';
import { isPublicAddress, resolvePublic, validateUrl } from '../src/fetch.js';
test('robots longest matching rules respect page path and training separation', () => {
  const report = inspectRobots('User-agent: *\nDisallow: /private/\nAllow: /private/public\n\nUser-agent: GPTBot\nDisallow: /\nSitemap: https://example.com/sitemap.xml', 'https://example.com/private/public');
  assert.equal(report.policies.find(p => p.agent === 'Googlebot')?.policy, 'allowed');
  assert.equal(report.policies.find(p => p.agent === 'GPTBot')?.policy, 'disallowed');
  assert.deepEqual(report.sitemaps, ['https://example.com/sitemap.xml']);
  const privateReport = inspectRobots('User-agent: *\nDisallow: /private/', 'https://example.com/private/data');
  assert.equal(privateReport.policies[0]?.policy, 'disallowed');
});
test('sitemap handles namespace, duplicates, invalid locations and dates', () => {
  const report = inspectSitemap('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/a</loc><lastmod>bad</lastmod></url><url><loc>https://example.com/a</loc></url><url><loc>/relative</loc></url></urlset>', 'https://example.com/sitemap.xml');
  assert.equal(report.entries, 3); assert.equal(report.duplicates, 1); assert.equal(report.invalidLocations, 1); assert.equal(report.invalidDates, 1);
});
test('sitemap indexes are reported without following arbitrary locations', () => {
  const report = inspectSitemap('<sitemapindex><sitemap><loc>http://127.0.0.1/private.xml</loc></sitemap></sitemapindex>', 'https://example.com/sitemap.xml');
  assert.equal(report.kind, 'sitemapindex'); assert.equal(report.entries, 1); assert.equal(report.crossOriginSample.length, 1);
});
test('reject invalid XML and entity declarations', () => {
  assert.throws(() => inspectSitemap('<urlset><url></urlset>', 'https://example.com/a'), /Invalid/);
  assert.throws(() => inspectSitemap('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><urlset/>', 'https://example.com/a'), /entity/);
  assert.throws(() => inspectSitemap('<html/>', 'https://example.com/a'), /Expected/);
});
test('public fetch validation blocks SSRF representations', () => {
  for (const url of ['file:///etc/passwd', 'http://localhost/', 'http://a.localhost/', 'http://127.1/', 'http://2130706433/', 'http://0x7f000001/', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://169.254.169.254/', 'http://10.1.1.1/', 'http://user:secret@example.com/', 'http://example.com:8080/']) assert.throws(() => validateUrl(url), undefined, url);
  assert.equal(validateUrl('https://example.com/a#b').href, 'https://example.com/a');
});
test('public address validation rejects private, mapped, reserved and transition ranges', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:10.0.0.1', '2002:7f00:1::', 'invalid']) assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress('8.8.8.8'), true);
});
test('mixed DNS results are rejected and accepted addresses can be pinned', async () => {
  await assert.rejects(resolvePublic('example.com', async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]), /non-public/);
  assert.deepEqual(await resolvePublic('example.com', async () => [{ address: '8.8.8.8', family: 4 }]), { address: '8.8.8.8', family: 4 });
});
test('empty sitemap is accepted and built-in XML escapes are decoded', () => {
  assert.equal(inspectSitemap('<urlset/>', 'https://example.com/sitemap.xml').entries, 0);
  const report = inspectSitemap('<urlset><url><loc>https://example.com/?a=1&amp;b=2</loc></url></urlset>', 'https://example.com/sitemap.xml');
  assert.equal(report.sample[0]?.loc, 'https://example.com/?a=1&b=2');
});
