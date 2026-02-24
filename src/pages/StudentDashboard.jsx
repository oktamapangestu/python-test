import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions, getCurrentStudent } from '../utils/storage';
import { Play, CheckCircle, XCircle, Clock, Timer, EyeOff, FileText, Code2, Star } from 'lucide-react';

export default function StudentDashboard() {
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const student = getCurrentStudent();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getQuestions();
    setQuestions(data);

    // Fetch all submissions for this student
    if (student?.id) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
        const res = await fetch(`${apiUrl}/submissions/student/${student.id}`);
        const subs = await res.json();
        // Group by question_id, keep latest per question
        const subMap = {};
        subs.forEach(sub => {
          if (!subMap[sub.question_id] || new Date(sub.created_at) > new Date(subMap[sub.question_id].created_at)) {
            subMap[sub.question_id] = sub;
          }
        });
        setSubmissions(subMap);
      } catch (err) {
        console.error('Gagal memuat status pengerjaan:', err);
      }
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return null;
    if (seconds < 60) return `${seconds}d`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return s > 0 ? `${m}m ${s}d` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}j ${rm}m` : `${h}j`;
  };

  const getStatus = (questionId) => {
    const sub = submissions[questionId];
    if (!sub) return { label: 'Belum Dikerjakan', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.25)', icon: 'pending' };
    if (sub.status === 'passed') return { label: 'Lulus', color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', icon: 'passed' };
    return { label: 'Gagal', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: 'failed' };
  };

  return (
    <div className="container mt-8 pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dasbor Mahasiswa</h1>
        <p className="text-muted text-sm">Pilih soal koding untuk mulai mengerjakan.</p>
      </div>

      {/* Stats Summary */}
      {questions.length > 0 && (
        <div style={{
          display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            fontSize: '0.8rem', color: '#c4b5fd'
          }}>
            <FileText size={14} />
            <span style={{ fontWeight: 700 }}>{questions.length}</span> Soal
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            fontSize: '0.8rem', color: '#4ade80'
          }}>
            <CheckCircle size={14} />
            <span style={{ fontWeight: 700 }}>{Object.values(submissions).filter(s => s.status === 'passed').length}</span> Lulus
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '0.8rem', color: '#f87171'
          }}>
            <XCircle size={14} />
            <span style={{ fontWeight: 700 }}>{Object.values(submissions).filter(s => s.status === 'failed').length}</span> Gagal
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)',
            fontSize: '0.8rem', color: '#9ca3af'
          }}>
            <Clock size={14} />
            <span style={{ fontWeight: 700 }}>{questions.length - Object.keys(submissions).length}</span> Belum
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {questions.length === 0 ? (
          <div className="glass-panel text-center p-8 md:col-span-2">
            <p className="text-muted">Tidak ada soal yang tersedia saat ini.</p>
          </div>
        ) : (
          questions.map((q) => {
            const status = getStatus(q.id);
            const sub = submissions[q.id];

            return (
              <div key={q.id} className="glass-card flex flex-col" style={{
                borderLeft: `3px solid ${status.color}`,
                transition: 'all 0.3s ease',
                padding: 0,
                overflow: 'hidden'
              }}>
                {/* Card Body */}
                <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Header: Title + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f1f5f9', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.55rem', borderRadius: '99px',
                      fontSize: '0.65rem', fontWeight: 700,
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.border}`,
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {status.icon === 'passed' && <CheckCircle size={11} />}
                      {status.icon === 'failed' && <XCircle size={11} />}
                      {status.icon === 'pending' && <Clock size={11} />}
                      {status.label}
                    </span>
                  </div>

                  {/* Description — clamped to 2 lines */}
                  <p style={{
                    fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.6,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}
                    className="rich-description"
                    dangerouslySetInnerHTML={{ __html: q.description }}
                  />

                  {/* Submission Details */}
                  {sub && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                      marginTop: 'auto', paddingTop: '0.75rem'
                    }}>
                      {sub.duration_seconds != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#f59e0b' }}>
                          <Timer size={11} /> {formatDuration(sub.duration_seconds)}
                        </span>
                      )}
                      {sub.tab_switch_count > 0 && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem',
                          color: sub.tab_switch_count >= 3 ? '#f87171' : '#fbbf24'
                        }}>
                          <EyeOff size={11} /> {sub.tab_switch_count}x tab
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                        <Clock size={11} /> {new Date(sub.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {sub.grade !== null && sub.grade !== undefined && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.75rem', fontWeight: 700,
                          color: '#60a5fa',
                          background: 'rgba(59,130,246,0.1)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(59,130,246,0.2)'
                        }}>
                          <Star size={11} /> Nilai: {sub.grade}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(15,23,42,0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-blue" style={{ margin: 0 }}>{q.test_cases?.length || 0} Kasus Uji</span>
                    {q.time_limit && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.2rem 0.5rem', borderRadius: '99px',
                        fontSize: '0.65rem', fontWeight: 600,
                        background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                        border: '1px solid rgba(245,158,11,0.2)'
                      }}>
                        <Timer size={10} /> {q.time_limit}m
                      </span>
                    )}
                  </div>
                  <Link to={`/student/solve/${q.id}`} className="btn btn-primary" style={{
                    textDecoration: 'none', padding: '0.4rem 1rem',
                    fontSize: '0.8rem', borderRadius: '8px'
                  }}>
                    {sub ? (
                      <><Code2 size={14} /> Lihat Kode</>
                    ) : (
                      <>Kerjakan <Play size={14} /></>
                    )}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
