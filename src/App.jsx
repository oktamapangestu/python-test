import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LecturerDashboard from './pages/LecturerDashboard';
import LecturerSubmissions from './pages/LecturerSubmissions';
import StudentDashboard from './pages/StudentDashboard';
import StudentCodingArea from './pages/StudentCodingArea';
import StudentAuth from './pages/StudentAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LecturerAuth from './pages/LecturerAuth';
import LecturerProtectedRoute from './components/LecturerProtectedRoute';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lecturer-auth" element={<LecturerAuth />} />
        <Route
          path="/lecturer"
          element={
            <LecturerProtectedRoute>
              <LecturerDashboard />
            </LecturerProtectedRoute>
          }
        />
        <Route
          path="/lecturer/submissions/:id"
          element={
            <LecturerProtectedRoute>
              <LecturerSubmissions />
            </LecturerProtectedRoute>
          }
        />
        <Route path="/student-auth" element={<StudentAuth />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/solve/:id"
          element={
            <ProtectedRoute>
              <StudentCodingArea />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
