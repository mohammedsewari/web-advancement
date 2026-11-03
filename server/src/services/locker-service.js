// Locker CRUD and public query filters use Sequelize, never concatenated SQL.
import { sequelize, Locker, Reservation } from '../models/index.js';
import { Op, Transaction } from 'sequelize';
import { fail, id, interval, lockerInput, text } from './validation.js';
export async function list(query) {
    const where = {};
    if (query.code !== undefined) where.code = text(query.code, 'Code', /^[A-Z0-9-]+$/, 30);
    if (query.size !== undefined) where.size = text(query.size, 'Size', /^(small|medium|large)$/);
    if (query.location !== undefined) where.location = text(query.location, 'Location', /^[A-Za-z0-9 -]+$/, 50).toUpperCase();
    if (query.floor !== undefined) {
        if (!/^\d{1,3}$/.test(String(query.floor)) || Number(query.floor) > 100) fail(400, 'Floor must be 0-100.');
        where.floor = Number(query.floor);
    }
    const lockers = await Locker.findAll({ where, order: [['code', 'ASC']] });
    if (query.startAt !== undefined || query.durationMinutes !== undefined) {
        const { startAt, endAt } = interval(query);
        const bookings = await Reservation.findAll({ where: { startAt: { [Op.lt]: endAt }, endAt: { [Op.gt]: startAt } }, include: [Locker] });
        const busy = new Set(bookings.flatMap(r => r.Lockers.map(l => l.id)));
        return lockers.map(l => ({ ...l.toJSON(), available: !busy.has(l.id) }));
    }
    return lockers;
}
export async function get(value) {
    const locker = await Locker.findByPk(id(value));
    if (!locker) fail(404, 'Locker not found.');
    return locker;
}
export const create = body => Locker.create(lockerInput(body));
export async function update(value, body) {
    const locker = await get(value);
    return locker.update(lockerInput({ ...locker.toJSON(), ...body }));
}
export async function remove(value) {
    // Keep deletion and its reservation check atomic with concurrent bookings.
    return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
        const locker = await Locker.findByPk(id(value), { transaction });
        if (!locker) fail(404, 'Locker not found.');
        if (await locker.countReservations({ transaction })) fail(409, 'A reserved locker cannot be deleted.');
        await locker.destroy({ transaction });
        return { message: 'Locker deleted.' };
    });
}
