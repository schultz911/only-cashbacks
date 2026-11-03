import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BillReminders } from './BillReminders';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('does not mark Amazon Pay ICICI ready on the 1st when its saved payment day is the 3rd', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-01T06:30:00Z'));
  render(<BillReminders walletCards={['icici-amazon-pay']} cardBillDates={{ 'icici-amazon-pay': 3 }} paidBills={{}} markBillPaid={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Ready' })).toBeNull();
});

it('displays the saved payment date separately from an early reminder and refreshes at India midnight', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-31T18:29:50Z'));
  const props = { walletCards: ['icici-amazon-pay'], cardBillDates: { 'icici-amazon-pay': 3 }, paidBills: { 'icici-amazon-pay': '2026-10' }, markBillPaid: vi.fn() };
  const { rerender } = render(<BillReminders {...props} />);
  rerender(<BillReminders {...props} cardBillDates={{ ...props.cardBillDates, 'icici-amazon-pay:reminderDays': 2 }} />);
  expect(screen.queryByRole('button', { name: 'Ready' })).toBeNull();
  vi.setSystemTime(new Date('2026-10-31T18:30:00Z'));
  act(() => window.dispatchEvent(new Event('focus')));
  expect(screen.getByText('Payment due 3 Nov 2026')).toBeTruthy();
  expect(screen.getByText('Reminder 1 Nov 2026')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ready' }));
  act(() => vi.advanceTimersByTime(1300));
  expect(props.markBillPaid).toHaveBeenCalledWith('icici-amazon-pay');
});
