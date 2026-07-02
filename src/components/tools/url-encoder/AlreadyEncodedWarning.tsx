'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  visible: boolean;
}

/**
 * Non-blocking advisory: the result is computed live regardless, this just
 * warns that the input already looks percent-encoded (double-encoding risk).
 */
export function AlreadyEncodedWarning({ visible }: Props) {
  const t = useTranslations('tools.url-encoder');

  if (!visible) return null;

  return (
    <div
      className="flex gap-3 bg-warning/10 border border-warning/30 rounded-lg p-4"
      role="status"
    >
      <AlertCircle className="w-5 h-5 text-warning-ink flex-shrink-0 mt-0.5" strokeWidth={1.75} />
      <p className="flex-1 text-sm text-text">{t('alreadyEncoded.hint')}</p>
    </div>
  );
}
