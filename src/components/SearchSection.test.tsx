import React, { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchSection } from './SearchSection';

function SearchHarness() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null!);
  return <SearchSection query={query} setQuery={setQuery} amount="" setAmount={vi.fn()} foreignAmount="" setForeignAmount={vi.fn()} baseCurrency="USD" setBaseCurrency={vi.fn()} isIntl={false} setIsIntl={vi.fn()} isOnline={true} setIsOnline={vi.fn()} isScanToPay={false} setIsScanToPay={vi.fn()} handleSearch={vi.fn()} loading={false} suggestions={['Swiggy']} showSuggestions={open} setShowSuggestions={setOpen} focusedSuggestionIndex={index} setFocusedSuggestionIndex={setIndex} history={[]} suggestionRef={ref} formatAmountStr={value => value} isOffline={false} />;
}

describe('merchant suggestions', () => {
  it('announces and selects the active suggestion from the keyboard', () => {
    render(<SearchHarness />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'swi' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('merchant-suggestion-0');
    expect(screen.getByRole('option').getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect((input as HTMLInputElement).value).toBe('Swiggy');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
