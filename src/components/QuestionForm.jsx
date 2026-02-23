import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

export default function QuestionForm({ onSave, onCancel, initialData = null }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.time_limit || '');
  const [initialCode, setInitialCode] = useState(initialData?.initial_code || initialData?.initialCode || 'def solusi():\n    # Tulis kode Anda di sini\n    pass');
  const [testCases, setTestCases] = useState(initialData?.test_cases || initialData?.testCases || [{ testCode: '', expectedOutput: '', inputs: '' }]);

  const handleAddTestCase = () => {
    setTestCases([...testCases, { testCode: '', expectedOutput: '', inputs: '' }]);
  };

  const handleRemoveTestCase = (index) => {
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || testCases.some(tc => !tc.expectedOutput.trim())) {
      alert('Mohon isi semua bidang utama dan Output yang Diharapkan pada setiap Kasus Uji.');
      return;
    }

    const payload = {
      title,
      description,
      initialCode,
      testCases,
      time_limit: timeLimit ? parseInt(timeLimit, 10) : null
    };
    if (initialData?.id) {
      payload.id = initialData.id;
    }

    onSave(payload);
  };

  return (
    <div className="glass-panel mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{initialData ? 'Edit Soal' : 'Buat Soal Baru'}</h2>
        <button type="button" onClick={onCancel} className="btn btn-outline p-2" title="Batal"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Judul Soal</label>
          <input
            type="text"
            className="form-input"
            placeholder="Misal: Penjumlahan Dua Angka"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Deskripsi Soal</label>
            <textarea
              className="form-input h-32"
              placeholder="Jelaskan apa yang harus diselesaikan oleh mahasiswa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Batas Waktu (Menit) - Opsional</label>
            <input
              type="number"
              min="1"
              className="form-input"
              placeholder="Kosongkan jika tanpa batas waktu"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
            <p className="text-xs text-muted mt-2">
              Jika diisi, mahasiswa akan melihat hitung mundur. Jawaban akan otomatis dikirim ketika waktu habis.
            </p>
          </div>
        </div>

        <div className="input-group">
          <label>Kode Awal (Template Mahasiswa)</label>
          <div className="rounded-lg overflow-hidden border border-gray-700">
            <CodeMirror
              value={initialCode}
              height="200px"
              theme={oneDark}
              extensions={[python()]}
              onChange={(value) => setInitialCode(value)}
              className="text-sm border-0"
            />
          </div>
        </div>

        <div className="mt-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Kasus Uji (Test Cases)</h3>
            <button type="button" onClick={handleAddTestCase} className="btn btn-secondary text-sm">
              <Plus size={16} /> Tambah Test Case
            </button>
          </div>
          <p className="text-sm text-muted mb-4">
            Setiap test case bisa memiliki <b>Input Data</b> (untuk soal yang menggunakan <code>input()</code>), <b>Kode Uji</b> (untuk memanggil fungsi), dan <b>Output yang Diharapkan</b>.
          </p>

          {testCases.map((tc, index) => (
            <div key={index} className="glass-card p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => handleRemoveTestCase(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1"
                title="Hapus Test Case"
              >
                <Trash2 size={18} />
              </button>
              <div className="grid md:grid-cols-3 gap-4 mt-2">
                <div className="input-group mb-0">
                  <label>Input Data <span className="text-xs text-muted">(untuk <code>input()</code>)</span></label>
                  <textarea
                    className="form-input h-20 font-mono text-sm"
                    placeholder={"Satu input per baris, misal:\n5\n3"}
                    value={tc.inputs || ''}
                    onChange={(e) => handleTestCaseChange(index, 'inputs', e.target.value)}
                  />
                </div>
                <div className="input-group mb-0">
                  <label>Kode Uji <span className="text-xs text-muted">(Opsional)</span></label>
                  <textarea
                    className="form-input h-20 font-mono text-sm"
                    placeholder={"Kosongkan atau\nprint(solusi(2))"}
                    value={tc.testCode}
                    onChange={(e) => handleTestCaseChange(index, 'testCode', e.target.value)}
                  />
                </div>
                <div className="input-group mb-0">
                  <label>Output yang Diharapkan</label>
                  <textarea
                    className="form-input h-20 font-mono text-sm"
                    placeholder="Misal: 8"
                    value={tc.expectedOutput}
                    onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={onCancel} className="btn btn-outline">Batal</button>
          <button type="submit" className="btn btn-primary">Simpan Soal</button>
        </div>
      </form>
    </div>
  );
}
