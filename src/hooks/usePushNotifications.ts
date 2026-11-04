import { useEffect } from 'react';
import { CARD_DICT } from '../data/cards';
import { dateInMonth, formatBillDate, indiaDate, statementReminder, statementDay, validBillDay } from '../lib/billingDates';

export function usePushNotifications(
  isDataLoaded: boolean,
  walletCards: string[],
  cardBillDates: Record<string, number>,
  paidBills: Record<string, string>,
  _getCycleForCard: (id: string, dates: Record<string, number>) => string
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission === 'default') window.Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!isDataLoaded || !walletCards) return;
    // [] is the app's all-selected sentinel. Notify only cards with an actual
    // account date when selection is implicit, matching the reminder panel.
    const effectiveCards = walletCards.length ? walletCards : Object.keys(CARD_DICT).filter(id => validBillDay(cardBillDates[`${id}:statement`]));

    const notify = () => {
      if (window.Notification.permission !== 'granted') return;
      const today = indiaDate();
      const dateKey = today.toISOString().slice(0, 10);
      for (const cardId of effectiveCards) {
        const card = CARD_DICT[cardId];
        if (!card || card.isDummy) continue;
        const reminder = card.type === 'Credit' ? statementReminder(cardId, cardBillDates, paidBills) : null;
        if (reminder?.ready) {
          const key = `oc_notif_bill_${cardId}_${reminder.cycle}_${reminder.dueDate.getUTCDate()}_${reminder.leadDays}_${dateKey}`;
          try {
            if (!localStorage.getItem(key)) {
              new window.Notification('Credit Card Statement Reminder', {
                body: `${card.bank} ${card.name}: statement date ${formatBillDate(reminder.dueDate)} (IST).`,
                icon: '/pwa-192x192.png',
              });
              localStorage.setItem(key, 'true');
            }
          } catch (error) { console.error('Failed to trigger local notification', error); }
        }

        const resetDay = card.type !== 'Credit' || card.offerReset === 'calendar' || card.id === 'axis-myzone'
          ? 1 : statementDay(cardId, cardBillDates);
        if (!resetDay || today.getTime() !== dateInMonth(today.getUTCFullYear(), today.getUTCMonth(), resetDay).getTime()) continue;
        const key = `oc_notif_reset_${cardId}_${dateKey}`;
        try {
          if (!localStorage.getItem(key)) {
            new window.Notification('Offers Reset Today', {
              body: `Monthly offer limits have reset for ${card.bank} ${card.name}.`, icon: '/pwa-192x192.png',
            });
            localStorage.setItem(key, 'true');
          }
        } catch (error) { console.error('Failed to trigger local notification', error); }
      }
    };
    const timer = window.setTimeout(notify, 3000);
    const interval = window.setInterval(notify, 60000);
    window.addEventListener('focus', notify);
    document.addEventListener('visibilitychange', notify);
    return () => {
      clearTimeout(timer); clearInterval(interval);
      window.removeEventListener('focus', notify);
      document.removeEventListener('visibilitychange', notify);
    };
  }, [isDataLoaded, walletCards, paidBills, cardBillDates]);
}
