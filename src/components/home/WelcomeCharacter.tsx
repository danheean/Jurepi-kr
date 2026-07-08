import { useTranslations } from 'next-intl';
import { ToolCharacter } from '@/components/tools/ToolCharacter';

interface WelcomeCharacterProps {
  className?: string;
}

/**
 * Home hero's welcome character — the arms-spread "welcome" pose from the
 * character sheet (public/characters/home.webp). Replaces the circular mascot
 * avatar on the home page only; HeroMascot stays circular for not-found /
 * empty states. Keeps the greeting caption and the optional blog link that the
 * old mascot had. Server-compatible (isomorphic useTranslations).
 */
export function WelcomeCharacter({
  className,
}: WelcomeCharacterProps): React.ReactNode {
  const t = useTranslations('home');
  // Optional external destination (owner's blog); plain image when unset.
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL?.trim();

  const portrait = (
    <ToolCharacter
      slug="home"
      alt={t('mascotAlt')}
      priority
      className="h-auto w-[168px] rounded-2xl shadow-card sm:w-[204px]"
    />
  );

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      {blogUrl ? (
        <a
          href={blogUrl}
          aria-label={t('mascotBlogLabel')}
          className="rounded-2xl transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          {portrait}
        </a>
      ) : (
        portrait
      )}
      <p className="text-center text-sm font-medium text-text-secondary">
        {t('mascotGreeting')}
      </p>
    </div>
  );
}
