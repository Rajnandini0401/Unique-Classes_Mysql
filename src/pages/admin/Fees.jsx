import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { IndianRupee, Plus, Search, Filter, RotateCcw, Eye, CreditCard, Calendar, User, Printer, CheckCircle2, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { getFeesOverviewAPI, createFeeAPI, updateFeeAPI, getFeeByStudentAPI, createPaymentAPI, deletePaymentAPI } from '../../services/api';
import logoImg from '../../assets/logo.png';
import FeeReceiptModal from '../../components/common/FeeReceiptModal';
import '../../styles/admin/fees.css';

const STANDARDS_LIST = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Navodaya'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Online', 'Bank Transfer', 'Cheque'];

const Fees = ({ layoutWrapper: LayoutComponent = AdminLayout, isStaff = false }) => {
  const isStaffUser = isStaff || LayoutComponent !== AdminLayout;
  const [studentsOverview, setStudentsOverview] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalExpectedFees: 0,
    totalCollectedFees: 0,
    totalPendingFees: 0
  });

  const [selectedStandard, setSelectedStandard] = useState('All Standards');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CENTERED PORTAL MODAL ACTIONS: null | 'setFees' | 'view' | 'addPayment' | 'receipt'
  const [activeAction, setActiveAction] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [setFeeTotal, setSetFeeTotal] = useState(25000);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'UPI',
    notes: ''
  });

  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (activeAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeAction]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const closeActionModal = () => {
    setActiveAction(null);
    setSelectedItem(null);
    setPaymentHistory([]);
    setActionLoading(false);
    setIsSubmitting(false);
    setApiError('');
  };

  const fetchFeesOverviewList = useCallback(async (std, stat, searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getFeesOverviewAPI({
        standard: std !== 'All Standards' ? std : undefined,
        status: stat !== 'All Status' ? stat : undefined,
        search: searchQ
      });

      if (res.success) {
        setStudentsOverview(res.students || []);
        if (res.summary) {
          setSummaryMetrics(res.summary);
        }
      } else {
        setApiError(res.message || 'Unable to load fee overview from server.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to load fee overview from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeesOverviewList(selectedStandard, selectedStatus, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedStandard, selectedStatus, searchQuery, fetchFeesOverviewList]);

  const handleOpenSetFees = (item) => {
    setSelectedItem(item);
    setSetFeeTotal(25000);
    setActiveAction('setFees');
  };

  const handleOpenViewDetails = async (item) => {
    setSelectedItem(item);
    setActiveAction('view');
    setActionLoading(true);

    try {
      const sId = item.student._id || item.student.id;
      const res = await getFeeByStudentAPI(sId);
      if (res.success) {
        setSelectedItem({
          student: res.student || item.student,
          fee: res.fee || item.fee
        });
        setPaymentHistory(res.payments || []);
      }
    } catch (err) {
      console.warn('Payment history fetch notice:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAddPayment = (item) => {
    setSelectedItem(item);
    setActiveAction('addPayment');
    const remaining = item.fee ? item.fee.pendingAmount : 0;
    setPaymentForm({
      amount: remaining > 0 ? remaining : '',
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      notes: ''
    });
  };

  const handleSetFeesSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const sId = selectedItem.student._id || selectedItem.student.id;
      const res = await createFeeAPI({
        student: sId,
        totalFees: Number(setFeeTotal)
      });

      if (res.success) {
        showToast('Fee master record created successfully.');
        closeActionModal();
        fetchFeesOverviewList(selectedStandard, selectedStatus, searchQuery);
      } else {
        setApiError(res.message || 'Unable to set total fees.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to set total fees.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem.fee) return;

    const amtNum = Number(paymentForm.amount);
    const maxPending = selectedItem.fee.pendingAmount;

    if (amtNum <= 0) {
      setApiError('Payment amount must be greater than ₹0.');
      return;
    }

    if (amtNum > maxPending) {
      setApiError('Payment amount (₹' + amtNum + ') cannot exceed pending fee (₹' + maxPending + ').');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const sId = selectedItem.student._id || selectedItem.student.id;
      const fId = selectedItem.fee._id || selectedItem.fee.id;

      const payload = {
        student: sId,
        fee: fId,
        amount: amtNum,
        paymentDate: paymentForm.date,
        paymentMode: paymentForm.mode,
        notes: paymentForm.notes.trim()
      };

      const res = await createPaymentAPI(payload);

      if (res.success) {
        showToast('Payment recorded successfully.');
        let allPayments = [];
        try {
          const historyRes = await getFeeByStudentAPI(sId);
          if (historyRes && historyRes.payments) {
            allPayments = historyRes.payments;
          }
        } catch (e) {
          console.warn('Payment history fetch error:', e);
        }
        if (allPayments.length === 0 && res.payment) {
          allPayments = [res.payment];
        }

        setReceiptData({
          ...res,
          student: selectedItem ? selectedItem.student : null,
          allPayments
        });
        setActiveAction('receipt');
        fetchFeesOverviewList(selectedStandard, selectedStatus, searchQuery);
      } else {
        setApiError(res.message || 'Unable to record payment.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiptForPayment = async (p, feeItem) => {
    const sId = (feeItem && feeItem.student && (feeItem.student._id || feeItem.student.id)) || (p.student && (p.student._id || p.student.id));
    let allPayments = [];
    if (sId) {
      try {
        const historyRes = await getFeeByStudentAPI(sId);
        if (historyRes && historyRes.payments) {
          allPayments = historyRes.payments;
        }
      } catch (e) {
        console.warn('Receipt history fetch error:', e);
      }
    }
    if (allPayments.length === 0) {
      allPayments = [p];
    }
    setReceiptData({
      payment: p,
      updatedFee: feeItem ? feeItem.fee : p.fee,
      student: feeItem ? feeItem.student : p.student,
      allPayments
    });
    setActiveAction('receipt');
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? Fee totals will be recalculated.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await deletePaymentAPI(paymentId);
      if (res.success) {
        showToast('Payment deleted and fee totals recalculated.');
        if (selectedItem) {
          handleOpenViewDetails(selectedItem);
        }
        fetchFeesOverviewList(selectedStandard, selectedStatus, searchQuery);
      }
    } catch (err) {
      alert(err.message || 'Unable to delete payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedStandard('All Standards');
    setSelectedStatus('All Status');
    setSearchQuery('');
  };

  return (
    <LayoutComponent>
      <div className="fees-container">
        {/* Top Page Header */}
        <div className="fees-top-bar">
          <h1 className="fees-heading">Student Fees & Payment Directory</h1>
          <p className="fees-subtitle">
            Manage student fee master records, record installments, and track pending fee status.
          </p>
        </div>

        {/* Toast Banner */}
        {toastMessage && (
          <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div className="validation-alert-box" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* 3 Summary Stat Cards matching fees.css (Admin Only) */}
        {!isStaffUser && (
          <div className="fees-summary-grid">
            <div className="fees-stat-card total">
              <div className="fees-stat-icon total">
                <IndianRupee size={26} />
              </div>
              <div className="fees-stat-details">
                <div className="fees-stat-label">Total Expected Fees</div>
                <div className="fees-stat-count">₹{summaryMetrics.totalExpectedFees.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="fees-stat-card collected">
              <div className="fees-stat-icon collected">
                <CheckCircle2 size={26} />
              </div>
              <div className="fees-stat-details">
                <div className="fees-stat-label">Total Collected Fees</div>
                <div className="fees-stat-count" style={{ color: '#10B981' }}>
                  ₹{summaryMetrics.totalCollectedFees.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="fees-stat-card pending">
              <div className="fees-stat-icon pending">
                <AlertCircle size={26} />
              </div>
              <div className="fees-stat-details">
                <div className="fees-stat-label">Total Pending Fees</div>
                <div className="fees-stat-count" style={{ color: '#EF4444' }}>
                  ₹{summaryMetrics.totalPendingFees.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Card matching fees.css */}
        <div className="fees-filter-card">
          <input
            type="text"
            placeholder="🔍 Search Student Name / Roll No / ID..."
            className="f-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="f-select-filter"
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
          >
            <option value="All Standards">Class ▼</option>
            {STANDARDS_LIST.map(std => (
              <option key={std} value={std}>{std} Class</option>
            ))}
          </select>

          <select
            className="f-select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All Status">Fee Status ▼</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Not Set">Not Set</option>
          </select>

          <button className="f-select-filter" onClick={handleClearFilters} style={{ minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <RotateCcw size={16} /> Clear
          </button>
        </div>

        {/* Student Fee Overview Table Card matching fees.css */}
        <div className="fees-table-card">
          <div style={{ padding: '1rem 1.5rem', background: '#F8F5EC', borderBottom: '1px solid #E2DBD0', fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A' }}>
            All Registered Students Fee Status ({studentsOverview.length} Students)
          </div>

          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600 }}>Loading student fee details...</div>
            </div>
          ) : studentsOverview.length > 0 ? (
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Total Fees</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsOverview.map(({ student, fee }) => {
                  const sId = student._id || student.id;
                  const hasFeeRecord = !!fee;

                  return (
                    <tr key={sId}>
                      <td className="f-id-cell">{student.studentId || 'N/A'}</td>
                      <td className="f-name-cell">{student.name}</td>
                      <td style={{ fontWeight: 800 }}>{student.standard} Class</td>
                      <td style={{ fontWeight: 800 }}>
                        {hasFeeRecord ? ('₹' + fee.totalFees.toLocaleString('en-IN')) : <span style={{ color: '#888' }}>Not Set</span>}
                      </td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>
                        {hasFeeRecord ? ('₹' + fee.paidAmount.toLocaleString('en-IN')) : '₹0'}
                      </td>
                      <td style={{ fontWeight: 800, color: hasFeeRecord && fee.pendingAmount > 0 ? '#EF4444' : '#171717' }}>
                        {hasFeeRecord ? ('₹' + fee.pendingAmount.toLocaleString('en-IN')) : <span style={{ color: '#888' }}>Not Set</span>}
                      </td>
                      <td>
                        {hasFeeRecord ? (
                          <span className={fee.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                            {fee.status}
                          </span>
                        ) : (
                          <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.82rem' }}>
                            Not Set
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          {hasFeeRecord ? (
                            <>
                              <button
                                onClick={() => handleOpenViewDetails({ student, fee })}
                                style={{ background: '#1E3A8A', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              >
                                <Eye size={13} /> View
                              </button>

                              <button
                                onClick={() => handleOpenReceiptForPayment(null, { student, fee })}
                                style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #10B981', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="View & Print Fee Receipt"
                              >
                                <Printer size={13} /> Receipt
                              </button>

                              <button
                                className="btn-add-payment"
                                onClick={() => handleOpenAddPayment({ student, fee })}
                                disabled={fee.pendingAmount === 0}
                                style={{
                                  background: fee.pendingAmount === 0 ? '#9CA3AF' : '#10B981',
                                  cursor: fee.pendingAmount === 0 ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <CreditCard size={13} /> Add Payment
                              </button>
                            </>
                          ) : !isStaffUser ? (
                            <button
                              onClick={() => handleOpenSetFees({ student, fee: null })}
                              style={{ background: '#D4AF37', color: '#080808', border: 'none', padding: '0.4rem 0.85rem', fontSize: '0.82rem', fontWeight: 900, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Plus size={14} /> Set Fees
                            </button>
                          ) : (
                            <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                              Fee Not Set
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <User size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No student records found matching criteria.</div>
            </div>
          )}
        </div>

        {/* ==================================================
            CRITICAL REQUIREMENT: CENTERED FIXED MODALS (PORTAL ON DOCUMENT.BODY)
            ================================================== */}

        {/* MODAL 1: SET FEES CENTERED MODAL */}
        {activeAction === 'setFees' && selectedItem && ReactDOM.createPortal(
          <div className="fees-modal-overlay" onClick={closeActionModal}>
            <div className="fees-modal" style={{ border: '2px solid #D4AF37', borderRadius: '8px', padding: '1.5rem', maxWidth: '480px', width: '92%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#7A5B0B', fontWeight: 900, margin: 0 }}>Set Student Total Fees</h3>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: '#F8F5EC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2DBD0', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3A8A' }}>{selectedItem.student.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>Class: {selectedItem.student.standard} Standard | Student ID: {selectedItem.student.studentId || 'N/A'}</div>
              </div>

              <form onSubmit={handleSetFeesSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Total Course Fees (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A', boxSizing: 'border-box' }}
                    value={setFeeTotal}
                    onChange={(e) => setSetFeeTotal(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} style={{ background: '#D4AF37', color: '#080808', border: 'none', padding: '0.55rem 1.5rem', borderRadius: '4px', fontWeight: 900, cursor: 'pointer' }}>
                    {isSubmitting ? 'Saving Fees...' : 'Save Fee Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: VIEW FEE DETAILS & PAYMENT HISTORY CENTERED MODAL */}
        {activeAction === 'view' && selectedItem && ReactDOM.createPortal(
          <div className="fees-modal-overlay" onClick={closeActionModal}>
            <div className="fees-modal" style={{ border: '2px solid #1E3A8A', borderRadius: '8px', padding: '1.75rem', maxWidth: '750px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>Fee Statement & Payment History</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    {selectedItem.student.name} ({selectedItem.student.standard} Class)
                  </span>
                </div>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              {selectedItem.fee && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#F8F5EC', border: '1px solid #E2DBD0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Total Fees</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111' }}>₹{selectedItem.fee.totalFees.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>Paid Amount</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>₹{selectedItem.fee.paidAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>Pending Balance</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444' }}>₹{selectedItem.fee.pendingAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.75rem' }}>Payment Transactions ({paymentHistory.length})</h4>

              {actionLoading ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ color: '#666', fontWeight: 600 }}>Loading payment history...</div>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div style={{ border: '1px solid #E2DBD0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table className="fees-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Notes</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p) => {
                        const pId = p._id || p.id;
                        const pDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                        return (
                          <tr key={pId}>
                            <td style={{ fontWeight: 800, color: '#1E3A8A' }}>{p.receiptNumber}</td>
                            <td>{pDate}</td>
                            <td style={{ fontWeight: 800, color: '#10B981' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                            <td><span style={{ background: '#F8F5EC', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #E2DBD0' }}>{p.paymentMode}</span></td>
                            <td>{p.notes || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleOpenReceiptForPayment(p, selectedItem)}
                                  style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #10B981', padding: '0.3rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  <Printer size={12} /> Receipt
                                </button>
                                {!isStaffUser && (
                                  <button
                                    onClick={() => handleDeletePayment(pId)}
                                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #EF4444', padding: '0.3rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#F8F5EC', borderRadius: '6px', border: '1px solid #E2DBD0', color: '#666', fontWeight: 600 }}>
                  No payment records found for this student yet.
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button onClick={closeActionModal} style={{ background: '#1E3A8A', color: '#FFF', border: 'none', padding: '0.55rem 2.5rem', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: ADD PAYMENT CENTERED MODAL */}
        {activeAction === 'addPayment' && selectedItem && selectedItem.fee && ReactDOM.createPortal(
          <div className="fees-modal-overlay" onClick={closeActionModal}>
            <div className="fees-modal" style={{ border: '2px solid #10B981', borderRadius: '8px', padding: '1.5rem', maxWidth: '520px', width: '92%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10B981', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#065F46', fontWeight: 900, margin: 0 }}>Add Fee Payment</h3>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #10B981', padding: '0.85rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>{selectedItem.student.name} ({selectedItem.student.standard} Class)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: '4px', color: '#047857', fontWeight: 700 }}>
                  <span>Total Fees: ₹{selectedItem.fee.totalFees.toLocaleString('en-IN')}</span>
                  <span>Paid: ₹{selectedItem.fee.paidAmount.toLocaleString('en-IN')}</span>
                  <span style={{ color: '#EF4444', fontWeight: 900 }}>Pending: ₹{selectedItem.fee.pendingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <form onSubmit={handleAddPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedItem.fee.pendingAmount}
                    style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A', boxSizing: 'border-box' }}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder={'Max: ₹' + selectedItem.fee.pendingAmount}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Payment Date *</label>
                    <input
                      type="date"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Payment Mode *</label>
                    <select
                      className="f-select-filter"
                      style={{ width: '100%' }}
                      value={paymentForm.mode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Notes / Remarks</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                    placeholder="e.g. Installment 1 via PhonePe"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-add-payment" style={{ padding: '0.55rem 1.5rem' }}>
                    {isSubmitting ? 'Processing Payment...' : 'Save Payment & Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 4: PRINTABLE FEE RECEIPT PREVIEW CENTERED MODAL */}
        {activeAction === 'receipt' && receiptData && (
          <FeeReceiptModal receiptData={receiptData} onClose={closeActionModal} />
        )}
      </div>
    </LayoutComponent>
  );
};

export default Fees;
