const request = require('supertest');
const app = require('../app');

describe('DB routes auth + validation', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.MCP_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('POST /db/query requires x-api-key', async () => {
    const res = await request(app).post('/db/query').send({ sql: 'SELECT 1' });
    expect(res.status).toBe(401);
  });

  test('POST /db/query validates sql', async () => {
    const res = await request(app)
      .post('/db/query')
      .set('x-api-key', 'test-key')
      .send({ sql: '' });
    expect(res.status).toBe(400);
  });

  test('POST /db/execute requires mode=rw', async () => {
    const res = await request(app)
      .post('/db/execute')
      .set('x-api-key', 'test-key')
      .send({ sql: 'UPDATE t SET a=1', mode: 'ro' });
    expect(res.status).toBe(400);
  });

  test('GET /health/db returns 200 or 503 (depending on DB availability)', async () => {
    const res = await request(app)
      .get('/health/db')
      .set('x-api-key', 'test-key');
    expect([200, 503]).toContain(res.status);
  });
});
