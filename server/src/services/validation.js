// Normalize permitted text and reject invalid types before querying the database.
export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function text(value, label, pattern, max = 100) {
    if (typeof value !== 'string') fail(400, `${label} must be text.`);
    const clean = value.trim();
    if (!clean || clean.length > max || !pattern.test(clean)) fail(400, `${label} has an invalid format.`);
    return clean;
}
export function id(value) {
    if (!['string', 'number'].includes(typeof value)) fail(400, 'ID must be a positive integer.');
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) fail(400, 'ID must be a positive integer.');
    return Number(value);
}
export function interval(input) {
    const raw = text(input.startAt, 'Start time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
    const startAt = new Date(raw);
    if (!Number.isFinite(+startAt) || startAt.toISOString().slice(0,19) !== raw.slice(0,19) || +startAt < Date.now()) fail(400, 'Choose a valid future start time.');
    if (!['string', 'number'].includes(typeof input.durationMinutes) || String(input.durationMinutes).trim() === '') fail(400, 'Duration must be a number.');
    const duration = Number(input.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) fail(400, 'Duration must be 1-1440 whole minutes.');
    return { startAt, endAt: new Date(+startAt + duration * 60000) };
}
export function lockerInput(body) {
    const code = text(body.code, 'Locker code', /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 30);
    const size = text(body.size, 'Size', /^(small|medium|large)$/);
    const location = text(body.location, 'Location', /^[A-Za-z0-9 -]+$/, 50).toUpperCase();
    for (const field of ['floor', 'maxPerUser']) {
        if (!['string', 'number'].includes(typeof body[field]) || String(body[field]).trim() === '') fail(400, `${field} must be a number.`);
    }
    const floor = Number(body.floor), maxPerUser = Number(body.maxPerUser);
    if (!Number.isInteger(floor) || floor < 0 || floor > 100) fail(400, 'Floor must be 0-100.');
    if (!Number.isInteger(maxPerUser) || maxPerUser < 1 || maxPerUser > 100) fail(400, 'Limit must be 1-100.');
    return { code, size, floor, location, maxPerUser };
}
