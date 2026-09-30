import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RotateCw, Smartphone, Clock } from 'lucide-react';

const WhatsAppResultCard = ({ result, onRetryFailed, onRetryAll, isSending }) => {
  if (!result) return null;

  const { success, sent = 0, failed = 0, totalAbsent = 0, results = [], lastSentTime, code, message } = result;

  const isDisconnected = code === 'WHATSAPP_NOT_CONNECTED' || (message && message.includes('not connected'));
  const isNoAbsent = code === 'NO_ABSENT_STUDENTS' || (totalAbsent === 0 && sent === 0 && failed === 0);
  const isFullSuccess = !isDisconnected && !isNoAbsent && failed === 0 && sent > 0;
  const isPartialSuccess = !isDisconnected && !isNoAbsent && failed > 0 && sent > 0;
  const isFullFailure = !isDisconnected && !isNoAbsent && sent === 0 && (failed > 0 || !success);

  const failedStudents = results.filter(r => r.status === 'FAILED');
  const failedStudentIds = failedStudents.map(r => r.studentId).filter(Boolean);

  // 1. WhatsApp Disconnected Card
  if (isDisconnected) {
    return (
      <div
        style={{
          background: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#991B1B',
          marginTop: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <XCircle size={22} color="#DC2626" />
          <strong style={{ fontSize: '1rem', color: '#991B1B' }}>❌ WhatsApp Not Connected</strong>
        </div>
        <p style={{ margin: '0.2rem 0 0.75rem 0', fontSize: '0.85rem', color: '#B91C1C', fontWeight: 600 }}>
          Connect WhatsApp Web first before sending attendance alerts to parents.
        </p>
        <div style={{ fontSize: '0.78rem', color: '#7F1D1D', background: '#FEE2E2', padding: '0.4rem 0.75rem', borderRadius: '6px', fontWeight: 700 }}>
          Tip: Ensure WhatsApp Web session is active in backend server.
        </div>
      </div>
    );
  }

  // 2. No Absent Students Card
  if (isNoAbsent) {
    return (
      <div
        style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          color: '#166534',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.88rem',
          fontWeight: 700
        }}
      >
        <CheckCircle2 size={20} color="#059669" />
        <span>✓ No absent students to notify for this selection.</span>
      </div>
    );
  }

  // 3. Full Success Card (Green)
  if (isFullSuccess) {
    return (
      <div
        style={{
          background: '#F0FDF4',
          border: '2px solid #22C55E',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#14532D',
          marginTop: '1rem',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} color="#16A34A" />
            <strong style={{ fontSize: '1.05rem', color: '#14532D' }}>✅ WhatsApp Sent Successfully</strong>
          </div>
          {lastSentTime && (
            <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Last sent: {lastSentTime}
            </span>
          )}
        </div>

        {/* Counter Summary Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 800 }}>
          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #86EFAC' }}>
            Sent: {sent}
          </span>
          <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            Failed: 0
          </span>
        </div>

        {/* Sent Student Breakdown */}
        {results.length > 0 && (
          <div style={{ borderTop: '1px solid #BBF7D0', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>
              Recipients Notified:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '150px', overflowY: 'auto' }}>
              {results.map((r, idx) => (
                <div key={r.studentId || idx} style={{ fontSize: '0.8rem', color: '#15803D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>• <strong>{r.studentName}</strong> ({r.mobile || 'N/A'})</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>✓ SENT</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Partial Success Card (Amber / Warning)
  if (isPartialSuccess) {
    return (
      <div
        style={{
          background: '#FFFBEB',
          border: '2px solid #F59E0B',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#78350F',
          marginTop: '1rem',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={22} color="#D97706" />
            <strong style={{ fontSize: '1.05rem', color: '#78350F' }}>⚠️ WhatsApp Partially Sent</strong>
          </div>
          {lastSentTime && (
            <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Last sent: {lastSentTime}
            </span>
          )}
        </div>

        {/* Counter Summary Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 800 }}>
          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #86EFAC' }}>
            Sent: {sent}
          </span>
          <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #FCA5A5' }}>
            Failed: {failed}
          </span>
        </div>

        {/* Failed Recipients Breakdown */}
        {failedStudents.length > 0 && (
          <div style={{ borderTop: '1px solid #FDE68A', paddingTop: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B45309', marginBottom: '0.4rem' }}>
              Failed to send:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {failedStudents.map((r, idx) => (
                <div key={r.studentId || idx} style={{ fontSize: '0.82rem', color: '#991B1B', background: '#FEE2E2', padding: '0.4rem 0.65rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>• {r.studentName}</strong> ({r.mobile || 'N/A'})
                    {r.message && <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>Reason: {r.message}</div>}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>FAILED</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retry Failed Button */}
        {onRetryFailed && failedStudentIds.length > 0 && (
          <button
            type="button"
            onClick={() => onRetryFailed(failedStudentIds)}
            disabled={isSending}
            style={{
              background: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isSending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
            }}
          >
            {isSending ? (
              <>
                <RotateCw size={15} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Retrying Failed...</span>
              </>
            ) : (
              <>
                <RotateCw size={15} />
                <span>⚠️ Retry Failed ({failedStudentIds.length})</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // 5. Complete Failure Card (Red)
  if (isFullFailure) {
    return (
      <div
        style={{
          background: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#7F1D1D',
          marginTop: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <XCircle size={22} color="#DC2626" />
          <strong style={{ fontSize: '1.05rem', color: '#7F1D1D' }}>❌ WhatsApp Sending Failed</strong>
        </div>

        {/* Counter Summary Pills */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 800 }}>
          <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            Sent: 0
          </span>
          <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #FCA5A5' }}>
            Failed: {failed || totalAbsent || 1}
          </span>
        </div>

        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: '#991B1B', fontWeight: 600 }}>
          {message || 'Unable to send WhatsApp messages. Please check network connection or WhatsApp Web status.'}
        </p>

        {/* Retry Button */}
        {onRetryAll && (
          <button
            type="button"
            onClick={onRetryAll}
            disabled={isSending}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isSending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
            }}
          >
            {isSending ? (
              <>
                <RotateCw size={15} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RotateCw size={15} />
                <span>✕ Retry</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default WhatsAppResultCard;
