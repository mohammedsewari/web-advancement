# Demo Accounts

Run `npm run seed` inside the `server/` directory to create these development accounts and 6 demo lockers (`L-001` through `L-006`).

> **Note:** These are development-only credentials for local evaluation and oral assessment demonstration. Never reuse real passwords.

| Role Category | Email (Username) | Password | Stored Roles | Allowed Actions |
|---|---|---|---|---|
| **Regular User** | `user@example.com` | `DemoPass123!` | `["USER"]` | Browse/filter lockers, check availability, reserve one or multiple lockers, view own reservations (`/reservations`). Cannot access Admin dashboard or Admin API endpoints (`403 Forbidden`). |
| **Administrator** | `admin@example.com` | `DemoPass123!` | `["ADMIN"]` | Create, edit, and delete lockers, search users by email, search reservations by ID or locker code (`/admin`). Cannot reserve lockers or view `/reservations/my` (`403 Forbidden`). |
| **Multi-Role (User + Admin)** | `both@example.com` | `DemoPass123!` | `["USER", "ADMIN"]` | Has both `USER` and `ADMIN` permissions: can reserve lockers, view own reservations, and use all Admin features. |

## Seeding Details

- Defined in `server/src/seed.js`.
- Uses `User.findOrCreate` and `Locker.findOrCreate` so running `npm run seed` multiple times is safe and idempotent (it adds missing demo records without deleting existing bookings).
- Passwords are hashed with a random 16-byte salt using Node's `crypto.scrypt` via `hashPassword()` in `server/src/services/auth-service.js` before saving.
- Accounts registered through the UI (`POST /api/auth/register`) always receive `["USER"]` only.
