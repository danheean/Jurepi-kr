'use client';

import { useIpFetch } from './useIpFetch';
import { IpDisplay } from './IpDisplay';
import { IpLoader } from './IpLoader';
import { IpError } from './IpError';
import { OfflineNotice } from './OfflineNotice';
import { PrivacyDisclosure } from './PrivacyDisclosure';

/**
 * MyIp Orchestrator (Client Component)
 * Owns fetch state, conditionally renders UI based on state.
 */
export function MyIp() {
  const { data, error, loading, isOnline, refresh } = useIpFetch();

  if (!isOnline && !data) {
    return <OfflineNotice />;
  }

  if (loading) {
    return <IpLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6">
        <IpError error={error} onRetry={refresh} isLoading={loading} />
        {data && (
          <>
            <IpDisplay data={data} onRefresh={refresh} isLoading={loading} />
            <PrivacyDisclosure data={data} />
          </>
        )}
      </div>
    );
  }

  if (data) {
    return (
      <div className="flex flex-col items-center gap-6">
        <IpDisplay data={data} onRefresh={refresh} isLoading={loading} />
        <PrivacyDisclosure data={data} />
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
}
