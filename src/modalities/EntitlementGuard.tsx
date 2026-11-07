// A modality route whose manifest asks for an entitlement renders only for an account that holds it (§4.9).
import type { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useAccount } from '../account';
import type { EntitlementKey } from '../types';

export function guarded(entitlement: EntitlementKey, Screen: ComponentType): ComponentType {
  return function EntitlementGuard() {
    const { status, account } = useAccount();
    if (status === 'loading') return null;
    if (!account?.entitlements.includes(entitlement)) return <Navigate to="/pick" replace />;
    return <Screen />;
  };
}
