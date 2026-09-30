import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'sis4d_app',
  password: 'S4D_DB_2026_vps',
  database: 'sis4d_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;