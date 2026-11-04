import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BillReminders } from './BillReminders';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('ignores legacy payment dates when no statement day is configured', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T06:30:00Z'));
  render(<BillReminders walletCards={['icici-amazon-pay']} cardBillDates={{ 'icici-amazon-pay': 1 }} paidBills={{}} markBillPaid={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  expect(screen.getByText("Set each card's statement day in card details.")).toBeTruthy();
});

it('starts only on the statement day at India midnight, ignoring old lead-day settings', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-02T18:29:50Z'));
  const props = { walletCards: ['icici-amazon-pay'], cardBillDates: { 'icici-amazon-pay': 1, 'icici-amazon-pay:statement': 3, 'icici-amazon-pay:reminderDays': 7 }, paidBills: {}, markBillPaid: vi.fn() };
  render(<BillReminders {...props} />);
  expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  expect(screen.getByText('Statement 3 Nov 2026')).toBeTruthy();
  vi.setSystemTime(new Date('2026-11-02T18:30:00Z'));
  act(() => window.dispatchEvent(new Event('focus')));
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  act(() => vi.advanceTimersByTime(1300));
  expect(props.markBillPaid).toHaveBeenCalledWith('icici-amazon-pay');
});
