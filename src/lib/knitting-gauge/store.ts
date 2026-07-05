import { Store, Gauge, STORE_VERSION, StoreSchema, parseStore, parseGauge, ProjectSchema } from './schema'

const RECENTS_MAX = 10
const PROJECTS_MAX = 50

/**
 * Create an initial empty store
 */
export function createEmptyStore(): Store {
  return {
    version: STORE_VERSION,
    projects: [],
    recents: [],
    meta: {
      createdAt: Date.now(),
    },
  }
}

/**
 * Save a project to the store (overwrites if name exists)
 * Returns a new Store (immutable)
 */
export function saveProject(store: Store, name: string, gauge: Gauge): Store {
  // Remove existing project with same name if any
  const filteredProjects = store.projects.filter((p) => p.name !== name)

  // Don't exceed max projects
  if (filteredProjects.length >= PROJECTS_MAX) {
    // Remove the oldest project (first in array)
    filteredProjects.shift()
  }

  return {
    ...store,
    projects: [...filteredProjects, { name, gauge }],
  }
}

/**
 * Remove a project from the store
 * Returns a new Store (immutable)
 */
export function removeProject(store: Store, name: string): Store {
  return {
    ...store,
    projects: store.projects.filter((p) => p.name !== name),
  }
}

/**
 * Add a gauge to recents (MRU: most recently used)
 * Removes duplicates and maintains max size
 * Returns a new Store (immutable)
 */
export function pushRecent(store: Store, gauge: Gauge): Store {
  // Check if this gauge already exists in recents
  const gaugeKey = JSON.stringify(gauge)
  const filtered = store.recents.filter((r) => JSON.stringify(r) !== gaugeKey)

  // Limit to RECENTS_MAX items, keeping most recent
  const updated = [gauge, ...filtered].slice(0, RECENTS_MAX)

  return {
    ...store,
    recents: updated,
  }
}

/**
 * Remove invalid gauges from the store (those that fail zod validation)
 * Returns a new Store (immutable)
 */
export function pruneInvalid(store: Store): Store {
  // Try to parse each gauge; keep only valid ones
  const validProjects = store.projects.filter((p) => {
    const parsed = StoreSchema.pick({ projects: true }).safeParse({
      projects: [p],
    })
    return parsed.success
  })

  const validRecents = store.recents.filter((r) => {
    const parsed = StoreSchema.pick({ recents: true }).safeParse({
      recents: [r],
    })
    return parsed.success
  })

  return {
    ...store,
    projects: validProjects,
    recents: validRecents,
  }
}

/**
 * Serialize a store to JSON string
 */
export function serializeStore(store: Store): string {
  return JSON.stringify(store)
}

/**
 * Deserialize a JSON string to a store
 * Returns null if parsing fails
 */
export function deserializeStore(json: string): Store | null {
  try {
    const data = JSON.parse(json)
    return parseStore(data)
  } catch {
    return null
  }
}

/**
 * Load store from localStorage, with fallback to empty store
 * Automatically prunes invalid entries
 */
export function loadStoreFromStorage(storageKey: string): Store {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      return createEmptyStore()
    }

    const parsed = deserializeStore(stored)
    if (parsed) {
      return pruneInvalid(parsed)
    }

    // Strict parse failed — salvage valid items instead of wiping everything
    // (a single corrupt recent must not destroy 50 saved projects)
    return salvageStore(stored)
  } catch {
    // localStorage unavailable (private mode, etc)
    return createEmptyStore()
  }
}

/**
 * Item-level salvage when the whole-store parse fails:
 * keep every individually-valid project/recent/current, drop the rest.
 * Returns an empty store when nothing is recoverable (corrupt JSON, wrong shape).
 */
export function salvageStore(json: string): Store {
  try {
    const data: unknown = JSON.parse(json)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return createEmptyStore()
    }
    const raw = data as Record<string, unknown>
    const projects = Array.isArray(raw.projects)
      ? raw.projects.filter((p) => ProjectSchema.safeParse(p).success)
      : []
    const recents = Array.isArray(raw.recents)
      ? raw.recents.filter((r) => parseGauge(r) !== null)
      : []
    const current = parseGauge(raw.current) ?? undefined
    return {
      ...createEmptyStore(),
      projects: projects as Store['projects'],
      recents: recents as Store['recents'],
      current,
    }
  } catch {
    return createEmptyStore()
  }
}

/**
 * Save store to localStorage
 * Returns true if successful, false if failed (quota exceeded, private mode, etc)
 */
export function saveStoreToStorage(storageKey: string, store: Store): boolean {
  try {
    const json = serializeStore(store)
    localStorage.setItem(storageKey, json)
    return true
  } catch {
    // Quota exceeded or private mode
    return false
  }
}
