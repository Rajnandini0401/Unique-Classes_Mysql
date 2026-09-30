import React from 'react';
import ReactDOM from 'react-dom';
import logoImg from '../../assets/logo.png';

const FeeReceiptModal = ({ receiptData, onClose }) => {
  if (!receiptData) return null;

  const rStudent = receiptData.student || (receiptData.payment && typeof receiptData.payment.student === 'object' ? receiptData.payment.student : null);
  const rFee = receiptData.updatedFee || receiptData.fee;
  const rPayment = receiptData.payment || null;

  const studentName = rStudent?.name || rStudent?.fullname || 'N/A';
  const rollNoVal = rStudent?.rollNo || 'N/A';
  const stdVal = rStudent?.standard ? (rStudent.standard.includes('Standard') || rStudent.standard.includes('th') || rStudent.standard.includes('st') || rStudent.standard.includes('nd') || rStudent.standard.includes('rd') ? rStudent.standard : `${rStudent.standard}th`) : 'N/A';
  const schoolVal = rStudent?.schoolName || rStudent?.school || 'N/A';
  const subjectsVal = Array.isArray(rStudent?.subjects) && rStudent.subjects.length > 0
    ? rStudent.subjects.join(', ')
    : (typeof rStudent?.subjects === 'string' && rStudent.subjects.trim() !== '' ? rStudent.subjects : (rStudent?.subject || 'N/A'));

  // Payments List
  const rawPayments = receiptData.allPayments || (rPayment ? [rPayment] : []);
  const sortedPayments = [...rawPayments].sort((a, b) => new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt));

  // Totals
  const totalFeesNum = rFee ? Number(rFee.totalFees || 0) : 0;
  const paidSumFromPayments = sortedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaidNum = rFee ? Math.max(Number(rFee.paidAmount || 0), paidSumFromPayments) : paidSumFromPayments;
  const remainingNum = Math.max(0, totalFeesNum - totalPaidNum);

  const receiptNoVal = rPayment?.receiptNumber || 'REC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001';
  
  // Format Date for top right
  const pDateObj = rPayment?.paymentDate ? new Date(rPayment.paymentDate) : new Date();
  const dateStrTop = `${String(pDateObj.getDate()).padStart(2, '0')}/${String(pDateObj.getMonth() + 1).padStart(2, '0')}/${pDateObj.getFullYear()}`;

  return ReactDOM.createPortal(
    <div className="fees-modal-overlay" onClick={onClose}>
      <div className="fees-modal" style={{ border: 'none', background: 'transparent', padding: 0, maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
        
        {/* Receipt Printable Wrapper - EXACT MATCH TO ORIGINAL DESIGN SCREENSHOT */}
        <div className="receipt-wrapper" style={{ background: '#FFFFFF', border: '2px solid #1E3A8A', borderRadius: '4px', padding: '2rem', color: '#111111', fontFamily: 'sans-serif' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <img src={logoImg} alt="Unique Classes Emblem" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#1E3A8A', margin: 0, lineHeight: 1.1, letterSpacing: '0.5px' }}>
                  UNIQUE CLASSES
                </h2>
                <div style={{ fontSize: '0.88rem', color: '#222', marginTop: '3px' }}>
                  Proper Application of Knowledge Moves to Progress
                </div>
                <div style={{ fontSize: '0.88rem', color: '#222', marginTop: '1px' }}>
                  Bank Colony Road, Nilanga
                </div>
                <div style={{ fontSize: '0.88rem', color: '#222', marginTop: '1px' }}>
                  Contact: +91 8308433435/8308433436
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '1rem', lineHeight: 1.5, color: '#111' }}>
              <div><strong>Receipt No:</strong> {receiptNoVal}</div>
              <div><strong>Date:</strong> {dateStrTop}</div>
            </div>
          </div>

          {/* Solid Dark Blue Divider */}
          <div style={{ borderBottom: '2px solid #1E3A8A', margin: '1.25rem 0 1.5rem 0' }}></div>

          {/* Student & Fee Information Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Roll No:</strong> {rollNoVal}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Name:</strong> {studentName}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Class:</strong> {stdVal}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>School:</strong> {schoolVal}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Subjects:</strong> {subjectsVal}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Total Fees:</strong> ₹{totalFeesNum.toFixed(2)}
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
              <strong>Total Paid:</strong> ₹{totalPaidNum}
            </div>
          </div>

          {/* Payment History Section */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111', margin: '0 0 1rem 0' }}>
            Payment History
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#1E3A8A', color: '#FFFFFF' }}>
                <th style={{ padding: '0.65rem 1rem', border: '1px solid #1E3A8A', fontWeight: 700, fontSize: '0.95rem' }}>Date</th>
                <th style={{ padding: '0.65rem 1rem', border: '1px solid #1E3A8A', fontWeight: 700, fontSize: '0.95rem' }}>Amount</th>
                <th style={{ padding: '0.65rem 1rem', border: '1px solid #1E3A8A', fontWeight: 700, fontSize: '0.95rem' }}>Mode</th>
                <th style={{ padding: '0.65rem 1rem', border: '1px solid #1E3A8A', fontWeight: 700, fontSize: '0.95rem' }}>Txn ID</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '0.75rem', border: '1px solid #E5E7EB', color: '#666' }}>No payment records found.</td>
                </tr>
              ) : (
                sortedPayments.map((pmt, idx) => {
                  const dObj = pmt.paymentDate ? new Date(pmt.paymentDate) : new Date();
                  const pmtDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
                  const pmtAmtStr = `₹${Number(pmt.amount || 0).toFixed(2)}`;
                  const pmtModeStr = pmt.paymentMode || 'Cash';
                  const pmtTxnStr = pmt.notes && pmt.notes !== 'Initial Admission Payment' && pmt.notes !== 'First Installment' ? pmt.notes : '-';

                  return (
                    <tr key={pmt._id || idx}>
                      <td style={{ padding: '0.65rem 1rem', border: '1px solid #E5E7EB', fontSize: '0.95rem', color: '#111' }}>{pmtDateStr}</td>
                      <td style={{ padding: '0.65rem 1rem', border: '1px solid #E5E7EB', fontSize: '0.95rem', color: '#111' }}>{pmtAmtStr}</td>
                      <td style={{ padding: '0.65rem 1rem', border: '1px solid #E5E7EB', fontSize: '0.95rem', color: '#111' }}>{pmtModeStr}</td>
                      <td style={{ padding: '0.65rem 1rem', border: '1px solid #E5E7EB', fontSize: '0.95rem', color: '#111' }}>{pmtTxnStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Remaining Balance & Authorized Signature Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111' }}>
              Remaining Balance: <span style={{ color: '#DC2626', fontWeight: 900 }}>₹{remainingNum.toFixed(2)}</span>
            </div>

            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ borderTop: '1px solid #111', marginBottom: '6px' }}></div>
              <span style={{ fontSize: '0.95rem', color: '#111' }}>Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Print Button (outside printable receipt card) */}
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print"
          style={{
            background: '#1E3A8A',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.6rem 2rem',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'block',
            margin: '1.5rem auto 0 auto'
          }}
        >
          Print
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FeeReceiptModal;
