import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'staff');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save Base64 photo string to disk and return relative path
 */
const saveStaffPhoto = (base64String, staffId) => {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image')) {
    return base64String || null;
  }

  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const fileName = `${staffId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, imageBuffer);
    return `/uploads/staff/${fileName}`;
  } catch (error) {
    console.error('Error saving staff photo:', error);
    return null;
  }
};

/**
 * Delete photo file from disk if relative upload path
 */
const deleteStaffPhoto = (photoPath) => {
  if (!photoPath || typeof photoPath !== 'string' || !photoPath.startsWith('/uploads/staff/')) {
    return;
  }
  try {
    const fileName = path.basename(photoPath);
    const fullPath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting staff photo file:', error);
  }
};

/**
 * GET /api/staff/me
 * Fetch complete profile for the authenticated logged-in staff member
 */
export const getAuthenticatedStaffProfile = async (req, res) => {
  try {
    let targetStaffDbId = req.user ? req.user.staff_id : null;

    if (!targetStaffDbId && req.user && req.user.userId) {
      const [uRow] = await query(`SELECT staff_id FROM users WHERE id = ?`, [req.user.userId]);
      if (uRow && uRow.staff_id) {
        targetStaffDbId = uRow.staff_id;
      }
    }

    if (!targetStaffDbId && req.user) {
      const searchKey = req.user.staffBusinessId || req.user.email || '';
      if (searchKey) {
        const [sRow] = await query(
          `SELECT id FROM staff WHERE LOWER(staff_id) = ? OR LOWER(mobile) = ?`,
          [String(searchKey).toLowerCase(), String(searchKey).toLowerCase()]
        );
        if (sRow) targetStaffDbId = sRow.id;
      }
    }

    if (!targetStaffDbId) {
      const [defaultStaff] = await query(`SELECT id FROM staff WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
      if (defaultStaff) {
        targetStaffDbId = defaultStaff.id;
      }
    }

    if (!targetStaffDbId) {
      return res.status(404).json({ success: false, message: 'No staff profile found in database.' });
    }

    const rows = await query(`SELECT * FROM staff WHERE id = ?`, [targetStaffDbId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff record not found.' });
    }

    const s = rows[0];

    return res.json({
      success: true,
      staff: {
        id: s.id,
        _id: s.id,
        staff_id: s.staff_id,
        staffId: s.staff_id,
        name: s.name,
        fullname: s.name,
        mobile: s.mobile,
        education: s.education,
        address: s.address,
        responsibility: s.responsibility,
        photo: s.photo || '',
        status: s.status || 'Active',
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }
    });
  } catch (error) {
    console.error('Error in getAuthenticatedStaffProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch authenticated staff profile.' });
  }
};

/**
 * Generate next Staff ID (e.g. STF1001, STF1002, etc.)
 */
const generateNextStaffId = async () => {
  const rows = await query(`SELECT staff_id FROM staff ORDER BY id DESC LIMIT 1`);
  if (!rows || rows.length === 0 || !rows[0].staff_id) {
    return 'STF1001';
  }
  const lastIdStr = rows[0].staff_id;
  const match = lastIdStr.match(/STF(\d+)/i);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `STF${nextNum}`;
  }
  return `STF${Date.now()}`;
};

/**
 * GET /api/staff - List all office staff members
 */
export const getStaff = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM staff`;
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` WHERE (name LIKE ? OR mobile LIKE ? OR responsibility LIKE ? OR address LIKE ? OR staff_id LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY id DESC`;

    const staffList = await query(sql, params);

    return res.json({
      success: true,
      count: staffList ? staffList.length : 0,
      staff: staffList || []
    });
  } catch (error) {
    console.error('Error in getStaff:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch office staff members.' });
  }
};

/**
 * GET /api/staff/:id - Fetch single office staff detail
 */
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`SELECT * FROM staff WHERE id = ?`, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Office staff member not found.' });
    }

    return res.json({
      success: true,
      staff: rows[0]
    });
  } catch (error) {
    console.error('Error in getStaffById:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff details.' });
  }
};

/**
 * POST /api/staff - Create new office staff member
 */
export const createStaff = async (req, res) => {
  try {
    const { name, mobile, education, address, responsibility, photo } = req.body;

    if (!name || !mobile || !education || !address || !responsibility) {
      return res.status(400).json({ success: false, message: 'Name, mobile, education, address, and responsibility are required.' });
    }

    const staff_id = await generateNextStaffId();
    const photoPath = saveStaffPhoto(photo, staff_id);

    const result = await query(
      `INSERT INTO staff (staff_id, name, mobile, education, address, responsibility, photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [staff_id, name.trim(), mobile.trim(), education.trim(), address.trim(), responsibility.trim(), photoPath]
    );

    const [newStaff] = await query(`SELECT * FROM staff WHERE id = ?`, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Office staff member created successfully.',
      staff: newStaff
    });
  } catch (error) {
    console.error('Error in createStaff:', error);
    return res.status(500).json({ success: false, message: 'Failed to create office staff member.' });
  }
};

/**
 * PUT /api/staff/:id - Update existing office staff member
 */
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, education, address, responsibility, status, photo } = req.body;

    const existing = await query(`SELECT * FROM staff WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    let photoPath = existing[0].photo;
    if (photo && photo.startsWith('data:image')) {
      if (existing[0].photo) deleteStaffPhoto(existing[0].photo);
      photoPath = saveStaffPhoto(photo, existing[0].staff_id);
    } else if (photo === '') {
      if (existing[0].photo) deleteStaffPhoto(existing[0].photo);
      photoPath = null;
    }

    await query(
      `UPDATE staff
       SET name = ?, mobile = ?, education = ?, address = ?, responsibility = ?, status = ?, photo = ?
       WHERE id = ?`,
      [
        name ? name.trim() : existing[0].name,
        mobile ? mobile.trim() : existing[0].mobile,
        education ? education.trim() : existing[0].education,
        address ? address.trim() : existing[0].address,
        responsibility ? responsibility.trim() : existing[0].responsibility,
        status || existing[0].status,
        photoPath,
        id
      ]
    );

    const [updatedStaff] = await query(`SELECT * FROM staff WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Staff member updated successfully.',
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Error in updateStaff:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff member.' });
  }
};

/**
 * DELETE /api/staff/:id - Delete staff member
 */
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT * FROM staff WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (existing[0].photo) {
      deleteStaffPhoto(existing[0].photo);
    }

    await query(`DELETE FROM staff WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: 'Staff member deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff member.' });
  }
};
