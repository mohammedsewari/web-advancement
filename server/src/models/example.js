import { DataTypes } from 'sequelize';        // brings in the data type tools
import { sequelize } from '../config/database.js'; // brings in the DB connection

export const Example = sequelize.define('Example', {
    // This defines ONE column in your table
    value: {
        type: DataTypes.STRING,   // what type of data (text, number, boolean...)
        allowNull: false,         // this column CANNOT be empty
        validate: {
            len: [1, 200]         // must be between 1 and 200 characters
        }
    }
}, {
    tableName: 'examples'  // exact name of the table in the database
});
