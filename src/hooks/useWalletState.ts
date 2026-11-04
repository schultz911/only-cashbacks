import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { getOwnedState, setOwnedState } from '../lib/storage';
import { CARD_DATA } from '../data/cards';
import { getCycleForCard } from '../lib/recommendation';
import { CashbackLog } from '../types';
import { statementReminder } from '../lib/billingDates';
import { useBillingDay } from './useBillingDay';

export function useWalletState(skipSyncRef: React.MutableRefObject<boolean>, setIsDirty: (dirty: boolean) => void, owner?: string | null, pendingEditsRef?: React.MutableRefObject<Record<string, unknown>>) {
  const billingDay = useBillingDay();
  // Record edits when setters are called, before any save can acknowledge them.
  // Cloud hydration suppresses tracking only around its synchronous setters.
  function useWalletValue<T>(initialValue: () => T, field: string) {
    const [value, setValue] = useState(initialValue);
    const valueRef = useRef(value);
    valueRef.current = value;
    const setTrackedValue = useCallback<React.Dispatch<React.SetStateAction<T>>>((next) => {
      const value = typeof next === 'function' ? (next as (previous: T) => T)(valueRef.current) : next;
      valueRef.current = value;
      if (!skipSyncRef.current && pendingEditsRef) pendingEditsRef.current[field] = value;
      setValue(value);
      if (!skipSyncRef.current) setIsDirty(true);
    }, [skipSyncRef, setIsDirty]);
    return [value, setTrackedValue] as const;
  }

  const [exhaustedCards, setExhaustedCards] = useWalletValue<Record<string, any>>(() => getOwnedState(owner, 'oc_exhaustedCards', {}), 'exhaustedCards');
  const [cardBillDates, setCardBillDates] = useWalletValue<Record<string, number>>(() => getOwnedState(owner, 'oc_cardBillDates', {}), 'cardBillDates');
  const [paidBills, setPaidBills] = useWalletValue<Record<string, string>>(() => getOwnedState(owner, 'oc_paidBills', {}), 'paidBills');
  const [loungePassesUsed, setLoungePassesUsed] = useWalletValue<Record<string, number>>(() => getOwnedState(owner, 'oc_loungePassesUsed', {}), 'loungePassesUsed');
  const [loungeMilestonesVerified, setLoungeMilestonesVerified] = useWalletValue<Record<string, boolean>>(() => getOwnedState(owner, 'oc_loungeMilestonesVerified', {}), 'loungeMilestonesVerified');
  const [offerUsage, setOfferUsage] = useWalletValue<Record<string, number>>(() => getOwnedState(owner, 'oc_offerUsage', {}), 'offerUsage');
  const [walletCards, setWalletCards] = useWalletValue<string[]>(() => getOwnedState(owner, 'oc_walletCards', []), 'walletCards');
  const [cashbackLogs, setCashbackLogs] = useWalletValue<CashbackLog[]>(() => getOwnedState(owner, 'oc_cashbackLogs', []), 'cashbackLogs');
  const [kiwiNeonEarnRate, setKiwiNeonEarnRate] = useWalletValue(() => getOwnedState(owner, 'oc_kiwiNeonEarnRate', 2), 'kiwiNeonEarnRate');

  const normalizedExhaustedCards = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const card of CARD_DATA) {
      const cycle = getCycleForCard(card.id, cardBillDates);
      const ex = exhaustedCards[card.id];
      if (ex === true) result[card.id] = true;
      else if (ex === cycle) result[card.id] = true;
    }
    return result;
  }, [exhaustedCards, cardBillDates, billingDay]);

  const markBillPaid = (cardId: string) => {
    const reminder = statementReminder(cardId, cardBillDates, paidBills);
    if (reminder) setPaidBills(prev => ({ ...prev, [cardId]: reminder.cycle }));
  };

  useEffect(() => {
    const persist = () => {
      setOwnedState(owner, 'oc_exhaustedCards', exhaustedCards);
      setOwnedState(owner, 'oc_cardBillDates', cardBillDates);
      setOwnedState(owner, 'oc_paidBills', paidBills);
      setOwnedState(owner, 'oc_loungePassesUsed', loungePassesUsed);
      setOwnedState(owner, 'oc_loungeMilestonesVerified', loungeMilestonesVerified);
      setOwnedState(owner, 'oc_offerUsage', offerUsage);
      setOwnedState(owner, 'oc_kiwiNeonEarnRate', kiwiNeonEarnRate);
      setOwnedState(owner, 'oc_walletCards', walletCards);
      setOwnedState(owner, 'oc_cashbackLogs', cashbackLogs);

    };
    const timer = setTimeout(persist, 500);
    const persistWhenHidden = () => { if (document.visibilityState === 'hidden') persist(); };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persistWhenHidden);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persistWhenHidden);
    };
  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, kiwiNeonEarnRate, walletCards, cashbackLogs, owner]);

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
