import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CardItem } from './CardItem';
import { CARD_DATA } from '../data/cards';

describe('wallet card keyboard access', () => {
  it('opens details with Enter or Space', () => {
    const onClick = vi.fn();
    const card = CARD_DATA[0];
    render(<CardItem card={card} onClick={onClick} />);
    const button = screen.getByRole('button', { name: `View ${card.name} card details` });
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
  it('updates limit status and click behavior when props change', () => {
    const card = CARD_DATA[0];
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<CardItem card={card} onClick={first} isExhausted={false} />);
    expect(screen.queryByText('Limit reached')).toBeNull();
    rerender(<CardItem card={card} onClick={second} isExhausted />);
    expect(screen.getByText('Limit reached')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `View ${card.name} card details` }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('shows BOGO alongside lounge when available and on its own otherwise', () => {
    const card = CARD_DATA.find(item => item.id === 'kotak-811-infinity')!;
    const { rerender } = render(<CardItem card={card} />);
    expect(screen.getByText('BOGO').parentElement?.parentElement).toBe(screen.getByText('Lounge').parentElement?.parentElement);
    rerender(<CardItem card={{ ...card, hasLounge: false }} />);
    expect(screen.getByText('BOGO')).toBeTruthy();
    expect(screen.queryByText('Lounge')).toBeNull();
    rerender(<CardItem card={CARD_DATA.find(item => item.id === 'one-card')!} />);
    expect(screen.queryByText('BOGO')).toBeNull();
  });

});
