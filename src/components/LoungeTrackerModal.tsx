import { Plane, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CARD_DATA } from '../data/cards';
import { LoungeTrackerItem } from './LoungeTrackerItem';
import { cn } from '../lib/utils';

// Reusable Select Component 
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const CustomSelect = ({ value, onChange, options, placeholder, className, dropdownClassName, fullOpacity }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

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
    <div ref={selectRef} className={`relative ${className}`} style={{ zIndex: isOpen ? 50 : 10 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-between outline-none cursor-pointer gap-1 pl-3 bg-transparent text-gray-800 dark:text-gray-200"
      >
        <span className="truncate">{value ? options.find((o: any) => o.value === value)?.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[50] border rounded-2xl mt-2 overflow-hidden",
              fullOpacity 
                ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" 
                : "bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border-gray-100/80 dark:border-gray-700",
              dropdownClassName
            )}
          >
            <div className="max-h-64 overflow-y-auto p-1.5 scrollbar-hide space-y-0.5">
              {options.map((option: any) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-all duration-200 rounded-xl text-sm ${value === option.value ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm text-white font-bold' : 'text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
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

export const parseLoungeBenefit = (b: { value: string, description: string }) => {
  let spend = 0;
  let isFree = false;
  const descLocal = b.description.toLowerCase();

  if (descLocal.includes('complimentary') || descLocal.includes('no spend') || descLocal.includes('free') || descLocal.includes('automatically')) {
    isFree = true;
    spend = 0;
  } else {
    const kMatch = b.description.match(/(\d+)k/i);
    if (kMatch) {
      spend = parseInt(kMatch[1], 10) * 1000;
    }
  }

  let passesStr = b.value.replace('/qtr', ' / Quarter')
    .replace('/milestone', ' / Milestone')
    .replace('/qr', ' / Quarter');

  let passesCount = 0;
  const numMatch = passesStr.match(/(\d+)/);
  if (numMatch) {
    passesCount = parseInt(numMatch[1], 10);
  }

  return { spend, isFree, passesStr, passesCount, description: b.description };
};

interface LoungeTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  loungeTab: 'Domestic' | 'International';
  setLoungeTab: (val: 'Domestic' | 'International') => void;
  loungePassesUsed: Record<string, number>;
  setLoungePassesUsed: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  loungeMilestonesVerified: Record<string, boolean>;
  setLoungeMilestonesVerified: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  kiwiNeonEarnRate: number;
}

export function LoungeTrackerModal({
  isOpen, onClose, loungeTab, setLoungeTab,
  loungePassesUsed, setLoungePassesUsed,
  loungeMilestonesVerified, setLoungeMilestonesVerified,
  kiwiNeonEarnRate
}: LoungeTrackerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[401] w-full md:w-[28rem] bg-[#f5f5f7] dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 pr-4 border-b border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Lounge Tracker</h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Your complimentary passes</p>
                </div>
              </div>
              <button
                aria-label="Close lounge tracker"
                onClick={onClose}
                className="p-2 bg-gray-200/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-300/50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
              <div className="mb-6 relative shrink-0" style={{ zIndex: 100 }}>
                <CustomSelect
                  value={loungeTab}
                  onChange={setLoungeTab}
                  options={[
                    { label: 'Domestic Lounges', value: 'Domestic' },
                    { label: 'International Lounges', value: 'International' }
                  ]}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl py-3 px-4 font-bold outline-none"
                  dropdownClassName="w-full top-full left-0 mt-2 z-50 shadow-xl"
                />
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-10">
                {CARD_DATA.filter(c => !c.isDummy)
                  .filter(c => c.benefits.some(b => b.type === 'lounge' && b.category === loungeTab))
                  .map((card: any) => {
                    const b = card.benefits.find((x: any) => x.type === 'lounge' && x.category === loungeTab)!;
                    const parsed = parseLoungeBenefit(b);

                    let finalPasses = parsed.passesCount;
                    let finalVerified = loungeMilestonesVerified[`${card.id}-${loungeTab}`] ?? parsed.isFree;

                    if (card.id === 'kiwi-neon') {
                      let passes = 0;
                      if (kiwiNeonEarnRate >= 3) passes += 1;
                      if (kiwiNeonEarnRate >= 4) passes += 1;
                      if (kiwiNeonEarnRate >= 5) passes += 1;
                      finalPasses = passes;
                      finalVerified = passes > 0;
                      parsed.passesCount = finalPasses;
                    }

                    const used = loungePassesUsed[`${card.id}-${loungeTab}`] || 0;
                    const passesRemaining = Math.max(0, finalPasses - used);
                    const isExhausted = finalPasses > 0 && passesRemaining === 0;
                    return { card, b, parsed, isExhausted, isVerified: finalVerified };
                  })
                  .sort((a, b) => {
                    if (a.isExhausted && !b.isExhausted) return 1;
                    if (!a.isExhausted && b.isExhausted) return -1;
                    if (a.isVerified && !b.isVerified) return -1;
                    if (!a.isVerified && b.isVerified) return 1;
                    if (a.parsed.spend !== b.parsed.spend) return a.parsed.spend - b.parsed.spend;
                    return b.parsed.passesCount - a.parsed.passesCount;
                  })
                  .map(({ card, parsed, isVerified }) => (
                    <LoungeTrackerItem
                      key={`${card.id}-${loungeTab}`}
                      card={card}
                      parsed={parsed}
                      category={loungeTab}
                      isVerified={isVerified}
                      passesUsed={loungePassesUsed[`${card.id}-${loungeTab}`] || 0}
                      setPassesUsed={(updater: any) => setLoungePassesUsed(prev => {
                        const current = prev[`${card.id}-${loungeTab}`] || 0;
                        const next = typeof updater === 'function' ? updater(current) : updater;
                        return { ...prev, [`${card.id}-${loungeTab}`]: next };
                      })}
                      setIsVerified={(val: boolean) => setLoungeMilestonesVerified(prev => ({ ...prev, [`${card.id}-${loungeTab}`]: val }))}
                    />
                  ))
                }
                {CARD_DATA.filter(c => c.benefits.some(b => b.type === 'lounge' && b.category === loungeTab)).length === 0 && (
                  <div className="text-sm text-gray-400 py-4 text-center">No {loungeTab.toLowerCase()} lounge cards</div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
