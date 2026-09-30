import { query } from '../config/db.js';

async function createTestsTables() {
  try {
    console.log('Creating `tests` table in MySQL...');
    await query(`
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
    `);
    console.log('`tests` table ready.');

    console.log('Creating `test_results` table in MySQL...');
    await query(`
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
    `);
    console.log('`test_results` table ready.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tests & test_results tables:', error);
    process.exit(1);
  }
}

createTestsTables();
