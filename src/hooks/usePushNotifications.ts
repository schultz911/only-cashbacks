import { useEffect } from 'react';
import { CARD_DATA } from '../data/cards';

export function usePushNotifications(
  isDataLoaded: boolean,
  walletCards: string[],
  cardBillDates: Record<string, number>,
  paidBills: Record<string, string>,
  getCycleForCard: (id: string, dates: Record<string, number>) => string
) {
  useEffect(() => {
    if (!('Notification' in window)) return;
    
    // Request permission if not already granted/denied
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded || !walletCards || walletCards.length === 0) return;
    if (Notification.permission !== 'granted') return;

    // Use a small timeout to avoid showing immediately on load
    const timer = setTimeout(() => {
      let unpaidCards = [];
      const today = new Date();
      
      for (const cardId of walletCards) {
        const card = CARD_DATA.find(c => c.id === cardId);
        if (!card || card.isDummy || card.type !== 'Credit') continue;

        const billDay = cardBillDates[cardId] || 1;
        const cycle = getCycleForCard(cardId, cardBillDates);
        const isPaid = paidBills[cardId] === cycle;

        if (!isPaid) {
          // If today is past the bill day by 2+ days, notify
          if (today.getDate() >= billDay + 2) {
             unpaidCards.push(card.name);
          }
        }
      }

      if (unpaidCards.length > 0) {
         try {
            const notifKey = `oc_notif_bill_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
            if (!localStorage.getItem(notifKey)) {
               new Notification('Unpaid Credit Card Bills', {
                  body: `You have unpaid bills past their billing dates for: ${unpaidCards.join(', ')}`,
                  icon: '/pwa-192x192.png',
               });
               localStorage.setItem(notifKey, 'true');
            }
         } catch(e) {
            console.error("Failed to trigger local notification", e);
         }
      }

      // Check for offers that have been reset today (e.g. 1st of month, or bill date)
      const resetCards = [];
      for (const cardId of walletCards) {
        const card = CARD_DATA.find(c => c.id === cardId);
        if (!card || card.isDummy) continue;
        const resetDay = card.type === 'Credit' ? (cardBillDates[cardId] || 1) : 1;
        if (today.getDate() === resetDay) {
           resetCards.push(card.name);
        }
      }

      if (resetCards.length > 0) {
         try {
            const notifKey = `oc_notif_reset_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
            if (!localStorage.getItem(notifKey)) {
               new Notification('Offers Reset Today', {
                  body: `Monthly limits and offers have been reset for: ${resetCards.join(', ')}`,
                  icon: '/pwa-192x192.png',
               });
               localStorage.setItem(notifKey, 'true');
            }
         } catch(e) {
            console.error("Failed to trigger local notification", e);
         }
      }

    }, 3000);

    return () => clearTimeout(timer);
  }, [isDataLoaded, walletCards, paidBills, cardBillDates, getCycleForCard]);
}
