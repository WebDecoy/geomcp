import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import https from 'node:https';
import { fetchPublic, MAX_BYTES } from '../src/fetch.js';

// Mock only the wire transport; URL validation and public IP selection run normally.
function wire(status: number, headers: Record<string, string>, body: string | Buffer) {
  return mock.method(https, 'request', (_url: URL, options: Record<string, unknown>, callback: (res: PassThrough) => void) => {
    const req = new EventEmitter() as EventEmitter & { end: () => void };
    req.end = () => queueMicrotask(() => {
      const res = Object.assign(new PassThrough(), { statusCode: status, headers });
      callback(res);
      if (!res.destroyed) res.end(body);
    });
    return req;
  });
}
test('fetch returns bounded response and pins checked DNS address on socket', async () => {
  const m = wire(200, { 'content-type': 'text/html' }, '<h1>Hello</h1>');
  try {
    const result = await fetchPublic('https://8.8.8.8/');
    assert.equal(result.status, 200); assert.equal(result.body, '<h1>Hello</h1>');
    const options = m.mock.calls[0]!.arguments[1] as Record<string, any>;
    options.lookup('ignored', { all: true }, (err: unknown, records: unknown) => { assert.equal(err, null); assert.deepEqual(records, [{ address: '8.8.8.8', family: 4 }]); });
    assert.equal(options.headers['accept-encoding'], 'identity');
    assert.match(options.headers['user-agent'], /^GEOMCP/);
  } finally { m.mock.restore(); }
});
test('redirect to private IP is rejected before another connection', async () => {
  const m = wire(302, { location: 'http://169.254.169.254/latest/meta-data' }, '');
  try {
    await assert.rejects(fetchPublic('https://8.8.8.8/'), /reserved IP/);
    assert.equal(m.mock.callCount(), 1);
  } finally { m.mock.restore(); }
});
test('HTTPS downgrade and redirect loops fail within budget', async () => {
  let m = wire(302, { location: 'http://8.8.8.8/' }, '');
  try { await assert.rejects(fetchPublic('https://8.8.8.8/'), /downgrade|HTTPS-to-HTTP/); } finally { m.mock.restore(); }
  m = wire(302, { location: 'https://8.8.8.8/loop' }, '');
  try { await assert.rejects(fetchPublic('https://8.8.8.8/'), /Too many/); assert.equal(m.mock.callCount(), 5); } finally { m.mock.restore(); }
});
test('streaming size limit works without a content-length header', async () => {
  const m = wire(200, { 'content-type': 'text/html' }, Buffer.alloc(MAX_BYTES + 1));
  try { await assert.rejects(fetchPublic('https://8.8.8.8/'), /2 MiB/); } finally { m.mock.restore(); }
});
test('unexpected encoding and cancellation return errors', async () => {
  const m = wire(200, { 'content-encoding': 'gzip' }, 'not decoded');
  try { await assert.rejects(fetchPublic('https://8.8.8.8/'), /compressed/); } finally { m.mock.restore(); }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchPublic('https://8.8.8.8/', undefined, controller.signal), /abort/i);
});
