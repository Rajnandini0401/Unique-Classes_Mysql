import React from 'react';
import StudentHeader from '../components/student/StudentHeader';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentBottomNav from '../components/student/StudentBottomNav';
import '../styles/student/student.css';

const StudentLayout = ({ children, student, onLogout }) => {
  return (
    <div className="student-page-container">
      {/* Sticky Top Header */}
      <StudentHeader student={student} loading={!student} />

      <div className="student-layout-wrapper">
        {/* Desktop Sidebar */}
        <StudentSidebar onLogout={onLogout} />

        {/* Main View Area */}
        <main className="student-main-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <StudentBottomNav onLogout={onLogout} />
    </div>
  );
};

export default StudentLayout;
