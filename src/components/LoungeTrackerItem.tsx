import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../types';
import { cn } from '../lib/utils';
import { Check } from 'lucide-react';

interface LoungeTrackerItemProps {
  card: Card;
  parsed: any;
  category: string;
  passesUsed: number;
  setPassesUsed: (val: number | ((prev: number) => number)) => void;
  isVerified: boolean;
  setIsVerified: (val: boolean) => void;
}

export const LoungeTrackerItem: React.FC<LoungeTrackerItemProps> = ({
  card,
  parsed,
  category,
  passesUsed,
  setPassesUsed,
  isVerified,
  setIsVerified
}) => {
  // If free, it's verified by default. Else requires verification.
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  const passesCount = parsed.passesCount || 0;
  const passesRemaining = Math.max(0, passesCount - passesUsed);
  const isExhausted = passesCount > 0 && passesRemaining === 0;

  const handleInteract = () => {
    if (!isVerified) {
      if (card.id === 'kiwi-neon') return;
      setShowVerifyDialog(true);
      return;
    }

    if (isExhausted) {
      // Return to original state where spend milestone isn't finished
      setPassesUsed(0);
      if (card.id !== 'kiwi-neon') {
        setIsVerified(parsed.isFree);
      }
    } else {
      // Use pass
      setPassesUsed(p => p + 1);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative p-4 rounded-2xl flex flex-col gap-2 overflow-hidden transition-all duration-500 shadow-sm border shrink-0 backdrop-blur-xl group",
        isVerified || card.id !== 'kiwi-neon' ? "cursor-pointer" : "cursor-default",
        isExhausted
          ? "bg-gray-100/50 dark:bg-gray-800/50 grayscale opacity-80 border-gray-200 dark:border-gray-800"
          : isVerified && passesCount > 0
            ? "bg-gradient-to-br from-blue-50/90 to-blue-100/50 dark:from-blue-900/40 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-700/30 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600/50"
            : "bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700 hover:shadow-md"
      )}
      onClick={handleInteract}
    >
      {/* Silver Frosted Glass Overlay for active passes */}
      {isVerified && !isExhausted && passesCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 top-0 h-full bg-gradient-to-br from-white/30 via-white/5 to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent backdrop-blur-[2px] pointer-events-none rounded-2xl z-10 opacity-70 group-hover:opacity-100 transition-opacity"
        />
      )}

      {/* Golden Tag */}
      <AnimatePresence>
        {isVerified && !isExhausted && passesCount > 0 && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-b from-amber-200 to-amber-500 dark:from-amber-400 dark:to-amber-600 text-amber-900 dark:text-amber-950 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl shadow-md z-20 shadow-amber-500/20"
          >
            {passesRemaining} {passesRemaining === 1 ? 'Pass' : 'Passes'} Left
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("flex justify-between items-start gap-4 relative z-20 transition-all", isVerified && !isExhausted && passesCount > 0 ? "pt-2" : "")}>
        <div className="flex flex-col gap-1">
          <div className="font-black text-gray-900 dark:text-gray-100 mt-1">{card.name}</div>
          <div className={cn("font-bold backdrop-blur-md border px-2.5 py-0.5 rounded-lg text-xs w-fit shadow-sm bg-white/60 dark:bg-gray-800/60", category === 'International' ? "text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/30" : "text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30")}>
            {parsed.passesStr}
          </div>
        </div>
        <div className="shrink-0 flex justify-end mt-1">
          {parsed.isFree ? (
            <span className="font-black text-green-700 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-800/50 px-3 py-1 rounded-xl text-xs shadow-sm uppercase tracking-wider">Free</span>
          ) : parsed.spend > 0 ? (
            <span className="font-black text-amber-800 dark:text-amber-500 bg-amber-100/80 dark:bg-amber-900/20 backdrop-blur-sm px-3 py-1 rounded-xl text-xs shadow-sm border border-amber-300/50 dark:border-amber-800/30">₹{parsed.spend.toLocaleString()} Spend</span>
          ) : (
            <span className={cn(
              "font-black px-3 py-1 rounded-xl text-xs shadow-sm backdrop-blur-sm",
              card.id === 'kiwi-neon' && !isVerified
                ? "text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50"
                : "text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50"
            )}>
              {card.id === 'kiwi-neon' && !isVerified ? 'Locked' : 'Milestone'}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 relative z-20 mt-1">
        <div className="text-sm text-gray-500 font-medium leading-relaxed">
          {parsed.description}
        </div>
        {isVerified && passesCount > 0 && category === 'Domestic' && (card.id === 'hdfc-tata-neu-infinity' || card.id === 'hdfc-imperia') && (
          <div className="flex gap-2 items-center flex-wrap pt-1">
            {!isExhausted && card.id === 'hdfc-tata-neu-infinity' && (
              <a
                href="https://www.gyftr.com/myrewards/tataneuhdfcbankcreditcards/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-blue-700 bg-blue-100/80 backdrop-blur-sm border border-blue-200 px-3 py-1.5 rounded-lg w-fit hover:bg-blue-200 transition-colors shadow-sm"
              >
                Redeem Voucher
              </a>
            )}
            {!isExhausted && card.id === 'hdfc-imperia' && (
              <a
                href="https://www.gyftr.com/myrewards/hdfcdebitcardloungeprogram/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-blue-700 bg-blue-100/80 backdrop-blur-sm border border-blue-200 px-3 py-1.5 rounded-lg w-fit hover:bg-blue-200 transition-colors shadow-sm"
              >
                Redeem Voucher
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPassesUsed(passesUsed - 1);
              }}
              className="text-xs font-bold text-purple-700 bg-purple-100/80 backdrop-blur-sm border border-purple-200 px-3 py-1.5 rounded-lg w-fit hover:bg-purple-200 transition-colors shadow-sm"
            >
              + 1
            </button>
          </div>
        )}
      </div>

      {/* Verify Dialog Overlay */}
      <AnimatePresence>
        {showVerifyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center rounded-2xl"
          >
            <h4 className="text-gray-900 font-bold text-sm mb-1">Confirm Milestone</h4>
            <p className="text-xs text-gray-500 font-medium mb-3">Have you met the required spend target?</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowVerifyDialog(false)}
                className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold py-2 rounded-xl transition-colors"
              >
                Not Yet
              </button>
              <button
                onClick={() => {
                  setIsVerified(true);
                  setShowVerifyDialog(false);
                }}
                className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-600/30 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" /> Yes, Enable
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
