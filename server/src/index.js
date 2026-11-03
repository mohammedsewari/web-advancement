// Startup connects middleware, routes and the database.
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger-config.js';
import router from './routes/api-router.js';
import { initDatabase } from './models/index.js';
const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '20kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', (req, res, next) => {
    if (['POST', 'PATCH'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ message: 'Send a JSON object as the request body.' });
    next();
}, router);
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
// Express 5 forwards rejected async handlers here automatically.
app.use((err, req, res, _next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.name === 'SequelizeUniqueConstraintError') { status = 409; message = 'Email or locker code already exists.'; }
    if (err.original?.code === 'SQLITE_BUSY') { status = 409; message = 'Database busy; please retry.'; }
    res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred.' : message });
});
await initDatabase();
if (process.env.NODE_ENV !== 'test') {
    const port = process.env.PORT || 3000;
    // eslint-disable-next-line no-console
    app.listen(port, () => console.log('Locker API listening on port ' + port)).on('error', error => {
        // Report port conflicts instead of leaving watch mode looking ready.
        // eslint-disable-next-line no-console
        console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the existing backend before restarting.` : error.message);
        process.exit(1);
    });
}
export default app;
