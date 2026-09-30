import { query } from '../config/db.js';

async function run() {
  try {
    const sql = `
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
    `;
    await query(sql);
    console.log('✅ MySQL "batches" table created successfully!');
  } catch (err) {
    console.error('❌ Error creating batches table:', err);
  } process.exit(0);
}

run();
