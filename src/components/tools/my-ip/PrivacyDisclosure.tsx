'use client';

import { useTranslations } from 'next-intl';
import type { IpResult } from '@/lib/my-ip/schema';

interface PrivacyDisclosureProps {
  data: IpResult | null;
}

export function PrivacyDisclosure({ data }: PrivacyDisclosureProps) {
  const t = useTranslations('tools.my-ip');

  if (!data) {
    return null;
  }

  // Use raw() to get ICU message with provider interpolation
  const disclosure = t('privacy.disclosure', { provider: data.provider });

  // Explicit width — scale tokens like max-w-xs collide with the custom
  // spacing scale and collapse to a sliver.
  return (
    <p className="text-xs text-text-muted leading-relaxed text-center max-w-[480px] mx-auto">
      {disclosure}
    </p>
  );
}
