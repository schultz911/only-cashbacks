import React from 'react';
import { motion } from 'motion/react';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
}

interface Props {
  categoryData: CategoryData[];
  colors: string[];
}

export function TopCategoriesChart({ categoryData, colors }: Props) {
  if (categoryData.length === 0) return null;

  return (
    <div className="w-full mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 text-left">Top Categories</h3>

      <div className="bg-white/40 dark:bg-gray-800/20 backdrop-blur-xl border border-gray-100/30 dark:border-white/5 shadow-lg rounded-2xl p-4 w-full flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-xl pointer-events-none" />

        {/* Donut Chart with Centered Dynamic Metric */}
        <div className="w-full sm:w-1/2 h-36 flex items-center justify-center relative select-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={67}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
            <span className="text-sm font-black text-gray-800 dark:text-gray-200 truncate max-w-[70px] mt-0.5 leading-none">{categoryData[0]?.name || ''}</span>
          </div>
        </div>

        {/* High-quality Responsive Legend with HTML Flow (solves SVG overlaps) */}
        <div className="w-full sm:w-1/2 flex flex-col gap-2 z-10">
          {categoryData.map((item, index) => {
            const totalVal = categoryData.reduce((s, c) => s + c.value, 0);
            const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
            return (
              <div key={item.name} className="flex flex-col gap-1 w-full text-left">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0 pr-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate pr-1">{item.name}</span>
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
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
