import { useEffect, useState } from 'react';
import { indiaDate } from '../lib/billingDates';

export function useBillingDay() {
  const [day, setDay] = useState(() => indiaDate().getTime());
  useEffect(() => {
    const refresh = () => setDay(indiaDate().getTime());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return day;
}
