// Admin search only exposes public account fields, never password hashes.
import { User } from '../models/index.js';
import { text } from './validation.js';
export function search(query) {
    const email = text(query.email, 'Email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 254).toLowerCase();
    return User.findAll({ where: { email }, attributes: ['id', 'email', 'roles'] });
}
