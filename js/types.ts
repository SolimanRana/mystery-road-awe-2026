// ---------------------------------------------------------------------
// DOMAIN DATA MODEL
// ---------------------------------------------------------------------
//
// Types matching the shape of data/*.json, shared between the data-loading
// module and anything that reads case data. Evidence/Person/Location were
// already declared inline in utils.ts (Demo 5) - re-exported from here so
// there is exactly one definition, not two copies drifting apart.

export interface Evidence {
  id: string;
  type: string;
  title: string;
  timestamp: string; // ISO 8601, e.g. "2026-10-16T06:49:00Z"
  summary: string;
  content: string;
  // DEMO 6: see the writeup for why this is `string[]` and not, say,
  // `{ personId: string }[]` - the short version is that data/evidence.json
  // itself is NOT fully consistent about what these strings are (mostly
  // person ids, but E04 has one raw display name, "Nova Byte", instead of
  // "nova-byte"). Typing this as `string[]` documents "this must resolve
  // to a Person somehow" without pretending the type system alone
  // guarantees every entry is already a clean id - see evidenceMentionsPerson
  // in utils.ts, which is exactly the workaround that inconsistency forced.
  personIds: string[];
  locationIds: string[];
  tags: string[];
  status: string;
  relevance: string;
  // DEMO 7: not present in data/evidence.json - added at runtime by
  // applyStoredBookmarkFlags()/handleBookmarkClick() in views/evidence.js.
  // Converting that file to .ts is what surfaced this: `ev.bookmarked = true`
  // doesn't compile against a type that only reflects the JSON shape.
  // Marked optional because it's genuinely absent until that function runs.
  bookmarked?: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  speciality: string;
  responsibilities: string[];
  statement: string;
  background: string;
  avatar: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  contains: string[];
}

export interface TimelineEvent {
  id: string;
  time: string; // ISO 8601
  title: string;
  description: string;
  type: string;
  certainty: string;
  personIds: string[];
  locationIds: string[];
  evidenceIds: string[];
}

export interface CaseData {
  caseId: string;
  title: string;
  subtitle: string;
  status: string;
  opened: string;
  summary: string;
}
