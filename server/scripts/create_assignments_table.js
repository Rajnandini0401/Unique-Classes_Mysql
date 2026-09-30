import { query } from '../config/db.js';

async function run() {
  try {
    const sql = `
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
    `;
    await query(sql);
    console.log('✅ MySQL "assignments" table created successfully!');
  } catch (err) {
    console.error('❌ Error creating assignments table:', err);
  } finally {
    process.exit(0);
  }
}

run();
