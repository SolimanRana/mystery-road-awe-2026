import { getAllEvidence, getAllPeople, getAllLocations } from "./state.js";
import type { Evidence, Person, Location } from "./types.js";

export function findEvidenceById(id: string): Evidence | null {
  const allEvidence = getAllEvidence() as Evidence[];
  for (const evidence of allEvidence) {
    if (evidence.id === id) return evidence;
  }
  return null;
}

export function findPersonById(id: string): Person | null {
  const allPeople = getAllPeople() as Person[];
  for (const person of allPeople) {
    if (person.id === id) return person;
  }
  return null;
}

export function findLocationById(id: string): Location | null {
  const allLocations = getAllLocations() as Location[];
  for (const location of allLocations) {
    if (location.id === id) return location;
  }
  return null;
}

export function evidenceMentionsPerson(ev: Evidence, person: Person): boolean {
  if (!ev.personIds) return false;
  return (
    ev.personIds.indexOf(person.id) !== -1 ||
    ev.personIds.indexOf(person.name) !== -1
  );
}

export const formatDate = (ts: string | undefined | null): string => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
};

export const getStatusBadgeClass = (
  status: string | undefined | null,
): string => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

export function getRelevanceBadgeClass(
  relevance: string | undefined | null,
): string {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
}

export function statusOptionHTML(
  current: string | undefined | null,
  value: string,
  label: string,
): string {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

export function getSelectedOptions(selectEl: HTMLSelectElement): string[] {
  const result: string[] = [];
  for (const option of selectEl.options) {
    if (option.selected) result.push(option.value);
  }
  return result;
}
