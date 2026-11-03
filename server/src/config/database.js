// All models share this SQLite connection. Tests can use a separate database file.
import { Sequelize } from 'sequelize';
import { mkdirSync } from 'node:fs';
mkdirSync('db', { recursive: true });
export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || `db/database.${process.env.NODE_ENV || 'dev'}.sqlite`,
    logging: false,
    retry: { max: 5, match: [/SQLITE_BUSY/] }
});
