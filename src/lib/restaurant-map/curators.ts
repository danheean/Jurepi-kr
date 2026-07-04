import { CURATOR_ENUM, type CuratorId } from './schema';

/**
 * Static curator registry. Each themed place list is authored by exactly one
 * curator (list-level identity). Display names are NOT hard-coded here — they
 * come from i18n (`tools.restaurant-map.curators.<id>`), mirroring category
 * labels. Only stable, locale-independent metadata (id + avatar asset) lives here.
 */
export interface Curator {
  id: CuratorId;
  /** Avatar filename under public/images/restaurant-map/curators/ */
  avatar: string;
}

export const CURATORS: readonly Curator[] = CURATOR_ENUM.map((id) => ({
  id,
  avatar: `${id}.png`,
}));

/** Display/filter order including the "all" pseudo-option. */
export const CURATOR_ORDER = ['all', ...CURATOR_ENUM] as const;

/** Public path to a curator's avatar image. */
export function avatarSrc(id: CuratorId): string {
  return `/images/restaurant-map/curators/${id}.png`;
}
