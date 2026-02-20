/** Simple fuzzy search — case-insensitive substring matching */
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  // Check if all chars appear in order
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function searchEntities<T>(
  items: T[],
  query: string,
  fields: readonly (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field as keyof T];
      if (typeof val === 'string') return fuzzyMatch(query, val);
      return false;
    })
  );
}
