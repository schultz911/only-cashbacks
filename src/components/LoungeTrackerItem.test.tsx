import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoungeTrackerItem } from './LoungeTrackerItem';
import { CARD_DATA } from '../data/cards';

function Example() {
  const [verified, setVerified] = useState(false);
  const [open, setOpen] = useState(false);
  const card = CARD_DATA.find(item => item.id === 'hdfc-imperia')!;
  return <LoungeTrackerItem card={card} parsed={{ passesCount: 2, passesStr: '2 / Quarter', isFree: false, spend: 10000 }} category="Domestic" passesUsed={0} setPassesUsed={vi.fn()} isVerified={verified} setIsVerified={setVerified} showVerifyDialog={open} setShowVerifyDialog={setOpen} />;
}

describe('lounge milestone confirmation', () => {
  it('moves focus into the confirmation and restores it on cancel and Escape', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: /confirm milestone for/i }));
    expect(screen.getByRole('dialog', { name: /confirm milestone for/i }).getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Not Yet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not Yet' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /confirm milestone for/i }));
    fireEvent.click(document.activeElement!);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Not Yet' }), { key: 'Escape' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /confirm milestone for/i }));
  });
  it('keeps the existing confirmation action and focuses the updated action', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: /confirm milestone for/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, enable/i }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /use a lounge pass for/i }));
  });
});
