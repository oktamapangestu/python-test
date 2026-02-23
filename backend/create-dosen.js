const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createLecturer() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'python_test_db',
    });

    const email = 'dosen@kampus.id';
    const name = 'Dosen Pengampu';
    const password = 'password'; // Kata sandi default
    
    // Cek apakah akun dengan email ini sudah ada
    const [rows] = await connection.execute('SELECT * FROM lecturers WHERE email = ?', [email]);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        'INSERT INTO lecturers (email, name, password) VALUES (?, ?, ?)',
        [email, name, hashedPassword]
      );
      console.log(`Akun Dosen tunggal berhasil dibuat:\nEmail: ${email}\nPassword: ${password}`);
    } else {
      console.log(`Akun Dosen dengan email '${email}' sudah ada dalam database.`);
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Gagal membuat akun Dosen:', err);
    process.exit(1);
  }
}

createLecturer();
