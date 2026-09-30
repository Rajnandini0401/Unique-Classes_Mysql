import React, { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  IndianRupee,
  Receipt,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  getCurrentStudentProfileAPI,
  getFeeByStudentAPI,
  getPaymentsByStudentAPI
} from '../../services/api';
import logoImg from '../../assets/logo.png';

const StudentFees = () => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [feeMaster, setFeeMaster] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected payment for Receipt Modal View
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchFeeData = useCallback(async () => {
    setLoadingStudent(true);
    setLoading(true);
    setErrorMsg('');

    try {
      const savedStudentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
      const meRes = await getCurrentStudentProfileAPI(savedStudentId || undefined);

      if (meRes.success && meRes.student) {
        const stdDoc = meRes.student;
        setStudent(stdDoc);

        const sId = stdDoc._id || stdDoc.id;

        // Fetch Fee Master & Payment History
        const [feeRes, paymentsRes] = await Promise.all([
          getFeeByStudentAPI(sId),
          getPaymentsByStudentAPI(sId)
        ]);

        if (feeRes.success && feeRes.fee) {
          setFeeMaster(feeRes.fee);
        } else {
          // Fallback if fee record not created yet
          const tFee = stdDoc.totalFees !== undefined ? stdDoc.totalFees : 25000;
          const pFee = stdDoc.amountPaid !== undefined ? stdDoc.amountPaid : 0;
          setFeeMaster({
            totalFees: tFee,
            paidAmount: pFee,
            pendingAmount: Math.max(0, tFee - pFee),
            status: Math.max(0, tFee - pFee) === 0 ? 'Paid' : 'Pending'
          });
        }

        if (paymentsRes.success && Array.isArray(paymentsRes.payments)) {
          setPayments(paymentsRes.payments);
        } else {
          setPayments([]);
        }
      } else {
        setErrorMsg('Unable to retrieve student profile.');
      }
    } catch (err) {
      console.error('Error fetching student fee data:', err);
      setErrorMsg('Failed to load fee details from server.');
    } finally {
      setLoadingStudent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeData();
  }, [fetchFeeData]);

  if (loadingStudent || loading) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading Fee Records...</div>
        </div>
      </StudentLayout>
    );
  }

  if (errorMsg || !student) {
    return (
      <StudentLayout>
        <div className="student-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>{errorMsg || 'Student Record Not Found'}</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.3rem' }}>Please contact institute staff for fee assistance.</p>
        </div>
      </StudentLayout>
    );
  }

  const totalFeeNum = feeMaster?.totalFees !== undefined ? feeMaster.totalFees : (student.totalFees || 25000);
  const paidFeeNum = feeMaster?.paidAmount !== undefined ? feeMaster.paidAmount : (student.amountPaid || 0);
  const remFeeNum = feeMaster?.pendingAmount !== undefined ? feeMaster.pendingAmount : Math.max(0, totalFeeNum - paidFeeNum);
  const feeStatus = remFeeNum === 0 ? 'Paid' : 'Pending';

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <StudentLayout student={student}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* FEE OVERVIEW CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div className="student-card" style={{ marginBottom: 0, background: '#F8FAFC', borderLeft: '4px solid #1E3A8A' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL ACADEMIC FEES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              ₹{totalFeeNum.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Course / Standard: {student.standard}</div>
          </div>

          <div className="student-card" style={{ marginBottom: 0, background: '#ECFDF5', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>TOTAL FEES PAID</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
              ₹{paidFeeNum.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px' }}>Cleared payments</div>
          </div>

          <div className="student-card" style={{ marginBottom: 0, background: remFeeNum > 0 ? '#FEF2F2' : '#F0FDF4', borderLeft: remFeeNum > 0 ? '4px solid #DC2626' : '4px solid #16A34A' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: remFeeNum > 0 ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>REMAINING BALANCE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: remFeeNum > 0 ? '#DC2626' : '#16A34A', marginTop: '4px' }}>
              ₹{remFeeNum.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: remFeeNum > 0 ? '#B91C1C' : '#15803D', marginTop: '2px' }}>
              Status: {feeStatus}
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY SECTION (SIMPLE TABLE & CARDS FORMAT) */}
        <div className="student-card">
          <div className="student-card-title" style={{ marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A', margin: 0 }}>
              <Receipt size={20} color="#1E3A8A" /> Fee Payment History
            </h3>
          </div>

          {payments.length > 0 ? (
            <div>
              {/* DESKTOP / TABLET: SIMPLE CLEAN TABLE */}
              <div className="student-desktop-only-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Receipt No</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Amount Paid</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Payment Mode</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Notes / Reference</th>
                      <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const pDate = p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '--';

                      return (
                        <tr key={p._id || p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 900, color: '#1E3A8A' }}>
                            {p.receiptNumber || `UC-REC-${String(p._id || p.id).slice(-4).toUpperCase()}`}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600 }}>{pDate}</td>
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                            ₹{(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#DBEAFE', color: '#1E3A8A', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                              {p.paymentMode || 'Cash'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', fontSize: '0.82rem' }}>
                            {p.transactionId ? `Txn: ${p.transactionId}` : (p.notes || 'Fee Payment')}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedPayment(p)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                background: '#1E3A8A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <Printer size={13} /> View Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE: SIMPLE CLEAN CARDS */}
              <div className="student-mobile-only-cards" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {payments.map((p) => {
                  const pDate = p.paymentDate
                    ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '--';

                  return (
                    <div
                      key={p._id || p.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        padding: '0.9rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B' }}>RECEIPT NO</div>
                          <div style={{ fontWeight: 900, color: '#1E3A8A', fontSize: '0.9rem' }}>
                            {p.receiptNumber || `UC-REC-${String(p._id || p.id).slice(-4).toUpperCase()}`}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#DBEAFE', color: '#1E3A8A', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                          {p.paymentMode || 'Cash'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B' }}>AMOUNT PAID</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                            ₹{(p.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B' }}>PAYMENT DATE</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>{pDate}</div>
                        </div>
                      </div>

                      {(p.notes || p.transactionId) && (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', background: '#F8FAFC', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.65rem' }}>
                          {p.transactionId ? `Txn: ${p.transactionId}` : p.notes}
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedPayment(p)}
                        style={{
                          width: '100%',
                          padding: '0.45rem',
                          background: '#1E3A8A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Printer size={14} /> View Receipt
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '1.25rem 0', textAlign: 'center' }}>
              No fee payment receipts available yet.
            </div>
          )}
        </div>

        {/* APPROVED ORIGINAL ADMIN FEE RECEIPT MODAL */}
        {selectedPayment && (
          <div
            className="no-print-bg"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setSelectedPayment(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                borderRadius: '12px',
                padding: '1.5rem',
                boxSizing: 'border-box',
                overflowY: 'auto',
                border: '2px solid #1E3A8A',
                color: '#0F172A'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Actions */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: '#1E3A8A', fontSize: '0.95rem' }}>OFFICIAL FEE RECEIPT</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handlePrintReceipt}
                    style={{ background: '#1E3A8A', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={18} color="#64748B" />
                  </button>
                </div>
              </div>

              {/* RECEIPT PRINT AREA */}
              <div className="print-area">
                {/* Header branding */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={logoImg} alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div>
                      <h2 style={{ margin: 0, color: '#1E3A8A', fontWeight: 900, fontSize: '1.25rem' }}>UNIQUE CLASSES</h2>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>Excellence in Coaching & Academic Development</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1E3A8A' }}>
                      {selectedPayment.receiptNumber || `UC-REC-${selectedPayment._id.slice(-4).toUpperCase()}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Date: {new Date(selectedPayment.paymentDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1rem', fontSize: '0.82rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                  <div><strong>Student Name:</strong> {student.name}</div>
                  <div><strong>Student ID:</strong> {student.studentId}</div>
                  <div><strong>Standard / Class:</strong> {student.standard}</div>
                  <div><strong>Roll No:</strong> {student.rollNo || '--'}</div>
                  <div><strong>School:</strong> {student.schoolName || '--'}</div>
                  <div><strong>Subjects:</strong> {(student.subjects || []).join(', ')}</div>
                </div>

                {/* Payment Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#1E3A8A', color: '#FFFFFF', fontWeight: 800 }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem' }}>Total Academic Course Fee</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>₹{totalFeeNum.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#ECFDF5' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 800, color: '#065F46' }}>Current Installment Paid ({selectedPayment.paymentMode || 'Cash'})</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 900, color: '#059669' }}>₹{(selectedPayment.amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem' }}>Total Cumulative Paid Till Date</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>₹{paidFeeNum.toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#F8FAFC', fontWeight: 900 }}>
                      <td style={{ padding: '0.5rem', color: remFeeNum > 0 ? '#DC2626' : '#16A34A' }}>Remaining Fee Balance</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: remFeeNum > 0 ? '#DC2626' : '#16A34A' }}>₹{remFeeNum.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed #CBD5E1' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    * This is a computer-generated fee receipt from Unique Classes Portal.
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #0F172A', width: '140px', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1E3A8A' }}>Authorized Signature</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
};

export default StudentFees;
