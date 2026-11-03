// Models describe tables; associations connect reservations to users and lockers.
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
export const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    roles: { type: DataTypes.JSON, allowNull: false, defaultValue: ['USER'] }
});
export const Locker = sequelize.define('Locker', {
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    size: { type: DataTypes.STRING, allowNull: false },
    floor: { type: DataTypes.INTEGER, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    maxPerUser: { type: DataTypes.INTEGER, allowNull: false }
});
export const Reservation = sequelize.define('Reservation', {
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: false }
});
export const ReservationLocker = sequelize.define('ReservationLocker', {}, { timestamps: false });
User.hasMany(Reservation, { foreignKey: { name: 'userId', allowNull: false } });
Reservation.belongsTo(User, { foreignKey: 'userId' });
Reservation.belongsToMany(Locker, { through: ReservationLocker, foreignKey: 'reservationId' });
Locker.belongsToMany(Reservation, { through: ReservationLocker, foreignKey: 'lockerId' });
export const initDatabase = async () => { await sequelize.authenticate(); await sequelize.sync(); };
export { sequelize };
