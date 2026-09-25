import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ApplicationStatus } from '../types/application';
import { getStatusLabel } from '../features/applications/status';

type TerminalStatusDialogProps = {
  status: Extract<ApplicationStatus, 'HIRED' | 'REJECTED' | 'WITHDRAWN'>;
  isSubmitting: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DIALOG_CONTENT = {
  HIRED: {
    title: 'Mark as Hired?',
    confirmLabel: 'Mark as Hired',
    icon: '✓',
    tone: 'success',
  },
  REJECTED: {
    title: 'Mark as Rejected?',
    confirmLabel: 'Mark as Rejected',
    icon: '!',
    tone: 'danger',
  },
  WITHDRAWN: {
    title: 'Withdraw application?',
    confirmLabel: 'Withdraw application',
    icon: '↗',
    tone: 'warning',
  },
} as const;

export function TerminalStatusDialog({
  status,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: TerminalStatusDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const content = DIALOG_CONTENT[status];
  const titleId = `terminal-status-title-${status.toLowerCase()}`;
  const descriptionId = `terminal-status-description-${status.toLowerCase()}`;

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    cancelButtonRef.current?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled)',
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === firstFocusableElement
        ) {
          event.preventDefault();
          lastFocusableElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastFocusableElement
        ) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, onCancel]);

  return createPortal(
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="terminal-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={`terminal-status-icon terminal-status-icon-${content.tone}`} aria-hidden="true">
          {content.icon}
        </div>
        <div>
          <h2 id={titleId}>{content.title}</h2>
          <p id={descriptionId}>
            This will mark the application as {getStatusLabel(status)}. This
            status is final and cannot be changed later.
          </p>
          <p>You can still edit other application details afterward.</p>
        </div>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            className="button button-secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`button button-${content.tone}`}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : content.confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
