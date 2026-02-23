import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions, saveQuestion, deleteQuestion, getCurrentLecturer } from '../utils/storage';
import QuestionForm from '../components/QuestionForm';
import { Trash2, Edit, List } from 'lucide-react';

export default function LecturerDashboard() {
  const [questions, setQuestions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lecturer = getCurrentLecturer();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    const data = await getQuestions();
    // Only show questions created by this lecturer (optional, or just show all for demo)
    setQuestions(data.filter(q => q.lecturer_id === lecturer?.id));
    setIsLoading(false);
  };

  const handleSaveQuestion = async (newQuestion) => {
    await saveQuestion({ ...newQuestion, lecturer_id: lecturer.id });
    setIsCreating(false);
    setEditingQuestion(null);
    loadQuestions();
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
      await deleteQuestion(id);
      loadQuestions();
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingQuestion(null);
  };

  return (
    <div className="container mt-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dasbor Dosen</h1>
          <p className="text-muted text-sm">Kelola tugas koding kustom Anda.</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn btn-primary">
            Buat Soal Baru
          </button>
        )}
      </div>

      {isCreating && (
        <QuestionForm
          initialData={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={handleCancel}
        />
      )}

      {!isCreating && (
        <div className="grid gap-4 mt-6">
          {isLoading ? (
            <div className="text-center p-8 text-muted">Memuat data...</div>
          ) : questions.length === 0 ? (
            <div className="glass-panel text-center p-8">
              <p className="text-muted">Belum ada soal yang dibuat.</p>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="glass-panel p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{q.title}</h3>
                    <p className="text-sm text-muted mt-1">{q.test_cases?.length || 0} Kasus Uji | Dibuat: {new Date(q.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/lecturer/submissions/${q.id}`} className="btn btn-outline text-purple-400 border-purple-400 hover:bg-purple-500 hover:text-white" title="Lihat Pengumpulan" style={{ textDecoration: 'none' }}>
                      <List size={16} /> Jawaban Mahasiswa
                    </Link>
                    <button onClick={() => handleEdit(q)} className="btn btn-outline text-blue-400 border-blue-400 hover:bg-blue-500 hover:text-white" title="Edit Soal">
                      <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="btn btn-outline text-red-400 border-red-400 hover:bg-red-500 hover:text-white" title="Hapus Soal">
                      <Trash2 size={16} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
