import { query } from '../config/db.js';

async function createAttendanceTables() {
  console.log('--- Creating Attendance Database Tables ---');
  try {
    // 1. Attendance Sessions Master Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NULL,
        standard VARCHAR(50) NOT NULL,
        subject_id INT NULL,
        subject VARCHAR(100) NULL,
        teacher_id INT NULL,
        teacher_name VARCHAR(100) NULL,
        attendance_date DATE NOT NULL,
        start_time VARCHAR(20) NULL,
        end_time VARCHAR(20) NULL,
        class_time VARCHAR(100) NULL,
        attendance_type ENUM('ATTENDANCE', 'HOLIDAY', 'CLOSED') DEFAULT 'ATTENDANCE',
        total_students INT DEFAULT 0,
        present_count INT DEFAULT 0,
        absent_count INT DEFAULT 0,
        late_count INT DEFAULT 0,
        excused_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_session (standard, subject, attendance_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ attendance_sessions table created/verified.');

    // 2. Attendance Records Student Detail Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attendance_session_id INT NOT NULL,
        student_id INT NOT NULL,
        student_code VARCHAR(50) NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        roll_no VARCHAR(50) NULL,
        status ENUM('Present', 'Absent', 'Late', 'Excused') DEFAULT 'Present',
        remarks VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_session (attendance_session_id, student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ attendance_records table created/verified.');

    console.log('--- Attendance Tables Creation Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating attendance tables:', error);
    process.exit(1);
  }
}

createAttendanceTables();
