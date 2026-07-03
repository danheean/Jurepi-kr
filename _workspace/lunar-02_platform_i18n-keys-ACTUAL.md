# ACTUAL i18n keys authored by platform (UI MUST consume EXACTLY these — no drift)

Namespace `tools.lunar-converter` in `src/i18n/messages/{ko,en}.json`:

- `title`, `description`  (top-level; footer/home/search)
- `meta.title`, `meta.description`  (generateMetadata + StructuredData)
- `intro.eyebrow`, `intro.title`, `intro.lead`
- `solar.label`, `solar.year`, `solar.month`, `solar.day`
- `lunar.label`, `lunar.year`, `lunar.month`, `lunar.day`, `lunar.leapMonthLabel`
- `today`
- `result.sexagenary`, `result.zodiac`, `result.leap`
- `result.copyButtons.solar`, `result.copyButtons.lunar`, `result.copyButtons.both`, `result.copyButtons.copied`
- `zodiac.{rat,ox,tiger,rabbit,dragon,snake,horse,goat,monkey,rooster,dog,pig}`
- `recents.title`, `recents.empty`, `recents.clear`
- `errors.out_of_range`, `errors.no_leap_month`, `errors.invalid_date`
- `copyToast`
- `howTo.heading`, `howTo.whatIsTitle`, `howTo.whatIsBody`, `howTo.sexagenaryTitle`, `howTo.sexagenaryBody`, `howTo.howToTitle`, `howTo.howToBody`
- `faq.heading`, `faq.items` = **ARRAY** of `{q, a}` (6 items) — consume via `t.raw('faq.items')` in components/StructuredData.

Registry: icon `CalendarSync`, accent `grape`, order 4, isNew.

NOTE: platform reported 2 pre-existing tsc errors in `age-calculator.spec.ts` (unrelated to this branch — inherited from main). Leader to confirm they are pre-existing on `main`, not regressions.
