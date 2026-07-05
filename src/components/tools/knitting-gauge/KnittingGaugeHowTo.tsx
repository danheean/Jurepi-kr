import { useTranslations } from 'next-intl'

export function KnittingGaugeHowTo() {
  const t = useTranslations('tools.knitting-gauge')

  const items = t.raw('howTo.items') as string[]

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-text">{t('howTo.title')}</h2>
      <div className="space-y-4 text-text-secondary">
        {items.map((item, idx) => (
          <p key={idx}>{item}</p>
        ))}
      </div>
    </section>
  )
}
