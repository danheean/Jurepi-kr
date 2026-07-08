import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ToolCharacterProps {
  /** Tool slug → /characters/<slug>.webp (also 'home' for the welcome pose). */
  slug: string;
  /** Optional alt override; defaults to the localized generic character alt. */
  alt?: string;
  /** Extra classes for responsive sizing; replaces the default size classes. */
  className?: string;
  priority?: boolean;
}

/**
 * ToolCharacter renders a tool's themed Jurepi mascot illustration
 * (public/characters/<slug>.webp — a uniform 2:3 tile sliced from the sprite
 * sheet via scripts/slice-characters.mjs). Server-compatible; isomorphic
 * useTranslations localizes the alt. Explicit intrinsic 2:3 width/height keeps
 * layout CLS-safe; callers scale it responsively through className.
 */
export function ToolCharacter({
  slug,
  alt,
  className,
  priority = false,
}: ToolCharacterProps): React.ReactNode {
  const t = useTranslations('toolPage');
  return (
    <Image
      src={`/characters/${slug}.webp`}
      alt={alt ?? t('characterAlt')}
      width={300}
      height={450}
      priority={priority}
      className={
        className ??
        'h-auto w-[104px] rounded-xl sm:w-[132px]'
      }
    />
  );
}
