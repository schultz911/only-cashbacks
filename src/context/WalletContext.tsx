import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Card } from '../types';
import type { User } from 'firebase/auth';

interface WalletState {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthLoading: boolean;
  setIsAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  exhaustedCards: Record<string, boolean>;
  setExhaustedCards: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  cardBillDates: Record<string, number>;
  setCardBillDates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  loungeTab: 'Domestic' | 'International';
  setLoungeTab: React.Dispatch<React.SetStateAction<'Domestic' | 'International'>>;
  loungePassesUsed: Record<string, number>;
  setLoungePassesUsed: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  loungeMilestonesVerified: Record<string, boolean>;
  setLoungeMilestonesVerified: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  offerUsage: Record<string, number>;
  setOfferUsage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  kiwiNeonEarnRate: number;
  setKiwiNeonEarnRate: React.Dispatch<React.SetStateAction<number>>;
  
  openRouterApiKey: string;
  setOpenRouterApiKey: React.Dispatch<React.SetStateAction<string>>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultValue;
  };

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [exhaustedCards, setExhaustedCards] = useState<Record<string, boolean>>(() => getInitialState('oc_exhaustedCards', {}));
  const [cardBillDates, setCardBillDates] = useState<Record<string, number>>(() => getInitialState('oc_cardBillDates', {}));
  const [loungeTab, setLoungeTab] = useState<'Domestic' | 'International'>('Domestic');
  const [loungePassesUsed, setLoungePassesUsed] = useState<Record<string, number>>(() => getInitialState('oc_loungePassesUsed', {}));
  const [loungeMilestonesVerified, setLoungeMilestonesVerified] = useState<Record<string, boolean>>(() => getInitialState('oc_loungeMilestonesVerified', {}));
  const [offerUsage, setOfferUsage] = useState<Record<string, number>>(() => getInitialState('oc_offerUsage', {}));
  const [kiwiNeonEarnRate, setKiwiNeonEarnRate] = useState(() => getInitialState('oc_kiwiNeonEarnRate', 2));
  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => getInitialState('oc_openRouterApiKey', ''));

  return (
    <WalletContext.Provider value={{
      user, setUser,
      isAuthLoading, setIsAuthLoading,
      exhaustedCards, setExhaustedCards,
      cardBillDates, setCardBillDates,
      loungeTab, setLoungeTab,
      loungePassesUsed, setLoungePassesUsed,
      loungeMilestonesVerified, setLoungeMilestonesVerified,
      offerUsage, setOfferUsage,
      kiwiNeonEarnRate, setKiwiNeonEarnRate,
      openRouterApiKey, setOpenRouterApiKey
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
