import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, ChevronLeft, LogOut, User, GraduationCap, BookOpen } from 'lucide-react';
import { getCurrentStudent, logoutStudent, getCurrentLecturer, logoutLecturer } from '../utils/storage';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const student = getCurrentStudent();
  const lecturer = getCurrentLecturer();

  const handleStudentLogout = () => {
    logoutStudent();
    navigate('/student-auth');
  };

  const handleLecturerLogout = () => {
    logoutLecturer();
    navigate('/lecturer-auth');
  };

  const homeLink = student ? '/student' : lecturer ? '/lecturer' : '/';

  return (
    <nav style={{
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(15,23,42,0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left: Brand + Beranda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to={homeLink} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          textDecoration: 'none', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem'
        }}>
          <Code2 size={22} style={{ color: '#3b82f6' }} />
          <span>PythonTest</span>
        </Link>


      </div>

      {/* Right: User info + Keluar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {student && location.pathname.startsWith('/student') && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem', borderRadius: '8px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.12)'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))',
                color: '#93c5fd'
              }}>
                <GraduationCap size={14} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{student.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Mahasiswa</div>
              </div>
            </div>
            <button
              onClick={handleStudentLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.75rem', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 500,
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.12)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <LogOut size={13} /> Keluar
            </button>
          </>
        )}

        {lecturer && location.pathname.startsWith('/lecturer') && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem', borderRadius: '8px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.12)'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                color: '#c4b5fd'
              }}>
                <BookOpen size={14} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{lecturer.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Dosen</div>
              </div>
            </div>
            <button
              onClick={handleLecturerLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.75rem', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 500,
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.12)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <LogOut size={13} /> Keluar
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
