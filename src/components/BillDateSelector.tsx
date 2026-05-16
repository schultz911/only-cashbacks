import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BillDateSelectorProps {
  date: number;
  onChange: (date: number) => void;
}

export function BillDateSelector({ date, onChange }: BillDateSelectorProps) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const startAdjusting = (increment: number) => {
    let current = date;
    const change = () => {
      let next = current + increment;
      if (next > 31) next = 1;
      if (next < 1) next = 31;
      current = next;
      onChange(next);
    };
    
    change();

    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(change, 80);
    }, 400);
  };

  const stopAdjusting = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
      <button
        onMouseDown={() => startAdjusting(-1)}
        onMouseUp={stopAdjusting}
        onMouseLeave={stopAdjusting}
        onTouchStart={() => startAdjusting(-1)}
        onTouchEnd={stopAdjusting}
        onTouchCancel={stopAdjusting}
        className="w-8 h-8 rounded-lg outline-none hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="w-8 flex items-center justify-center">
        <span className="text-white font-black tabular-nums">{date}</span>
      </div>
      
      <button
        onMouseDown={() => startAdjusting(1)}
        onMouseUp={stopAdjusting}
        onMouseLeave={stopAdjusting}
        onTouchStart={() => startAdjusting(1)}
        onTouchEnd={stopAdjusting}
        onTouchCancel={stopAdjusting}
        className="w-8 h-8 rounded-lg outline-none hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
