import { normalise, normaliseWithMap } from './normalise';

export const MAX_SUGGESTIONS = 6;

export interface Suggestion<T> {
  item: T;
  match: { start: number; end: number };
}

interface Searchable {
  id: string;
  name: string;
}

function rank(name: string, query: string): { rank: number; index: number } | null {
  if (name.startsWith(query)) return { rank: 1, index: 0 };
  const wordIndex = name.indexOf(' ' + query);
  if (wordIndex !== -1) return { rank: 2, index: wordIndex + 1 };
  const index = name.indexOf(query);
  return index === -1 ? null : { rank: 3, index };
}

export function suggest<T extends Searchable>(
  items: readonly T[],
  query: string,
  exclude: readonly string[] = [],
  limit = MAX_SUGGESTIONS,
): Suggestion<T>[] {
  const normalisedQuery = normalise(query);
  if (normalisedQuery.length === 0) return [];
  const ranked = [];
  for (const item of items) {
    if (exclude.includes(item.id)) continue;
    const name = normaliseWithMap(item.name);
    const found = rank(name.text, normalisedQuery);
    if (!found) continue;
    const start = name.sourceIndex[found.index];
    const end = name.sourceIndex[found.index + normalisedQuery.length - 1] + 1;
    ranked.push({ item, rank: found.rank, sortKey: name.text, match: { start, end } });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.sortKey.localeCompare(b.sortKey));
  return ranked.slice(0, limit).map(({ item, match }) => ({ item, match }));
}
