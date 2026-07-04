import { useTranslations } from 'next-intl';
import { CURATORS, avatarSrc } from '@/lib/restaurant-map/curators';

/**
 * Identity strip showing the 3 curators who authored this place list.
 * Non-interactive — purely informational.
 */
export function CuratorLegend() {
  const t = useTranslations('tools.restaurant-map');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">
        {t('curatorLegend.title')}
      </h3>
      <div className="flex flex-wrap gap-4">
        {CURATORS.map((curator) => (
          <div key={curator.id} className="flex items-center gap-2">
            <img
              src={avatarSrc(curator.id)}
              alt={t(`curators.${curator.id}`)}
              className="h-10 w-10 rounded-full object-cover"
              width={40}
              height={40}
              loading="lazy"
            />
            <span className="text-sm text-text-secondary">
              {t(`curators.${curator.id}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
