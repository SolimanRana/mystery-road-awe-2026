// ---------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------
//
// This is the module index.html loads via
// <script type="module" src="js/main.js">. It wires up navigation and
// event listeners on startup, then kicks off data loading - it doesn't
// implement any view logic itself, it just imports and composes the
// pieces (see the theory guide, chapter 5.5, "composition at the
// application boundary").

import { handleHashChange } from "./router.js";
import { renderEvidenceList, handleSearchInput, clearFilters } from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import loadAllData from "./data.js";
import { loadBookmarksFromStorage, loadNotesFromStorage, loadNoteAsync } from "./storage.js";

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  // FIX (Demo 8): this was `for (var i = ...)`. var is function-scoped, so
  // all five closures below shared the exact same `i` binding. By the time
  // any button was actually clicked, the loop had long finished and `i`
  // was sitting at navButtons.length (one past the last button) - so
  // navButtons[i] was always undefined, and every click threw "Cannot read
  // properties of undefined (reading 'getAttribute')" (the PAGEERROR seen
  // throughout every test in this project). `let` is block-scoped: each
  // loop iteration gets its OWN fresh `i` binding, so each closure
  // correctly captures the button index it was created for.
  const navButtons = document.querySelectorAll(".nav-btn");
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      const targetView = navButtons[i].getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);

  // CODE SMELL FIX (Demo 8): filterStatus used to be wired up TWICE - once
  // properly via addEventListener above, and a second time via
  // setAttribute("onchange", "renderEvidenceList()"), an inline HTML-attribute
  // string. Both fired on every "change" event, so renderEvidenceList() ran
  // twice per click for this one field only - wasted work, and a trap for
  // whoever edits this later and doesn't realize there are two wires to the
  // same switch. It only kept working after the module split because
  // evidence.js explicitly exposes window.renderEvidenceList - removing the
  // duplicate line means that exposure is no longer needed for this purpose.
  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);

  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  // REFACTOR (Demo 10): arrow function instead of an anonymous
  // function(e){...}. Safe here because this callback never uses `this`
  // (it uses e.target instead, same as every other listener in this app)
  // and is never called with `new` - a plain value-in, side-effect-out
  // callback is exactly what arrow functions are for.
  document.getElementById("hypConfidence").addEventListener("input", (e) => {
    document.getElementById("hypConfidenceValue").textContent = e.target.value;
  });
}

// REFACTOR (Demo 9): fourth conversion. loadAllData() itself is `async`
// now (see data.js), so it still returns a Promise - `await` on it works
// exactly like the old `.then()` did, just without the extra nesting.
async function initApp() {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  await loadAllData();
  handleHashChange();
  // FIX (Demo 4): loadNoteAsync returns a Promise, not the note text
  // itself. The old code did `var firstNote = loadNoteAsync("E01");` and
  // logged `firstNote` directly - that logged the pending Promise object,
  // not its resolved value. `await` unwraps it the same way .then() did.
  const firstNote = await loadNoteAsync("E01");
  console.log("First note preview:", firstNote);
}

window.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("hashchange", handleHashChange);