/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../types';
import { Zap, Plane } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils'; // Make sure you have this

interface CardItemProps {
  card: Card;
  className?: string;
  isRecommendation?: boolean;
  benefitText?: string;
  onClick?: () => void;
  layoutId?: string;
  isExhausted?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({ card, className, isRecommendation, benefitText, onClick, layoutId, isExhausted }) => {
  const hasLounge = card.benefits.some(b => b.type === 'lounge');
  const isZeroForex = card.benefits.some(b => b.type === 'forex' || b.description.toLowerCase().includes('zero forex'));
  const isForexPositive = card.benefits.some(b => b.description.toLowerCase().includes('forex-positive') && !isZeroForex);

  // Network text/styles (if we were using full SVGs we'd inline them, text works well too)
  const renderNetwork = () => {
    if (card.network === 'Visa') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[40px] pb-1 opacity-100 drop-shadow-md">
            <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 0 1 .894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 0 1 1.913.336l.34-1.59a5.207 5.207 0 0 0-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 0 0-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z" />
        </svg>
      );
    }
    if (card.network === 'Mastercard') {
      return (
        <svg viewBox="0 0 24 15" className="h-[20px] drop-shadow-md mt-2">
          {/* Red circle in the background */}
          <circle cx="7.5" cy="7.5" r="7.5" fill="#eb001b" />
          {/* Yellow/Orange circle cleanly layered on top */}
          <circle cx="16.5" cy="7.5" r="7.5" fill="#f79e1b" />
        </svg>
      );
    }
    if (card.network === 'RuPay') {
      return (
        <svg viewBox="0 0 92 32" className="h-[21px] opacity-100 drop-shadow-md pb-1 mt-2" xmlns="http://www.w3.org/2000/svg">
          <text x="90" y="26" textAnchor="end" fontFamily="sans-serif" fontSize="27" fontWeight="900" fontStyle="italic" fill="#0f3281" letterSpacing="0.1">RuPay</text>
        </svg>
      );
    }
    return <span className="font-bold text-white text-sm">{card.network}</span>;
  };

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: isRecommendation ? 1.08 : 1.03, y: -5 } : {}}
      transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br flex flex-col justify-between min-h-[200px] group",
        card.gradient || "from-gray-700 to-gray-900",
        isRecommendation ? "scale-105" : "scale-100",
        onClick && "cursor-pointer",
        className
      )}
    >
      {onClick && (
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none" />
      )}
      {/* Network (Top Right) */}
      <div className="absolute top-5 right-5 flex flex-col items-end gap-1">
         {renderNetwork()}
      </div>

      {/* Top Section - Bank & Card Name */}
      <div className="flex justify-between items-start mb-8 pr-16 relative">
        <div className="flex flex-col relative w-full gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{card.bank}</span>
            {isZeroForex && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-100 border border-blue-500/30 whitespace-nowrap">Forex</span>
            )}
            {isForexPositive && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 whitespace-nowrap">Forex+</span>
            )}
          </div>
          <div 
             className="relative w-full"
          >
             <h3 className="text-lg font-bold pr-2 whitespace-nowrap overflow-hidden" style={{ maskImage: 'linear-gradient(to right, white 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, white 80%, transparent 100%)' }}>
               {card.name}
             </h3>
          </div>
        </div>
      </div>

      {/* Bottom Section - Lounge Badge & Benefit */}
      <div className="flex flex-col gap-3 mt-auto">
        {hasLounge && (
          <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 shadow-sm mt-auto">
            <Plane className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Lounge</span>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-80 mb-1 font-medium tracking-wide">Benefit</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium leading-tight line-clamp-2 max-w-[220px]">
                {benefitText || (card.benefits[0]?.value + ' ' + card.benefits[0]?.category)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {isRecommendation && (
        <div className="absolute top-0 right-0 left-0 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 uppercase text-center z-10">
          Best Choice
        </div>
      )}

      {isExhausted && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-4 transition-all">
          <div className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded shadow-xl text-center">
             Accelerated Limit Reached
          </div>
        </div>
      )}
    </motion.div>
  );
};
