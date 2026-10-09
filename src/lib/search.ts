import type { AppItem, Category, Folder } from './types';
import { displayName } from './demoApps';

export interface SearchActionItem {
  id: string;
  title: string;
  subtitle: string;
  run: () => void;
}

export interface SearchResults {
  apps: AppItem[];
  categories: Category[];
  folders: Folder[];
  actions: SearchActionItem[];
}

function matches(hay: string, q: string): boolean {
  return hay.toLowerCase().includes(q.toLowerCase());
}

/** Forgiving local search across apps, categories, folders, and actions. */
export function searchAll(
  query: string,
  apps: AppItem[],
  categories: Category[],
  folders: Folder[],
  actions: SearchActionItem[],
): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { apps: [], categories: [], folders: [], actions: [] };

  const appHits = apps
    .filter((a) => !a.isHidden)
    .map((a) => {
      const name = displayName(a);
      let score = -1;
      if (name.toLowerCase().startsWith(q)) score = 0;
      else if (matches(name, q)) score = 1;
      else if (matches(a.aliases.join(' '), q)) score = 2;
      else if (q.length >= 2 && name.toLowerCase().split('').filter((c) => q.includes(c)).length >= q.length) score = 3;
      return { app: a, score };
    })
    .filter((r) => r.score >= 0)
    .sort((x, y) => x.score - y.score || displayName(x.app).localeCompare(displayName(y.app)))
    .map((r) => r.app);

  return {
    apps: appHits,
    categories: categories.filter((c) => matches(c.name, q)),
    folders: folders.filter((f) => matches(f.name, q)),
    actions: actions.filter((a) => matches(`${a.title} ${a.subtitle}`, q)),
  };
}
