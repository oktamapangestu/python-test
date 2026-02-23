import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionById, getCurrentStudent } from '../utils/storage';
import { Loader2, Play, CheckCircle, XCircle, ArrowLeft, Clock, Send, AlertTriangle, Terminal, MessageSquare, Code2, Eye, X, EyeOff, FileText, ChevronRight } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

export default function StudentCodingArea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const student = getCurrentStudent();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const codeRef = useRef(code);
  const hasAutoSubmitted = useRef(false);

  // Tab switch detection
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const tabSwitchRef = useRef(0);

  // Mobile responsive state
  const [activeTab, setActiveTab] = useState('editor');
  const [isMobile, setIsMobile] = useState(false);

  // Collapsible panel state
  const [isQuestionOpen, setIsQuestionOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isTestsOpen, setIsTestsOpen] = useState(true);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Tab switch detection via Page Visibility API
  useEffect(() => {
    if (!student?.id || !id) return;
    // Load saved count from localStorage
    const storageKey = `tab_switch_${student.id}_${id}`;
    const saved = parseInt(localStorage.getItem(storageKey) || '0');
    setTabSwitchCount(saved);
    tabSwitchRef.current = saved;

    const handleVisibilityChange = () => {
      if (document.hidden && !hasAutoSubmitted.current) {
        const newCount = tabSwitchRef.current + 1;
        tabSwitchRef.current = newCount;
        setTabSwitchCount(newCount);
        localStorage.setItem(storageKey, newCount.toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [student?.id, id]);

  // Skulpt & Execution state
  const [isSkulptReady, setIsSkulptReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [globalError, setGlobalError] = useState('');

  // Interactive terminal state
  const [terminalLines, setTerminalLines] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const inputResolverRef = useRef(null);
  const terminalEndRef = useRef(null);
  const inputFieldRef = useRef(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, waitingForInput]);

  // Focus input field when waiting for input
  useEffect(() => {
    if (waitingForInput && inputFieldRef.current) {
      inputFieldRef.current.focus();
    }
  }, [waitingForInput]);

  useEffect(() => {
    const fetchQuestion = async () => {
      const q = await getQuestionById(id);
      if (!q) {
        navigate('/student');
        return;
      }
      setQuestion(q);

      // Track start time for duration calculation
      const startKey = `start_time_${student?.id}_${q.id}`;
      if (!localStorage.getItem(startKey)) {
        localStorage.setItem(startKey, Date.now().toString());
      }

      // Load saved notes from localStorage
      const notesKey = `notes_${student?.id}_${q.id}`;
      const savedNotes = localStorage.getItem(notesKey);
      if (savedNotes) setStudentNotes(savedNotes);

      // Check if student already submitted
      try {
        const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
        const checkRes = await fetch(`${apiUrl}/submissions/check/${q.id}/${student?.id}`);
        const checkData = await checkRes.json();
        if (checkData.submitted) {
          setSubmissionStatus(checkData.submission);
          setCode(checkData.submission.code || q.initial_code || q.initialCode || '');
          if (checkData.submission.notes) setStudentNotes(checkData.submission.notes);
        } else {
          // Load auto-saved code, fallback to initial_code
          const savedCode = localStorage.getItem(`code_${student?.id}_${q.id}`);
          setCode(savedCode !== null ? savedCode : (q.initial_code || q.initialCode || ''));
        }
      } catch (err) {
        console.error("Gagal mengecek status pengerjaan", err);
        const savedCode = localStorage.getItem(`code_${student?.id}_${q.id}`);
        setCode(savedCode !== null ? savedCode : (q.initial_code || q.initialCode || ''));
      }

      if (q.time_limit && !submissionStatus) {
        const storageKey = `timer_${student?.id}_${q.id}`;
        let endTime = localStorage.getItem(storageKey);
        if (!endTime) {
          endTime = Date.now() + q.time_limit * 60 * 1000;
          localStorage.setItem(storageKey, endTime);
        }
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    };

    fetchQuestion();

    // Check if Skulpt is loaded
    const checkSkulpt = () => {
      if (window.Sk) {
        setIsSkulptReady(true);
      } else {
        setTimeout(checkSkulpt, 200);
      }
    };
    checkSkulpt();
  }, [id, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (!hasAutoSubmitted.current) {
        handleTimeUp();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const submitToBackend = async (allPassed, submissionCode) => {
    try {
      // Calculate duration
      const startKey = `start_time_${student?.id}_${question.id}`;
      const startTime = parseInt(localStorage.getItem(startKey) || '0');
      const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;

      const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
      await fetch(`${apiUrl}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student?.id,
          question_id: question.id,
          code: submissionCode,
          status: allPassed ? 'passed' : 'failed',
          duration_seconds: durationSeconds,
          notes: studentNotes || null,
          tab_switch_count: tabSwitchRef.current
        })
      });
      localStorage.removeItem(`timer_${student?.id}_${question.id}`);
      localStorage.removeItem(startKey);
      localStorage.removeItem(`notes_${student?.id}_${question.id}`);
      localStorage.removeItem(`tab_switch_${student?.id}_${question.id}`);
      localStorage.removeItem(`code_${student?.id}_${question.id}`);
      setSubmissionStatus({ status: allPassed ? 'passed' : 'failed' });
    } catch (submitErr) {
      console.error("Gagal merekam jawaban:", submitErr);
    }
  };

  const handleTimeUp = async () => {
    hasAutoSubmitted.current = true;
    // If waiting for input, resolve it to unblock
    if (inputResolverRef.current) {
      inputResolverRef.current('');
      inputResolverRef.current = null;
    }
    setWaitingForInput(false);
    addTerminalLine('⏰ Waktu habis! Jawaban dikumpulkan otomatis...', 'error');
    // Run test cases silently and submit
    const results = await runTestCases(codeRef.current);
    const allPassed = results ? results.every(r => r.passed) : false;
    setTestResults({ allPassed, results: results || [] });
    await submitToBackend(allPassed, codeRef.current);
    setIsRunning(false);
  };

  const addTerminalLine = (text, type = 'output') => {
    setTerminalLines(prev => [...prev, { text, type, id: Date.now() + Math.random() }]);
  };

  // Run code interactively with Skulpt (with real-time input)
  const runInteractive = async (codeToRun) => {
    if (!window.Sk) return;
    setIsRunning(true);
    setTerminalLines([{ text: '$ python script.py', type: 'command', id: 'cmd' }]);
    setGlobalError('');

    // Switch to terminal tab on mobile when running
    if (isMobile) setActiveTab('terminal');

    const Sk = window.Sk;

    Sk.configure({
      output: (text) => {
        addTerminalLine(text, 'output');
      },
      inputfun: (prompt) => {
        return new Promise((resolve) => {
          if (prompt) {
            addTerminalLine(prompt, 'prompt');
          }
          setWaitingForInput(true);
          setInputPrompt(prompt || '');
          setCurrentInput('');
          inputResolverRef.current = resolve;
        });
      },
      inputfunTakesPrompt: true,
      __future__: Sk.python3,
      read: (x) => {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
          throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
      }
    });

    try {
      const promise = Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody("<stdin>", false, codeToRun, true);
      });
      await promise;
      addTerminalLine('\n✅ Program selesai dijalankan.', 'success');
    } catch (err) {
      const errMsg = err.toString();
      if (!errMsg.includes('ExternalError') && !errMsg.includes('SystemExit')) {
        addTerminalLine(errMsg, 'error');
      }
    } finally {
      setWaitingForInput(false);
      inputResolverRef.current = null;
      setIsRunning(false);
    }
  };

  // Handle user pressing Enter in the input field
  const handleInputSubmit = (e) => {
    if (e.key === 'Enter' && inputResolverRef.current) {
      const value = currentInput;
      addTerminalLine(value, 'input');
      setWaitingForInput(false);
      setCurrentInput('');
      inputResolverRef.current(value);
      inputResolverRef.current = null;
    }
  };

  // Run test cases silently (no interactive, use predefined inputs)
  const runTestCases = async (codeToRun) => {
    if (!window.Sk) return null;
    const Sk = window.Sk;
    const tcs = question.test_cases || question.testCases || [];
    const results = [];

    for (let i = 0; i < tcs.length; i++) {
      const tc = tcs[i];
      const inputLines = (tc.inputs || '').split('\n');
      let inputIdx = 0;
      let capturedOutput = '';

      Sk.configure({
        output: (text) => { capturedOutput += text; },
        inputfun: (prompt) => {
          return new Promise((resolve) => {
            if (inputIdx < inputLines.length) {
              resolve(inputLines[inputIdx++]);
            } else {
              resolve('');
            }
          });
        },
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        read: (x) => {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
            throw "File not found: '" + x + "'";
          }
          return Sk.builtinFiles["files"][x];
        }
      });

      let execError = null;
      try {
        // Run student code
        await Sk.misceval.asyncToPromise(() => {
          return Sk.importMainWithBody("<stdin>", false, codeToRun, true);
        });

        // If there's test code, run it too
        if (tc.testCode || tc.test_code) {
          const testCodeStr = tc.testCode || tc.test_code;
          capturedOutput = ''; // Reset for test code output
          await Sk.misceval.asyncToPromise(() => {
            return Sk.importMainWithBody("<test>", false, testCodeStr, true);
          });
        }
      } catch (err) {
        execError = err.toString();
      }

      const actualOutput = capturedOutput.trim();
      const expectedOutput = (tc.expectedOutput || tc.expected_output || '').trim();
      const passed = !execError && (actualOutput === expectedOutput);

      results.push({
        index: i + 1,
        inputs: tc.inputs || '',
        testCode: tc.testCode || tc.test_code || '',
        expected: expectedOutput,
        actual: actualOutput,
        error: execError,
        passed
      });
    }

    return results;
  };

  const handleRunOnly = async () => {
    if (!isSkulptReady || isRunning) return;
    setTestResults(null);
    await runInteractive(code);
  };

  const handleFinalSubmit = async () => {
    if (!isSkulptReady || isRunning) return;
    setIsSubmitModalOpen(false);
    setIsRunning(true);
    setTestResults(null);
    setTerminalLines([{ text: '📝 Mengevaluasi jawaban akhir...', type: 'command', id: 'eval' }]);

    // Switch to tests tab on mobile when submitting
    if (isMobile) setActiveTab('tests');

    const results = await runTestCases(code);
    const allPassed = results ? results.every(r => r.passed) : false;
    setTestResults({ allPassed, results: results || [] });
    await submitToBackend(allPassed, code);
    hasAutoSubmitted.current = true;

    addTerminalLine(allPassed ? '\n🎉 Semua kasus uji berhasil!' : '\n❌ Ada kasus uji yang gagal.', allPassed ? 'success' : 'error');
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!question) return null;

  const isTimeUp = timeLeft === 0;

  // Determine which panels to show on mobile
  const showEditor = !isMobile || activeTab === 'editor';
  const showTerminal = !isMobile || activeTab === 'terminal';
  const showTests = !isMobile || activeTab === 'tests';
  const showRightPanel = !isMobile || activeTab === 'terminal' || activeTab === 'tests';

  return (
    <div className="coding-area">
      {/* Top Bar */}
      <div className="coding-topbar">
        <div className="coding-topbar-info">
          <button onClick={() => navigate('/student')} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}>
            <ArrowLeft size={14} /> Kembali
          </button>
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{question.title}</h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{question.description}</p>
            </div>
            {/* <button
              onClick={() => setIsQuestionModalOpen(true)}
              title="Lihat Soal"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
                background: 'rgba(168,85,247,0.12)', color: '#c084fc',
                border: '1px solid rgba(168,85,247,0.25)',
                cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <Eye size={13} /> Lihat Soal
            </button> */}
          </div>
        </div>
        <div className="coding-topbar-actions">
          {tabSwitchCount > 0 && !submissionStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.7rem', borderRadius: '99px',
              fontSize: '0.75rem', fontWeight: 700,
              background: tabSwitchCount >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: tabSwitchCount >= 3 ? '#f87171' : '#fbbf24',
              border: `1px solid ${tabSwitchCount >= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }} title="Jumlah perpindahan tab terdeteksi">
              <EyeOff size={13} />
              {tabSwitchCount}x
            </div>
          )}
          {timeLeft !== null && !submissionStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.875rem', borderRadius: '99px',
              fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700,
              background: timeLeft > 60 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
              color: timeLeft > 60 ? '#60a5fa' : '#f87171',
              border: `1px solid ${timeLeft > 60 ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
              animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
            }}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
          {submissionStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.875rem', borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: 700,
              background: submissionStatus.status === 'passed'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(244,63,94,0.1))',
              color: submissionStatus.status === 'passed' ? '#4ade80' : '#fb7185',
              border: `1px solid ${submissionStatus.status === 'passed' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
              {submissionStatus.status === 'passed' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {submissionStatus.status === 'passed' ? 'Lulus' : 'Gagal'}
            </div>
          )}
          {!submissionStatus && (
            <button
              onClick={handleRunOnly}
              disabled={!isSkulptReady || isRunning || isTimeUp}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.3)',
                cursor: (!isSkulptReady || isRunning || isTimeUp) ? 'not-allowed' : 'pointer',
                opacity: (!isSkulptReady || isRunning || isTimeUp) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Jalankan
            </button>
          )}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={!isSkulptReady || isRunning || isTimeUp || submissionStatus !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
              background: submissionStatus !== null
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: submissionStatus !== null ? '#6b7280' : '#fff',
              border: submissionStatus !== null ? '1px solid rgba(255,255,255,0.1)' : 'none',
              cursor: (submissionStatus !== null || !isSkulptReady || isRunning || isTimeUp) ? 'not-allowed' : 'pointer',
              opacity: (!isSkulptReady || isRunning || isTimeUp) && !submissionStatus ? 0.5 : 1,
              boxShadow: submissionStatus === null ? '0 4px 14px rgba(34,197,94,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {submissionStatus !== null ? <><CheckCircle size={14} /> Dikerjakan</> : <><Send size={14} /> Kumpulkan</>}
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="coding-tabs">
        <button
          className={`coding-tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <Code2 size={14} /> Editor
        </button>
        <button
          className={`coding-tab ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          <Terminal size={14} /> Terminal
        </button>
        <button
          className={`coding-tab ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          <CheckCircle size={14} /> Kasus Uji
          {testResults && (
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: testResults.allPassed ? '#4ade80' : '#f87171',
              flexShrink: 0
            }}></span>
          )}
        </button>
      </div>

      {/* Main IDE Layout */}
      <div className="coding-main">
        {/* Left Panel: Code Editor */}
        <div className={`coding-panel-left ${!showEditor ? 'hidden-mobile' : ''}`}>
          {/* Editor Header */}
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(30,41,59,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
            <code style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>solution.py</code>
            <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>Python 3</span>
          </div>

          {/* Code Editor */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {isTimeUp && !submissionStatus && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5', padding: '1.5rem 2rem', borderRadius: '16px', textAlign: 'center'
                }}>
                  <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                  <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Waktu Habis</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Jawaban dikumpulkan otomatis.</p>
                </div>
              </div>
            )}
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[python()]}
              onChange={(value) => {
                if (!isTimeUp && !submissionStatus) {
                  setCode(value);
                  localStorage.setItem(`code_${student?.id}_${question?.id}`, value);
                }
              }}
              readOnly={isTimeUp || submissionStatus !== null}
              className="h-full text-sm font-mono border-0 [&>.cm-editor]:h-full"
            />
          </div>

          {/* Notes Section */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0
          }}>
            <div style={{
              padding: '0.4rem 1rem',
              background: 'rgba(22,27,34,0.9)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <MessageSquare size={13} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Catatan</span>
              <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>(opsional, terlihat oleh dosen)</span>
            </div>
            <textarea
              value={studentNotes}
              onChange={(e) => {
                if (!isTimeUp && !submissionStatus) {
                  setStudentNotes(e.target.value);
                  localStorage.setItem(`notes_${student?.id}_${question.id}`, e.target.value);
                }
              }}
              readOnly={isTimeUp || submissionStatus !== null}
              placeholder="Tulis catatan untuk dosen di sini..."
              style={{
                width: '100%',
                height: '64px',
                padding: '0.5rem 1rem',
                background: 'rgba(15,23,42,0.5)',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: '#d1d5db',
                fontSize: '0.8rem',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                lineHeight: 1.5,
                opacity: (isTimeUp || submissionStatus !== null) ? 0.6 : 1
              }}
            />
          </div>
        </div>

        {/* Right Panel: Question Info + Terminal + Test Results */}
        <div className={`coding-panel-right ${!showRightPanel ? 'hidden-mobile' : ''}`}>
          {/* Question Info */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="collapsible-header"
              onClick={() => setIsQuestionOpen(!isQuestionOpen)}
              style={{ background: 'rgba(15,23,42,0.7)' }}
            >
              <ChevronRight size={14} className={`collapsible-chevron ${isQuestionOpen ? 'open' : ''}`} />
              <FileText size={14} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Soal</span>
              {!isQuestionOpen && <span style={{ fontSize: '0.7rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{question.title}</span>}
            </div>
            {isQuestionOpen && (
              <div className="collapsible-content" style={{ padding: '0.75rem 1rem' }}>
                <h2 style={{
                  fontSize: '0.95rem', fontWeight: 700, color: '#e5e7eb',
                  margin: '0 0 0.375rem 0'
                }}>
                  {question.title}
                </h2>
                <p style={{
                  fontSize: '0.8rem', color: '#94a3b8', margin: 0,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap'
                }}>
                  {question.description}
                </p>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div
              className="coding-terminal-section"
              style={{ flex: isMobile ? '1 1 100%' : (isTerminalOpen ? '1 1 50%' : '0 0 auto'), display: 'flex', flexDirection: 'column', borderBottom: !isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none', minHeight: 0, transition: 'flex 0.25s ease' }}
            >
              {/* Terminal Header */}
              <div
                className="collapsible-header"
                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                style={{ background: 'rgba(22,27,34,0.9)' }}
              >
                <ChevronRight size={14} className={`collapsible-chevron ${isTerminalOpen ? 'open' : ''}`} />
                <Terminal size={14} style={{ color: '#4ade80' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Terminal</span>
                {isRunning && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.65rem', color: '#4ade80',
                    display: 'flex', alignItems: 'center', gap: '0.375rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></span>
                    {waitingForInput ? 'Menunggu input...' : 'Menjalankan...'}
                  </span>
                )}
              </div>

              {/* Terminal Content */}
              {isTerminalOpen && (
                <div className="collapsible-content" style={{
                  flex: 1, overflow: 'auto', padding: '0.75rem 1rem',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '0.8rem', lineHeight: 1.6
                }}>
                  {terminalLines.length === 0 ? (
                    <div style={{ color: '#484f58', fontStyle: 'italic', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                      <Terminal size={32} style={{ opacity: 0.2 }} />
                      <span>Tekan <b style={{ color: '#60a5fa' }}>Jalankan</b> untuk mulai</span>
                    </div>
                  ) : (
                    terminalLines.map((line) => (
                      <div key={line.id} style={{
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        color: line.type === 'command' ? '#484f58'
                          : line.type === 'prompt' ? '#e5c07b'
                            : line.type === 'input' ? '#56d4dd'
                              : line.type === 'error' ? '#f87171'
                                : line.type === 'success' ? '#4ade80'
                                  : '#c9d1d9',
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
          )}

          {/* Test Results Panel */}
          {showTests && (
            <div
              className="coding-tests-section"
              style={{ flex: isMobile ? '1 1 100%' : (isTestsOpen ? '1 1 50%' : '0 0 auto'), display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'flex 0.25s ease' }}
            >
              {/* Test Results Header */}
              <div
                className="collapsible-header"
                onClick={() => setIsTestsOpen(!isTestsOpen)}
                style={{ background: 'rgba(22,27,34,0.9)' }}
              >
                <ChevronRight size={14} className={`collapsible-chevron ${isTestsOpen ? 'open' : ''}`} />
                <CheckCircle size={14} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>Kasus Uji</span>
                {testResults && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                    padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: testResults.allPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: testResults.allPassed ? '#4ade80' : '#f87171',
                    border: `1px solid ${testResults.allPassed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
                  }}>
                    {testResults.allPassed ? 'LULUS' : 'GAGAL'}
                  </span>
                )}
              </div>

              {/* Test Results Content */}
              {isTestsOpen && <div className="collapsible-content" style={{ flex: 1, overflow: 'auto', padding: '0.75rem 1rem' }}>
                {submissionStatus && !testResults ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', textAlign: 'center', gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: submissionStatus.status === 'passed'
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(244,63,94,0.1))',
                      border: `2px solid ${submissionStatus.status === 'passed' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                      {submissionStatus.status === 'passed'
                        ? <CheckCircle size={28} style={{ color: '#4ade80' }} />
                        : <XCircle size={28} style={{ color: '#f87171' }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#e5e7eb', fontSize: '0.95rem', margin: 0 }}>Telah Dikumpulkan</p>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Status: <span style={{
                          fontWeight: 700,
                          color: submissionStatus.status === 'passed' ? '#4ade80' : '#f87171'
                        }}>{submissionStatus.status === 'passed' ? 'Berhasil' : 'Gagal'}</span>
                      </p>
                    </div>
                  </div>
                ) : !isSkulptReady ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.8rem', justifyContent: 'center', height: '100%' }}>
                    <Loader2 size={14} className="animate-spin" /> Memuat Python...
                  </div>
                ) : isRunning ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.8rem', justifyContent: 'center', height: '100%' }}>
                    <Loader2 size={14} className="animate-spin" /> {waitingForInput ? 'Menunggu input...' : 'Mengevaluasi...'}
                  </div>
                ) : testResults ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {testResults.results.map((r, i) => (
                      <div key={i} style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: `1px solid ${r.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        background: r.passed ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem' }}>
                          {r.passed ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                          <span style={{ color: '#e5e7eb' }}>Uji #{r.index}</span>
                          <span style={{
                            marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                            padding: '0.1rem 0.4rem', borderRadius: '3px',
                            background: r.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: r.passed ? '#4ade80' : '#f87171'
                          }}>
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {r.inputs && (
                            <div><span style={{ color: '#6b7280' }}>Input: </span><span style={{ color: '#56d4dd', whiteSpace: 'pre-wrap' }}>{r.inputs}</span></div>
                          )}
                          {r.testCode && (
                            <div><span style={{ color: '#6b7280' }}>Kode: </span><span style={{ color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>{r.testCode}</span></div>
                          )}
                          <div><span style={{ color: '#6b7280' }}>Target: </span><span style={{ color: '#4ade80', whiteSpace: 'pre-wrap' }}>{r.expected}</span></div>
                          {r.error ? (
                            <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '0.375rem 0.5rem', borderRadius: '6px', whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{r.error}</div>
                          ) : (
                            <div><span style={{ color: '#6b7280' }}>Output: </span>
                              <span style={{ color: r.passed ? '#4ade80' : '#f87171', whiteSpace: 'pre-wrap' }}>{r.actual || '<kosong>'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : globalError ? (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#f87171', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {globalError}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#484f58', fontSize: '0.8rem', gap: '0.5rem' }}>
                    <CheckCircle size={28} style={{ opacity: 0.15 }} />
                    <span>Jalankan kode untuk melihat hasil</span>
                  </div>
                )}
              </div>}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isSubmitModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', padding: '2rem',
            background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }}></div>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
              marginBottom: '1rem', marginTop: '0.5rem'
            }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>Kumpulkan Jawaban?</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Anda hanya bisa mengumpulkan <b style={{ color: '#f8fafc' }}>satu kali saja</b>. Pastikan kode Anda sudah benar.
            </p>
            <div style={{ display: 'flex', width: '100%', gap: '0.75rem' }}>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                style={{
                  flex: 1, padding: '0.625rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500,
                  background: 'rgba(255,255,255,0.05)', color: '#d1d5db',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleFinalSubmit}
                style={{
                  flex: 1, padding: '0.625rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Description Modal */}
      {isQuestionModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
        }} onClick={() => setIsQuestionModalOpen(false)}>
          <div style={{
            width: '100%', maxWidth: '640px', maxHeight: '80vh',
            background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Gradient top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a78bfa, #6366f1)' }}></div>

            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(168,85,247,0.12)', color: '#c084fc'
                }}>
                  <Eye size={18} />
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Deskripsi Soal</span>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '1.5rem', overflow: 'auto', flex: 1
            }}>
              <h2 style={{
                fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc',
                margin: '0 0 1rem', lineHeight: 1.4
              }}>{question.title}</h2>
              <div style={{
                fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.8,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {question.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
