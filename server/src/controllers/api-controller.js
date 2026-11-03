// Controllers translate HTTP input/output; services own the business rules.
import { authenticate } from '../services/auth-service.js';
import * as lockers from '../services/locker-service.js';
import * as reservations from '../services/reservation-service.js';
import { connect, notifyAvailability } from '../services/event-service.js';
import { search } from '../services/user-service.js';
export const register = async (req, res) => res.status(201).json(await authenticate(req.body, true));
export const login = async (req, res) => res.json(await authenticate(req.body, false));
export const listLockers = async (req, res) => res.json(await lockers.list(req.query));
export const getLocker = async (req, res) => res.json(await lockers.get(req.params.id));
export async function createLocker(req, res) {
    const result = await lockers.create(req.body);
    // Notify only after successful persistence (and after the booking transaction commits).
    notifyAvailability();
    res.status(201).json(result);
}
export async function updateLocker(req, res) {
    const result = await lockers.update(req.params.id, req.body);
    // Notify only after successful persistence (and after the booking transaction commits).
    notifyAvailability();
    res.status(200).json(result);
}
export async function deleteLocker(req, res) {
    const result = await lockers.remove(req.params.id);
    // Notify only after successful persistence (and after the booking transaction commits).
    notifyAvailability();
    res.status(200).json(result);
}
export async function createReservation(req, res) {
    const result = await reservations.create(req.user.id, req.body);
    // Notify only after successful persistence (and after the booking transaction commits).
    notifyAvailability();
    res.status(201).json(result);
}
export const getReservation = async (req, res) => res.json(await reservations.get(req.params.id));
export const searchUsers = async (req, res) => res.json(await search(req.query));
export const myReservations = async (req, res) => res.json(await reservations.list({}, req.user.id));
export const listReservations = async (req, res) => res.json(await reservations.list(req.query));
export const events = connect;
