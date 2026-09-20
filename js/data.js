// ---------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------
//
// loadAllData is the one coherent operation this module offers to the
// rest of the app (main.js calls it once, at startup) - default export.
// Everything else here (the loading-overlay helpers, the three per-file
// loaders, populateAllDropdowns) is an internal implementation detail of
// "load everything", so none of it is exported.
//
// REFACTOR (Demo 9): these used to be nested .then() chains - see the
// comment above loadCorePeopleAndLocations for the full before/after.

import {
  setCaseData, setAllPeople, setAllLocations, setAllEvidence, setAllTimeline,
  getAllEvidence, setFilteredEvidence, getCurrentPage,
  getLoadingStepsRemaining, setLoadingStepsRemaining,
  setEvidenceViewLoading
} from "./state.js";
import renderDashboard from "./views/dashboard.js";
import { renderEvidenceList, populateEvidenceDropdowns, applyStoredBookmarkFlags } from "./views/evidence.js";
import { renderTimeline, populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

function showLoadingOverlay(msg) {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  setLoadingStepsRemaining(getLoadingStepsRemaining() - 1);
  if (getLoadingStepsRemaining() <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

function populateAllDropdowns() {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}

// REFACTOR (Demo 9): this was the deepest nesting in the whole app - 3
// levels of .then(), each one only starting once the previous fetch AND
// its .json() parse had both resolved:
//
//   fetch(case.json).then(caseRes =>
//     caseRes.json().then(caseJson => {
//       ...
//       fetch(people.json).then(peopleRes =>
//         peopleRes.json().then(peopleJson => {
//           ...
//           fetch(locations.json).then(locationsRes =>
//             locationsRes.json().then(locationsJson => { ... })
//           )
//         })
//       )
//     })
//   )
//
// i.e. case.json must fully arrive and parse before people.json is even
// requested, and people.json must fully arrive and parse before
// locations.json is requested - three sequential round-trips, one after
// another, never in parallel. `await` preserves that exact ordering (each
// line blocks the NEXT line in this function from running until it
// settles) while reading top-to-bottom like ordinary synchronous code -
// no callback pyramid, no counting closing braces to see what depends on
// what.
async function loadCorePeopleAndLocations() {
  const caseRes = await fetch("data/case.json");
  const caseJson = await caseRes.json();
  setCaseData(caseJson);

  const peopleRes = await fetch("data/people.json");
  const peopleJson = await peopleRes.json();
  setAllPeople(peopleJson);

  const locationsRes = await fetch("data/locations.json");
  const locationsJson = await locationsRes.json();
  setAllLocations(locationsJson);

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

// REFACTOR (Demo 9): second conversion - a flatter .then()/.catch() chain,
// but the error handling has to survive the rewrite. try/catch around
// await is the async/await equivalent of .catch() (see the theory
// questions below for what happens if you skip it).
async function loadEvidenceData() {
  try {
    const res = await fetch("data/evidence.json");
    const data = await res.json();
    setAllEvidence(data);
    applyStoredBookmarkFlags();

    // FIX (Demo 2): evidenceViewLoading was declared true and never set
    // back to false anywhere in the app - so renderEvidenceList()'s
    // early-return loading branch fired forever, and the evidence card
    // grid never actually rendered. Data has now arrived, so the
    // "loading" state is over.
    setEvidenceViewLoading(false);

    // FIX (Demo 2): this used to be setFilteredEvidence(getAllEvidence()),
    // which assigns filteredEvidence the SAME array reference as
    // allEvidence (not a copy). Any later code that does
    // filteredEvidence.sort(...) or .splice(...) - like the sort logic in
    // getFilteredEvidence()/handleSortChange() - mutates that one shared
    // array in place, so allEvidence silently gets reordered/changed too,
    // even though the two are supposed to be independent ("all items" vs.
    // "currently visible items"). .slice() with no arguments returns a
    // shallow copy: a new array containing the same items, so mutating
    // filteredEvidence can never again reach back and change allEvidence.
    setFilteredEvidence(getAllEvidence().slice());

    renderDashboard();
    populateAllDropdowns();
    if (getCurrentPage() === "evidence") renderEvidenceList();
  } catch (err) {
    console.error("Failed to load evidence.json", err);
    alert("Evidence could not be loaded. Some views may be incomplete.");
  }
}

// REFACTOR (Demo 9): third conversion - this one also had a .finally(),
// whose async/await equivalent is just a plain `finally` block.
async function loadTimelineData() {
  try {
    const res = await fetch("data/timeline.json");
    const data = await res.json();
    setAllTimeline(data);
    renderDashboard();
    if (getCurrentPage() === "timeline") renderTimeline();
    populateAllDropdowns();
  } catch (err) {
    console.log("timeline load error", err);
  } finally {
    hideLoadingStep();
  }
}

export default async function loadAllData() {
  showLoadingOverlay("Loading case file…");
  setLoadingStepsRemaining(2);
  await loadCorePeopleAndLocations();
  // NOTE: kept exactly as in the original - these two are called without
  // awaiting them here, so they run concurrently with each other (and with
  // whatever runs after loadAllData() resolves). That's a separate,
  // pre-existing loose end, not something Demo 9 asks us to fix.
  loadEvidenceData();
  loadTimelineData();
}