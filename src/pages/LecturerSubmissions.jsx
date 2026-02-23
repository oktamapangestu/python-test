import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionById } from '../utils/storage';
import { List, CheckCircle, XCircle, ArrowLeft, User, Clock, Code2, Timer, MessageSquare, EyeOff, Play, Loader2, Terminal, ChevronRight } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

export default function LecturerSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Skulpt execution state
  const [isSkulptReady, setIsSkulptReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const inputResolverRef = useRef(null);
  const terminalEndRef = useRef(null);
  const inputFieldRef = useRef(null);

  // Check Skulpt availability
  useEffect(() => {
    const check = () => {
      if (window.Sk) setIsSkulptReady(true);
      else setTimeout(check, 200);
    };
    check();
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines, waitingForInput]);

  // Focus input
  useEffect(() => {
    if (waitingForInput && inputFieldRef.current) inputFieldRef.current.focus();
  }, [waitingForInput]);

  const addLine = (text, type = 'output') => {
    setTerminalLines(prev => [...prev, { text, type, id: Date.now() + Math.random() }]);
  };

  const handleRun = async () => {
    if (!window.Sk || !selectedSubmission?.code || isRunning) return;
    setIsRunning(true);
    setIsTerminalOpen(true);
    setTerminalLines([{ text: '$ python solution.py', type: 'command', id: 'cmd' }]);

    const Sk = window.Sk;
    Sk.configure({
      output: (text) => addLine(text, 'output'),
      inputfun: (prompt) => {
        return new Promise((resolve) => {
          if (prompt) addLine(prompt, 'prompt');
          setWaitingForInput(true);
          setCurrentInput('');
          inputResolverRef.current = resolve;
        });
      },
      inputfunTakesPrompt: true,
      __future__: Sk.python3,
      read: (x) => {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) throw "File not found: '" + x + "'";
        return Sk.builtinFiles["files"][x];
      }
    });

    try {
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, selectedSubmission.code, true));
      addLine('\n✅ Program selesai dijalankan.', 'success');
    } catch (err) {
      const msg = err.toString();
      if (!msg.includes('ExternalError') && !msg.includes('SystemExit')) addLine(msg, 'error');
    } finally {
      setWaitingForInput(false);
      inputResolverRef.current = null;
      setIsRunning(false);
    }
  };

  const handleInputSubmit = (e) => {
    if (e.key === 'Enter' && inputResolverRef.current) {
      addLine(currentInput, 'input');
      setWaitingForInput(false);
      setCurrentInput('');
      inputResolverRef.current(currentInput);
      inputResolverRef.current = null;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = await getQuestionById(id);
        if (!q) {
          navigate('/lecturer');
          return;
        }
        setQuestion(q);

        const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
        const response = await fetch(`${apiUrl}/submissions/${id}`);
        const data = await response.json();

        // Group by student_id to only keep the latest submission per student
        const latestMap = new Map();
        data.forEach(sub => {
          const existing = latestMap.get(sub.student_id);
          if (!existing || new Date(sub.created_at) > new Date(existing.created_at)) {
            latestMap.set(sub.student_id, sub);
          }
        });

        const latestSubmissions = Array.from(latestMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setSubmissions(latestSubmissions);
        if (latestSubmissions.length > 0) {
          setSelectedSubmission(latestSubmissions[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="container mt-12 flex justify-center text-muted">
        Memuat data pengumpulan...
      </div>
    );
  }

  if (!question) return null;

  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
        <button onClick={() => navigate('/lecturer')} className="btn btn-outline" style={{ padding: '0.5rem' }} title="Kembali ke Dasbor">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <List style={{ color: '#a78bfa' }} /> Hasil Pengerjaan Mahasiswa
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            Soal: <span style={{ fontWeight: 600, color: '#fff' }}>{question.title}</span>
          </p>
        </div>
      </div>

      {/* Master-Detail Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 30px rgb(0,0,0,0.5)',
        background: 'rgba(30,41,59,0.6)',
        backdropFilter: 'blur(12px)',
        minHeight: 0
      }}>
        {/* Panel Kiri: Daftar Mahasiswa */}
        <div style={{
          width: '280px',
          minWidth: '280px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Daftar */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(30,41,59,0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 500, color: '#d1d5db', fontSize: '0.875rem' }}>Daftar Mahasiswa</span>
            <span style={{
              background: 'rgba(168,85,247,0.15)',
              color: '#c4b5fd',
              padding: '0.2rem 0.6rem',
              borderRadius: '99px',
              fontSize: '0.7rem',
              fontWeight: 700,
              border: '1px solid rgba(168,85,247,0.25)'
            }}>
              {submissions.length}
            </span>
          </div>

          {/* List Mahasiswa */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {submissions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', padding: '1.5rem', textAlign: 'center' }}>
                <User size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada mahasiswa yang menyelesaikan soal ini.</p>
              </div>
            ) : (
              submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: selectedSubmission?.id === sub.id ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.05)',
                    background: selectedSubmission?.id === sub.id
                      ? 'linear-gradient(135deg, rgba(88,28,135,0.3), rgba(30,58,138,0.15))'
                      : 'rgba(255,255,255,0.02)',
                    cursor: selectedSubmission?.id === sub.id ? 'default' : 'pointer',
                    marginBottom: '0.5rem',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: 'inherit'
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    borderRadius: '50%',
                    padding: '0.5rem',
                    background: selectedSubmission?.id === sub.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
                    color: selectedSubmission?.id === sub.id ? '#c4b5fd' : '#9ca3af'
                  }}>
                    <User size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: selectedSubmission?.id === sub.id ? '#fff' : '#d1d5db',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: '0.5rem'
                      }}>
                        {sub.student_name}
                      </span>
                      {sub.status === 'passed' ? (
                        <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                      <span style={{ color: 'rgba(196,181,253,0.7)', fontFamily: 'monospace' }}>{sub.nim}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {sub.tab_switch_count > 0 && (
                          <span style={{
                            color: sub.tab_switch_count >= 3 ? '#f87171' : '#fbbf24',
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                            fontWeight: 700
                          }} title={`${sub.tab_switch_count}x pindah tab`}>
                            <EyeOff size={10} />
                            {sub.tab_switch_count}
                          </span>
                        )}
                        {sub.duration_seconds != null && (
                          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Timer size={10} />
                            {formatDuration(sub.duration_seconds)}
                          </span>
                        )}
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={10} />
                          {new Date(sub.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel Kanan: Viewer Kode */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e2227', minWidth: 0 }}>
          {selectedSubmission ? (
            <>
              {/* Header Kode */}
              <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(15,23,42,0.7)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    background: 'rgba(59,130,246,0.1)',
                    padding: '0.625rem',
                    borderRadius: '10px',
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.15)',
                    display: 'flex'
                  }}>
                    <Code2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>Kiriman Kode Terakhir</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                      <code style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>solution.py</code>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={handleRun}
                    disabled={!isSkulptReady || isRunning}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                      background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                      border: '1px solid rgba(59,130,246,0.3)',
                      cursor: (!isSkulptReady || isRunning) ? 'not-allowed' : 'pointer',
                      opacity: (!isSkulptReady || isRunning) ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Jalankan
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.375rem' }}>Status Pemeriksaan</div>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: selectedSubmission.status === 'passed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: selectedSubmission.status === 'passed' ? '#4ade80' : '#f87171',
                      border: `1px solid ${selectedSubmission.status === 'passed' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                    }}>
                      {selectedSubmission.status === 'passed' ? '✓ Lulus Uji' : '✗ Gagal Uji'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Notes */}
              {selectedSubmission.notes && (
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(245,158,11,0.04)',
                  borderBottom: '1px solid rgba(245,158,11,0.1)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <MessageSquare size={13} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fbbf24' }}>Catatan Mahasiswa</span>
                  </div>
                  <p style={{
                    fontSize: '0.8rem', color: '#d1d5db', margin: 0,
                    whiteSpace: 'pre-wrap', lineHeight: 1.5,
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace"
                  }}>
                    {selectedSubmission.notes}
                  </p>
                </div>
              )}

              {/* Code Viewer */}
              <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, padding: '0.5rem' }}>
                  <CodeMirror
                    value={selectedSubmission.code}
                    height="100%"
                    theme={oneDark}
                    extensions={[python()]}
                    readOnly={true}
                    className="h-full text-sm font-mono border-0 [&>.cm-editor]:h-full [&>.cm-editor]:bg-transparent"
                  />
                </div>
              </div>

              {/* Terminal Output */}
              <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="collapsible-header"
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  style={{ background: 'rgba(22,27,34,0.9)' }}
                >
                  <ChevronRight size={14} className={`collapsible-chevron ${isTerminalOpen ? 'open' : ''}`} />
                  <Terminal size={14} style={{ color: '#4ade80' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Terminal</span>
                  {isRunning && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
                      {waitingForInput ? 'Menunggu input...' : 'Menjalankan...'}
                    </span>
                  )}
                </div>
                {isTerminalOpen && (
                  <div className="collapsible-content" style={{
                    maxHeight: '200px', overflow: 'auto', padding: '0.75rem 1rem',
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    fontSize: '0.8rem', lineHeight: 1.6,
                    background: 'rgba(13,17,23,0.9)'
                  }}>
                    {terminalLines.length === 0 ? (
                      <div style={{ color: '#484f58', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                        Tekan <b style={{ color: '#60a5fa' }}>Jalankan</b> untuk menjalankan kode mahasiswa
                      </div>
                    ) : (
                      terminalLines.map((line) => (
                        <div key={line.id} style={{
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          color: line.type === 'command' ? '#484f58'
                            : line.type === 'prompt' ? '#e5c07b'
                              : line.type === 'input' ? '#56d4dd'
                                : line.type === 'error' ? '#f87171'
                                  : line.type === 'success' ? '#4ade80' : '#c9d1d9',
                          fontWeight: line.type === 'input' ? 700 : 400
                        }}>
                          {line.text}
                        </div>
                      ))
                    )}
                    {waitingForInput && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ color: '#4ade80', marginRight: '0.375rem', animation: 'pulse 1s infinite' }}>❯</span>
                        <input
                          ref={inputFieldRef}
                          type="text"
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyDown={handleInputSubmit}
                          style={{
                            background: 'transparent', color: '#56d4dd',
                            fontFamily: 'inherit', fontSize: 'inherit',
                            outline: 'none', border: 'none', flex: 1,
                            caretColor: '#56d4dd'
                          }}
                          placeholder="Ketik input, Enter untuk kirim..."
                          autoFocus
                        />
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(15,23,42,0.9)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.75rem',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)' }}></span>
                  <span>Sinkronisasi Aktif</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {selectedSubmission.tab_switch_count > 0 && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      color: selectedSubmission.tab_switch_count >= 3 ? '#f87171' : '#fbbf24'
                    }}>
                      <EyeOff size={13} />
                      Pindah Tab: <span style={{ fontWeight: 600 }}>{selectedSubmission.tab_switch_count}x</span>
                    </span>
                  )}
                  {selectedSubmission.duration_seconds != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#f59e0b' }}>
                      <Timer size={13} />
                      Durasi: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{formatDuration(selectedSubmission.duration_seconds)}</span>
                    </span>
                  )}
                  <span>
                    Dikirim: <span style={{ color: '#d1d5db', fontWeight: 500 }}>{new Date(selectedSubmission.created_at).toLocaleString('id-ID')}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <Code2 size={64} style={{ marginBottom: '1rem', opacity: 0.1 }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#9ca3af' }}>Pilih mahasiswa di panel kiri</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.6 }}>Untuk meninjau kiriman <i>source code</i> mereka</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
