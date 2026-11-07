import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDialogFocus } from './useDialogFocus';

function Example() {
  const [open, setOpen] = useState(false);
  const ref = useDialogFocus(open, () => setOpen(false));
  return <><button onClick={() => setOpen(true)}>Open</button>{open && <div ref={ref} role="dialog" tabIndex={-1}><button>First</button><button>Last</button></div>}</>;
}

describe('dialog focus', () => {
  it('contains keyboard focus and restores it after Escape', () => {
    render(<Example />);
    const trigger = screen.getByText('Open');
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByText('First'));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
