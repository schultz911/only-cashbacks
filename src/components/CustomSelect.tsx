import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  fullOpacity?: boolean;
  label?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  className, 
  dropdownClassName, 
  fullOpacity,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && focusIndex !== null) selectRef.current?.querySelectorAll<HTMLElement>('[role=option]')[focusIndex]?.focus();
  }, [isOpen, focusIndex]);

  const close = () => { setIsOpen(false); setFocusIndex(null); triggerRef.current?.focus(); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab' && isOpen) {
      if (event.target !== triggerRef.current) {
        event.preventDefault();
        const scope = selectRef.current?.closest('[role=dialog], dialog') || document;
        const controls = Array.from(scope.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(item => item.tabIndex >= 0 && item.getClientRects().length > 0 && !item.closest('[hidden], [inert], [aria-hidden="true"]'));
        const index = controls.indexOf(triggerRef.current!);
        const next = controls[index + (event.shiftKey ? -1 : 1)];
        (next || (scope !== document ? controls[event.shiftKey ? controls.length - 1 : 0] : triggerRef.current))?.focus();
      }
      setIsOpen(false);
      setFocusIndex(null);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !options.length) return;
    event.preventDefault();
    const selected = Math.max(0, options.findIndex(option => option.value === value));
    setIsOpen(true);
    setFocusIndex(current => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : current === null ? selected : Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} onKeyDown={onKeyDown} className={cn("relative", className)} style={{ zIndex: isOpen ? 50 : 10 }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label ? `${label}: ${options.find(option => option.value === value)?.label || placeholder || value}` : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => { setIsOpen(!isOpen); setFocusIndex(null); }}
        className="w-full h-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg cursor-pointer gap-1 pl-3 bg-transparent text-gray-800 dark:text-gray-200"
      >
        <span className="truncate">{value ? options.find(o => o.value === value)?.label : placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[50] border rounded-2xl mt-2 overflow-hidden shadow-xl",
              fullOpacity 
                ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" 
                : "bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border-gray-100/80 dark:border-gray-700",
              dropdownClassName
            )}
          >
            <div className="max-h-64 overflow-y-auto p-1.5 scrollbar-hide space-y-0.5" role="listbox">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={value === option.value}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-xl text-sm",
                    value === option.value 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm text-white font-bold" 
                      : "text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
