import { Plane, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CARD_DATA } from '../data/cards';
import { LoungeTrackerItem } from './LoungeTrackerItem';
import { CustomSelect } from './CustomSelect';
import { cn } from '../lib/utils';
import React from 'react';

const BENEFIT_CACHE = new Map<string, { spend: number, isFree: boolean, passesStr: string, passesCount: number, description: string }>();

export const parseLoungeBenefit = (b: { value: string, description: string }) => {
  const cacheKey = `${b.value}|${b.description}`;
  const cached = BENEFIT_CACHE.get(cacheKey);
  if (cached) return cached;

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

  let passesStr = b.value;
  if (passesStr.includes('/qtr')) passesStr = passesStr.replace('/qtr', ' / Quarter');
  else if (passesStr.includes('/milestone')) passesStr = passesStr.replace('/milestone', ' / Milestone');
  else if (passesStr.includes('/qr')) passesStr = passesStr.replace('/qr', ' / Quarter');

  let passesCount = 0;
  const numMatch = passesStr.match(/(\d+)/);
  if (numMatch) {
    passesCount = parseInt(numMatch[1], 10);
  }

  const result = { spend, isFree, passesStr, passesCount, description: b.description };
  BENEFIT_CACHE.set(cacheKey, result);
  return result;
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
