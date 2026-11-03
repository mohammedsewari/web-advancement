// Verify the signature, then load current roles from the database rather than trusting the browser.
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { secret } from '../services/auth-service.js';
import { fail } from '../services/validation.js';
export async function loggedIn(req, res, next) {
    let payload;
    try { payload = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), secret, { algorithms: ['HS256'] }); }
    catch { fail(401, 'Please log in with a valid, unexpired token.'); }
    req.user = await User.findByPk(payload.sub);
    if (!req.user) fail(401, 'Account not found.');
    next();
}
export const role = required => (req, res, next) => {
    if (!req.user.roles.includes(required)) fail(403, `${required} role required.`);
    next();
};
