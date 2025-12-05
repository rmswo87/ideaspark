// 프리미엄 사용자 확인 Hook
import { useState, useEffect } from 'react';
import { isPremiumUser } from '@/services/premiumService';
import { useAuth } from './useAuth';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPremium() {
      if (!user) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const premium = await isPremiumUser(user.id);
        setIsPremium(premium);
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    }

    checkPremium();
  }, [user]);

  return { isPremium, loading };
}

