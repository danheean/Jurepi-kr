#!/usr/bin/env node

/**
 * Build-time generator: scan content/bookmarks/topics/, parse markdown,
 * validate, merge ko+en pairs, and emit bookmarks.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

// Re-declare schemas (keep in sync with src/lib/bookmarks/schema.ts)
const BookmarkFileFrontSchema = z.object({
  title: z.string().min(1, 'title required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1, 'description required').max(200, 'description max 200 chars'),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1, 'section heading required'),
        links: z
          .array(
            z.object({
              label: z.string().min(1, 'link label required'),
              url: z.string().url('link url must be valid http(s) URL'),
              description: z.string().max(100, 'link description max 100 chars').optional(),
            })
          )
          .min(1, 'section must have ≥1 link'),
      })
    )
    .min(1, 'topic must have ≥1 section'),
});

const MergedTopicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  ko: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
          })
        ),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
          })
        ),
      })
    ),
  }),
});

const LINKS_MIN_PER_TOPIC = 3;

/**
 * Slugify: convert string to lowercase, remove diacritics, replace spaces with hyphens.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 */
function resolveSlug(front, filename) {
  if (front.slug) {
    return front.slug;
  }
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}

/**
 * Merge ko + en pair following canonical rule.
 * Slug is canonical from KO; title/description/sections are per-locale.
 */
function mergePair(koFront, enFront, koFilename = 'unknown.md') {
  const slug = resolveSlug(koFront, koFilename);

  return {
    slug,
    ko: {
      title: koFront.title,
      description: koFront.description,
      sections: koFront.sections,
    },
    en: {
      title: enFront.title,
      description: enFront.description,
      sections: enFront.sections,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 */
function validatePair(koFilename, koFront, enFront) {
  const errors = [];

  const koResult = BookmarkFileFrontSchema.safeParse(koFront);
  const enResult = BookmarkFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const ko = koResult.data;
  const en = enResult.data;

  // Validate ko/en link counts (≥3 links total per topic per locale)
  const koLinkCount = ko.sections.reduce((acc, sec) => acc + sec.links.length, 0);
  const enLinkCount = en.sections.reduce((acc, sec) => acc + sec.links.length, 0);

  if (koLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(`${koFilename}: KO has ${koLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`);
  }
  if (enLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(`${koFilename}: EN has ${enLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`);
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const topic = mergePair(ko, en, koFilename);

  return { topic, errors: [] };
}

/**
 * Main generator: scan, parse, validate, merge, emit.
 */
async function main() {
  const contentDir = new URL('../content/bookmarks/topics/', import.meta.url).pathname;
  const outputDir = new URL('../src/components/tools/bookmarks/data/', import.meta.url).pathname;
  const outputFile = join(outputDir, 'bookmarks.generated.json');

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  console.log(`Scanning ${contentDir}...`);

  let files;
  try {
    files = readdirSync(contentDir, { encoding: 'utf-8' });
  } catch (err) {
    console.error(`Failed to read ${contentDir}:`, err.message);
    console.error('Creating empty content directory...');
    mkdirSync(contentDir, { recursive: true });
    files = [];
  }

  // Filter: exclude files starting with '_' (templates)
  files = files.filter((f) => !f.startsWith('_') && f.endsWith('.md'));

  if (files.length === 0) {
    console.warn('No markdown files found. Emitting empty catalog.');
    writeFileSync(outputFile, JSON.stringify([], null, 2), 'utf-8');
    console.log(`Wrote ${outputFile}`);
    process.exit(0);
  }

  // Group by base filename (ko/en pairs)
  const pairs = new Map();
  files.forEach((file) => {
    const base = file.replace(/(_en)?\.md$/, '');
    const isEn = file.endsWith('_en.md');
    if (!pairs.has(base)) {
      pairs.set(base, {});
    }
    pairs.get(base)[isEn ? 'en' : 'ko'] = file;
  });

  const topics = [];
  const allErrors = [];

  // Validate each pair
  for (const [base, pair] of pairs) {
    if (!pair.ko) {
      allErrors.push(`${base}: missing Korean file (.md)`);
      continue;
    }
    if (!pair.en) {
      allErrors.push(`${base}: missing English file (_en.md)`);
      continue;
    }

    try {
      const koPath = join(contentDir, pair.ko);
      const enPath = join(contentDir, pair.en);

      const koContent = readFileSync(koPath, 'utf-8');
      const enContent = readFileSync(enPath, 'utf-8');

      const koParsed = matter(koContent);
      const enParsed = matter(enContent);

      const { topic, errors } = validatePair(base, koParsed.data, enParsed.data);

      if (errors.length > 0) {
        allErrors.push(...errors);
      }

      if (topic) {
        topics.push(topic);
      }
    } catch (err) {
      allErrors.push(`${base}: read/parse error — ${err.message}`);
    }
  }

  // Check for duplicate slugs
  const slugSet = new Set();
  topics.forEach((topic) => {
    if (slugSet.has(topic.slug)) {
      allErrors.push(`Duplicate slug: "${topic.slug}"`);
    }
    slugSet.add(topic.slug);
  });

  // Validate final merged topics
  topics.forEach((topic) => {
    const result = MergedTopicSchema.safeParse(topic);
    if (!result.success) {
      allErrors.push(`${topic.slug}: merged schema error — ${result.error.message}`);
    }
  });

  // Report errors
  if (allErrors.length > 0) {
    console.error('\nValidation errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    console.error(`\n${allErrors.length} error(s) found. Build failed.`);
    process.exit(1);
  }

  // Sort topics by slug (deterministic)
  topics.sort((a, b) => a.slug.localeCompare(b.slug));

  // Write output
  writeFileSync(outputFile, JSON.stringify(topics, null, 2), 'utf-8');
  console.log(`\nSuccess! Emitted ${topics.length} topic(s) to ${outputFile}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
