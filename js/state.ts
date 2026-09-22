// ---------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------
//
// This used to be a block of top-level `var` declarations in app.js,
// readable and writable from anywhere in that one giant file.
//
// Modules each get their own top-level scope (see EXERCISE_1.md Demo 1,
// question 2), so a plain `export let allEvidence = [];` would only let
// other modules READ the current value. Several places in the original
// app.js don't just mutate these values (e.g. `bookmarks.push(...)`),
// they REASSIGN them (e.g. `bookmarks = bookmarks.filter(...)`). An
// import is a live, read-only view of a binding, so an importer that
// tries `allEvidence = data;` would fail at runtime with:
//   TypeError: Assignment to constant variable.
//
// The fix used throughout this module: keep every variable private to
// this file, and export a getter (read) and, wherever the original code
// reassigns the variable, a setter (write) function instead. Modules
// that only ever mutate the returned reference in place (like
// `viewRendered`, whose properties are set individually) only get a
// getter, because nothing outside this file ever reassigns the object
// itself.
//
// DEMO 7: last module converted to .ts. Every getter/setter now has an
// explicit type instead of an implicit any - this is what makes the
// casts in utils.ts/data.ts (getAllEvidence() as Evidence[], etc.)
// unnecessary going forward, but those call sites weren't touched here
// since removing a cast that's no longer needed is a cleanup, not a
// requirement of this demo.

import type {
  Evidence,
  Person,
  Location,
  TimelineEvent,
  CaseData,
} from "./types.js";

let allEvidence: Evidence[] = [];
let filteredEvidence: Evidence[] = [];
let selectedEvidence: Evidence | null = null;
let bookmarks: string[] = [];
let currentPage = "dashboard";

let allPeople: Person[] = [];
let allLocations: Location[] = [];
let allTimeline: TimelineEvent[] = [];
// DEMO 7: caseData starts as `{}` before the first fetch resolves, then
// becomes a real CaseData. `Partial<CaseData>` models that honestly -
// every field is possibly-undefined until loadCorePeopleAndLocations()
// actually sets it, which matches how dashboard.js already reads it
// (`caseData.title || "Case"`, always with a fallback).
let caseData: Partial<CaseData> = {};

let currentPeopleTab = "people";
let loadingStepsRemaining = 2;

let evidenceViewLoading = true;

interface ViewRenderedFlags {
  dashboard: boolean;
  evidence: boolean;
  people: boolean;
  timeline: boolean;
  workspace: boolean;
}

const viewRendered: ViewRenderedFlags = {
  dashboard: false,
  evidence: false,
  people: false,
  timeline: false,
  workspace: false,
};

let notesStore: Record<string, string> = {};
let modalCloseListenerCount = 0;

export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";

// --- evidence -----------------------------------------------------------
export function getAllEvidence(): Evidence[] {
  return allEvidence;
}
export function setAllEvidence(value: Evidence[]): void {
  allEvidence = value;
}

export function getFilteredEvidence(): Evidence[] {
  return filteredEvidence;
}
export function setFilteredEvidence(value: Evidence[]): void {
  filteredEvidence = value;
}

export function getSelectedEvidence(): Evidence | null {
  return selectedEvidence;
}
export function setSelectedEvidence(value: Evidence | null): void {
  selectedEvidence = value;
}

// --- bookmarks ------------------------------------------------------------
export function getBookmarks(): string[] {
  return bookmarks;
}
export function setBookmarks(value: string[]): void {
  bookmarks = value;
}

// --- navigation / view flags ---------------------------------------------
export function getCurrentPage(): string {
  return currentPage;
}
export function setCurrentPage(value: string): void {
  currentPage = value;
}

export function getCurrentPeopleTab(): string {
  return currentPeopleTab;
}
export function setCurrentPeopleTab(value: string): void {
  currentPeopleTab = value;
}

// viewRendered's properties are toggled in place (e.g. viewRendered.dashboard
// = true), never reassigned as a whole object, so a getter is enough here.
export function getViewRendered(): ViewRenderedFlags {
  return viewRendered;
}

// --- reference/lookup data -------------------------------------------------
export function getAllPeople(): Person[] {
  return allPeople;
}
export function setAllPeople(value: Person[]): void {
  allPeople = value;
}

export function getAllLocations(): Location[] {
  return allLocations;
}
export function setAllLocations(value: Location[]): void {
  allLocations = value;
}

export function getAllTimeline(): TimelineEvent[] {
  return allTimeline;
}
export function setAllTimeline(value: TimelineEvent[]): void {
  allTimeline = value;
}

export function getCaseData(): Partial<CaseData> {
  return caseData;
}
export function setCaseData(value: CaseData): void {
  caseData = value;
}

// --- loading / misc bookkeeping --------------------------------------------
export function getLoadingStepsRemaining(): number {
  return loadingStepsRemaining;
}
export function setLoadingStepsRemaining(value: number): void {
  loadingStepsRemaining = value;
}

// NOTE: kept exactly as in the original app.js — evidenceViewLoading is
// declared true and read once (in renderEvidenceList), but nothing in the
// original code ever calls a setter for it. That looks like a bug. We are
// NOT fixing it in Demo 1 (pure refactor only) - flagged for a bug-hunt demo.
export function getEvidenceViewLoading(): boolean {
  return evidenceViewLoading;
}
export function setEvidenceViewLoading(value: boolean): void {
  evidenceViewLoading = value;
}

export function getNotesStore(): Record<string, string> {
  return notesStore;
}
export function setNotesStore(value: Record<string, string>): void {
  notesStore = value;
}

export function getModalCloseListenerCount(): number {
  return modalCloseListenerCount;
}
export function setModalCloseListenerCount(value: number): void {
  modalCloseListenerCount = value;
}
