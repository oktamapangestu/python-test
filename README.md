# 🐍 Python Coding Test

Platform ujian coding Python berbasis web untuk lingkungan perkuliahan. Dosen dapat membuat soal pemrograman Python, dan mahasiswa dapat mengerjakan soal langsung di browser menggunakan code editor — **tanpa perlu instalasi Python**.

---

## ✨ Fitur Utama

### 👨‍🏫 Dosen (Lecturer)
- **Autentikasi** — Login & registrasi akun dosen
- **Manajemen Soal** — Membuat, mengedit, dan menghapus soal pemrograman (CRUD)
- **Test Cases** — Menentukan input & expected output untuk validasi otomatis jawaban mahasiswa
- **Batas Waktu** — Mengatur time limit (dalam menit) untuk setiap soal
- **Initial Code** — Menyediakan kode awal (boilerplate) untuk mahasiswa
- **Melihat Submissions** — Melihat seluruh jawaban mahasiswa per soal, lengkap dengan:
  - Kode yang dikumpulkan
  - Status (lulus/gagal)
  - Durasi pengerjaan
  - Jumlah perpindahan tab (tab switch detection)
  - Catatan mahasiswa

### 👨‍🎓 Mahasiswa (Student)
- **Autentikasi** — Login & registrasi dengan NIM
- **Dashboard** — Melihat daftar soal yang tersedia beserta status pengerjaan
- **Code Editor** — Editor Python berbasis CodeMirror dengan tema dark (One Dark)
- **Eksekusi Python di Browser** — Menjalankan kode Python langsung di browser menggunakan [Pyodide](https://pyodide.org/) (WebAssembly) — tidak perlu server Python
- **Terminal Output** — Melihat output eksekusi kode secara real-time
- **Validasi Test Cases** — Menjalankan test cases untuk memvalidasi jawaban sebelum submit
- **Timer** — Countdown timer sesuai batas waktu yang ditentukan dosen
- **Catatan (Notes)** — Menambahkan catatan pribadi saat mengerjakan soal
- **Responsive** — Layout adaptif untuk desktop dan mobile

### 🔒 Keamanan & Monitoring
- **Tab Switch Detection** — Mendeteksi dan menghitung berapa kali mahasiswa berpindah tab/minimize window menggunakan Page Visibility API
- **Password Hashing** — Semua password di-hash menggunakan bcrypt
- **Protected Routes** — Halaman dosen dan mahasiswa dilindungi dengan route guard

---

## 🏗️ Arsitektur & Tech Stack

```
python-coding-test/
├── backend/                # Backend API (Express.js)
│   ├── server.js           # Server utama & REST API endpoints
│   ├── init-db.js          # Script inisialisasi database & tabel
│   ├── alter-db.js         # Script migrasi (tambah kolom baru)
│   ├── create-dosen.js     # Script membuat akun dosen default
│   ├── .env                # Konfigurasi environment (database)
│   └── package.json        # Dependencies backend
├── src/                    # Frontend (React + Vite)
│   ├── App.jsx             # Root component & routing
│   ├── main.jsx            # Entry point
│   ├── index.css           # Global styles
│   ├── pages/              # Halaman-halaman aplikasi
│   │   ├── Home.jsx                # Landing page
│   │   ├── LecturerAuth.jsx        # Login/Register dosen
│   │   ├── LecturerDashboard.jsx   # Dashboard dosen (kelola soal)
│   │   ├── LecturerSubmissions.jsx # Lihat jawaban mahasiswa
│   │   ├── StudentAuth.jsx         # Login/Register mahasiswa
│   │   ├── StudentDashboard.jsx    # Dashboard mahasiswa (daftar soal)
│   │   └── StudentCodingArea.jsx   # Halaman mengerjakan soal
│   ├── components/         # Komponen reusable
│   │   ├── Navbar.jsx               # Navigasi utama
│   │   ├── QuestionForm.jsx         # Form buat/edit soal
│   │   ├── ProtectedRoute.jsx       # Route guard mahasiswa
│   │   └── LecturerProtectedRoute.jsx # Route guard dosen
│   └── utils/
│       └── storage.js      # Utilitas local storage
├── public/                 # Static assets
├── index.html              # HTML entry point
├── vite.config.js          # Konfigurasi Vite
└── package.json            # Dependencies & scripts
```

### Frontend
| Teknologi | Fungsi |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **React Router DOM** | Client-side routing |
| **CodeMirror** | Code editor dengan syntax highlighting Python |
| **Pyodide** | Runtime Python di browser (via WebAssembly) |
| **Lucide React** | Icon library |

### Backend
| Teknologi | Fungsi |
|---|---|
| **Express.js 5** | REST API server |
| **MySQL** | Database relasional |
| **mysql2** | MySQL driver untuk Node.js |
| **bcrypt** | Hashing password |
| **dotenv** | Manajemen environment variables |
| **CORS** | Cross-Origin Resource Sharing |

---

## 🗄️ Skema Database

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   students   │     │   questions   │     │  lecturers   │
├──────────────┤     ├───────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)       │     │ id (PK)      │
│ nim (UNIQUE) │     │ lecturer_id   │◄────│ email        │
│ name         │     │ title         │     │ name         │
│ password     │     │ description   │     │ password     │
│ created_at   │     │ initial_code  │     │ created_at   │
└──────┬───────┘     │ test_cases    │     └──────────────┘
       │             │ time_limit    │
       │             │ created_at    │
       │             │ updated_at    │
       │             └───────┬───────┘
       │                     │
       │    ┌────────────────┘
       │    │
       ▼    ▼
┌──────────────────┐
│   submissions    │
├──────────────────┤
│ id (PK)          │
│ student_id (FK)  │
│ question_id (FK) │
│ code             │
│ status           │
│ duration_seconds │
│ notes            │
│ tab_switch_count │
│ created_at       │
└──────────────────┘
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** (v18 atau lebih baru)
- **MySQL Server** yang sudah berjalan
- **npm**

### 1. Clone & Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Konfigurasi Database

Edit file `backend/.env` sesuai konfigurasi MySQL kamu:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=python_test_db
```

### 3. Inisialisasi Database

```bash
# Buat database & tabel
node backend/init-db.js

# Jalankan migrasi (tambah kolom time_limit & tab_switch_count)
node backend/alter-db.js

# (Opsional) Buat akun dosen default
node backend/create-dosen.js
# Email: dosen@kampus.id
# Password: password
```

### 4. Jalankan Aplikasi

```bash
# Jalankan frontend + backend secara bersamaan
npm start

# Atau jalankan terpisah:
npm run dev       # Frontend saja (Vite dev server)
npm run server    # Backend saja (Express)
```

Aplikasi akan berjalan di:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 📡 API Endpoints

### Autentikasi Mahasiswa
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/register` | Registrasi mahasiswa baru |
| `POST` | `/api/login` | Login mahasiswa |

### Autentikasi Dosen
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/lecturer/register` | Registrasi dosen baru |
| `POST` | `/api/lecturer/login` | Login dosen |

### Soal (Questions)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/questions` | Ambil semua soal |
| `GET` | `/api/questions/:id` | Ambil soal berdasarkan ID |
| `POST` | `/api/questions` | Buat soal baru |
| `PUT` | `/api/questions/:id` | Update soal |
| `DELETE` | `/api/questions/:id` | Hapus soal |

### Submissions
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/submissions` | Submit jawaban |
| `GET` | `/api/submissions/:questionId` | Ambil submissions per soal |
| `GET` | `/api/submissions/check/:questionId/:studentId` | Cek status pengerjaan |
| `GET` | `/api/submissions/student/:studentId` | Ambil semua submissions mahasiswa |

---

## 📜 NPM Scripts

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| `npm start` | `concurrently` | Jalankan frontend + backend bersamaan |
| `npm run dev` | `vite` | Jalankan frontend dev server |
| `npm run server` | `node backend/server.js` | Jalankan backend server |
| `npm run build` | `vite build` | Build frontend untuk production |
| `npm run lint` | `eslint .` | Jalankan linter |
| `npm run preview` | `vite preview` | Preview build production |
