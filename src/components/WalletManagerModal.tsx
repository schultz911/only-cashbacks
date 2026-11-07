import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Search, Wallet, CreditCard } from 'lucide-react';
import { CARD_DATA } from '../data/cards';
import { cn } from '../lib/utils';
import { useDialogFocus } from '../hooks/useDialogFocus';

const BANK_LOGOS: Record<string, string> = {
  SBI: '/logos/sbi.svg', HDFC: '/logos/hdfc.svg', HSBC: '/logos/hsbc.svg',
  Kotak: '/logos/kotak.svg', YES: '/logos/yes.svg', IDIB: '/logos/indian-bank.svg',
  DCB: '/logos/dcb.svg', Axis: '/logos/axis.svg', ICICI: '/logos/icici.png'
};
const NETWORK_LOGOS: Record<string, string> = {
  Mastercard: '/logos/mastercard.svg', Visa: '/logos/visa.png', RuPay: '/logos/rupay.svg'
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  walletCards: string[];
  setWalletCards: React.Dispatch<React.SetStateAction<string[]>>;
}

export function WalletManagerModal({ isOpen, onClose, walletCards, setWalletCards }: Props) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const [search, setSearch] = useState('');
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

  const visibleCards = allCards.filter(card => `${card.bank} ${card.name} ${card.network} ${card.type}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedCount = allCards.filter(card => isSelected(card.id)).length;
  const cardGroups = (['Credit', 'Debit'] as const).map(type => ({
    type,
    cards: visibleCards.filter(card => card.type === type)
      .sort((a, b) => a.bank.localeCompare(b.bank, 'en') || a.name.localeCompare(b.name, 'en'))
  })).filter(group => group.cards.length > 0);


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
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-title"
            className="bg-[#F5F5F7] dark:bg-gray-900 rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col h-[90dvh] sm:h-[min(760px,85dvh)] border border-white/60 dark:border-gray-800"
          >
            <div className="p-6 pb-4 border-b border-gray-200/70 dark:border-gray-800 shrink-0 bg-white/50 dark:bg-gray-900/80">
              <div className="flex justify-between items-start gap-4 mb-5">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-blue-600 dark:text-blue-400"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <h2 id="wallet-title" className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">My Wallet</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the cards you own.</p>
                  </div>
                </div>
                <button onClick={onClose}
                aria-label="Close Wallet Manager" className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input aria-label="Search cards" placeholder="Search by card, bank, or network" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 py-3 pl-10 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear card search"
                    onClick={() => setSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center mt-4 text-xs font-medium">
                <span className="text-gray-500 dark:text-gray-400">{search ? `${visibleCards.length} matching cards` : 'Available cards'}</span>
                <span className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full" aria-live="polite">{selectedCount} selected</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
              <div className="flex flex-col gap-2.5">
                {cardGroups.map(group => (
                  <section key={group.type} aria-label={`${group.type} Cards`} className="space-y-2.5 mb-4 last:mb-0">
                    <div className="flex items-center justify-between px-1 pb-1">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{group.type} Cards</h3>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{group.cards.length}</span>
                    </div>
                    {group.cards.map(card => {
                  const selected = isSelected(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      aria-label={`${card.bank} ${card.name} ${card.network}`}
                      onClick={() => toggleCard(card.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        selected ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60" : "bg-white/80 dark:bg-gray-800/40 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="w-16 h-12 rounded-xl flex items-center justify-center p-2 shrink-0" style={{ backgroundColor: card.bank === 'IDIB' ? '#004a8f' : card.bank === 'Axis' ? '#800040' : card.bank === 'ICICI' ? '#9b3419' : '#ffffff' }}>
                        <img src={BANK_LOGOS[card.bank]} alt={`${card.bank} logo`} className="w-full h-full object-contain" width="48" height="32" />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0 font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-gray-100 leading-snug">{card.name}</div>
                        {NETWORK_LOGOS[card.network] && <span className="w-10 h-7 p-1 rounded-md bg-[#ffffff] dark:bg-[#ffffff] flex items-center justify-center shrink-0"><img src={NETWORK_LOGOS[card.network]} alt={`${card.network} logo`} className="w-full h-full object-contain" width="32" height="20" /></span>}
                      </div>
                      <span aria-hidden="true" className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors", selected ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900")}>
                        {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                    })}
                  </section>
                ))}
                {visibleCards.length === 0 && <div className="py-12 text-center"><CreditCard className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" /><p className="font-bold text-sm text-gray-700 dark:text-gray-200">No matching cards</p><p className="text-xs text-gray-500 mt-1">Try a different card name, bank, or network.</p><button onClick={() => setSearch('')} className="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400">Clear search</button></div>}
              </div>
            </div>
            <div className="p-5 sm:px-6 border-t border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900 shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">Changes apply as you select cards.</p>
              <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:bg-black dark:hover:bg-gray-100 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
