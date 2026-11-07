import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CustomSelect } from './CustomSelect';

function Example() {
  const [value, setValue] = useState('USD');
  return <CustomSelect value={value} onChange={setValue} options={[{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }]} />;
}

describe('CustomSelect keyboard access', () => {
  it('navigates, selects and returns focus; Escape closes without changing the value', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'USD' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('USD');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('EUR');
    fireEvent.click(document.activeElement!);
    expect(trigger.textContent).toBe('EUR');
    expect(document.activeElement).toBe(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toBe('EUR');
    expect(document.activeElement).toBe(trigger);
  });
});
