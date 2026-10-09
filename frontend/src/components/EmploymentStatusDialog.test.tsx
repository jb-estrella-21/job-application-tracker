import { useCallback, useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmploymentStatusDialog } from './EmploymentStatusDialog';

type HarnessProps = {
  isSubmitting?: boolean;
  error?: string;
  closeOnConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

function DialogHarness({
  isSubmitting = false,
  error,
  closeOnConfirm = false,
  onConfirm = () => undefined,
  onCancel = () => undefined,
}: HarnessProps) {
  const [isOpen, setIsOpen] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const employmentHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const getRestoreFocusTarget = useCallback(() => restoreFocusRef.current, []);

  function handleConfirm() {
    onConfirm();
    if (closeOnConfirm) {
      restoreFocusRef.current = employmentHeadingRef.current;
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          restoreFocusRef.current = event.currentTarget;
          setIsOpen(true);
        }}
      >
        Open employment dialog
      </button>
      <button type="button">Outside control</button>
      <h2 ref={employmentHeadingRef} tabIndex={-1}>Employment</h2>
      {isOpen && (
        <EmploymentStatusDialog
          status="LEFT"
          isSubmitting={isSubmitting}
          error={error}
          getRestoreFocusTarget={getRestoreFocusTarget}
          onCancel={() => {
            onCancel();
            setIsOpen(false);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

describe('EmploymentStatusDialog keyboard accessibility', () => {
  it('moves initial focus to Cancel after the portal mounts and exposes its name', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));

    const dialog = screen.getByRole('dialog', { name: 'Mark employment as left?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab through enabled focusable elements in the dialog', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));

    const dialog = screen.getByRole('dialog');
    const extraLink = document.createElement('a');
    extraLink.href = '#details';
    extraLink.textContent = 'Dialog details';
    dialog.querySelector('.dialog-actions')?.before(extraLink);

    await user.tab({ shift: true });
    expect(extraLink).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
    await user.tab();
    expect(extraLink).toHaveFocus();
  });

  it('returns programmatic focus changes to the dialog', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));

    screen.getByRole('button', { name: 'Outside control' }).focus();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('closes on Escape and restores focus to the opening control', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open employment dialog' });
    await user.click(trigger);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('closes on Cancel and restores focus to the opening control', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open employment dialog' });
    await user.click(trigger);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('does not dismiss during submission and keeps focus in the modal context', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    rerender(<DialogHarness isSubmitting />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(dialog).toHaveFocus();
  });

  it('keeps an error open and contained, then restores focus after Cancel', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open employment dialog' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    rerender(<DialogHarness error="Unable to update employment status." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to update employment status.');
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('preserves Confirm and restores focus to a surviving context after successful closure', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DialogHarness closeOnConfirm onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Employment' })).toHaveFocus();
  });

  it('removes document listeners when the dialog unmounts', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const outside = document.createElement('button');
    outside.textContent = 'Outside after unmount';
    document.body.append(outside);
    const { unmount } = render(<DialogHarness onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Open employment dialog' }));

    unmount();
    outside.focus();
    await user.keyboard('{Escape}');

    expect(outside).toHaveFocus();
    expect(onCancel).not.toHaveBeenCalled();
    outside.remove();
  });
});
