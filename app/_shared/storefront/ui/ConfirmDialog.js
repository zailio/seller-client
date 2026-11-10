'use client';
import { useEffect } from 'react';
import { st, cx } from './controls';
import m from './modal.module.css';

export default function ConfirmDialog({ request, onClose }) {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger, onConfirm } = request;
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={m.overlay} onMouseDown={onClose} role="alertdialog" aria-modal="true" aria-label={title}>
      <div className={m.modal} style={{ width: 'min(420px, 100%)' }} onMouseDown={(e) => e.stopPropagation()}>
        <div className={m.head}><h3 className={m.title}>{title}</h3></div>
        <div className={m.confirmText}>{message}</div>
        <div className={m.foot}>
          <button type="button" className={st.btn} onClick={onClose}>{cancelText}</button>
          <button type="button" autoFocus className={cx(st.btn, danger ? st.btnDanger : st.btnPrimary)} style={danger ? { borderColor: '#f6c7c8' } : undefined} onClick={() => { onConfirm?.(); onClose(); }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
