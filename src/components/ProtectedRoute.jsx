import { Navigate } from 'react-router-dom';
import { getCurrentStudent, getCurrentLecturer } from '../utils/storage';

export default function ProtectedRoute({ children }) {
  const student = getCurrentStudent();
  const lecturer = getCurrentLecturer();

  // If a lecturer is logged in, redirect to lecturer dashboard
  if (lecturer && !student) {
    return <Navigate to="/lecturer" replace />;
  }

  if (!student) {
    return <Navigate to="/student-auth" replace />;
  }

  return children;
}
