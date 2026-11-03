// Seeding adds demo data without deleting existing reservations or accounts.
import { initDatabase, sequelize, User, Locker } from './models/index.js';
import { hashPassword } from './services/auth-service.js';
if (['prod', 'production'].includes(process.env.NODE_ENV)) throw new Error('Demo seeding is disabled in production.');
await initDatabase();
for (const [email, roles] of [['user@example.com', ['USER']], ['admin@example.com', ['ADMIN']], ['both@example.com', ['USER', 'ADMIN']]]) {
    await User.findOrCreate({ where: { email }, defaults: { roles, passwordHash: await hashPassword('DemoPass123!') } });
}
for (let n = 1; n <= 6; n++) {
    await Locker.findOrCreate({ where: { code: `L-${String(n).padStart(3, '0')}` }, defaults: { size: n < 4 ? 'small' : 'large', floor: n < 4 ? 1 : 2, location: n < 4 ? 'A' : 'B', maxPerUser: 2 } });
}
// eslint-disable-next-line no-console
console.log('Demo accounts and lockers ready.');
await sequelize.close();
