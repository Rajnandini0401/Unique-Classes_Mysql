import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import '../../styles/teacher/teacher-modal.css';

const TeacherModal = ({ isOpen, onClose, title, children, maxWidth = '540px' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="teacher-modal-overlay" onClick={onClose}>
      <div
        className="teacher-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="teacher-modal-header">
          <h3 className="teacher-modal-title">{title}</h3>
          <button className="teacher-modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={20} />
          </button>
        </div>
        <div className="teacher-modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TeacherModal;
