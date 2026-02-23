import { Navigate } from 'react-router-dom';
import { getCurrentLecturer, getCurrentStudent } from '../utils/storage';

export default function LecturerProtectedRoute({ children }) {
  const lecturer = getCurrentLecturer();
  const student = getCurrentStudent();

  // If a student is logged in, redirect to student dashboard
  if (student && !lecturer) {
    return <Navigate to="/student" replace />;
  }

  if (!lecturer) {
    return <Navigate to="/lecturer-auth" replace />;
  }

  return children;
}
