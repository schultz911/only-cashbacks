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
      setShowVerifyDialog(true);
      return;
    }
    
    if (isExhausted) {
      // Return to original state where spend milestone isn't finished
      setPassesUsed(0);
      setIsVerified(parsed.isFree);
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
        "relative p-4 rounded-2xl flex flex-col gap-2 overflow-hidden transition-all duration-500 cursor-pointer shadow-sm border",
        isExhausted 
          ? "bg-gray-100 grayscale opacity-80 border-gray-200" 
          : isVerified && passesCount > 0 
            ? "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300 hover:shadow-md" 
            : "bg-white border-gray-100 hover:shadow-md"
      )}
      onClick={handleInteract}
    >
      {/* Silver Frosted Glass Overlay for active passes */}
      {isVerified && !isExhausted && passesCount > 0 && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="absolute inset-x-0 top-0 h-full bg-gradient-to-br from-white/60 via-white/10 to-gray-50/40 backdrop-blur-[1px] pointer-events-none rounded-2xl z-10 opacity-70"
         />
      )}

      {/* Golden Tag */}
      <AnimatePresence>
         {isVerified && !isExhausted && passesCount > 0 && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-200 to-yellow-500 text-yellow-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-b-lg shadow z-20 shadow-yellow-500/20"
            >
              {passesRemaining} {passesRemaining === 1 ? 'Pass' : 'Passes'} Left
            </motion.div>
         )}
      </AnimatePresence>

      <div className={cn("flex justify-between items-start gap-4 relative z-20 transition-all", isVerified && !isExhausted && passesCount > 0 ? "pt-2" : "")}>
         <div className="flex flex-col gap-1">
             <div className="font-bold text-gray-800">{card.name}</div>
             <div className={cn("font-black bg-gray-50/80 backdrop-blur-sm border border-gray-100 px-2 py-0.5 rounded-md text-sm w-fit shadow-sm", category === 'International' ? "text-purple-600" : "text-blue-600")}>
               {parsed.passesStr}
             </div>
         </div>
         <div className="shrink-0 flex justify-end">
            {parsed.isFree ? (
                <span className="font-black text-green-700 bg-green-100/80 backdrop-blur-sm border border-green-200 px-3 py-1 rounded-lg text-sm shadow-sm uppercase tracking-wider">Free</span>
            ) : parsed.spend > 0 ? (
                <span className="font-black text-yellow-800 bg-yellow-100/80 backdrop-blur-sm px-3 py-1 rounded-lg text-sm shadow-sm border border-yellow-300">₹{parsed.spend.toLocaleString()} Spend</span>
            ) : (
                <span className="font-black text-blue-600 bg-blue-100/80 backdrop-blur-sm border border-blue-200 px-3 py-1 rounded-lg text-sm shadow-sm">Milestone</span>
            )}
         </div>
      </div>
      <div className="text-sm text-gray-500 font-medium mt-1 leading-relaxed relative z-20">
          {parsed.description}
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
