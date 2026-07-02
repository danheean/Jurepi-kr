import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

interface LinkRowProps {
  label: string;
  url: string;
  description?: string;
  locale: 'ko' | 'en';
}

export function LinkRow({ label, url, description, locale }: LinkRowProps) {
  const t = useTranslations('tools.bookmarks.link');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-hairline hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
      aria-label={`${label} ${t('openInNewTab')}`}
    >
      <div className="flex items-start gap-3 min-h-11">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-text break-words">{label}</div>
          {description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
      </div>
    </a>
  );
}
