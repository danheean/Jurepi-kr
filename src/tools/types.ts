/**
 * Tool registry types — pure domain layer, no React/Next imports
 */

export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev' | 'mindset' | 'news';

export type AccentColor = 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose';

export interface ToolMeta {
  /** Unique stable identifier */
  id: string;
  /** URL segment */
  slug: string;
  /** Category for filtering and accent assignment */
  category: ToolCategory;
  /** lucide-react icon name */
  icon: string;
  /** Accent color identity */
  accent: AccentColor;
  /** Live tools are statically generated and clickable; coming_soon are non-clickable placeholders */
  status: 'live' | 'coming_soon';
  /** Release date (ISO YYYY-MM-DD) — NEW badge derives from this (last 7 days) */
  addedAt: string;
  /** Marks as popular (may pin to top) — reserve for analytics-backed picks */
  isPopular?: boolean;
  /** Sort order weight (lower first) — demand-based curation, assign in steps of 10 */
  order: number;
  /** Search keywords (localized per messages) */
  keywords: string[];
}
