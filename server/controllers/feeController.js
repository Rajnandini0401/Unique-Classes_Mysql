import { query, getConnection } from '../config/db.js';

/**
 * GET /api/fees/overview
 * Fetches fee overview directory of registered students with optional search, standard, and status filters.
 * Returns aggregated summary metrics: totalExpectedFees, totalCollectedFees, totalPendingFees.
 */
export const getFeesOverview = async (req, res) => {
  try {
    const { standard, status, search } = req.query;

    // 1. Calculate Summary Metrics Across All Active Registered Students (or filtered by standard if provided)
    let sumSql = `
      SELECT 
        SUM(COALESCE(fa.total_fees, 0)) AS totalExpected,
        SUM(COALESCE(fa.amount_paid, 0)) AS totalCollected,
        SUM(COALESCE(fa.balance_amount, 0)) AS totalPending
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_accounts fa ON s.id = fa.student_id
      WHERE s.status = 'Active'
    `;
    const sumParams = [];

    if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
      sumSql += ' AND c.class_name = ?';
      sumParams.push(standard);
    }

    const [sumRow] = await query(sumSql, sumParams);
    const expected = sumRow && sumRow.totalExpected ? Number(sumRow.totalExpected) : 0;
    const collected = sumRow && sumRow.totalCollected ? Number(sumRow.totalCollected) : 0;
    const pending = Math.max(0, expected - collected);

    const summary = {
      totalExpectedFees: expected,
      totalCollectedFees: collected,
      totalPendingFees: pending
    };

    // 2. Query Student Roster joined with Fee Accounts & Classes
    let listSql = `
      SELECT 
        s.id AS studentDbId,
        s.student_id AS studentBusinessId,
        s.roll_no AS rollNo,
        s.full_name AS studentName,
        c.class_name AS standard,
        s.school_name AS schoolName,
        s.mobile,
        s.status AS studentStatus,
        fa.id AS feeAccountId,
        fa.total_fees AS totalFees,
        fa.amount_paid AS amountPaid,
        fa.balance_amount AS balanceAmount
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_accounts fa ON s.id = fa.student_id
      WHERE 1=1
    `;
    const listParams = [];

    if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
      listSql += ' AND c.class_name = ?';
      listParams.push(standard);
    }

    if (status && status !== 'All Status' && status !== 'All') {
      if (status === 'Paid') {
        listSql += ' AND fa.id IS NOT NULL AND fa.balance_amount <= 0 AND fa.total_fees > 0';
      } else if (status === 'Pending') {
        listSql += ' AND fa.id IS NOT NULL AND fa.balance_amount > 0';
      } else if (status === 'Not Set') {
        listSql += ' AND fa.id IS NULL';
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      listSql += ' AND (s.full_name LIKE ? OR s.student_id LIKE ? OR s.roll_no LIKE ? OR s.mobile LIKE ?)';
      listParams.push(term, term, term, term);
    }

    listSql += ' ORDER BY s.id DESC';

    const rows = await query(listSql, listParams);

    // Fetch subjects for all returned students
    const students = await Promise.all(rows.map(async (r) => {
      const hasFee = r.feeAccountId !== null;
      const totalF = hasFee ? Number(r.totalFees) : 0;
      const paidA = hasFee ? Number(r.amountPaid) : 0;
      const pendingA = hasFee ? Number(r.balanceAmount) : 0;

      let feeStatus = 'Not Set';
      if (hasFee) {
        feeStatus = (pendingA <= 0 && totalF > 0) ? 'Paid' : 'Pending';
      }

      // Fetch subjects from student_subjects junction table
      const subRows = await query(
        `SELECT sub.subject_name 
         FROM student_subjects ss 
         JOIN subjects sub ON ss.subject_id = sub.id 
         WHERE ss.student_id = ?
         ORDER BY sub.id ASC`,
        [r.studentDbId]
      );
      const subjects = subRows.map(s => s.subject_name);

      return {
        student: {
          id: r.studentDbId,
          _id: r.studentDbId,
          studentId: r.studentBusinessId,
          rollNo: r.rollNo,
          name: r.studentName,
          fullname: r.studentName,
          standard: r.standard,
          schoolName: r.schoolName || '',
          subjects: subjects,
          mobile: r.mobile,
          status: r.studentStatus
        },
        fee: hasFee ? {
          id: r.feeAccountId,
          _id: r.feeAccountId,
          totalFees: totalF,
          paidAmount: paidA,
          pendingAmount: pendingA,
          status: feeStatus
        } : null
      };
    }));

    return res.status(200).json({
      success: true,
      students,
      summary
    });

  } catch (error) {
    console.error('Error fetching fees overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load fee directory from database.'
    });
  }
};

/**
 * GET /api/fees/student/:studentId
 * GET /api/fee-payments/student/:studentId
 * Fetches fee details, master ledger, and payment history for a specific student.
 */
export const getFeeByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID parameter is required.' });
    }

    const cleanId = String(studentId).trim();

    // Find student master record
    let studentSql = `
      SELECT s.id, s.student_id, s.roll_no, s.full_name, c.class_name AS standard, s.school_name AS schoolName, s.mobile
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE `;
    let studentParams = [];
    if (/^\d+$/.test(cleanId)) {
      studentSql += ' (s.id = ? OR s.student_id = ?)';
      studentParams = [parseInt(cleanId, 10), cleanId];
    } else {
      studentSql += ' s.student_id = ?';
      studentParams = [cleanId];
    }

    const studentRows = await query(studentSql, studentParams);
    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const studentObj = studentRows[0];
    const studentDbId = studentObj.id;

    // Fetch student subjects
    const subRows = await query(
      `SELECT sub.subject_name 
       FROM student_subjects ss 
       JOIN subjects sub ON ss.subject_id = sub.id 
       WHERE ss.student_id = ?
       ORDER BY sub.id ASC`,
      [studentDbId]
    );
    const subjects = subRows.map(s => s.subject_name);

    // Fetch Fee Account Ledger
    const [feeRow] = await query(
      `SELECT id, total_fees, amount_paid, balance_amount FROM fee_accounts WHERE student_id = ?`,
      [studentDbId]
    );

    // Fetch Payment History Log
    const paymentRows = await query(
      `SELECT id, receipt_number, amount, payment_mode, payment_date, notes
       FROM fee_payments
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentDbId]
    );

    const formattedPayments = paymentRows.map(p => ({
      id: p.id,
      _id: p.id,
      receiptNumber: p.receipt_number,
      amount: Number(p.amount) || 0,
      paymentMode: p.payment_mode,
      paymentDate: p.payment_date,
      notes: p.notes
    }));

    const totalF = feeRow ? Number(feeRow.total_fees) : 0;
    const paidA = feeRow ? Number(feeRow.amount_paid) : 0;
    const pendingA = feeRow ? Number(feeRow.balance_amount) : 0;
    const feeStatus = (feeRow && pendingA <= 0 && totalF > 0) ? 'Paid' : 'Pending';

    return res.status(200).json({
      success: true,
      student: {
        id: studentObj.id,
        _id: studentObj.id,
        studentId: studentObj.student_id,
        rollNo: studentObj.roll_no,
        name: studentObj.full_name,
        fullname: studentObj.full_name,
        standard: studentObj.standard,
        schoolName: studentObj.schoolName || '',
        subjects: subjects,
        mobile: studentObj.mobile
      },
      fee: feeRow ? {
        id: feeRow.id,
        _id: feeRow.id,
        totalFees: totalF,
        paidAmount: paidA,
        pendingAmount: pendingA,
        status: feeStatus
      } : null,
      payments: formattedPayments
    });

  } catch (error) {
    console.error('Error fetching student fee details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load student fee record.'
    });
  }
};

/**
 * POST /api/fees
 * Sets or updates total fees for a student in atomic MySQL transaction.
 */
export const createOrUpdateFeeMaster = async (req, res) => {
  const conn = await getConnection();
  try {
    const { student, totalFees } = req.body;

    if (!student) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    if (totalFees === undefined || totalFees === null || isNaN(Number(totalFees))) {
      return res.status(400).json({ success: false, message: 'Total Fees amount must be a valid number.' });
    }

    const totalFeesNum = Number(totalFees);
    if (totalFeesNum < 0) {
      return res.status(400).json({ success: false, message: 'Total Fees cannot be negative.' });
    }

    const cleanId = String(student).trim();

    // Resolve Student DB ID
    let findSql = `SELECT id FROM students WHERE `;
    let findParams = [];
    if (/^\d+$/.test(cleanId)) {
      findSql += ' (id = ? OR student_id = ?)';
      findParams = [parseInt(cleanId, 10), cleanId];
    } else {
      findSql += ' student_id = ?';
      findParams = [cleanId];
    }

    const [stdRows] = await conn.execute(findSql, findParams);
    if (!stdRows || stdRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found in database.' });
    }

    const studentDbId = stdRows[0].id;

    await conn.beginTransaction();

    const [existingFee] = await conn.execute(
      `SELECT id, total_fees, amount_paid, balance_amount FROM fee_accounts WHERE student_id = ? FOR UPDATE`,
      [studentDbId]
    );

    let feeAccountId = null;
    let paidAmount = 0;
    let pendingAmount = totalFeesNum;

    if (existingFee && existingFee.length > 0) {
      feeAccountId = existingFee[0].id;
      paidAmount = Number(existingFee[0].amount_paid) || 0;
      pendingAmount = Math.max(0, totalFeesNum - paidAmount);

      await conn.execute(
        `UPDATE fee_accounts SET total_fees = ?, balance_amount = ? WHERE id = ?`,
        [totalFeesNum, pendingAmount, feeAccountId]
      );
    } else {
      const [insertRes] = await conn.execute(
        `INSERT INTO fee_accounts (student_id, total_fees, amount_paid, balance_amount) VALUES (?, ?, 0.00, ?)`,
        [studentDbId, totalFeesNum, totalFeesNum]
      );
      feeAccountId = insertRes.insertId;
      paidAmount = 0;
      pendingAmount = totalFeesNum;
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Student total fee master set successfully.',
      fee: {
        id: feeAccountId,
        _id: feeAccountId,
        totalFees: totalFeesNum,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        status: (pendingAmount <= 0 && totalFeesNum > 0) ? 'Paid' : 'Pending'
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error setting student fees:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error setting total fees.'
    });
  } finally {
    conn.release();
  }
};

/**
 * POST /api/fee-payments
 * Records installment payment for a student inside atomic MySQL transaction.
 */
export const createPayment = async (req, res) => {
  const conn = await getConnection();
  try {
    const { student, fee, amount, paymentDate, paymentMode, notes } = req.body;

    if (!student) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const payAmountNum = Number(amount);
    if (!payAmountNum || payAmountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than ₹0.' });
    }

    const cleanId = String(student).trim();

    // Resolve Student DB ID & Details
    let findSql = `
      SELECT s.id, s.full_name, s.student_id, s.roll_no, c.class_name AS standard, s.school_name AS schoolName, s.mobile 
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      WHERE `;
    let findParams = [];
    if (/^\d+$/.test(cleanId)) {
      findSql += ' (s.id = ? OR s.student_id = ?)';
      findParams = [parseInt(cleanId, 10), cleanId];
    } else {
      findSql += ' s.student_id = ?';
      findParams = [cleanId];
    }

    const [stdRows] = await conn.execute(findSql, findParams);
    if (!stdRows || stdRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const studentObj = stdRows[0];
    const studentDbId = studentObj.id;

    // Fetch subjects from student_subjects junction table
    const [subRows] = await conn.execute(
      `SELECT sub.subject_name 
       FROM student_subjects ss 
       JOIN subjects sub ON ss.subject_id = sub.id 
       WHERE ss.student_id = ?
       ORDER BY sub.id ASC`,
      [studentDbId]
    );
    const subjects = subRows.map(s => s.subject_name);

    // START ATOMIC TRANSACTION
    await conn.beginTransaction();

    const [feeRows] = await conn.execute(
      `SELECT id, total_fees, amount_paid, balance_amount FROM fee_accounts WHERE student_id = ? FOR UPDATE`,
      [studentDbId]
    );

    let feeAccountId;
    let currentTotal;
    let currentPaid;

    if (feeRows && feeRows.length > 0) {
      feeAccountId = feeRows[0].id;
      currentTotal = Number(feeRows[0].total_fees);
      currentPaid = Number(feeRows[0].amount_paid);
    } else {
      currentTotal = payAmountNum;
      currentPaid = 0;
      const [newFeeAcc] = await conn.execute(
        `INSERT INTO fee_accounts (student_id, total_fees, amount_paid, balance_amount) VALUES (?, ?, 0.00, ?)`,
        [studentDbId, currentTotal, currentTotal]
      );
      feeAccountId = newFeeAcc.insertId;
    }

    const maxPending = Math.max(0, currentTotal - currentPaid);
    if (payAmountNum > maxPending) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmountNum}) cannot exceed remaining pending fee (₹${maxPending}).`
      });
    }

    const newAmountPaid = currentPaid + payAmountNum;
    const newBalanceAmount = Math.max(0, currentTotal - newAmountPaid);

    // Format payment date (e.g. 2026-09-18)
    const formattedDateStr = paymentDate ? new Date(paymentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const receiptNo = `REC-${formattedDateStr.replace(/-/g, '')}-${String(studentDbId).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

    // Insert Payment Record
    const [payRes] = await conn.execute(
      `INSERT INTO fee_payments (student_id, fee_account_id, amount, payment_mode, payment_date, receipt_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentDbId,
        feeAccountId,
        payAmountNum,
        (paymentMode || 'Cash').trim(),
        formattedDateStr,
        receiptNo,
        notes ? notes.trim() : null
      ]
    );

    const insertedPaymentId = payRes.insertId;

    // Update Fee Account Ledger
    await conn.execute(
      `UPDATE fee_accounts SET amount_paid = ?, balance_amount = ? WHERE id = ?`,
      [newAmountPaid, newBalanceAmount, feeAccountId]
    );

    await conn.commit();

    const updatedFeeObj = {
      id: feeAccountId,
      _id: feeAccountId,
      totalFees: currentTotal,
      paidAmount: newAmountPaid,
      pendingAmount: newBalanceAmount,
      status: (newBalanceAmount <= 0 && currentTotal > 0) ? 'Paid' : 'Pending'
    };

    const paymentObj = {
      id: insertedPaymentId,
      _id: insertedPaymentId,
      receiptNumber: receiptNo,
      amount: payAmountNum,
      paymentMode: (paymentMode || 'Cash').trim(),
      paymentDate: formattedDateStr,
      notes: notes ? notes.trim() : ''
    };

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment: paymentObj,
      updatedFee: updatedFeeObj,
      student: {
        id: studentObj.id,
        _id: studentObj.id,
        studentId: studentObj.student_id,
        rollNo: studentObj.roll_no,
        name: studentObj.full_name,
        fullname: studentObj.full_name,
        standard: studentObj.standard,
        schoolName: studentObj.schoolName || '',
        subjects: subjects,
        mobile: studentObj.mobile
      }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error recording payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error while recording payment.'
    });
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/fee-payments/:id
 * Deletes payment record and recalculates fee ledger totals inside atomic MySQL transaction.
 */
export const deletePayment = async (req, res) => {
  const conn = await getConnection();
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Payment ID is required.' });
    }

    await conn.beginTransaction();

    const [payRows] = await conn.execute(
      `SELECT id, student_id, fee_account_id, amount FROM fee_payments WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (!payRows || payRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payRecord = payRows[0];
    const studentDbId = payRecord.student_id;
    const feeAccountId = payRecord.fee_account_id;
    const deletedAmount = Number(payRecord.amount) || 0;

    const [feeRows] = await conn.execute(
      `SELECT id, total_fees, amount_paid FROM fee_accounts WHERE id = ? FOR UPDATE`,
      [feeAccountId]
    );

    if (feeRows && feeRows.length > 0) {
      const totalF = Number(feeRows[0].total_fees);
      const currentPaid = Number(feeRows[0].amount_paid);
      const newPaid = Math.max(0, currentPaid - deletedAmount);
      const newBalance = Math.max(0, totalF - newPaid);

      await conn.execute(
        `UPDATE fee_accounts SET amount_paid = ?, balance_amount = ? WHERE id = ?`,
        [newPaid, newBalance, feeAccountId]
      );
    }

    await conn.execute(`DELETE FROM fee_payments WHERE id = ?`, [id]);

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Payment deleted and fee totals recalculated successfully.'
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error deleting payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error deleting payment.'
    });
  } finally {
    conn.release();
  }
};
