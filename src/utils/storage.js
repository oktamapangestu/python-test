const API_BASE_URL = `http://${window.location.hostname}:3000/api`;

// ==========================================
// QUESTIONS LOGIC (BACKEND MYSql)
// ==========================================

export async function getQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveQuestion(question) {
  try {
    const url = question.id 
      ? `${API_BASE_URL}/questions/${question.id}`
      : `${API_BASE_URL}/questions`;
    
    const method = question.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });

    if (!response.ok) throw new Error('Failed to save question');
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function deleteQuestion(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete question');
  } catch (error) {
    console.error(error);
  }
}

export async function getQuestionById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch question details');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ==========================================
// LECTURER AUTHENTICATION
// ==========================================
const CURRENT_LECTURER_KEY = 'python_coding_test_current_lecturer';

export async function registerLecturer({ name, email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mendaftar akun dosen.');
    }

    return data.lecturer;
  } catch (error) {
    throw error;
  }
}

export async function loginLecturer(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/lecturer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal melakukan login dosen.');
    }

    localStorage.setItem(CURRENT_LECTURER_KEY, JSON.stringify(data.lecturer));
    return data.lecturer;
  } catch (error) {
    throw error;
  }
}

export function logoutLecturer() {
  localStorage.removeItem(CURRENT_LECTURER_KEY);
}

export function getCurrentLecturer() {
  const data = localStorage.getItem(CURRENT_LECTURER_KEY);
  return data ? JSON.parse(data) : null;
}

// === AUTHENTICATION LOGIC (BACKEND MYSQL) ===
const CURRENT_STUDENT_KEY = 'python_coding_test_current_student';

export async function registerStudent({ name, nim, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, nim, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mendaftar akun.');
    }

    return data.student;
  } catch (error) {
    throw error; // Rethrow to display in UI
  }
}

export async function loginStudent(nim, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal melakukan login.');
    }

    // Save session payload to local storage
    localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(data.student));
    return data.student;
  } catch (error) {
    throw error;
  }
}

export function logoutStudent() {
  localStorage.removeItem(CURRENT_STUDENT_KEY);
}

export function getCurrentStudent() {
  const data = localStorage.getItem(CURRENT_STUDENT_KEY);
  return data ? JSON.parse(data) : null;
}
