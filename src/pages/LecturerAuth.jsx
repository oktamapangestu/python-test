import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { loginLecturer } from '../utils/storage';

export default function LecturerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await loginLecturer(email, password);
      // Successfully authenticated
      navigate('/lecturer');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-12 flex justify-center items-center pb-12">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <ShieldCheck size={120} />
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4 text-purple-400">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Portal Dosen</h1>
          <p className="text-muted">
            Masuk untuk mengelola soal uji kompetensi koding.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">

          <div className="input-group mb-0">
            <label>Alamat Email Institusi</label>
            <input
              type="email"
              className="form-input focus:ring-purple-500 focus:border-purple-500"
              placeholder="dosen@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-0">
            <label>Kata Sandi</label>
            <input
              type="password"
              className="form-input focus:ring-purple-500 focus:border-purple-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn bg-purple-600 hover:bg-purple-700 text-white w-full mt-4 justify-center py-3">
            <LogIn size={18} /> Masuk ke Dasbor
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted relative z-10">
          Gunakan akun Dosen yang telah diberikan oleh Administrator.
        </div>
      </div>
    </div>
  );
}
