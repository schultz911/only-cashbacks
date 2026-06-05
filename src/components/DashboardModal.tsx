import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Undo2, RotateCcw, AlertTriangle } from 'lucide-react';
import { CashbackLog } from '../types';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: CashbackLog[];
  setLogs: React.Dispatch<React.SetStateAction<CashbackLog[]>>;
}

export function DashboardModal({ isOpen, onClose, logs, setLogs }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'card'>('category');

  // calculate this month's cashback
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthLogs = logs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = thisMonthLogs.reduce((acc, log) => acc + log.amount, 0);

  // Group logs by category or card for Pie Chart
  const chartData = logs.reduce((acc, log) => {
    const key = viewMode === 'category' ? log.category : log.cardName;
    const existing = acc.find(item => item.name === key);
    if (existing) {
      existing.value += log.amount;
    } else {
      acc.push({ name: key, value: log.amount });
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
            <button
              onClick={handleClose}
              aria-label="Close Savings Dashboard"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {showConfirm ? (
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
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors shadow-sm"
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
                  <div className="w-full mb-6">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-left">Top {viewMode === 'category' ? 'Categories' : 'Cards'}</h3>
                       <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                          <button onClick={() => setViewMode('category')} className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors ${viewMode === 'category' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Category</button>
                          <button onClick={() => setViewMode('card')} className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Card</button>
                       </div>
                    </div>
                    
                    <div className="bg-white/40 dark:bg-gray-800/20 backdrop-blur-xl border border-gray-100/30 dark:border-white/5 shadow-lg rounded-2xl p-4 w-full flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
                      <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-xl pointer-events-none" />

                      {/* Donut Chart with Centered Dynamic Metric */}
                      <div className="w-full sm:w-1/2 h-36 flex items-center justify-center relative select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={67}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `₹${value.toFixed(2)}`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.05)',
                                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                color: '#1f2937'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-none">Top</span>
                          <span className="text-sm font-black text-gray-800 dark:text-gray-200 truncate max-w-[70px] mt-0.5 leading-none">{chartData[0]?.name || ''}</span>
                        </div>
                      </div>

                      {/* High-quality Responsive Legend with HTML Flow (solves SVG overlaps) */}
                      <div className="w-full sm:w-1/2 flex flex-col gap-2 z-10">
                        {(() => {
                          const totalVal = chartData.reduce((s, c) => s + c.value, 0);
                          return chartData.map((item, index) => {
                            const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
                            return (
                              <div key={item.name} className="flex flex-col gap-1 w-full text-left">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0 pr-1">
                                  <span 
                                    className="w-2 h-2 rounded-full shrink-0" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                                  />
                                  <span className="truncate pr-1" title={item.name}>{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-900 dark:text-white font-black shrink-0">
                                  <span>₹{item.value.toFixed(0)}</span>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">({pct.toFixed(0)}%)</span>
                                </div>
                              </div>
                              <div className="w-full h-1 bg-gray-100 dark:bg-gray-800/60 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                              </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
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
