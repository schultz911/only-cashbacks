import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DashboardModal } from './DashboardModal';

vi.mock('./SavingsChart', () => { throw new Error('Chart chunk is unavailable offline'); });
afterEach(() => vi.restoreAllMocks());

it('keeps totals and controls available when the deferred chart cannot load', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<DashboardModal isOpen onClose={() => {}} setLogs={() => {}} logs={[{
    date: Date.now(), amount: 42, cardId: 'test', cardName: 'Test', merchantName: 'Test', category: 'Other',
  }]} />);
  expect((await screen.findByRole('status')).textContent).toContain('Chart unavailable');
  expect(screen.getByText('₹42.00')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Undo Last/ })).toBeTruthy();
});
