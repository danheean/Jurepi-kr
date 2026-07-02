'use client';

import { useTranslations } from 'next-intl';
import { Cake } from 'lucide-react';

interface Props {
  onInputFocus?: () => void;
}

export function AgeCalculatorEmptyState({ onInputFocus }: Props) {
  const t = useTranslations('tools.age-calculator');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-mint-soft">
        <Cake className="w-8 h-8 text-accent-mint-ink" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text">
          {t('people.emptyState')}
        </h2>
        <p className="text-sm text-text-secondary max-w-xs mx-auto">
          위 입력창에 생년월일을 입력하면 당신의 나이를 계산해드립니다.
        </p>
      </div>
    </div>
  );
}
