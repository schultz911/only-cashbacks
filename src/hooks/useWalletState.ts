import { useState, useMemo, useEffect } from 'react';
import { getInitialState, safeSetItem } from '../lib/storage';
import { CARD_DATA } from '../data/cards';
import { getCycleForCard } from '../lib/recommendation';
import { CashbackLog } from '../types';

export function useWalletState(skipSyncRef: React.MutableRefObject<boolean>, setIsDirty: (dirty: boolean) => void) {
  const [exhaustedCards, setExhaustedCards] = useState<Record<string, any>>(() => getInitialState('oc_exhaustedCards', {}));
  const [cardBillDates, setCardBillDates] = useState<Record<string, number>>(() => getInitialState('oc_cardBillDates', {}));
  const [paidBills, setPaidBills] = useState<Record<string, string>>(() => getInitialState('oc_paidBills', {}));
  const [loungePassesUsed, setLoungePassesUsed] = useState<Record<string, number>>(() => getInitialState('oc_loungePassesUsed', {}));
  const [loungeMilestonesVerified, setLoungeMilestonesVerified] = useState<Record<string, boolean>>(() => getInitialState('oc_loungeMilestonesVerified', {}));
  const [offerUsage, setOfferUsage] = useState<Record<string, number>>(() => getInitialState('oc_offerUsage', {}));
  const [walletCards, setWalletCards] = useState<string[]>(() => getInitialState('oc_walletCards', []));
  const [cashbackLogs, setCashbackLogs] = useState<CashbackLog[]>(() => getInitialState('oc_cashbackLogs', []));
  const [kiwiNeonEarnRate, setKiwiNeonEarnRate] = useState(() => getInitialState('oc_kiwiNeonEarnRate', 2));

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
    safeSetItem('oc_exhaustedCards', exhaustedCards);
    safeSetItem('oc_cardBillDates', cardBillDates);
    safeSetItem('oc_paidBills', paidBills);
    safeSetItem('oc_loungePassesUsed', loungePassesUsed);
    safeSetItem('oc_loungeMilestonesVerified', loungeMilestonesVerified);
    safeSetItem('oc_offerUsage', offerUsage);
    safeSetItem('oc_kiwiNeonEarnRate', kiwiNeonEarnRate);
    safeSetItem('oc_walletCards', walletCards);
    safeSetItem('oc_cashbackLogs', cashbackLogs);

    if (!skipSyncRef.current) {
      setIsDirty(true);
    }
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
