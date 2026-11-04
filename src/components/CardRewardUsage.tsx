import { Card } from '../types';
import { getCardRewardLimits } from '../data/cardDetails';

interface Props {
  card: Card;
  dates: Record<string, number>;
  usage: Record<string, number>;
  setUsage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function CardRewardUsage({ card }: Props) {
  const limits = getCardRewardLimits(card);
  if (limits.length === 0) return null;
  return <section className="p-4 border border-white/10 rounded-2xl bg-black/20 space-y-3" aria-label="Reward limits">
    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Reward limits</h3>
    <div className="space-y-2">
      {limits.map((cap, index) => <div key={`${cap.label}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-white/5 border border-white/5 p-3">
        <span className="text-xs font-medium text-white/80 leading-relaxed max-w-[55%]">{cap.label}</span>
        <span className="text-right shrink-0"><span className="block text-lg font-bold text-white tabular-nums">{cap.value}</span><span className="text-[10px] font-medium text-white/50">{cap.period}</span></span>
      </div>)}
    </div>
  </section>;
}
