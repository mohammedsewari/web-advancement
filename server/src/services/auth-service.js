// Passwords use salted scrypt hashes; JWTs identify the signed-in user.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { fail, text } from './validation.js';
const scrypt = promisify(scryptCallback);
export const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('Set JWT_SECRET to at least 32 characters.');
export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
export const publicUser = user => ({ id: user.id, email: user.email, roles: user.roles });
export async function authenticate(body, register) {
    const email = text(body.email, 'Email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 254).toLowerCase();
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) fail(400, 'Password must contain 8-128 characters.');
    let user;
    if (register) {
        // Registration never accepts roles from the browser.
        user = await User.create({ email, passwordHash: await hashPassword(body.password), roles: ['USER'] });
    } else {
        user = await User.findOne({ where: { email } });
        if (!user) fail(401, 'Incorrect email or password.');
        const [salt, stored] = user.passwordHash.split(':');
        if (!timingSafeEqual(Buffer.from(stored, 'hex'), await scrypt(body.password, salt, 64))) fail(401, 'Incorrect email or password.');
    }
    return { token: jwt.sign({}, secret, { subject: String(user.id), expiresIn: '2h', algorithm: 'HS256' }), user: publicUser(user) };
}
