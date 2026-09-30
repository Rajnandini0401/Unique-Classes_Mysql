import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/Dashboard';
import NewAdmissionPage from './pages/admin/NewAdmission';
import AllStudentsPage from './pages/admin/AllStudents';
import TeachersPage from './pages/admin/Teachers';
import OfficeStaffPage from './pages/admin/OfficeStaff';
import BatchesPage from './pages/admin/Batches';
import AttendancePage from './pages/admin/Attendance';
import MarksResultsPage from './pages/admin/MarksResults';
import AdminFeesPage from './pages/admin/Fees';
import AdminAnnouncementsPage from './pages/admin/Announcements';

// Dedicated Teacher Panel Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboard';
import MyBatchesPage from './pages/teacher/MyBatches';
import MyClassesPage from './pages/teacher/MyClasses';
import TeacherAssignmentsPage from './pages/teacher/TeacherAssignments';
import TeacherAttendancePage from './pages/teacher/TeacherAttendance';
import TeacherTestsPage from './pages/teacher/TeacherTests';
import TeacherStudentsPage from './pages/teacher/TeacherStudents';
import TeacherProfilePage from './pages/teacher/TeacherProfile';
import TeacherAnnouncementsPage from './pages/teacher/TeacherAnnouncements';

// Dedicated Staff Panel Pages
import StaffDashboardPage from './pages/staff/StaffDashboard';
import StaffAdmissionPage from './pages/staff/StaffAdmission';
import StaffStudentsPage from './pages/staff/StaffStudents';
import StaffAttendancePage from './pages/staff/StaffAttendance';
import StaffFeesPage from './pages/staff/StaffFees';
import StaffBatchesPage from './pages/staff/StaffBatches';
import StaffTestsPage from './pages/staff/StaffTests';
import StaffAnnouncementsPage from './pages/staff/StaffAnnouncements';
import StaffProfilePage from './pages/staff/StaffProfile';

// Dedicated Student Panel Pages
import StudentDashboardPage from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfile';
import StudentAttendancePage from './pages/student/StudentAttendance';
import StudentTestsPage from './pages/student/StudentTests';
import StudentFeesPage from './pages/student/StudentFees';
import StudentSchedulePage from './pages/student/StudentSchedule';
import StudentAnnouncementsPage from './pages/student/StudentAnnouncements';
import StudentAssignmentsPage from './pages/student/StudentAssignments';

// Helper Component: Automatically Scroll to Top on Navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Route Wrapper for Student Portal Access Protection
const StudentProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext) || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC', color: '#1E3A8A' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(30,58,138,0.2)', borderTopColor: '#1E3A8A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Verifying student session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  const isStudentUser = Boolean(user && (user.role === 'student' || user.role === 'admin'));

  if (!token || !user || !isStudentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Wrapper for Dedicated Teacher Panel Access Protection
const TeacherProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext) || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0c', color: 'var(--color-champagne-gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--color-metallic-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>Verifying teacher session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  const isTeacherUser = Boolean(user && (user.role === 'teacher' || user.role === 'admin'));

  if (!token || !user || !isTeacherUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Wrapper for Dedicated Staff Panel Access Protection
const StaffProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext) || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC', color: '#1E3A8A' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(30,58,138,0.2)', borderTopColor: '#1E3A8A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Verifying staff session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  const isStaffUser = Boolean(user && (user.role === 'office' || user.role === 'staff' || user.role === 'admin'));

  if (!token || !user || !isStaffUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Wrapper for Admin Panel Access Protection
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext) || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0c', color: 'var(--color-champagne-gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--color-metallic-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>Verifying admin session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  const isAdminUser = Boolean(user && (user.role === 'admin' || user.role === 'office'));

  if (!token || !user || !isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Default Route -> Redirect to Admin Dashboard */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Login Portal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Panel Routes (Protected) */}
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
          <Route path="/admin/new-admission" element={<AdminProtectedRoute><NewAdmissionPage /></AdminProtectedRoute>} />
          <Route path="/admin/new-admission/edit/:id" element={<AdminProtectedRoute><NewAdmissionPage /></AdminProtectedRoute>} />
          <Route path="/admin/students" element={<AdminProtectedRoute><AllStudentsPage /></AdminProtectedRoute>} />
          <Route path="/admin/teachers" element={<AdminProtectedRoute><TeachersPage /></AdminProtectedRoute>} />
          <Route path="/admin/staff" element={<AdminProtectedRoute><OfficeStaffPage /></AdminProtectedRoute>} />
          <Route path="/admin/batches" element={<AdminProtectedRoute><BatchesPage /></AdminProtectedRoute>} />
          <Route path="/admin/attendance" element={<AdminProtectedRoute><AttendancePage /></AdminProtectedRoute>} />
          <Route path="/admin/results" element={<AdminProtectedRoute><MarksResultsPage /></AdminProtectedRoute>} />
          <Route path="/admin/fees" element={<AdminProtectedRoute><AdminFeesPage /></AdminProtectedRoute>} />
          <Route path="/admin/announcements" element={<AdminProtectedRoute><AdminAnnouncementsPage /></AdminProtectedRoute>} />

          {/* Dedicated Staff Panel Routes (Protected) */}
          <Route path="/staff" element={<StaffProtectedRoute><StaffDashboardPage /></StaffProtectedRoute>} />
          <Route path="/staff/dashboard" element={<StaffProtectedRoute><StaffDashboardPage /></StaffProtectedRoute>} />
          <Route path="/staff/admission" element={<StaffProtectedRoute><StaffAdmissionPage /></StaffProtectedRoute>} />
          <Route path="/staff/students" element={<StaffProtectedRoute><StaffStudentsPage /></StaffProtectedRoute>} />
          <Route path="/staff/attendance" element={<StaffProtectedRoute><StaffAttendancePage /></StaffProtectedRoute>} />
          <Route path="/staff/fees" element={<StaffProtectedRoute><StaffFeesPage /></StaffProtectedRoute>} />
          <Route path="/staff/batches" element={<StaffProtectedRoute><StaffBatchesPage /></StaffProtectedRoute>} />
          <Route path="/staff/tests" element={<StaffProtectedRoute><StaffTestsPage /></StaffProtectedRoute>} />
          <Route path="/staff/announcements" element={<StaffProtectedRoute><StaffAnnouncementsPage /></StaffProtectedRoute>} />
          <Route path="/staff/profile" element={<StaffProtectedRoute><StaffProfilePage /></StaffProtectedRoute>} />
          <Route path="/office/dashboard" element={<Navigate to="/staff/dashboard" replace />} />

          {/* Dedicated Teacher Panel Routes (Protected) */}
          <Route path="/teacher" element={<TeacherProtectedRoute><TeacherDashboardPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/dashboard" element={<TeacherProtectedRoute><TeacherDashboardPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/batches" element={<TeacherProtectedRoute><MyBatchesPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/classes" element={<TeacherProtectedRoute><MyClassesPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/assignments" element={<TeacherProtectedRoute><TeacherAssignmentsPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/attendance" element={<TeacherProtectedRoute><TeacherAttendancePage /></TeacherProtectedRoute>} />
          <Route path="/teacher/tests" element={<TeacherProtectedRoute><TeacherTestsPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/schedule" element={<TeacherProtectedRoute><Navigate to="/teacher/batches" replace /></TeacherProtectedRoute>} />
          <Route path="/teacher/students" element={<TeacherProtectedRoute><TeacherStudentsPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/announcements" element={<TeacherProtectedRoute><TeacherAnnouncementsPage /></TeacherProtectedRoute>} />
          <Route path="/teacher/profile" element={<TeacherProtectedRoute><TeacherProfilePage /></TeacherProtectedRoute>} />

          {/* Dedicated Student Panel Routes (Protected) */}
          <Route path="/student" element={<StudentProtectedRoute><StudentDashboardPage /></StudentProtectedRoute>} />
          <Route path="/student/dashboard" element={<StudentProtectedRoute><StudentDashboardPage /></StudentProtectedRoute>} />
          <Route path="/student/profile" element={<StudentProtectedRoute><StudentProfilePage /></StudentProtectedRoute>} />
          <Route path="/student/attendance" element={<StudentProtectedRoute><StudentAttendancePage /></StudentProtectedRoute>} />
          <Route path="/student/tests" element={<StudentProtectedRoute><StudentTestsPage /></StudentProtectedRoute>} />
          <Route path="/student/fees" element={<StudentProtectedRoute><StudentFeesPage /></StudentProtectedRoute>} />
          <Route path="/student/schedule" element={<StudentProtectedRoute><StudentSchedulePage /></StudentProtectedRoute>} />
          <Route path="/student/announcements" element={<StudentProtectedRoute><StudentAnnouncementsPage /></StudentProtectedRoute>} />
          <Route path="/student/assignments" element={<StudentProtectedRoute><StudentAssignmentsPage /></StudentProtectedRoute>} />

          {/* Catch-all fallback -> Redirect to Admin Dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
