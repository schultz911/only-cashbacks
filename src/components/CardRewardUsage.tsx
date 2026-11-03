import { Card } from '../types';
import { rewardCapKey, rewardCapUsed } from '../lib/rewardRules';

interface Props {
  card: Card;
  dates: Record<string, number>;
  usage: Record<string, number>;
  setUsage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function CardRewardUsage({ card, dates, usage, setUsage }: Props) {
  if (!card.rewardProgram) return null;
  return <div className="p-4 border border-white/10 rounded-2xl bg-black/20 space-y-3">
    <h3 className="font-bold text-white">Reward limits</h3>
    <p className="text-xs text-white/70">Logging savings updates usage. Enter your total actual savings used, including spending outside this app. Estimates depend on eligible items and merchant IDs.</p>
    {card.rewardProgram.caps.map(cap => {
      const key = rewardCapKey(card.id, cap, dates);
      return <label key={cap.id} className="flex justify-between items-center gap-3 text-xs text-white/90">
        <span>{cap.label}<span className="block text-white/60">₹{cap.limit.toLocaleString('en-IN')} / {cap.period === 'calendar' ? 'calendar month' : 'statement cycle'}</span></span>
        {key ? <input aria-label={`${cap.label} used`} type="number" min="0" step="0.01" value={rewardCapUsed(key, usage)}
          onChange={event => {
            const amount = Number(event.target.value);
            if (event.target.value === '' || !Number.isFinite(amount) || amount < 0) return;
            setUsage(previous => ({ ...previous, [`${key}:opening`]: Math.round(((previous[`${key}:opening`] || 0) + amount - rewardCapUsed(key, previous)) * 100) / 100 }));
          }} className="w-24 rounded-xl bg-black/20 border border-white/20 p-2 text-right text-white" />
          : <span className="text-white/60 text-right">Set statement day</span>}
      </label>;
    })}
    <p className="text-xs text-white/70">{card.rewardProgram.notes}</p>
    <details className="border-t border-white/10 pt-3 text-xs text-white/80">
      <summary className="cursor-pointer font-bold text-white">Excluded spending</summary>
      <p className="mt-2 leading-relaxed">{card.benefits.filter(benefit => benefit.type === 'exclusion').map(benefit => benefit.description).join(', ')}. Exclusions apply within partner apps too.</p>
    </details>
  </div>;
}
