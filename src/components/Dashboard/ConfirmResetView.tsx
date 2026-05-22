import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmResetView({ onCancel, onConfirm }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center py-6"
    >
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
        <AlertTriangle className="w-8 h-8 animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reset Savings?</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">This will permanently delete your savings history. This cannot be undone.</p>
      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          Yes, Reset
        </button>
      </div>
    </motion.div>
  );
}
