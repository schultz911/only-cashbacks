import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LoungeTrackerModal } from './LoungeTrackerModal';

afterEach(() => {
  cleanup();
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});

it('opens a named native modal, handles cancellation and restores the opener', () => {
  // jsdom has no native dialog methods. Browser checks cover native focus containment.
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
    this.querySelector('button')?.focus();
  });
  const close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const onClose = vi.fn();
  const view = render(<LoungeTrackerModal
    isOpen onClose={onClose} loungeTab="Domestic" setLoungeTab={vi.fn()}
    loungePassesUsed={{}} setLoungePassesUsed={vi.fn()}
    loungeMilestonesVerified={{}} setLoungeMilestonesVerified={vi.fn()}
    kiwiNeonEarnRate={1}
  />);

  const dialog = screen.getByRole('dialog', { name: 'Lounge Tracker' });
  expect(showModal).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close lounge tracker' }));
  const cancel = new Event('cancel', { cancelable: true });
  fireEvent(dialog, cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledOnce();

  view.unmount();
  expect(close).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(opener);
  opener.remove();
});
