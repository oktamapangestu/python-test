import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
import { loginStudent, registerStudent } from '../utils/storage';

export default function StudentAuth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginView) {
        await loginStudent(nim, password);
      } else {
        if (!name.trim()) {
          throw new Error('Nama lengkap diwajibkan.');
        }
        await registerStudent({ name, nim, password });
        await loginStudent(nim, password); // Auto-login after register
      }

      // Successfully authenticated
      navigate('/student');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setPassword('');
  };

  return (
    <div className="container mt-12 flex justify-center items-center pb-12">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Portal Mahasiswa</h1>
          <p className="text-muted">
            {isLoginView
              ? 'Masuk untuk mengakses dan mengerjakan tugas koding Anda.'
              : 'Daftarkan diri Anda untuk mulai memecahkan algoritma.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginView && (
            <div className="input-group mb-0">
              <label>Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                placeholder="Misal: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoginView}
              />
            </div>
          )}

          <div className="input-group mb-0">
            <label>Nomor Induk Mahasiswa (NIM)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Misal: 12345678"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-0">
            <label>Kata Sandi</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4 justify-center py-3">
            {isLoginView ? (
              <><LogIn size={18} /> Masuk Sekarang</>
            ) : (
              <><UserPlus size={18} /> Daftar Akun Baru</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {isLoginView ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            type="button"
            onClick={toggleView}
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
          >
            {isLoginView ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  );
}
