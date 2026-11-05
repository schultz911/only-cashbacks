import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Card } from '../types';
import { CARD_DATA, CARD_DICT } from '../data/cards';
import { formatBillDate, statementReminder } from '../lib/billingDates';
import { useBillingDay } from '../hooks/useBillingDay';
import { cn } from '../lib/utils';

interface BillRemindersProps {
  walletCards: string[];
  cardBillDates: Record<string, number>;
  paidBills: Record<string, string>;
  markBillPaid: (cardId: string) => void;
}

const DEFAULT_EFFECTIVE_CARDS = CARD_DATA.filter(c => !c.isDummy).map(c => c.id);

export function BillReminders({ walletCards, cardBillDates, paidBills, markBillPaid }: BillRemindersProps) {
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  const paymentTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => {
    paymentTimers.current.forEach(clearTimeout);
  }, []);
  const billingDay = useBillingDay();

  const bills = useMemo(() => {
    const result: { card: Card, status: 'ready' | 'upcoming', daysUntil: number, dueDate: Date, reminderDate: Date, leadDays: number }[] = [];

    const effectiveCards = walletCards.length > 0 ? walletCards : DEFAULT_EFFECTIVE_CARDS;

    for (const cardId of effectiveCards) {
      const card = CARD_DICT[cardId];
      if (!card || card.isDummy || card.type !== 'Credit') continue;
      
      const reminder = statementReminder(cardId, cardBillDates, paidBills);
      if (reminder && (reminder.ready || reminder.daysUntil <= 7)) {
        result.push({ card, status: reminder.ready ? 'ready' : 'upcoming', ...reminder });
      }
    }

    return result.sort((a, b) => {
      if (a.status === 'ready' && b.status !== 'ready') return -1;
      if (a.status !== 'ready' && b.status === 'ready') return 1;
      return a.daysUntil - b.daysUntil;
    });
  }, [walletCards, cardBillDates, paidBills, billingDay]);

  const handlePay = (cardId: string) => {
    setAnimatingCardId(cardId);
    const timer = setTimeout(() => {
      markBillPaid(cardId);
      setAnimatingCardId(null);
      paymentTimers.current = paymentTimers.current.filter(item => item !== timer);
    }, 1300);
    paymentTimers.current.push(timer);
  };

  if (bills.length === 0) {
    return (
      <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 flex items-center justify-center border border-red-200/50 shadow-sm relative z-10">
            <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Statement Reminders</h3>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">All caught up</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[120px] relative z-10">
          <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-700/50 mb-2" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">All caught up!</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Set each card's statement day in card details.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 flex items-center justify-center border border-red-200/50 shadow-sm relative z-10">
          <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Statement Reminders</h3>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Based on your statement day · IST</p>
        </div>
      </div>
      <div className="relative flex flex-col gap-3 z-10">
        <AnimatePresence mode="popLayout">
          {bills.map((bill) => (
            <motion.div
              layout
              key={bill.card.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={
                animatingCardId === bill.card.id 
                ? { scale: [1, 1.08, 1.02], opacity: 1, zIndex: 50, transition: { duration: 0.5, ease: "easeOut" } }
                : { scale: 1, opacity: 1, zIndex: 1, transition: { duration: 0.2 } }
              }
              exit={{ 
                scale: 0.5, 
                opacity: 0, 
                y: -30,
                transition: { duration: 0.4, ease: "backIn" } 
              }}
              className={cn(
                "w-full rounded-xl p-3 border shadow-sm relative overflow-hidden",
                animatingCardId !== bill.card.id ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700" : "bg-green-50 border-green-300 dark:bg-emerald-900/50 dark:border-emerald-600"
              )}
            >
              {animatingCardId === bill.card.id ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="flex items-center justify-center gap-2 h-full text-green-600 dark:text-emerald-400 font-extrabold text-lg py-1"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  <span>Done!</span>
                </motion.div>
              ) : (
                <div className="flex justify-between items-center h-full relative z-10 w-full transition-opacity">
                  <div className="flex flex-col flex-1 pl-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-1 pr-2">{bill.card.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Statement {formatBillDate(bill.dueDate)}</span>
                    {bill.leadDays > 0 && <span className="text-[10px] text-gray-500 dark:text-gray-400">Reminder {formatBillDate(bill.reminderDate)}</span>}
                  </div>
                  <div className="shrink-0 flex items-center justify-end">
                    {bill.status === 'ready' ? (
                      <button
                        onClick={() => handlePay(bill.card.id)}
                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                      >
                        Done
                      </button>
                    ) : (
                      <div className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-500/20 shadow-sm text-center">
                        <div>Upcoming</div>
                        <div className="text-[10px] font-medium opacity-80">in {bill.daysUntil} day{bill.daysUntil !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
