/**
 * tests/events.test.js
 * ─────────────────────
 * Supertest integration tests for POST /api/events.
 * The Event model is mocked so no real MongoDB is required.
 *
 * Run: npm test
 */

const request = require('supertest');

// Mock the Event model before requiring app
// (Jest hoists jest.mock() calls, so this runs before any require)
jest.mock('../src/models/Event', () => ({
  insertMany: jest.fn(),
  aggregate:  jest.fn(),
  find:       jest.fn(() => ({ sort: jest.fn(() => ({ lean: jest.fn() })) })),
  distinct:   jest.fn(),
}));

const app   = require('../app');
const Event = require('../src/models/Event');

// ─── Valid base payload ────────────────────────────────────────────────────────
const validPageView = {
  session_id: 'sess_test123',
  event_type: 'page_view',
  page_url:   'http://localhost:3000/demo/index.html',
  timestamp:  new Date().toISOString(),
};

const validClick = {
  session_id:      'sess_test123',
  event_type:      'click',
  page_url:        'http://localhost:3000/demo/index.html',
  timestamp:       new Date().toISOString(),
  x:               120,
  y:               340,
  viewport_width:  1440,
  viewport_height: 900,
};

// ─── Reset mocks between tests ─────────────────────────────────────────────────
beforeEach(() => jest.clearAllMocks());

// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/events', () => {

  it('✅ stores a single valid page_view event (201)', async () => {
    Event.insertMany.mockResolvedValue([{ _id: 'abc1' }]);

    const res = await request(app)
      .post('/api/events')
      .send(validPageView);

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(1);
    expect(res.body.message).toMatch(/1 event/);
    expect(Event.insertMany).toHaveBeenCalledTimes(1);
  });

  it('✅ stores a batch of mixed events (201)', async () => {
    Event.insertMany.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }]);

    const res = await request(app)
      .post('/api/events')
      .send([validPageView, validClick]);

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
  });

  it('❌ rejects event missing session_id (400)', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ event_type: 'page_view', page_url: 'http://localhost:3000/' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(Event.insertMany).not.toHaveBeenCalled();
  });

  it('❌ rejects invalid event_type (400)', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ ...validPageView, event_type: 'scroll' }); // not in enum

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid event_type/);
  });

  it('❌ rejects empty body gracefully (400)', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/sessions (auth middleware)', () => {

  it('✅ returns 200 when no API_KEY is configured (auth disabled)', async () => {
    // API_KEY is not set in test env → auth passes automatically
    Event.aggregate.mockResolvedValue([]);

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
  });

  it('❌ returns 401 when API_KEY is set but header is missing', async () => {
    process.env.API_KEY = 'secret-test-key';

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/x-api-key/);

    delete process.env.API_KEY;
  });

  it('✅ returns 200 when correct x-api-key header is provided', async () => {
    process.env.API_KEY = 'secret-test-key';
    Event.aggregate.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/sessions')
      .set('x-api-key', 'secret-test-key');

    expect(res.status).toBe(200);

    delete process.env.API_KEY;
  });

});
