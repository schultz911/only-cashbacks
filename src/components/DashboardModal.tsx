import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Undo2, RotateCcw } from 'lucide-react';
import { CashbackLog } from '../types';
import { TopCategoriesChart } from './Dashboard/TopCategoriesChart';
import { ConfirmResetView } from './Dashboard/ConfirmResetView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: CashbackLog[];
  setLogs: React.Dispatch<React.SetStateAction<CashbackLog[]>>;
}

export function DashboardModal({ isOpen, onClose, logs, setLogs }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  // calculate this month's cashback
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthLogs = logs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = thisMonthLogs.reduce((acc, log) => acc + log.amount, 0);

  // Group logs by category for Pie Chart
  const categoryData = logs.reduce((acc, log) => {
    const existing = acc.find(item => item.name === log.category);
    if (existing) {
      existing.value += log.amount;
    } else {
      acc.push({ name: log.category, value: log.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleUndo = () => {
    setLogs(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    setLogs([]);
    setShowConfirm(false);
  };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-950/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 dark:bg-gray-900/90 oled:bg-black/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {showConfirm ? (
              <ConfirmResetView
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleReset}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-md">
                  <TrendingUp className="w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">My Savings</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-bold tracking-widest uppercase">Track your total cashbacks</p>

                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/5 border border-emerald-100/60 dark:border-emerald-900/30 w-full rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                  <div className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black mb-2">Earned This Month</div>
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">₹{totalThisMonth.toFixed(2)}</div>
                </div>

                {logs.length > 0 && (
                  <TopCategoriesChart categoryData={categoryData} colors={COLORS} />
                )}

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <button 
                    onClick={handleUndo}
                    disabled={logs.length === 0}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Undo2 className="w-4 h-4" /> Undo Last
                  </button>
                  <button 
                    onClick={() => setShowConfirm(true)}
                    disabled={logs.length === 0}
                    className="py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 disabled:opacity-40 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>

                <button 
                  onClick={handleClose} 
                  className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.99]"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
