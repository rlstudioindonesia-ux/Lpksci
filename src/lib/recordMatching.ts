/**
 * Finds the student record a request refers to.
 *
 * Several server handlers used a single
 *   findIndex(s => idMatches || nameMatches || emailMatches)
 * which returns the FIRST record matching ANY criterion. When two students
 * share a name (common: "Muhammad Rizki", "Siti Aminah"), saving student B's
 * data (payload carries B's id AND name) could update student A instead,
 * simply because A comes earlier in the list. The id is now always tried
 * first; email next; name is only used when it identifies exactly one record.
 */
export interface RecordLookup {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export function findRecordIndex(list: any[] | null | undefined, lookup: RecordLookup): number {
  if (!Array.isArray(list) || list.length === 0) return -1;

  const id = norm(lookup.id);
  if (id) {
    const byId = list.findIndex((r) => r && norm(r.id) === id);
    if (byId !== -1) return byId;
  }

  const email = norm(lookup.email);
  if (email) {
    const byEmail = list.findIndex((r) => r && norm(r.email) === email);
    if (byEmail !== -1) return byEmail;
  }

  const name = norm(lookup.name);
  if (name) {
    let found = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i] && norm(list[i].name) === name) {
        if (found !== -1) return -1; // ambiguous: several students share this name
        found = i;
      }
    }
    return found;
  }

  return -1;
}
