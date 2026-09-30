import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Search, Eye, Edit3, Trash2, Users, X, UserCheck, CheckCircle2, AlertCircle, Loader2, Check, Camera, Upload } from 'lucide-react';
import { getStaffAPI, getStaffByIdAPI, createStaffAPI, updateStaffAPI, deleteStaffAPI } from '../../services/api';
import { getPhotoUrl } from '../../utils/photoUtils';
import '../../styles/admin/staff.css';

const OfficeStaff = () => {
  // Staff Data List & Total Count from MongoDB API
  const [staffList, setStaffList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Single Action State for Mutually Exclusive Modals (null | 'create' | 'view' | 'edit' | 'delete')
  const [activeAction, setActiveAction] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    education: '',
    address: '',
    responsibility: '',
    photo: ''
  });

  // Lock background body scrolling when any modal is active
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

  // Fetch Staff Members from MongoDB Backend (GET /api/staff)
  const fetchStaffMembers = useCallback(async (searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getStaffAPI({ search: searchQ });

      if (res.success) {
        setStaffList(res.staff || []);
        setTotalCount(res.count !== undefined ? res.count : (res.staff ? res.staff.length : 0));
      } else {
        setApiError('Unable to load office staff.');
      }
    } catch (err) {
      setApiError('Unable to load office staff.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaffMembers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchStaffMembers]);

  // Show Toast Banner
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Close Active Modal Action
  const closeActionModal = () => {
    setActiveAction(null);
    setSelectedStaff(null);
    setActionLoading(false);
  };

  // Action 1: OPEN CREATE STAFF MODAL
  const handleOpenCreate = () => {
    setActiveAction('create');
    setSelectedStaff(null);
    setFormData({
      name: '',
      mobile: '',
      education: '',
      address: '',
      responsibility: '',
      photo: ''
    });
  };

  // Action 2: OPEN VIEW STAFF MODAL (GET /api/staff/:id)
  const handleOpenView = async (staffItem) => {
    setActiveAction('view');
    setSelectedStaff(staffItem);
    setActionLoading(true);

    try {
      const targetId = staffItem._id || staffItem.id;
      const res = await getStaffByIdAPI(targetId);
      if (res.success && res.staff) {
        setSelectedStaff(res.staff);
      }
    } catch (err) {
      console.warn('Staff view notice:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: OPEN EDIT STAFF MODAL (GET /api/staff/:id & Pre-fill)
  const handleOpenEdit = async (staffItem) => {
    setActiveAction('edit');
    setSelectedStaff(staffItem);
    setActionLoading(true);

    const targetId = staffItem._id || staffItem.id;
    try {
      const res = await getStaffByIdAPI(targetId);
      const data = (res.success && res.staff) ? res.staff : staffItem;
      setSelectedStaff(data);

      setFormData({
        name: data.name || '',
        mobile: data.mobile || '',
        education: data.education || '',
        address: data.address || '',
        responsibility: data.responsibility || '',
        photo: data.photo || ''
      });
    } catch (err) {
      setFormData({
        name: staffItem.name || '',
        mobile: staffItem.mobile || '',
        education: staffItem.education || '',
        address: staffItem.address || '',
        responsibility: staffItem.responsibility || '',
        photo: staffItem.photo || ''
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 4: OPEN DELETE CONFIRMATION
  const handleOpenDelete = (staffItem) => {
    setActiveAction('delete');
    setSelectedStaff(staffItem);
  };

  // Submit Create Form (POST /api/staff)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.education.trim() || !formData.address.trim() || !formData.responsibility.trim()) {
      alert('Please fill in all required fields (Name, Mobile, Education, Address, Responsibility).');
      return;
    }

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        education: formData.education.trim(),
        address: formData.address.trim(),
        responsibility: formData.responsibility.trim(),
        photo: formData.photo || ''
      };

      const res = await createStaffAPI(payload);

      if (res.success) {
        showToast('Staff created successfully.');
        closeActionModal();
        fetchStaffMembers(searchQuery);
      } else {
        setApiError(res.message || 'Unable to create staff.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to create staff.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Update Form (PUT /api/staff/:id)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedStaff._id || selectedStaff.id;
      const updatePayload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        education: formData.education.trim(),
        address: formData.address.trim(),
        responsibility: formData.responsibility.trim(),
        photo: formData.photo || ''
      };

      const res = await updateStaffAPI(targetId, updatePayload);

      if (res.success) {
        showToast('Staff updated successfully.');
        closeActionModal();
        fetchStaffMembers(searchQuery);
      } else {
        setApiError(res.message || 'Unable to update staff.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to update staff.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Confirm Delete Action (DELETE /api/staff/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedStaff._id || selectedStaff.id;
      const res = await deleteStaffAPI(targetId);

      if (res.success) {
        showToast('Staff deleted successfully.');
        closeActionModal();
        fetchStaffMembers(searchQuery);
      } else {
        setApiError(res.message || 'Unable to delete staff.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to delete staff.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <AdminLayout>
      <div className="staff-container">
        {/* ==================================================
            1. PAGE HEADER BAR & CREATE NEW STAFF BUTTON
            ================================================== */}
        <div className="staff-top-bar">
          <div>
            <h1 className="staff-heading">Office Staff</h1>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', marginBottom: 0 }}>
              Manage office administrative staff, job responsibilities, and contact info.
            </p>
          </div>
          <button className="create-staff-btn" onClick={handleOpenCreate}>
            <Plus size={18} /> Create New Staff
          </button>
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
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* ==================================================
            2. TOTAL STAFF SUMMARY CARD
            ================================================== */}
        <div className="staff-summary-card">
          <div className="staff-summary-icon">
            <Users size={28} />
          </div>
          <div className="staff-summary-details">
            <span className="staff-summary-label">Total Staff</span>
            <span className="staff-summary-count">{loading ? '...' : totalCount}</span>
          </div>
        </div>

        {/* ==================================================
            3. SEARCH STAFF BAR
            ================================================== */}
        <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2DBD0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', padding: '1.1rem 1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
            <input
              type="text"
              placeholder="Search Staff Name / Mobile / Responsibility / Address..."
              style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.2rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', outline: 'none', boxSizing: 'border-box' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} color="#666" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#111' }}
            >
              Clear Search
            </button>
          )}
        </div>

        {/* ==================================================
            4. STAFF TABLE
            ================================================== */}
        <div className="staff-table-card">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600 }}>Loading office staff...</div>
            </div>
          ) : staffList.length > 0 ? (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Education</th>
                  <th>Responsibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => {
                  const isViewing = activeAction === 'view' && selectedStaff && (selectedStaff._id === staff._id || selectedStaff.id === staff.id);
                  return (
                    <tr key={staff._id || staff.id}>
                      <td className="s-name-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #CBD5E1' }}>
                            {staff.photo ? (
                              <img src={getPhotoUrl(staff.photo)} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <UserCheck size={18} color="#1E3A8A" />
                            )}
                          </div>
                          <span style={{ fontWeight: 700 }}>{staff.name}</span>
                        </div>
                      </td>
                      <td>{staff.mobile}</td>
                      <td>{staff.education}</td>
                      <td className="s-resp-cell">{staff.responsibility}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenView(staff)}
                            style={{ background: isViewing ? '#1D4ED8' : '#233F8F', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            {isViewing ? (
                              <>
                                <Check size={13} /> Viewing
                              </>
                            ) : (
                              <>
                                <Eye size={13} /> View
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            style={{ background: '#C9A227', color: '#080808', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(staff)}
                            style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <UserCheck size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No staff records found.</div>
            </div>
          )}
        </div>

        {/* ==================================================
            5. MUTUALLY EXCLUSIVE OVERLAY MODALS (PORTALS ON DOCUMENT.BODY)
            ================================================== */}

        {/* MODAL 1: CREATE NEW STAFF MODAL */}
        {activeAction === 'create' && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.5rem', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>Create New Staff</h3>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                    Staff Photo (Upload / Capture)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1E3A8A', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      {formData.photo ? (
                        <img src={getPhotoUrl(formData.photo)} alt="Staff Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={26} color="#64748B" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        id="staff-create-photo-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Image file size must be under 5MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, photo: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label
                          htmlFor="staff-create-photo-upload"
                          style={{ background: '#1E3A8A', color: '#FFFFFF', padding: '0.4rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Upload size={14} /> Upload / Choose Photo
                        </label>
                        {formData.photo && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>Supports JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Name *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter staff full name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Education *</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      placeholder="e.g. B.Com, M.A."
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Address *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter residential address"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Responsibility *</label>
                  <textarea
                    rows={4}
                    required
                    className="s-textarea-field"
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    placeholder="Describe staff job responsibilities in detail..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                    Cancel
                  </button>
                  <button type="submit" className="create-staff-btn" disabled={isSubmittingAction}>
                    {isSubmittingAction ? 'Creating...' : 'Create Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: VIEW STAFF MODAL */}
        {activeAction === 'view' && selectedStaff && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.75rem', maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>View Staff</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Staff ID: <strong style={{ color: '#1E3A8A' }}>{selectedStaff.staff_id || selectedStaff.staffId || 'N/A'}</strong>
                  </span>
                </div>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {actionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading staff details...</div>
                </div>
              ) : (
                <>
                  {selectedStaff.photo && (
                    <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                      <img
                        src={getPhotoUrl(selectedStaff.photo)}
                        alt={selectedStaff.name}
                        style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1E3A8A', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Staff ID:</label>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A' }}>{selectedStaff.staff_id || selectedStaff.staffId || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Name:</label>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111' }}>{selectedStaff.name}</div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Mobile Number:</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A' }}>{selectedStaff.mobile || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Education:</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>{selectedStaff.education || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Address:</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#333' }}>{selectedStaff.address || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Responsibility:</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, color: '#171717', background: '#F8F5EC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2DBD0' }}>
                      {selectedStaff.responsibility || 'N/A'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button type="button" className="create-staff-btn" onClick={closeActionModal} style={{ padding: '0.5rem 2.5rem' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: EDIT STAFF MODAL */}
        {activeAction === 'edit' && selectedStaff && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #C9A227', padding: '1.5rem', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#7A5B0B', fontWeight: 900, margin: 0 }}>Edit Staff Member</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Staff Name: <strong style={{ color: '#171717' }}>{selectedStaff.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {actionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Loader2 size={36} className="spin-icon" color="#7A5B0B" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading staff details...</div>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                      Staff Photo (Upload / Capture)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #C9A227', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        {formData.photo ? (
                          <img src={getPhotoUrl(formData.photo)} alt="Staff Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={26} color="#64748B" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="file"
                          id="staff-edit-photo-upload"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Image file size must be under 5MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, photo: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <label
                            htmlFor="staff-edit-photo-upload"
                            style={{ background: '#C9A227', color: '#080808', padding: '0.4rem 0.9rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Upload size={14} /> Upload / Change Photo
                          </label>
                          {formData.photo && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>Supports JPG, PNG, WEBP (Max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Name *</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Education *</label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Address *</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Responsibility *</label>
                    <textarea
                      rows={4}
                      required
                      className="s-textarea-field"
                      value={formData.responsibility}
                      onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                      Cancel
                    </button>
                    <button type="submit" className="create-staff-btn" disabled={isSubmittingAction} style={{ background: '#C9A227', color: '#080808' }}>
                      {isSubmittingAction ? 'Updating...' : 'Update Staff'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 4: DELETE CONFIRMATION MODAL */}
        {activeAction === 'delete' && selectedStaff && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={closeActionModal}
          >
            <div style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #EF4444', padding: '1.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <Trash2 size={46} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, marginBottom: '0.4rem' }}>
                Delete Staff
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                Are you sure you want to delete this staff member?
                <br />
                <strong style={{ color: '#171717', fontSize: '1rem', marginTop: '4px', display: 'block' }}>{selectedStaff.name}</strong>
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                  Cancel
                </button>
                <button className="create-staff-btn" onClick={handleDeleteConfirm} disabled={isSubmittingAction} style={{ background: '#DC2626', padding: '0.5rem 1.5rem' }}>
                  {isSubmittingAction ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminLayout>
  );
};

export default OfficeStaff;
