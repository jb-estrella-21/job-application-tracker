import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { EmploymentStatus } from '../types/application';

type Props = {
  status: Exclude<EmploymentStatus, 'ACTIVE'>;
  isSubmitting: boolean;
  error?: string;
  getRestoreFocusTarget: () => HTMLElement | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

function isVisible(element: HTMLElement) {
  if (!element.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) {
    return false;
  }

  let current: HTMLElement | null = element;
  while (current) {
    const style = window.getComputedStyle(current);
    if (
      style.display === 'none'
      || style.visibility === 'hidden'
      || style.visibility === 'collapse'
      || style.opacity === '0'
    ) {
      return false;
    }
    current = current.parentElement;
  }

  return true;
}

function canReceiveFocus(element: HTMLElement | null): element is HTMLElement {
  return Boolean(
    element
    && element.isConnected
    && !element.matches(':disabled, [aria-disabled="true"]')
    && isVisible(element),
  );
}

function getFocusableElements(dialog: HTMLElement | null) {
  if (!dialog) return [];

  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.tabIndex >= 0 && canReceiveFocus(element));
}

export function EmploymentStatusDialog({
  status,
  isSubmitting,
  error,
  getRestoreFocusTarget,
  onCancel,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const isSubmittingRef = useRef(isSubmitting);
  const onCancelRef = useRef(onCancel);

  const left = status === 'LEFT';

  useLayoutEffect(() => {
    isSubmittingRef.current = isSubmitting;
    onCancelRef.current = onCancel;
  }, [isSubmitting, onCancel]);

  useLayoutEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!isSubmittingRef.current) onCancelRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (activeIndex === -1 || activeIndex === focusableElements.length - 1)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function handleFocusIn(event: FocusEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && dialog.contains(target)) {
        lastFocusedElementRef.current = target;
        return;
      }

      const lastFocused = lastFocusedElementRef.current;
      const targetToRestore = lastFocused && dialog.contains(lastFocused) && canReceiveFocus(lastFocused)
        ? lastFocused
        : getFocusableElements(dialog)[0] ?? dialog;
      targetToRestore.focus({ preventScroll: true });
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, []);

  useLayoutEffect(() => {
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    cancelRef.current?.focus({ preventScroll: true });
    lastFocusedElementRef.current = cancelRef.current;

    return () => {
      const preferredTarget = getRestoreFocusTarget() ?? previouslyFocusedElement;
      if (canReceiveFocus(preferredTarget)) {
        preferredTarget.focus({ preventScroll: true });
      }
    };
  }, [getRestoreFocusTarget]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const activeElement = document.activeElement;
    if (
      isSubmitting
      && (!(activeElement instanceof HTMLElement)
        || !dialog.contains(activeElement)
        || activeElement.matches(':disabled'))
    ) {
      dialog.focus({ preventScroll: true });
    }
  }, [isSubmitting]);

  return createPortal(
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="terminal-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employment-status-title"
        tabIndex={-1}
      >
        <div className={`terminal-status-icon terminal-status-icon-${left ? 'warning' : 'danger'}`} aria-hidden="true">
          !
        </div>
        <div>
          <h2 id="employment-status-title">
            {left ? 'Mark employment as left?' : 'Mark employment as terminated?'}
          </h2>
          <p>This indicates that you no longer work at this company. This cannot be changed in the current version.</p>
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button
            ref={cancelRef}
            className="button button-secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`button button-${left ? 'warning' : 'danger'}`}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
