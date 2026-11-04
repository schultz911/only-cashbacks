import { BillDateSelector } from './BillDateSelector';
import { validBillDay } from '../lib/billingDates';

interface Props {
  cardId: string;
  dates: Record<string, number>;
  setDates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function CardBillingSettings({ cardId, dates, setDates }: Props) {
  return <div className="pt-1">
    <div className="flex justify-between items-center gap-3">
      <div><span className="text-sm font-semibold text-white">Statement day</span><span className="block text-[11px] text-white/50 mt-1">Monthly reminder</span></div>
      <div role="group" aria-label="Statement day"><BillDateSelector date={validBillDay(dates[`${cardId}:statement`])} onChange={day => setDates(previous => ({ ...previous, [`${cardId}:statement`]: day }))} /></div>
    </div>
  </div>;
}
