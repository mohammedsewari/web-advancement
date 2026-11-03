// Real HTTP handlers and a real SQLite database; no business logic is mocked.
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import request from 'supertest';
import { rm } from 'node:fs/promises';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { sequelize, User, Locker, Reservation } from '../models/index.js';
import { hashPassword, secret } from '../services/auth-service.js';

let passwordHash;
let userToken, adminToken, bothToken;
const credentials = { email: 'user@example.com', password: 'DemoPass123!' };
const locker = { code: 'L-001', size: 'small', floor: 1, location: 'A', maxPerUser: 2 };
const startAt = new Date(Date.now() + 86400000).toISOString();
const booking = { lockerIds: [1, 2], startAt, durationMinutes: 60 };
function call(method, path, body, token) {
    const req = request(app)[method]('/api' + path);
    if (token) req.set('Authorization', 'Bearer ' + token);
    return body === undefined ? req : req.send(body);
}

beforeAll(async () => { passwordHash = await hashPassword(credentials.password); });
beforeEach(async () => {
    // Recreate only the dedicated test database so every case starts independently.
    await sequelize.sync({ force: true });
    for (const [email, roles] of [
        ['user@example.com', ['USER']],
        ['admin@example.com', ['ADMIN']],
        ['both@example.com', ['USER', 'ADMIN']]
    ]) await User.create({ email, roles, passwordHash });
    userToken = jwt.sign({}, secret, { subject: '1', expiresIn: '1h' });
    adminToken = jwt.sign({}, secret, { subject: '2', expiresIn: '1h' });
    bothToken = jwt.sign({}, secret, { subject: '3', expiresIn: '1h' });
    await Locker.bulkCreate([1, 2, 3].map(n => ({ ...locker, code: 'L-00' + n })));
});
afterAll(async () => {
    await sequelize.close();
    await rm(process.env.DB_STORAGE, { force: true });
});

test('registration normalizes email, hashes passwords and ignores requested roles', async () => {
    const result = await call('post', '/auth/register', { email: ' New@Example.com ', password: credentials.password, roles: ['ADMIN'] });
    expect(result.status).toBe(201);
    expect(result.body.user).toMatchObject({ email: 'new@example.com', roles: ['USER'] });
    expect(result.body.user.passwordHash).toBeUndefined();
    expect((await User.findByPk(result.body.user.id)).passwordHash).not.toBe(credentials.password);
    expect((await call('post', '/auth/register', credentials)).status).toBe(409);
});

test('login issues a signed expiring token and rejects incorrect credentials', async () => {
    const result = await call('post', '/auth/login', credentials);
    expect(result.status).toBe(200);
    expect(jwt.verify(result.body.token, secret)).toMatchObject({ sub: '1' });
    expect(jwt.decode(result.body.token).exp).toBeGreaterThan(Date.now() / 1000);
    expect((await call('post', '/auth/login', { ...credentials, password: 'incorrect' })).status).toBe(401);
});

test('protected endpoints reject guests, tampered tokens, expiry and incorrect roles', async () => {
    expect((await call('post', '/lockers', locker)).status).toBe(401);
    expect((await call('post', '/lockers', locker, userToken)).status).toBe(403);
    expect((await call('post', '/lockers', locker, userToken + 'x')).status).toBe(401);
    const expired = jwt.sign({}, secret, { subject: '2', expiresIn: -1 });
    expect((await call('post', '/lockers', locker, expired)).status).toBe(401);
    expect((await call('post', '/reservations', booking, adminToken)).status).toBe(403);
    expect((await call('post', '/reservations', booking, bothToken)).status).toBe(201);
});

test('public listing supports code search and all three filters', async () => {
    const result = await call('get', '/lockers?size=small&floor=1&location=a&code=L-001');
    expect(result.status).toBe(200);
    expect(result.body.map(l => l.code)).toEqual(['L-001']);
    expect((await call('get', '/lockers?floor=2')).body).toEqual([]);
    expect((await call('get', '/lockers?floor=bad')).status).toBe(400);
});

test('admin creates, reads, updates and deletes lockers; codes are unique', async () => {
    const created = await call('post', '/lockers', { ...locker, code: 'L-004' }, adminToken);
    expect(created.status).toBe(201);
    const path = '/lockers/' + created.body.id;
    expect((await call('get', path)).body.code).toBe('L-004');
    expect((await call('patch', path, { size: 'large' }, adminToken)).body.size).toBe('large');
    expect((await call('post', '/lockers', locker, adminToken)).status).toBe(409);
    expect((await call('delete', path, undefined, adminToken)).status).toBe(200);
    expect((await call('get', path)).status).toBe(404);
});

test('booking multiple lockers uses authenticated ownership and private own-reservation scope', async () => {
    const result = await call('post', '/reservations', { ...booking, userId: 3 }, userToken);
    expect(result.status).toBe(201);
    expect(result.body.userId).toBe(1);
    expect(result.body.Lockers).toHaveLength(2);
    expect((await call('get', '/reservations/my?userId=3', undefined, userToken)).body).toHaveLength(1);
    expect((await call('get', '/reservations/my?userId=1', undefined, bothToken)).body).toEqual([]);
    expect((await call('get', '/reservations/my', undefined, adminToken)).status).toBe(403);
});

test('overlaps fail atomically but adjacent time intervals are allowed', async () => {
    await call('post', '/reservations', booking, userToken);
    expect((await call('post', '/reservations', { ...booking, lockerIds: [3, 1] }, bothToken)).status).toBe(409);
    expect(await Reservation.count()).toBe(1);
    const adjacent = { ...booking, startAt: new Date(+new Date(startAt) + 3600000).toISOString() };
    expect((await call('post', '/reservations', adjacent, bothToken)).status).toBe(201);
    const unavailable = await call('get', '/lockers?' + new URLSearchParams({ startAt, durationMinutes: 60 }));
    expect(unavailable.body.find(l => l.id === 1).available).toBe(false);
    expect(unavailable.body.find(l => l.id === 3).available).toBe(true);
});

test('booking limits include existing simultaneous reservations', async () => {
    expect((await call('post', '/reservations', booking, userToken)).status).toBe(201);
    expect((await call('post', '/reservations', { ...booking, lockerIds: [3] }, userToken)).status).toBe(409);
});

test('concurrent overlapping bookings have exactly one winner', async () => {
    const responses = await Promise.all([
        call('post', '/reservations', booking, userToken),
        call('post', '/reservations', booking, bothToken)
    ]);
    expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await Reservation.count()).toBe(1);
});

test('admin reservation filters retain every locker in a matching reservation', async () => {
    const created = await call('post', '/reservations', booking, userToken);
    const result = await call('get', '/reservations?code=L-001', undefined, adminToken);
    expect(result.status).toBe(200);
    expect(result.body).toHaveLength(1);
    expect(result.body[0].Lockers).toHaveLength(2);
    expect(result.body[0].User.passwordHash).toBeUndefined();
    expect((await call('get', '/reservations?lockerId=3', undefined, adminToken)).body).toEqual([]);
    expect((await call('get', '/reservations?id=' + created.body.id, undefined, adminToken)).body).toHaveLength(1);
    expect((await call('get', '/reservations/' + created.body.id, undefined, adminToken)).status).toBe(200);
    expect((await call('get', '/reservations', undefined, userToken)).status).toBe(403);
});

test('user search is admin-only and never exposes password hashes', async () => {
    const result = await call('get', '/users?email=user@example.com', undefined, adminToken);
    expect(result.body[0]).toMatchObject({ email: credentials.email });
    expect(result.body[0].passwordHash).toBeUndefined();
    expect((await call('get', '/users?email=user@example.com', undefined, userToken)).status).toBe(403);
});

test('validation rejects invalid dates, duplicate IDs, missing lockers and malformed JSON', async () => {
    for (const [body, status] of [
        [{ ...booking, startAt: '2027-02-30T10:00:00.000Z' }, 400],
        [{ ...booking, durationMinutes: 0 }, 400],
        [{ ...booking, lockerIds: [1, 1] }, 400],
        [{ ...booking, lockerIds: [1, 9999] }, 404]
    ]) expect((await call('post', '/reservations', body, userToken)).status).toBe(status);
    expect(await Reservation.count()).toBe(0);
    expect((await call('post', '/auth/register', { email: 'invalid', password: 'short' })).status).toBe(400);
    expect((await call('post', '/auth/login', [])).status).toBe(400);
    const malformed = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{');
    expect(malformed.status).toBe(400);
    expect((await call('get', '/missing')).body).toEqual({ message: 'Endpoint not found.' });
});

test('reserved lockers cannot be deleted', async () => {
    await call('post', '/reservations', booking, userToken);
    expect((await call('delete', '/lockers/1', undefined, adminToken)).status).toBe(409);
});

test('SSE sends public invalidations after successful booking and locker changes', async () => {
    const server = app.listen(0);
    await once(server, 'listening');
    const abort = new AbortController();
    let reader;
    try {
        const response = await fetch(`http://localhost:${server.address().port}/api/events`, { signal: abort.signal });
        expect(response.headers.get('content-type')).toContain('text/event-stream');
        reader = response.body.getReader();
        expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: ready');
        for (const action of [
            () => call('post', '/reservations', booking, userToken),
            () => call('patch', '/lockers/3', { maxPerUser: 3 }, adminToken)
        ]) {
            await action();
            const event = new TextDecoder().decode((await reader.read()).value);
            expect(event).toContain('event: availability');
            expect(event).not.toContain(credentials.email);
        }
    } finally {
        await reader?.cancel();
        abort.abort();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
});
