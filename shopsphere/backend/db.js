const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopsphere',
};

console.log(
  `DB config: user=${config.user} host=${config.host} db=${config.database} passwordSet=${config.password !== ''}`
);

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // return DECIMAL columns as numbers instead of strings
});

module.exports = pool;