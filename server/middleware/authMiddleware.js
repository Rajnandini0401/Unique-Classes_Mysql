import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'unique-classes-secret-key-2026';

/**
 * Middleware: Verify Token & Attach Authenticated User Identity
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    let token = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'askkmane@gmail.com').trim().toLowerCase();

    // 1. Dedicated Admin Authentication (No MySQL users table lookup)
    if (decoded && decoded.role === 'admin') {
      if (decoded.email && decoded.email.toLowerCase() === adminEmail) {
        req.user = {
          id: 'admin',
          email: adminEmail,
          role: 'admin',
          teacher_id: null,
          student_id: null,
          staff_id: null
        };
        return next();
      } else {
        return res.status(401).json({ success: false, message: 'Invalid admin session token.' });
      }
    }

    // 2. Teacher, Office Staff, and Student session lookup from MySQL users table
    const userRows = await query(
      `SELECT u.id, u.email, u.role, u.status AS user_status, u.teacher_id, u.student_id, u.staff_id,
              t.teacher_id AS teacherBusinessId, t.status AS teacher_status, t.name AS teacherName,
              s.student_id AS studentBusinessId, s.full_name AS studentName, s.class_id, c.class_name AS standard,
              st.staff_id AS staffBusinessId, st.name AS staffName
       FROM users u
       LEFT JOIN teachers t ON u.teacher_id = t.id
       LEFT JOIN students s ON u.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN staff st ON u.staff_id = st.id
       WHERE u.id = ?`,
      [decoded.userId || decoded.id]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = userRows[0];

    // Ensure database users table records cannot claim admin role
    if (user.role === 'admin') {
      return res.status(401).json({ success: false, message: 'Admin authentication must use dedicated credentials.' });
    }

    // Check account status
    if (user.user_status && user.user_status.toLowerCase() !== 'active') {
      return res.status(401).json({ success: false, message: 'Your account has been disabled.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      teacher_id: user.teacher_id,
      teacherBusinessId: user.teacherBusinessId || '',
      teacherName: user.teacherName || '',
      student_id: user.student_id,
      studentBusinessId: user.studentBusinessId || '',
      studentName: user.studentName || '',
      staff_id: user.staff_id || decoded.staff_id || null,
      staffBusinessId: user.staffBusinessId || decoded.staffBusinessId || '',
      staffName: user.staffName || decoded.staffName || '',
      class_id: user.class_id || null,
      standard: user.standard || ''
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Authentication process failed.' });
  }
};

export const protect = authenticateUser;

/**
 * Middleware: Role Enforcement (e.g. requireRole('admin') or requireRole('teacher'))
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
};

/**
 * Middleware: Cross-Teacher Security Enforcement
 * Ensures a logged-in teacher can only access their OWN data.
 */
export const verifyTeacherOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admin has full management access
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'teacher') {
    const targetParamId = req.params.id || req.query.teacherId;

    // If endpoint doesn't specify target ID, scope automatically in controller
    if (!targetParamId) {
      return next();
    }

    const currentTeacherDbId = String(req.user.teacher_id);
    const currentTeacherBusinessId = String(req.user.teacherBusinessId).toLowerCase();
    const requestedId = String(targetParamId).toLowerCase();

    if (requestedId !== currentTeacherDbId.toLowerCase() && requestedId !== currentTeacherBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'ACCESS DENIED: You do not have permission to access another teacher\'s data.'
      });
    }
  }

  next();
};
