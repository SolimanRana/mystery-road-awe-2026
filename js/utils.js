// ---------------------------------------------------------------------
// GENERIC LOOKUP & FORMATTING HELPERS
// ---------------------------------------------------------------------
//
// Small, mostly-pure functions used from several views. findEvidenceById /
// findPersonById / findLocationById do read shared state, but none of them
// ever reassign it, so they only need the read-side getters from state.js.

import { getAllEvidence, getAllPeople, getAllLocations } from "./state.js";

export function findEvidenceById(id) {
  const allEvidence = getAllEvidence();
  for (let i = 0; i < allEvidence.length; i++) {
    if (allEvidence[i].id === id) return allEvidence[i];
  }
  return null;
}

export function findPersonById(id) {
  const allPeople = getAllPeople();
  for (let i = 0; i < allPeople.length; i++) {
    if (allPeople[i].id === id) return allPeople[i];
  }
  return null;
}

export function findLocationById(id) {
  const allLocations = getAllLocations();
  for (let i = 0; i < allLocations.length; i++) {
    if (allLocations[i].id === id) return allLocations[i];
  }
  return null;
}

export function evidenceMentionsPerson(ev, person) {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

// REFACTOR (Demo 10): converted to arrow functions. Both are good
// candidates - pure, never used before this line elsewhere (no hoisting
// needed), never called with `new`, never rely on `this` or `arguments`,
// and not part of any circular import (see the note in router.js for a
// function that IS, and why that one stays a declaration).
export const formatDate = (ts) => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export const getStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

export function getRelevanceBadgeClass(relevance) {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
}

export function statusOptionHTML(current, value, label) {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

export function getSelectedOptions(selectEl) {
  const result = [];
  for (let i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].selected) result.push(selectEl.options[i].value);
  }
  return result;
}