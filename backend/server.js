const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'python_test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { nim, name, password } = req.body;
    
    if (!nim || !name || !password) {
      return res.status(400).json({ error: 'NIM, Nama, dan Kata Sandi diwajibkan.' });
    }

    // Check if NIM exists
    const [rows] = await pool.execute('SELECT * FROM students WHERE nim = ?', [nim]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'NIM sudah terdaftar. Silakan login.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student
    const [result] = await pool.execute(
      'INSERT INTO students (nim, name, password) VALUES (?, ?, ?)',
      [nim, name, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Registrasi berhasil',
      student: { id: result.insertId, nim, name }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { nim, password } = req.body;
    
    if (!nim || !password) {
      return res.status(400).json({ error: 'NIM dan Kata Sandi diwajibkan.' });
    }

    // Get student
    const [rows] = await pool.execute('SELECT * FROM students WHERE nim = ?', [nim]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'NIM atau Kata Sandi tidak valid.' });
    }

    const student = rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'NIM atau Kata Sandi tidak valid.' });
    }

    res.json({
      message: 'Login berhasil',
      student: { id: student.id, nim: student.nim, name: student.name }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

// ==========================================
// LECTURERS API
// ==========================================

// Lecturer Register
app.post('/api/lecturer/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, Nama, dan Kata Sandi diwajibkan.' });
    }

    const [rows] = await pool.execute('SELECT * FROM lecturers WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO lecturers (email, name, password) VALUES (?, ?, ?)',
      [email, name, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Registrasi Dosen berhasil',
      lecturer: { id: result.insertId, email, name }
    });
  } catch (err) {
    console.error('Lecturer Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat registrasi Dosen.' });
  }
});

// Lecturer Login
app.post('/api/lecturer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan Kata Sandi diwajibkan.' });
    }

    const [rows] = await pool.execute('SELECT * FROM lecturers WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email atau Kata Sandi tidak valid.' });
    }

    const lecturer = rows[0];
    const validPassword = await bcrypt.compare(password, lecturer.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email atau Kata Sandi tidak valid.' });
    }

    res.json({
      message: 'Login Dosen berhasil',
      lecturer: { id: lecturer.id, email: lecturer.email, name: lecturer.name }
    });
  } catch (err) {
    console.error('Lecturer Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login Dosen.' });
  }
});

// ==========================================
// QUESTIONS API
// ==========================================

// Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM questions ORDER BY created_at DESC');
    // Parse JSON strings back to objects
    const questions = rows.map(q => ({
      ...q,
      test_cases: typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases
    }));
    res.json(questions);
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Gagal mengambil data soal.' });
  }
});

// Get question by ID
app.get('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    }
    const q = rows[0];
    q.test_cases = typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases;
    res.json(q);
  } catch (err) {
    console.error('Get question by ID error:', err);
    res.status(500).json({ error: 'Gagal mengambil data soal.' });
  }
});

// Create question (Requires lecturer_id)
app.post('/api/questions', async (req, res) => {
  try {
    const { lecturer_id, title, description, initialCode, testCases, time_limit } = req.body;
    
    if (!lecturer_id || !title || !description || !testCases) {
      return res.status(400).json({ error: 'Data soal tidak lengkap.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO questions (lecturer_id, title, description, initial_code, test_cases, time_limit) VALUES (?, ?, ?, ?, ?, ?)',
      [lecturer_id, title, description, initialCode || '', JSON.stringify(testCases), time_limit || null]
    );

    res.status(201).json({ id: result.insertId, message: 'Soal berhasil disimpan.' });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Gagal menyimpan soal.' });
  }
});

// Update question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, initialCode, testCases, time_limit } = req.body;
    
    await pool.execute(
      'UPDATE questions SET title = ?, description = ?, initial_code = ?, test_cases = ?, time_limit = ? WHERE id = ?',
      [title, description, initialCode || '', JSON.stringify(testCases), time_limit || null, id]
    );

    res.json({ message: 'Soal berhasil diperbarui.' });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Gagal memperbarui soal.' });
  }
});

// Delete question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ message: 'Soal berhasil dihapus.' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Gagal menghapus soal.' });
  }
});

// ==========================================
// SUBMISSIONS API
// ==========================================

// Submit code answer
app.post('/api/submissions', async (req, res) => {
  try {
    const { student_id, question_id, code, status, duration_seconds, notes, tab_switch_count } = req.body;

    if (!student_id || !question_id || !code || !status) {
      return res.status(400).json({ error: 'Data pengumpulan tidak lengkap.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO submissions (student_id, question_id, code, status, duration_seconds, notes, tab_switch_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id, question_id, code, status, duration_seconds || null, notes || null, tab_switch_count || 0]
    );

    res.status(201).json({ id: result.insertId, message: 'Jawaban berhasil direkam.' });
  } catch (err) {
    console.error('Submit code error:', err);
    res.status(500).json({ error: 'Gagal menyimpan jawaban.' });
  }
});

// Get submissions for a specific question (For Lecturers)
app.get('/api/submissions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    
    // Join with students to get student name and nim
    const query = `
      SELECT sub.*, s.nim, s.name as student_name
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      WHERE sub.question_id = ?
      ORDER BY sub.created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [questionId]);
    res.json(rows);
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar jawaban mahasiswa.' });
  }
});

// Check if student has submitted
app.get('/api/submissions/check/:questionId/:studentId', async (req, res) => {
  try {
    const { questionId, studentId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE question_id = ? AND student_id = ? ORDER BY created_at DESC LIMIT 1',
      [questionId, studentId]
    );
    if (rows.length > 0) {
      res.json({ submitted: true, submission: rows[0] });
    } else {
      res.json({ submitted: false });
    }
  } catch (err) {
    console.error('Check submission error:', err);
    res.status(500).json({ error: 'Gagal mengecek status pengerjaan.' });
  }
});

// Get all submissions for a specific student (For Student Dashboard)
app.get('/api/submissions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM submissions WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get student submissions error:', err);
    res.status(500).json({ error: 'Gagal mengambil data pengerjaan mahasiswa.' });
  }
});

// Update grade for a submission (For Lecturers)
app.patch('/api/submissions/:id/grade', async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ error: 'Nilai tidak boleh kosong.' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ error: 'Nilai harus antara 0-100.' });
    }

    await pool.execute('UPDATE submissions SET grade = ? WHERE id = ?', [grade, id]);
    res.json({ message: 'Nilai berhasil disimpan.' });
  } catch (err) {
    console.error('Update grade error:', err);
    res.status(500).json({ error: 'Gagal menyimpan nilai.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
