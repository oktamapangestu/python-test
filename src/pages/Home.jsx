import { Link } from 'react-router-dom';
import { UserCog, UserCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mt-8 flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Platform Uji Koding Python</h1>
        <p className="text-lg text-muted">Selamat datang! Silakan pilih peran Anda untuk melanjutkan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/lecturer" style={{ textDecoration: 'none' }}>
          <div className="glass-card p-6 flex-col items-center text-center">
            <UserCog size={48} className="mb-4 text-blue-500" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-xl font-bold mb-2">Masuk Sebagai Dosen</h2>
            <p className="text-muted text-sm">Buat dan kelola soal-soal koding Python beserta kasus ujinya untuk mahasiswa Anda.</p>
          </div>
        </Link>

        <Link to="/student" style={{ textDecoration: 'none' }}>
          <div className="glass-card p-6 flex-col items-center text-center">
            <UserCircle size={48} className="mb-4 text-green-500" style={{ color: 'var(--success)' }} />
            <h2 className="text-xl font-bold mb-2">Masuk Sebagai Mahasiswa</h2>
            <p className="text-muted text-sm">Kerjakan soal koding yang tersedia dan jalankan kode Python secara langsung.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
