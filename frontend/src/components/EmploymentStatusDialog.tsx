import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { EmploymentStatus } from '../types/application';

type Props = {
  status: Exclude<EmploymentStatus, 'ACTIVE'>;
  isSubmitting: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EmploymentStatusDialog({ status, isSubmitting, error, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  const left = status === 'LEFT';
  return createPortal(<div className="dialog-backdrop" role="presentation"><section className="terminal-status-dialog" role="dialog" aria-modal="true" aria-labelledby="employment-status-title"><div className={`terminal-status-icon terminal-status-icon-${left ? 'warning' : 'danger'}`} aria-hidden="true">!</div><div><h2 id="employment-status-title">{left ? 'Mark employment as left?' : 'Mark employment as terminated?'}</h2><p>This indicates that you no longer work at this company. This cannot be changed in the current version.</p></div>{error && <p className="alert alert-error" role="alert">{error}</p>}<div className="dialog-actions"><button ref={cancelRef} className="button button-secondary" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button><button className={`button button-${left ? 'warning' : 'danger'}`} type="button" onClick={onConfirm} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Confirm'}</button></div></section></div>, document.body);
}
