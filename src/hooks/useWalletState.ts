import { useState, useMemo, useEffect, useCallback } from 'react';
import { getInitialState, safeSetItem } from '../lib/storage';
import { CARD_DATA } from '../data/cards';
import { getCycleForCard } from '../lib/recommendation';
import { CashbackLog } from '../types';

export function useWalletState(skipSyncRef: React.MutableRefObject<boolean>, setIsDirty: (dirty: boolean) => void) {
  // Record edits when setters are called, before any save can acknowledge them.
  // Cloud hydration suppresses tracking only around its synchronous setters.
  function useWalletValue<T>(initialValue: () => T) {
    const [value, setValue] = useState(initialValue);
    const setTrackedValue = useCallback<React.Dispatch<React.SetStateAction<T>>>((next) => {
      setValue(next);
      if (!skipSyncRef.current) setIsDirty(true);
    }, [skipSyncRef, setIsDirty]);
    return [value, setTrackedValue] as const;
  }

  const [exhaustedCards, setExhaustedCards] = useWalletValue<Record<string, any>>(() => getInitialState('oc_exhaustedCards', {}));
  const [cardBillDates, setCardBillDates] = useWalletValue<Record<string, number>>(() => getInitialState('oc_cardBillDates', {}));
  const [paidBills, setPaidBills] = useWalletValue<Record<string, string>>(() => getInitialState('oc_paidBills', {}));
  const [loungePassesUsed, setLoungePassesUsed] = useWalletValue<Record<string, number>>(() => getInitialState('oc_loungePassesUsed', {}));
  const [loungeMilestonesVerified, setLoungeMilestonesVerified] = useWalletValue<Record<string, boolean>>(() => getInitialState('oc_loungeMilestonesVerified', {}));
  const [offerUsage, setOfferUsage] = useWalletValue<Record<string, number>>(() => getInitialState('oc_offerUsage', {}));
  const [walletCards, setWalletCards] = useWalletValue<string[]>(() => getInitialState('oc_walletCards', []));
  const [cashbackLogs, setCashbackLogs] = useWalletValue<CashbackLog[]>(() => getInitialState('oc_cashbackLogs', []));
  const [kiwiNeonEarnRate, setKiwiNeonEarnRate] = useWalletValue(() => getInitialState('oc_kiwiNeonEarnRate', 2));

  const normalizedExhaustedCards = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const card of CARD_DATA) {
      const cycle = getCycleForCard(card.id, cardBillDates);
      const ex = exhaustedCards[card.id];
      if (ex === true) result[card.id] = true;
      else if (ex === cycle) result[card.id] = true;
    }
    return result;
  }, [exhaustedCards, cardBillDates]);

  const markBillPaid = (cardId: string) => {
    const cycle = getCycleForCard(cardId, cardBillDates);
    setPaidBills(prev => ({ ...prev, [cardId]: cycle }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      safeSetItem('oc_exhaustedCards', exhaustedCards);
      safeSetItem('oc_cardBillDates', cardBillDates);
      safeSetItem('oc_paidBills', paidBills);
      safeSetItem('oc_loungePassesUsed', loungePassesUsed);
      safeSetItem('oc_loungeMilestonesVerified', loungeMilestonesVerified);
      safeSetItem('oc_offerUsage', offerUsage);
      safeSetItem('oc_kiwiNeonEarnRate', kiwiNeonEarnRate);
      safeSetItem('oc_walletCards', walletCards);
      safeSetItem('oc_cashbackLogs', cashbackLogs);

    }, 500);

    return () => clearTimeout(timer);
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, kiwiNeonEarnRate, walletCards, cashbackLogs]);

  return {
    exhaustedCards, setExhaustedCards, normalizedExhaustedCards,
    cardBillDates, setCardBillDates,
    paidBills, setPaidBills, markBillPaid,
    loungePassesUsed, setLoungePassesUsed,
    loungeMilestonesVerified, setLoungeMilestonesVerified,
    offerUsage, setOfferUsage,
    walletCards, setWalletCards,
    cashbackLogs, setCashbackLogs,
    kiwiNeonEarnRate, setKiwiNeonEarnRate
  };
}
