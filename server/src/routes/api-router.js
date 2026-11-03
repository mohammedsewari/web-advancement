// Routes define resources and permissions without implementing business logic.
import { Router } from 'express';
import * as c from '../controllers/api-controller.js';
import { loggedIn, role } from '../middleware/auth.js';
const router = Router();
router.post('/auth/register', c.register);
router.post('/auth/login', c.login);
router.get('/lockers', c.listLockers);
router.get('/lockers/:id', c.getLocker);
router.post('/lockers', loggedIn, role('ADMIN'), c.createLocker);
router.patch('/lockers/:id', loggedIn, role('ADMIN'), c.updateLocker);
router.delete('/lockers/:id', loggedIn, role('ADMIN'), c.deleteLocker);
router.post('/reservations', loggedIn, role('USER'), c.createReservation);
router.get('/reservations/my', loggedIn, role('USER'), c.myReservations);
router.get('/reservations', loggedIn, role('ADMIN'), c.listReservations);
router.get('/events', c.events);
router.get('/reservations/:id', loggedIn, role('ADMIN'), c.getReservation);
router.get('/users', loggedIn, role('ADMIN'), c.searchUsers);
export default router;
