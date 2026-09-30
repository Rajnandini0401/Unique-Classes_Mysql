import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RotateCw, Clock, X, Smartphone, Send } from 'lucide-react';
import { launchWhatsAppQRSetupAPI } from '../../services/api';


const WhatsAppResultModal = ({
  isOpen,
  onClose,
  result,
  isSending = false,
  onRetryFailed,
  onRetryAll
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSending && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSending, onClose]);

  if (!isOpen) return null;

  // Extract result details if available
  const {
    success,
    sent = 0,
    failed = 0,
    totalAbsent = 0,
    results = [],
    lastSentTime,
    code,
    status,
    message
  } = result || {};

  const isDisconnected = code === 'WHATSAPP_NOT_CONNECTED' || code === 'WHATSAPP_QR_REQUIRED' || status === 'WHATSAPP_NOT_CONNECTED' || status === 'WHATSAPP_QR_REQUIRED' || (message && (message.includes('not connected') || message.includes('scan the QR code')));
  const isNoAbsent = code === 'NO_ABSENT_STUDENTS' || (!isSending && result && totalAbsent === 0 && sent === 0 && failed === 0);
  const isFullSuccess = !isSending && !isDisconnected && !isNoAbsent && failed === 0 && sent > 0;
  const isPartialSuccess = !isSending && !isDisconnected && !isNoAbsent && failed > 0 && sent > 0;
  const isFullFailure = !isSending && !isDisconnected && !isNoAbsent && sent === 0 && (failed > 0 || !success);

  const failedStudents = results.filter(r => r.status === 'FAILED');
  const failedStudentIds = failedStudents.map(r => r.studentId).filter(Boolean);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isSending
              ? '#F8FAFC'
              : isDisconnected || isFullFailure
              ? '#FEF2F2'
              : isPartialSuccess
              ? '#FFFBEB'
              : '#F0FDF4'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            {isSending ? (
              <RotateCw size={20} color="#3B82F6" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            ) : isDisconnected || isFullFailure ? (
              <XCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            ) : isPartialSuccess ? (
              <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />
            )}

            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: isSending
                  ? '#1E293B'
                  : isDisconnected || isFullFailure
                  ? '#991B1B'
                  : isPartialSuccess
                  ? '#78350F'
                  : '#14532D',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {isSending
                ? '⏳ Sending WhatsApp via Playwright...'
                : isDisconnected
                ? '❌ WhatsApp Web is Not Connected'
                : isNoAbsent
                ? '✓ No Absent Students'
                : isFullSuccess
                ? '✅ WhatsApp Sent Automatically'
                : isPartialSuccess
                ? '⚠️ WhatsApp Partially Sent'
                : '❌ WhatsApp Sending Failed'}
            </h3>
          </div>

          {/* Close (×) Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSending}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: isSending ? 'not-allowed' : 'pointer',
              padding: '0.35rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              opacity: isSending ? 0.4 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSending) e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '1.15rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* A. SENDING STATE */}
          {isSending && (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem' }}>
                Executing WhatsApp Web Playwright Automation...
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Opening chats, typing formatted message, and clicking Send button automatically. Please wait.
              </div>
            </div>
          )}

          {/* B. DISCONNECTED STATE */}
          {!isSending && isDisconnected && (
            <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 800 }}>
                  WhatsApp Web is Not Connected
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Please scan the QR code first to connect WhatsApp Web on the server. No messages will be sent until authentication is completed.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    alert('Opening WhatsApp Web login window... Please scan the QR code.');
                    await launchWhatsAppQRSetupAPI();
                    alert('WhatsApp Web login successfully saved! You can now send automated messages.');
                    if (onClose) onClose();
                  } catch (err) {
                    alert('Failed to launch QR setup: ' + err.message);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Smartphone size={18} /> Scan QR Code to Connect WhatsApp Web
              </button>
            </div>
          )}

          {/* C. NO ABSENT STUDENTS STATE */}
          {!isSending && !isDisconnected && isNoAbsent && (
            <div style={{ textAlign: 'center', padding: '0.85rem 0' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
                All students are marked Present for this selection. No WhatsApp notifications needed.
              </p>
            </div>
          )}

          {/* D. SUCCESS / PARTIAL / FAILURE CONTENT */}
          {!isSending && !isDisconnected && !isNoAbsent && (
            <div>
              {/* Timestamp & Counter Pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {lastSentTime && (
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="#64748B" /> Last sent: {lastSentTime}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800 }}>
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.65rem', borderRadius: '20px', border: '1px solid #86EFAC' }}>
                    Sent: {sent}
                  </span>
                  <span style={{ background: failed > 0 ? '#FEE2E2' : '#F1F5F9', color: failed > 0 ? '#B91C1C' : '#64748B', padding: '0.2rem 0.65rem', borderRadius: '20px', border: failed > 0 ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>
                    Failed: {failed}
                  </span>
                </div>
              </div>

              {/* Error Message for Failure */}
              {isFullFailure && message && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                  {message}
                </div>
              )}

              {/* Recipients Breakdown List */}
              {results.length > 0 && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
                    Recipients Processed via Playwright Web Automation:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {results.map((r, idx) => {
                      const isAutomatedSent = r.status === 'AUTOMATED_SENT' || r.status === 'SENT';
                      const phone = r.phone || r.mobile || r.parentMobile || '';
                      const errorText = r.errorReason || r.message;

                      return (
                        <div
                          key={r.studentId || idx}
                          style={{
                            fontSize: '0.82rem',
                            background: isAutomatedSent ? '#F0FDF4' : '#FEF2F2',
                            border: isAutomatedSent ? '1px solid #BBF7D0' : '1px solid #FCA5A5',
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, color: isAutomatedSent ? '#166534' : '#991B1B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              • {r.studentName} {phone ? `(${phone})` : ''}
                            </div>
                            {!isAutomatedSent && errorText && (
                              <div style={{ fontSize: '0.72rem', color: '#B91C1C', marginTop: '2px', fontWeight: 600 }}>
                                Reason: {errorText}
                              </div>
                            )}
                            {isAutomatedSent && (
                              <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px', fontWeight: 600 }}>
                                ✓ Message typed & sent automatically via Playwright
                              </div>
                            )}
                          </div>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 900,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              background: isAutomatedSent ? '#16A34A' : '#DC2626',
                              color: '#FFFFFF',
                              flexShrink: 0
                            }}
                          >
                            {isAutomatedSent ? '✓ AUTOMATED SENT' : '✕ FAILED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.65rem',
            flexWrap: 'wrap'
          }}
        >
          {!isSending && results.some(r => r.waUrl || r.mobile || r.phone || r.whatsapp_number) && (
            <button
              type="button"
              onClick={() => {
                results.forEach(r => {
                  const phone = r.phone || r.mobile || r.parentMobile || '';
                  const cleanDigits = phone.replace(/\D/g, '');
                  const todayStr = new Date().toLocaleDateString('en-GB');
                  const defaultMsg = `*ABSENT ALERT*\n\nStudent: *${r.studentName}*\nDate: *${todayStr}*\n\nAbsent Subjects:\n• *${r.subject || 'Math'}* - 05:00 AM - 06:00 AM\n\n*कृपया गैरहजेरीचे कारण पालकांनी अंकात नोंदवावे:*\n1 आजारी होता./ आजारी होती.\n2 काही काम होते.\n3 मला माहित नाही.\n4 इतर.\n\n*Unique Classes, Nilanga*`;
                  const url = r.waUrl || (formattedPhone ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(r.messageText || defaultMsg)}` : null);
                  if (url) window.open(url, '_blank');

                });
              }}
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={15} /> Open All WhatsApp Chats
            </button>
          )}

          {/* Retry Failed Button */}
          {!isSending && (isPartialSuccess || isFullFailure) && (
            <button
              type="button"
              onClick={() => {
                if (failedStudentIds.length > 0 && onRetryFailed) {
                  onRetryFailed(failedStudentIds);
                } else if (onRetryAll) {
                  onRetryAll();
                }
              }}
              style={{
                background: isPartialSuccess ? '#D97706' : '#DC2626',
                color: '#FFFFFF',

                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: isPartialSuccess ? '0 2px 6px rgba(217, 119, 6, 0.25)' : '0 2px 6px rgba(220, 38, 38, 0.25)'
              }}
            >
              <RotateCw size={14} />
              <span>Retry Failed {failedStudentIds.length > 0 ? `(${failedStudentIds.length})` : ''}</span>
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: isSending ? 'not-allowed' : 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppResultModal;
