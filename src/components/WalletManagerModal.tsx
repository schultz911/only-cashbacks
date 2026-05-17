import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { CARD_DATA } from '../data/cards';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  walletCards: string[];
  setWalletCards: React.Dispatch<React.SetStateAction<string[]>>;
}

export function WalletManagerModal({ isOpen, onClose, walletCards, setWalletCards }: Props) {
  const allCards = useMemo(() => CARD_DATA.filter(c => !c.isDummy), []);
  
  const toggleCard = (id: string) => {
    setWalletCards(prev => {
      if (prev.length === 0) {
        return allCards.map(c => c.id).filter(cid => cid !== id);
      }
      if (prev.includes(id)) {
        return prev.filter(cid => cid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isSelected = (id: string) => {
    return walletCards.length === 0 ? true : walletCards.includes(id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[400] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-md"
           onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] dark:bg-gray-900 rounded-t-[2rem] sm:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] border border-white/20 dark:border-gray-800"
          >
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-1">My Wallet</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Add the cards you own to get personalized recommendations.</p>
              </div>
              <button
                aria-label="Close wallet manager"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200/50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 backdrop-blur-sm shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-6 min-h-0 snap-y">
              <div className="flex flex-col gap-2">
                {allCards.map(card => {
                  const selected = isSelected(card.id);
                  return (
                    <motion.div
                      layoutId={`wallet-card-${card.id}`}
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      className={cn(
                        "relative shrink-0 rounded-2xl md:rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 select-none group snap-center",
                        selected ? "shadow-lg scale-[0.98]" : "shadow-sm hover:scale-[1.02] opacity-50 hover:opacity-100",
                        "h-16 md:h-20"
                      )}
                    >
                      <div 
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br z-0",
                          card.gradient || "from-gray-700 to-gray-900"
                        )}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      <div className="absolute inset-0 p-3 md:p-4 flex items-center justify-between">
                        <div className="flex flex-col shrink-0 w-[80%] max-w-[80%] justify-center">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white/80 text-[10px] md:text-xs font-black tracking-widest uppercase truncate">{card.bank}</span>
                            <span className="text-white/60 text-[10px] md:text-xs font-bold font-mono tracking-widest">{card.network}</span>
                          </div>
                          <div className="text-white font-black text-base md:text-lg leading-tight drop-shadow-md truncate">{card.name}</div>
                        </div>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-sm shrink-0",
                          selected ? "bg-white text-emerald-600 shadow-lg scale-110" : "bg-white/10 border border-white/30 text-transparent"
                        )}>
                          <Check className="w-5 h-5" strokeWidth={selected ? 3 : 2} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-6 mt-auto shrink-0">
              <button onClick={onClose} className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-lg hover:scale-[1.01] transition-transform shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-95">
                Save & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
