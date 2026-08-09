import mysql from 'mysql2/promise';

export const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // default XAMPP kosong
  database: 'test'
});

console.log('MySQL connected');