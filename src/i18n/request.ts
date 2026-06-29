import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await Promise.resolve(requestLocale) ?? 'ko';
  const resolvedLocale = ['ko', 'en'].includes(locale) ? locale : 'ko';

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
