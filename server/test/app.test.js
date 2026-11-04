// Route tests with the Mongoose model methods stubbed, so no MongoDB is needed.
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const Url = require('../models/Model-Url');
const Visitor = require('../models/Visitor');
const app = require('../app');

const BASE_URL = 'http://localhost:4000';

afterEach((t) => t.mock.restoreAll());

// A new app instance gets its own rate limiter counters
const loadFreshApp = () => {
  delete require.cache[require.resolve('../app')];
  return require('../app');
};

const duplicateKeyError =() => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

test('POST /api/url/shorten rejects non-http schemes', async () => {
  const res = await request(app).post('/api/url/shorten').send({ url: 'javascript:alert(1)' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Invalid Url Provided');
});

test('POST /api/url/shorten rejects a missing url', async () => {
  const res = await request(app).post('/api/url/shorten').send({});
  assert.equal(res.status, 400);
});

test('POST /api/url/shorten rejects URLs over 2048 characters', async () => {
  const res = await request(app)
    .post('/api/url/shorten')
    .send({ url: `https://example.com/${'a'.repeat(2048)}` });
  assert.equal(res.status, 400);
});

test('POST /api/url/shorten upserts by originalUrl and returns the short URL', async (t) => {
  const stub = t.mock.method(Url, 'findOneAndUpdate', async (filter, update) => ({
    shortUrl: update.$setOnInsert.shortUrl,
  }));

  const res = await request(app).post('/api/url/shorten').send({ url: 'https://example.com/page' });

  assert.equal(res.status, 200);
  assert.match(res.body.shortUrl, new RegExp(`^${BASE_URL}/[A-Za-z0-9_-]{6}$`));
  const [filter, update, options] = stub.mock.calls[0].arguments;
  assert.deepEqual(filter, { originalUrl: 'https://example.com/page' });
  assert.equal(update.$setOnInsert.originalUrl, 'https://example.com/page');
  assert.equal(options.upsert, true);
});

test('POST /api/url/shorten retries after a duplicate key error', async (t) => {
  let calls = 0;
  t.mock.method(Url, 'findOneAndUpdate', async () => {
    calls += 1;
    if (calls === 1) throw duplicateKeyError();
    return { shortUrl: `${BASE_URL}/existing1` };
  });

  const res = await request(app).post('/api/url/shorten').send({ url: 'https://example.com/race' });

  assert.equal(res.status, 200);
  assert.equal(res.body.shortUrl, `${BASE_URL}/existing1`);
  assert.equal(calls, 2);
});

test('POST /api/url/shorten returns 500 after 3 duplicate key errors', async (t) => {
  const stub = t.mock.method(Url, 'findOneAndUpdate', async () => {
    throw duplicateKeyError();
  });
  t.mock.method(console, 'error', () => {});

  const res = await request(app).post('/api/url/shorten').send({ url: 'https://example.com/x' });

  assert.equal(res.status, 500);
  assert.equal(stub.mock.callCount(), 3);
});

test('GET /:shortId redirects to the original URL', async (t) => {
  t.mock.method(Url, 'findOneAndUpdate', async () => ({ originalUrl: 'https://example.com/target' }));

  const res = await request(app).get('/abcDEF12');

  assert.equal(res.status, 302);
  assert.equal(res.headers.location, 'https://example.com/target');
});

test('GET /:shortId shows an HTML 404 page for an unknown code', async (t) => {
  t.mock.method(Url, 'findOneAndUpdate', async () => null);

  const res = await request(app).get('/unknown12');

  assert.equal(res.status, 404);
  assert.match(res.headers['content-type'], /text\/html/);
  assert.match(res.text, /Link not found/);
});

test('GET /favicon.ico skips the database lookup', async (t) => {
  const stub = t.mock.method(Url, 'findOneAndUpdate', async () => null);

  const res = await request(app).get('/favicon.ico');

  assert.equal(res.status, 404);
  assert.equal(stub.mock.callCount(), 0);
});

test('POST /api/visitor/visit returns the incremented count', async (t) => {
  t.mock.method(Visitor, 'findOneAndUpdate', async () => ({ count: 42 }));

  const res = await request(app).post('/api/visitor/visit');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { count: 42 });
});

test('GET /:shortId accepts old 9-character shortid codes', async (t) => {
  t.mock.method(Url, 'findOneAndUpdate', async () => ({ originalUrl: 'https://example.com/old' }));

  const res = await request(app).get('/aBcD3_fG-');

  assert.equal(res.status, 302);
});

test('GET /:shortId blocks an IP after 30 unknown codes', async (t) => {
  t.mock.method(Url, 'findOneAndUpdate', async (filter) =>
    filter.shortId === 'known1' ? { originalUrl: 'https://example.com/ok' } : null
  );
  const agent = request(app);

  // Earlier tests already spent some of the 30 allowed misses; keep missing until the limit trips
  let status = 404;
  for (let i = 0; i < 31 && status === 404; i++) {
    status = (await agent.get(`/miss${String(i).padStart(3, '0')}`)).status;
  }
  assert.equal(status, 429);

  // Over the limit, every request from this IP is blocked, including known codes
  assert.equal((await agent.get('/known1')).status, 429);
});

test('GET /:shortId does not count successful redirects toward the limit', async (t) => {
  const freshApp = loadFreshApp();
  t.mock.method(Url, 'findOneAndUpdate', async () => ({ originalUrl: 'https://example.com/ok' }));

  for (let i = 0; i < 40; i++) {
    assert.equal((await request(freshApp).get('/known1')).status, 302);
  }
});

test('POST /api/url/shorten is rate limited after 30 requests', async () => {
  const agent = request(app);
  for (let i = 0; i < 30; i++) {
    await agent.post('/api/url/shorten').send({});
  }
  const res = await agent.post('/api/url/shorten').send({});
  assert.equal(res.status, 429);
});
