import { useTranslations } from 'next-intl';

/**
 * SSR-safe HowTo section. Server-renders into the static HTML for SEO/AI crawlers.
 */
export function MyIpHowTo() {
  const t = useTranslations('tools.my-ip');

  const sections = [
    { key: 'whatIsIp', title: t('howTo.whatIsIp.title'), body: t('howTo.whatIsIp.body') },
    { key: 'ipv4VsIpv6', title: t('howTo.ipv4VsIpv6.title'), body: t('howTo.ipv4VsIpv6.body') },
    {
      key: 'publicVsPrivate',
      title: t('howTo.publicVsPrivate.title'),
      body: t('howTo.publicVsPrivate.body'),
    },
    {
      key: 'dynamicVsStatic',
      title: t('howTo.dynamicVsStatic.title'),
      body: t('howTo.dynamicVsStatic.body'),
    },
  ];

  return (
    <section
      aria-labelledby="my-ip-howto-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2 id="my-ip-howto-heading" className="font-display text-3xl font-bold text-text">
        {t('howTo.title')}
      </h2>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key} className="space-y-2">
            <h3 className="font-semibold text-lg text-text">{section.title}</h3>
            <p className="text-text-secondary leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
