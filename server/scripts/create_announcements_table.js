import { query } from '../config/db.js';

async function createAnnouncementsTable() {
  try {
    console.log('Creating `announcements` table in MySQL...');
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        audience ENUM('All', 'Students', 'Teachers', 'Staff', 'Parents') DEFAULT 'Students',
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
    `);
    console.log('`announcements` table ready.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating announcements table:', error);
    process.exit(1);
  }
}

createAnnouncementsTable();
