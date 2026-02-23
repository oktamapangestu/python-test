const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    // Connect without database selected to be able to create one
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Terhubung ke MySQL Server.');

    const dbName = process.env.DB_NAME || 'python_test_db';
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database '${dbName}' berhasil dikonfirmasi/dibuat.`);
    
    await connection.query(`USE \`${dbName}\`;`);

    // 1. Students Table
    const createStudentsTable = `
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nim VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createStudentsTable);
    console.log('Tabel "students" OK.');

    // 2. Lecturers Table
    const createLecturersTable = `
      CREATE TABLE IF NOT EXISTS lecturers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createLecturersTable);
    console.log('Tabel "lecturers" OK.');

    // 3. Questions Table
    const createQuestionsTable = `
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lecturer_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        initial_code TEXT,
        test_cases JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createQuestionsTable);
    console.log('Tabel "questions" OK.');

    // 4. Submissions Table
    const createSubmissionsTable = `
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        question_id INT NOT NULL,
        code TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createSubmissionsTable);
    console.log('Tabel "submissions" OK.');

    await connection.end();
    console.log('Inisialisasi Database selesai dengan sukses.');
    process.exit(0);
  } catch (error) {
    console.error('Gagal menginisialisasi database:', error);
    process.exit(1);
  }
}

initDB();
