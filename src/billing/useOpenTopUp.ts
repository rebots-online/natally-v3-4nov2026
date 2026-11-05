// §5.7: the way into Top Up from any button. Android's paywall is `picking` and `checkout` together (§11.5).
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../ui';
import { getRail } from './rails';
import { strings } from './strings';
import { usePurchaseFlow } from './usePurchaseFlow';

export function useOpenTopUp(): () => void {
  const navigate = useNavigate();
  const { phase, start } = usePurchaseFlow({
    onDone: () => navigate('/atelier'),
    onNotBought: () => undefined,
  });

  useEffect(() => {
    if (phase === 'confirming') showToast(strings['billing.confirming']);
    if (phase === 'slow') showToast(strings['billing.slow']);
  }, [phase]);

  return useCallback(() => {
    if (getRail().capability === 'native_paywall') void start(null, 'credits');
    else navigate('/top-up');
  }, [navigate, start]);
}
