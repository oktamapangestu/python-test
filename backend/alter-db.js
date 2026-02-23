const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'python_test_db',
    });

    try {
      await connection.query('ALTER TABLE questions ADD COLUMN time_limit INT DEFAULT NULL');
      console.log('Kolom time_limit berhasil ditambahkan.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Kolom time_limit sudah ada.');
      } else {
        throw e;
      }
    }

    try {
      await connection.query('ALTER TABLE submissions ADD COLUMN tab_switch_count INT DEFAULT 0');
      console.log('Kolom tab_switch_count berhasil ditambahkan.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Kolom tab_switch_count sudah ada.');
      } else {
        throw e;
      }
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

alterDB();
