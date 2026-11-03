import { BillDateSelector } from './BillDateSelector';
import { reminderLeadDays, validBillDay } from '../lib/billingDates';

interface Props {
  cardId: string;
  dates: Record<string, number>;
  setDates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function CardBillingSettings({ cardId, dates, setDates }: Props) {
  const setDay = (key: string, day: number) => setDates(previous => ({ ...previous, [key]: day }));
  return <div className="mt-2 border-t border-white/20 pt-4 space-y-3">
    <div className="flex justify-between items-center gap-3">
      <span className="text-sm font-semibold text-white">Payment due day</span>
      <div role="group" aria-label="Payment due day"><BillDateSelector date={validBillDay(dates[cardId])} onChange={day => setDay(cardId, day)} /></div>
    </div>
    <div className="flex justify-between items-center gap-3">
      <span className="text-sm font-semibold text-white">Statement day</span>
      <div role="group" aria-label="Statement day"><BillDateSelector date={validBillDay(dates[`${cardId}:statement`])} onChange={day => setDay(`${cardId}:statement`, day)} /></div>
    </div>
    <label className="flex justify-between items-center gap-3 text-sm font-semibold text-white">
      Remind before due date (days)
      <input type="number" min="0" max="31" value={reminderLeadDays(cardId, dates)}
        onChange={event => { const value = Number(event.target.value); if (event.target.value !== '' && Number.isInteger(value) && value >= 0 && value <= 31) setDay(`${cardId}:reminderDays`, value); }}
        className="w-16 rounded-xl bg-black/20 border border-white/20 p-2 text-center text-white" />
    </label>
    <p className="text-xs text-white/70">Use the dates on your statement. Payment due day controls reminders; statement day controls statement-cycle rewards. In shorter months, the last day is used. Dates use India Standard Time.</p>
    <p className="text-xs text-white/70">Notifications require permission and an open app. Your statement remains the source of truth for amounts and deadlines.</p>
  </div>;
}
