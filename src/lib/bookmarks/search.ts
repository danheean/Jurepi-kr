import type { MergedTopic } from './schema';

/**
 * Normalize search text: lowercase, NFC, remove spaces/hyphens.
 * Makes search case/diacritic insensitive.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_]/g, ''); // Remove spaces, hyphens, underscores
}

/**
 * Filter topics by query, across both locales.
 * Match if any of: title (ko+en), description (ko+en), section headings (ko+en), link labels (ko+en).
 * PRIMARY: topic title/description; SECONDARY: section headings and link labels.
 * Returns filtered list in stable order.
 */
export function filterTopics(
  topics: MergedTopic[],
  query: string,
  locale?: 'ko' | 'en'
): MergedTopic[] {
  if (!query.trim()) {
    return topics;
  }

  const normalized = normalizeSearchText(query);

  return topics.filter((topic) => {
    const koSearchText = normalizeSearchText(
      [
        topic.ko.title,
        topic.ko.description,
        ...topic.ko.sections.map(
          (sec) =>
            sec.heading + ' ' + sec.links.map((link) => link.label).join(' ')
        ),
      ].join(' ')
    );

    const enSearchText = normalizeSearchText(
      [
        topic.en.title,
        topic.en.description,
        ...topic.en.sections.map(
          (sec) =>
            sec.heading + ' ' + sec.links.map((link) => link.label).join(' ')
        ),
      ].join(' ')
    );

    // If locale specified, search only that locale; else search both
    if (locale === 'ko') {
      return koSearchText.includes(normalized);
    }
    if (locale === 'en') {
      return enSearchText.includes(normalized);
    }
    return koSearchText.includes(normalized) || enSearchText.includes(normalized);
  });
}
