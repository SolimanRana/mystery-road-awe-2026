// ---------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------
//
// This is the module index.html loads via
// <script type="module" src="js/main.js">. It wires up navigation and
// event listeners on startup, then kicks off data loading.

import { handleHashChange } from "./router.js";
import {
  renderEvidenceList,
  handleSearchInput,
  clearFilters,
} from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import loadAllData from "./data.js";
import {
  loadBookmarksFromStorage,
  loadNotesFromStorage,
  loadNoteAsync,
} from "./storage.js";

function setupEventListeners(): void {
  window.addEventListener("hashchange", handleHashChange);

  // FIX (Demo 8): this was `for (var i = ...)`. var is function-scoped, so
  // all five closures below shared the exact same `i` binding - `let` is
  // block-scoped, so each loop iteration gets its own fresh binding.
  const navButtons = document.querySelectorAll<HTMLElement>(".nav-btn");
  for (const navButton of navButtons) {
    navButton.addEventListener("click", () => {
      const targetView = navButton.getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document
    .getElementById("evidenceSearch")!
    .addEventListener("input", handleSearchInput);

  document
    .getElementById("filterType")!
    .addEventListener("change", renderEvidenceList);
  document
    .getElementById("filterPerson")!
    .addEventListener("change", renderEvidenceList);
  document
    .getElementById("filterLocation")!
    .addEventListener("change", renderEvidenceList);

  document
    .getElementById("filterStatus")!
    .addEventListener("change", renderEvidenceList);

  document
    .getElementById("filterRelevance")!
    .addEventListener("change", renderEvidenceList);

  document
    .getElementById("clearFiltersBtn")!
    .addEventListener("click", clearFilters);

  document
    .getElementById("timelineOrder")!
    .addEventListener("change", renderTimeline);
  document
    .getElementById("timelinePersonFilter")!
    .addEventListener("change", renderTimeline);
  document
    .getElementById("timelineLocationFilter")!
    .addEventListener("change", renderTimeline);
  document
    .getElementById("timelineTypeFilter")!
    .addEventListener("change", renderTimeline);

  document.getElementById("hypConfidence")!.addEventListener("input", (e) => {
    document.getElementById("hypConfidenceValue")!.textContent = (
      e.target as HTMLInputElement
    ).value;
  });
}

// REFACTOR (Demo 9): loadAllData() itself is `async` now, so it still
// returns a Promise - `await` on it works exactly like the old `.then()`
// did, just without the extra nesting.
async function initApp(): Promise<void> {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  await loadAllData();
  handleHashChange();
  // FIX (Demo 4): loadNoteAsync returns a Promise, not the note text
  // itself. `await` unwraps it the same way .then() did.
  const firstNote = await loadNoteAsync("E01");
  console.log("First note preview:", firstNote);
}

window.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("hashchange", handleHashChange);
