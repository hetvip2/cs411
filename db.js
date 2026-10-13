// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '34.132.234.221',
  user: 'testuser',
  password: 'Testinguser1!',
  database: 'new_terrain',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;