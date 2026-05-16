import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Undo2, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: { amount: number; date: number }[];
  setLogs: React.Dispatch<React.SetStateAction<{ amount: number; date: number }[]>>;
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
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {showConfirm ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center py-6"
              >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Savings?</h3>
                <p className="text-gray-500 mb-8 font-medium">This will permanently delete your savings history. This cannot be undone.</p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Yes, Reset
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-2">My Savings</h2>
                <p className="text-sm text-gray-500 mb-8 font-medium">Track your total cashbacks</p>

                <div className="bg-gray-50 w-full rounded-2xl p-6 border border-gray-100 mb-6">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Earned This Month</div>
                  <div className="text-4xl font-black text-green-600">₹{totalThisMonth.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <button 
                    onClick={handleUndo}
                    disabled={logs.length === 0}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Undo2 className="w-4 h-4" /> Undo Last
                  </button>
                  <button 
                    onClick={() => setShowConfirm(true)}
                    disabled={logs.length === 0}
                    className="py-3 px-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>

                <button onClick={handleClose} className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg">
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
