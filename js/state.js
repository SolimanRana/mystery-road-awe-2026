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

let allEvidence = [];
let filteredEvidence = [];
let selectedEvidence = null;
let bookmarks = [];
let currentPage = "dashboard";

let allPeople = [];
let allLocations = [];
let allTimeline = [];
let caseData = {};

let currentPeopleTab = "people";
let loadingStepsRemaining = 2;

let evidenceViewLoading = true;

const viewRendered = {
  dashboard: false,
  evidence: false,
  people: false,
  timeline: false,
  workspace: false
};

let notesStore = {};
let modalCloseListenerCount = 0;

export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";

// --- evidence -----------------------------------------------------------
export function getAllEvidence() { return allEvidence; }
export function setAllEvidence(value) { allEvidence = value; }

export function getFilteredEvidence() { return filteredEvidence; }
export function setFilteredEvidence(value) { filteredEvidence = value; }

export function getSelectedEvidence() { return selectedEvidence; }
export function setSelectedEvidence(value) { selectedEvidence = value; }

// --- bookmarks ------------------------------------------------------------
export function getBookmarks() { return bookmarks; }
export function setBookmarks(value) { bookmarks = value; }

// --- navigation / view flags ---------------------------------------------
export function getCurrentPage() { return currentPage; }
export function setCurrentPage(value) { currentPage = value; }

export function getCurrentPeopleTab() { return currentPeopleTab; }
export function setCurrentPeopleTab(value) { currentPeopleTab = value; }

// viewRendered's properties are toggled in place (e.g. viewRendered.dashboard
// = true), never reassigned as a whole object, so a getter is enough here.
export function getViewRendered() { return viewRendered; }

// --- reference/lookup data -------------------------------------------------
export function getAllPeople() { return allPeople; }
export function setAllPeople(value) { allPeople = value; }

export function getAllLocations() { return allLocations; }
export function setAllLocations(value) { allLocations = value; }

export function getAllTimeline() { return allTimeline; }
export function setAllTimeline(value) { allTimeline = value; }

export function getCaseData() { return caseData; }
export function setCaseData(value) { caseData = value; }

// --- loading / misc bookkeeping --------------------------------------------
export function getLoadingStepsRemaining() { return loadingStepsRemaining; }
export function setLoadingStepsRemaining(value) { loadingStepsRemaining = value; }

// NOTE: kept exactly as in the original app.js — evidenceViewLoading is
// declared true and read once (in renderEvidenceList), but nothing in the
// original code ever calls a setter for it. That looks like a bug. We are
// NOT fixing it in Demo 1 (pure refactor only) - flagged for a bug-hunt demo.
export function getEvidenceViewLoading() { return evidenceViewLoading; }
export function setEvidenceViewLoading(value) { evidenceViewLoading = value; }

export function getNotesStore() { return notesStore; }
export function setNotesStore(value) { notesStore = value; }

export function getModalCloseListenerCount() { return modalCloseListenerCount; }
export function setModalCloseListenerCount(value) { modalCloseListenerCount = value; }