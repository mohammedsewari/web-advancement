// Booking checks and writes belong together in this service.
import { Op, Transaction } from 'sequelize';
import { sequelize, Locker, Reservation, User } from '../models/index.js';
import { fail, id, interval, text } from './validation.js';
export async function create(userId, body) {
    if (!Array.isArray(body.lockerIds) || !body.lockerIds.length || body.lockerIds.length > 100) fail(400, 'Select 1-100 lockers.');
    const ids = body.lockerIds.map(id);
    if (new Set(ids).size !== ids.length) fail(400, 'Select each locker only once.');
    const { startAt, endAt } = interval(body);
    // BEGIN IMMEDIATE obtains SQLite's write lock BEFORE reading availability.
    // Other processes must wait, so they see this booking before checking their own.
    // Rollback also guarantees that a multi-locker booking succeeds entirely or not at all.
    return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
        const all = await Locker.findAll({ transaction });
        const selected = all.filter(l => ids.includes(l.id));
        if (selected.length !== ids.length) fail(404, 'One or more lockers do not exist.');
        const bookings = await Reservation.findAll({
            where: { startAt: { [Op.lt]: endAt }, endAt: { [Op.gt]: startAt } },
            include: [Locker], transaction
        });
        if (bookings.some(r => r.Lockers.some(l => ids.includes(l.id)))) fail(409, 'A selected locker is already reserved during this time.');
        // A kind is a size/floor/location group. Its strictest configured limit applies.
        const kind = l => JSON.stringify([l.size, l.floor, l.location]);
        for (const group of new Set(selected.map(kind))) {
            const limit = Math.min(...all.filter(l => kind(l) === group).map(l => l.maxPerUser));
            const requested = selected.filter(l => kind(l) === group).length;
            // Check simultaneous usage at the start and at each existing booking start.
            // Counting all overlapping bookings would incorrectly reject consecutive bookings.
            const own = bookings.filter(r => r.userId === userId);
            const points = [+startAt, ...own.map(r => +r.startAt).filter(t => t > +startAt && t < +endAt)];
            if (points.some(t => requested + own.filter(r => +r.startAt <= t && +r.endAt > t).flatMap(r => r.Lockers).filter(l => kind(l) === group).length > limit)) fail(409, 'Reservation limit exceeded for a selected size/floor/location group.');
        }
        const reservation = await Reservation.create({ userId, startAt, endAt }, { transaction });
        await reservation.addLockers(selected, { transaction });
        return { ...reservation.toJSON(), Lockers: selected };
    });
}
export async function get(value) {
    const reservation = await Reservation.findByPk(id(value), { include: [Locker, { model: User, attributes: ['id', 'email'] }] });
    if (!reservation) fail(404, 'Reservation not found.');
    return reservation;
}

// The caller chooses ownership scope. Browsers cannot override the authenticated owner.
export async function list(query, userId) {
    const where = {};
    if (userId !== undefined) where.userId = userId;
    if (query.id !== undefined) where.id = id(query.id);
    const include = [Locker];
    if (userId === undefined) include.push({ model: User, attributes: ['id', 'email'] });
    const reservations = await Reservation.findAll({ where, include });
    if (query.lockerId === undefined && query.code === undefined) return reservations;
    const lockerId = query.lockerId !== undefined ? id(query.lockerId) : undefined;
    const code = query.code !== undefined ? text(query.code, 'Locker code', /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 30) : undefined;
    return reservations.filter(reservation => {
        const lockers = reservation.Lockers || [];
        return lockers.some(locker => {
            if (lockerId !== undefined && locker.id === lockerId) return true;
            if (code !== undefined && locker.code === code) return true;
            return false;
        });
    });
}
