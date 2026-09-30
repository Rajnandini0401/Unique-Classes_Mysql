-- ==================================================
-- TUITION MANAGEMENT SYSTEM - MYSQL DATABASE SCHEMA
-- New Admission & Core Master Data Tables
-- ==================================================

CREATE DATABASE IF NOT EXISTS tuition_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tuition_db;

-- Drop old pre-existing unnormalized tables if present
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS fee_payments;
DROP TABLE IF EXISTS fee_accounts;
DROP TABLE IF EXISTS student_subjects;
DROP TABLE IF EXISTS student_id_counters;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. CLASSES MASTER TABLE
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SUBJECTS MASTER TABLE
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  class_id INT DEFAULT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  UNIQUE KEY unique_subject_name (subject_name),
  UNIQUE KEY uq_subject_class (subject_name, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDENTS MASTER TABLE
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE, -- Business Student ID e.g. UC202610001
  roll_no VARCHAR(30) DEFAULT NULL,
  full_name VARCHAR(150) NOT NULL,
  class_id INT NOT NULL,
  medium VARCHAR(50) DEFAULT 'Semi-English',
  school_name VARCHAR(255) DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  address TEXT DEFAULT NULL,
  mobile VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20) DEFAULT NULL,
  course_stream VARCHAR(50) DEFAULT NULL,
  photo TEXT DEFAULT NULL, -- Rel Path e.g. /uploads/students/UC202610001.jpg or base64 fallback
  admission_date DATE NOT NULL,
  status ENUM('Active', 'Inactive', 'Passout') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  INDEX idx_students_standard (class_id),
  INDEX idx_students_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. STUDENT_SUBJECTS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS student_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_subject (student_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. FEE_ACCOUNTS MASTER LEDGER TABLE
CREATE TABLE IF NOT EXISTS fee_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  total_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. FEE_PAYMENTS TRANSACTION HISTORY TABLE
CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  fee_account_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_account_id) REFERENCES fee_accounts(id) ON DELETE CASCADE,
  INDEX idx_payments_receipt (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. STUDENT_ID_COUNTERS ATOMIC SEQUENCE TABLE
CREATE TABLE IF NOT EXISTS student_id_counters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year INT NOT NULL,
  class_id INT NOT NULL,
  last_serial INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_year_class (academic_year, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ROLL_NO_COUNTERS CLASS-WISE ROLL NUMBER COUNTER TABLE
CREATE TABLE IF NOT EXISTS roll_no_counters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  last_roll_no INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_class_id (class_id),
  CONSTRAINT fk_roll_counter_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. USERS AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'office', 'teacher', 'student', 'parent') NOT NULL DEFAULT 'student',
  student_id INT DEFAULT NULL,
  teacher_id INT DEFAULT NULL,
  staff_id INT DEFAULT NULL,
  status ENUM('Active', 'Disabled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8b. OFFICE STAFF MASTER TABLE
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  education VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  responsibility VARCHAR(255) NOT NULL,
  photo TEXT DEFAULT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. TEACHERS MASTER TABLE
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  education VARCHAR(150) NOT NULL,
  photo TEXT DEFAULT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_teachers_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. TEACHER_SUBJECTS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_teacher_subject (teacher_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. TEACHER_CLASSES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS teacher_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_teacher_class (teacher_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. TEACHER_CLASS_SUBJECTS PERMISSION TABLE
CREATE TABLE IF NOT EXISTS teacher_class_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_teacher_class_subject (teacher_id, class_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. BATCHES / TIMETABLE MASTER TABLE
CREATE TABLE IF NOT EXISTS batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  schedule_pattern VARCHAR(50) NOT NULL DEFAULT 'Monday-Friday',
  schedule_type VARCHAR(50) NOT NULL DEFAULT 'Regular Class',
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_batches_teacher (teacher_id),
  INDEX idx_batches_class (class_id),
  INDEX idx_batches_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. ASSIGNMENTS MASTER TABLE
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  due_date DATE NOT NULL,
  attachment_url TEXT DEFAULT NULL,
  attachment_name VARCHAR(255) DEFAULT NULL,
  attachment_type VARCHAR(50) DEFAULT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_assignments_teacher (teacher_id),
  INDEX idx_assignments_class (class_id),
  INDEX idx_assignments_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. TESTS MASTER TABLE
CREATE TABLE IF NOT EXISTS tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  test_date DATE NOT NULL,
  total_marks INT NOT NULL DEFAULT 50,
  status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_tests_teacher (teacher_id),
  INDEX idx_tests_class (class_id),
  INDEX idx_tests_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. TEST_RESULTS TRANSACTION TABLE
CREATE TABLE IF NOT EXISTS test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) DEFAULT NULL,
  status ENUM('PRESENT', 'ABSENT') DEFAULT 'PRESENT',
  notification_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_test_student (test_id, student_id),
  INDEX idx_results_test (test_id),
  INDEX idx_results_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. ANNOUNCEMENTS MASTER TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  audience VARCHAR(100) NOT NULL DEFAULT 'Students',
  target_class VARCHAR(50) NOT NULL DEFAULT 'All Students',
  target_subject VARCHAR(100) DEFAULT NULL,
  announcement_date DATE NOT NULL,
  expiry_date DATE DEFAULT NULL,
  attachment TEXT DEFAULT NULL,
  status ENUM('Published', 'Draft', 'Archived') DEFAULT 'Published',
  created_by_role ENUM('Admin', 'Teacher', 'Staff') NOT NULL DEFAULT 'Admin',
  created_by INT DEFAULT NULL,
  created_by_name VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_announcements_class (target_class),
  INDEX idx_announcements_role (created_by_role),
  INDEX idx_announcements_creator (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. ATTENDANCE_SESSIONS MASTER TABLE
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

-- 19. ATTENDANCE_RECORDS DETAIL TABLE
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

-- ==================================================
-- SEED MASTER DATA FOR CLASSES & CANONICAL SUBJECTS
-- ==================================================

INSERT INTO classes (class_name) VALUES 
('5th'), ('6th'), ('7th'), ('8th'), ('9th'), ('10th'), ('11th'), ('12th'), ('Navodaya')
ON DUPLICATE KEY UPDATE class_name=VALUES(class_name);

INSERT INTO subjects (subject_name) VALUES 
('Science'), ('English'), ('Physics'), ('Chemistry'), ('Biology'), ('Mathematics')
ON DUPLICATE KEY UPDATE subject_name=VALUES(subject_name);

-- Seed System Default Administrator User
INSERT INTO users (email, password, role) VALUES
('askkmane@gmail.com', 'UCadmin', 'admin')
ON DUPLICATE KEY UPDATE email=VALUES(email);

