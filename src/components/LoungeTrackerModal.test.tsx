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

it('keeps only the latest milestone confirmation open and clears it on close', () => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  const props = {
    onClose: vi.fn(), loungeTab: 'Domestic' as const, setLoungeTab: vi.fn(),
    loungePassesUsed: {}, setLoungePassesUsed: vi.fn(),
    loungeMilestonesVerified: {}, setLoungeMilestonesVerified: vi.fn(), kiwiNeonEarnRate: 1,
  };
  const view = render(<LoungeTrackerModal {...props} isOpen />);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm milestone for Imperia Platinum Debit' }));
  expect(screen.getByRole('group', { name: 'Confirm milestone for Imperia Platinum Debit' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm milestone for Tata Neu Infinity' }));
  expect(screen.queryByRole('group', { name: 'Confirm milestone for Imperia Platinum Debit' })).toBeNull();
  expect(screen.getByRole('group', { name: 'Confirm milestone for Tata Neu Infinity' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Not Yet' }));
  view.rerender(<LoungeTrackerModal {...props} isOpen={false} />);
  view.rerender(<LoungeTrackerModal {...props} isOpen />);
  expect(screen.queryByRole('group', { name: /Confirm milestone for/ })).toBeNull();
});
