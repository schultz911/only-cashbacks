/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../types';
import { Zap, Plane, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils'; // Make sure you have this

const CARD_BACKGROUNDS = new Set([
  'sbi-eternal', 'hdfc-swiggy', 'hsbc-live-plus', 'hdfc-tata-neu-infinity',
  'sbi-cashback', 'kotak-811-infinity', 'kiwi-neon', 'one-card',
  'niyo-dcb', 'axis-myzone', 'hdfc-imperia', 'icici-amazon-pay'
]);
const NETWORK_LOGOS: Record<string, string> = {
  Visa: '/logos/visa.png', Mastercard: '/logos/mastercard-symbol.svg', RuPay: '/logos/rupay.svg'
};

const CARD_BENEFIT_LABELS: Record<string, string> = {
  'hsbc-live-plus': '10% Grocery, Food & Dining',
  'hdfc-tata-neu-infinity': '10% BigBasket & 5% Utilities',
  'kotak-811-infinity': '5% All Spends & 5% Fuel',
  'kiwi-neon': '5% Scan & Pay',
  'one-card': '5% Offers Around You',
  'axis-myzone': 'Swiggy Food',
  'hdfc-imperia': '25% BookMyShow'
};
const BANK_LABELS: Record<string, string> = { YES: 'YES BANK', IDIB: 'INDIAN BANK' };

const getCardBenefitLabel = (card: Card): string =>
  CARD_BENEFIT_LABELS[card.id] || `${card.benefits[0]?.value} ${card.benefits[0]?.category}`;

interface CardItemProps {
  card: Card;
  className?: string;
  isRecommendation?: boolean;
  benefitText?: string;
  onClick?: () => void;
  layoutId?: string;
  isExhausted?: boolean;
}

export const CardItem: React.FC<CardItemProps> = React.memo(({ card, className, isRecommendation, benefitText, onClick, layoutId, isExhausted }) => {
  const hasLounge = card.hasLounge;
  const showLimitStatus = isExhausted && !isRecommendation;
  const hasBogo = card.id === 'sbi-eternal' || card.id === 'kotak-811-infinity' || card.id === 'hdfc-imperia' || card.id === 'axis-myzone';
  const isZeroForex = card.isZeroForex;
  const isForexPositive = card.isForexPositive;

  const lightFace = ['kotak-811-infinity', 'kiwi-neon', 'niyo-dcb'].includes(card.id);
  const background = CARD_BACKGROUNDS.has(card.id) ? `/card-backgrounds/${card.id}.svg` : undefined;
  const networkLogo = NETWORK_LOGOS[card.network];

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View ${card.name} card details` : undefined}
      onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: isRecommendation ? 1.08 : 1.03, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
      style={{
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        color: lightFace ? '#14232e' : '#ffffff',
        backgroundColor: showLimitStatus ? (lightFace ? '#c0c7b9' : '#17221e') : undefined,
        backgroundImage: showLimitStatus ? 'none' : undefined
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[200px] min-w-[310px] group bg-gradient-to-br",
        card.gradient || "from-gray-700 to-gray-900",
        isRecommendation ? "scale-105" : "scale-100",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        className
      )}
    >
      {background && <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("${background}")`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: showLimitStatus ? 'saturate(.18)' : undefined,
        opacity: showLimitStatus ? .28 : 1
      }} />}
      {background && !lightFace && <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.24), transparent 80%), linear-gradient(0deg, rgba(0,0,0,.72), transparent 70%)' }} />}
      {onClick && (
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none" />
      )}
      {/* Equal logo frames keep every network aligned and at a readable size. */}
      <div className="absolute top-5 right-5 z-10 w-14 h-9 flex items-center justify-center p-1.5">
        {networkLogo
          ? <img src={networkLogo} alt={card.network} width="44" height="24" className="w-full h-full object-contain" style={{ filter: card.id === 'kotak-811-infinity' ? 'brightness(0)' : card.network === 'Visa' && (!lightFace || card.id === 'niyo-dcb') ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.35))' : undefined }} />
          : <span className="text-[10px] font-bold">{card.network}</span>}
      </div>

      {/* Top Section - Bank & Card Name */}
      <div className="flex justify-between items-start mb-8 pr-16 relative">
        <div className="flex flex-col relative w-full gap-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{BANK_LABELS[card.bank] ?? card.bank}</span>
            {isZeroForex && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500/20 border border-blue-500/30 whitespace-nowrap">Forex</span>
            )}
            {isForexPositive && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 whitespace-nowrap">Forex+</span>
            )}
          </div>
          <div className="relative w-full overflow-hidden">
             <h3 className="text-lg font-bold pr-2 whitespace-nowrap overflow-hidden text-ellipsis">
               {card.name}
             </h3>
          </div>
        </div>
      </div>

      {/* Bottom Section - Lounge Badge & Benefit */}
      <div className="flex flex-col gap-3 mt-auto relative">
        <div className="flex flex-wrap items-center gap-2">
        {showLimitStatus && <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-md border border-amber-600/30 bg-[#fff1d5] text-[#87450b] text-[10px] font-bold uppercase tracking-wide">
          <span aria-hidden="true">✓</span> Limit reached
        </span>}
        {hasLounge && (
          <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 shadow-sm mt-auto">
            <Plane className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Lounge</span>
          </div>
        )}
        {hasBogo && (
          <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30 shadow-sm mt-auto">
            <Ticket aria-hidden="true" className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">BOGO</span>
          </div>
        )}

        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-80 mb-1 font-medium tracking-wide">Benefit</span>
            <div className="flex items-center gap-2">
              <Zap className={cn("w-4 h-4 shrink-0", lightFace ? "text-amber-700" : "text-yellow-400")} />
              <span className="text-sm font-medium leading-tight line-clamp-2 max-w-[220px]">
                {benefitText || getCardBenefitLabel(card)}
                {card.id === 'axis-myzone' && !benefitText && <code className="inline-block ml-2 px-1.5 py-0.5 rounded border border-white/30 bg-white/10 text-[10px] font-semibold tracking-wide align-middle">AXIS120</code>}
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


    </motion.div>
  );
});
