// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE + EVIDENCE DETAIL
// ---------------------------------------------------------------------
//
// Named exports throughout: this module has several things other modules
// genuinely need (renderEvidenceList, openEvidenceDetail, ...), not one
// single primary value, so a default export wouldn't fit as naturally as
// it does in dashboard.js.
//
// closeEvidenceDetail and saveCurrentNote are called from onclick="..."
// attributes inside HTML we build as strings (see renderEvidenceDetail
// below). Inline event-handler attributes look up their name on `window`,
// NOT in this module's scope - modules do not leak into the global object
// the way top-level `var`/`function` in a classic script used to. So both
// functions are exported *and* explicitly attached to `window` at the
// bottom of this file. (Converting these to addEventListener instead of
// onclick="..." would remove the need for that entirely - flagged as a
// code smell candidate for Demo 8, not fixed here.)

import {
  getAllEvidence, getAllPeople, getAllLocations,
  setFilteredEvidence,
  getBookmarks, setBookmarks,
  getEvidenceViewLoading, getCurrentPage, getViewRendered,
  getSelectedEvidence, setSelectedEvidence
} from "../state.js";
import {
  findEvidenceById, findPersonById, findLocationById,
  formatDate, getStatusBadgeClass, getRelevanceBadgeClass, statusOptionHTML
} from "../utils.js";
import { saveBookmarksToStorage, saveNoteForEvidence, loadNoteForEvidence } from "../storage.js";

// --- dropdowns --------------------------------------------------------

export function populateEvidenceDropdowns() {
  const typeSelect = document.getElementById("filterType");
  const personSelect = document.getElementById("filterPerson");
  const locationSelect = document.getElementById("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  const allEvidence = getAllEvidence();
  const allPeople = getAllPeople();
  const allLocations = getAllLocations();

  const types = [];
  for (let i = 0; i < allEvidence.length; i++) {
    const t = allEvidence[i].type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (let ti = 0; ti < types.length; ti++) {
    typeSelect.innerHTML += '<option value="' + types[ti] + '">' + types[ti] + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (let p = 0; p < allPeople.length; p++) {
    personSelect.innerHTML += '<option value="' + allPeople[p].id + '">' + allPeople[p].name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (let l = 0; l < allLocations.length; l++) {
    locationSelect.innerHTML += '<option value="' + allLocations[l].id + '">' + allLocations[l].id + " - " + allLocations[l].name + "</option>";
  }
}

// --- list / filter / sort ---------------------------------------------

// FIX (Demo 5): shared by getFilteredEvidence/renderEvidenceList and
// handleSortChange, so the currently selected sort order is re-applied
// every time the list renders - see the comment on renderEvidenceList
// below for why that's necessary.
function applySelectedSortOrder(results) {
  const sortValue = document.getElementById("sortEvidence").value;
  if (sortValue === "title-asc") {
    results.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  } else if (sortValue === "title-desc") {
    results.sort(function (a, b) {
      return b.title.localeCompare(a.title);
    });
  } else if (sortValue === "date-asc") {
    results.sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  } else {
    results.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }
}

export function getFilteredEvidence() {
  const allEvidence = getAllEvidence();
  const searchBox = document.getElementById("evidenceSearch");
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = document.getElementById("filterType").value;
  const personVal = document.getElementById("filterPerson").value;
  const locationVal = document.getElementById("filterLocation").value;
  const statusVal = document.getElementById("filterStatus").value;
  const relevanceVal = document.getElementById("filterRelevance").value;

  const results = [];
  for (let i = 0; i < allEvidence.length; i++) {
    const item = allEvidence[i];
    let matches = true;

    if (searchTerm) {
      const haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPersonLocal(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal) matches = false;

    if (matches) results.push(item);
  }

  setFilteredEvidence(results);
  return results;
}

// evidenceMentionsPerson lives in utils.js too, but the original
// getFilteredEvidence() in app.js called the top-level function directly.
// Re-using the same implementation here through utils.js keeps this a
// pure refactor (no behavior change) while avoiding a duplicate definition.
import { evidenceMentionsPerson as evidenceMentionsPersonLocal } from "../utils.js";

export function renderEvidenceList() {
  const container = document.getElementById("evidenceList");
  if (!container) return;

  const loadingIndicator = document.getElementById("evidenceLoadingIndicator");
  if (getEvidenceViewLoading()) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  const results = getFilteredEvidence();
  // FIX (Demo 5): getFilteredEvidence() rebuilds `results` from scratch on
  // every call (a fresh, unsorted array in allEvidence's order) and
  // overwrites the filteredEvidence state with it. Previously,
  // handleSortChange() sorted filteredEvidence in place and then called
  // renderEvidenceList() to show the result - but renderEvidenceList()
  // immediately called getFilteredEvidence() again right here, which threw
  // that sort away before a single card was rendered. Symptom: picking any
  // option in the "Sort by" dropdown visibly did nothing. Re-applying the
  // sort here, on every render, means it survives filter changes too.
  applySelectedSortOrder(results);

  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (let i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);
  }
  container.innerHTML = html;

  // Event delegation for card clicks / bookmark button.
  container.addEventListener("click", handleEvidenceListClick);
}

function renderEvidenceCardHTML(ev) {
  const isBookmarked = getBookmarks().indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html += '<button class="bookmark-btn ' + (isBookmarked ? "active" : "") + '" data-action="bookmark" data-id="' + ev.id + '" aria-label="Toggle bookmark for ' + ev.title + '"><span class="bookmark-icon">' + (isBookmarked ? "★" : "☆") + "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html += '<div class="evidence-meta">' + ev.id + " &middot; " + ev.type + " &middot; " + formatDate(ev.timestamp) + "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html += '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (let t = 0; t < ev.tags.length; t++) {
    html += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

function handleEvidenceListClick(event) {
  const target = event.target;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    handleBookmarkClick(target.dataset.id);
    return;
  }

  const card = target.closest(".evidence-card");
  if (card) {
    openEvidenceDetail(card.getAttribute("data-id"));
  }
}

function handleBookmarkClick(evidenceId) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  const bookmarks = getBookmarks();
  if (bookmarks.indexOf(evidenceId) === -1) {
    bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    setBookmarks(bookmarks.filter(function (id) {
      return id !== evidenceId;
    }));
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (getCurrentPage() === "evidence") renderEvidenceList();
}

export function applyStoredBookmarkFlags() {
  const allEvidence = getAllEvidence();
  const bookmarks = getBookmarks();
  for (let i = 0; i < allEvidence.length; i++) {
    allEvidence[i].bookmarked = bookmarks.indexOf(allEvidence[i].id) !== -1;
  }
}

export function handleSortChange() {
  // FIX (Demo 5): sorting now happens inside renderEvidenceList() itself
  // (via applySelectedSortOrder), every time it renders - so all this
  // needs to do is trigger that re-render; it will read the current
  // #sortEvidence value on its own.
  renderEvidenceList();
}

export function clearFilters() {
  document.getElementById("evidenceSearch").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterPerson").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterRelevance").value = "";
  renderEvidenceList();
}

function simulateAsyncSearch(term) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(term);
    }, 300);
  });
}

let latestSearchRequestId = 0;

export function handleSearchInput(event) {
  const term = event.target.value;
  const requestId = ++latestSearchRequestId;

  simulateAsyncSearch(term).then(function (resolvedTerm) {
    // Only apply this response if nothing newer has been typed meanwhile.
    if (requestId !== latestSearchRequestId) return;
    renderEvidenceList();
  });
}

// --- evidence detail ----------------------------------------------------

export function openEvidenceDetail(evidenceId) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  setSelectedEvidence(ev);

  const section = document.getElementById("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function closeEvidenceDetail() {
  const section = document.getElementById("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
  setSelectedEvidence(null);
}

function renderEvidenceDetail(ev) {
  const section = document.getElementById("evidenceDetailSection");

  const personNames = [];
  for (let p = 0; p < ev.personIds.length; p++) {
    const person = findPersonById(ev.personIds[p]);
    personNames.push(person ? person.name : ev.personIds[p]);
  }

  const locationNames = [];
  for (let l = 0; l < ev.locationIds.length; l++) {
    const loc = findLocationById(ev.locationIds[l]);
    locationNames.push(loc ? loc.id + " - " + loc.name : ev.locationIds[l]);
  }

  let tagsHtml = "";
  for (let t = 0; t < ev.tags.length; t++) {
    tagsHtml += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html += '<div class="evidence-meta">' + ev.id + " &middot; " + ev.type + " &middot; " + formatDate(ev.timestamp) + "</div></div>";
  html += '<button type="button" id="closeEvidenceDetailBtn" class="btn btn-secondary btn-small">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html += '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html += '<div class="detail-field"><strong>Related locations</strong>' + locationNames.join(", ") + "</div>";
  html += '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

  html += '<div class="detail-field"><strong>Review status</strong>';
  html += '<select id="detailStatusSelect">';
  html += statusOptionHTML(ev.status, "unreviewed", "Unreviewed");
  html += statusOptionHTML(ev.status, "reviewed", "Reviewed");
  html += statusOptionHTML(ev.status, "flagged", "Flagged");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Relevance</strong>';
  html += '<select id="detailRelevanceSelect">';
  html += statusOptionHTML(ev.relevance, "unknown", "Unknown");
  html += statusOptionHTML(ev.relevance, "relevant", "Relevant");
  html += statusOptionHTML(ev.relevance, "irrelevant", "Irrelevant");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Investigator note</strong>';
  html += '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' + ev.id + '" placeholder="Add a private note about this evidence...">' + storedNote + "</textarea>";
  html += '<button type="button" id="saveNoteBtn" class="btn btn-primary btn-small" style="margin-top:6px;">Save note</button>';
  html += "</div>";

  html += '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' + storedNote + "</div></div>";

  section.innerHTML = html;

  document.getElementById("detailStatusSelect").addEventListener("change", function (e) {
    ev.status = e.target.value; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (getViewRendered().evidence) renderEvidenceList();
  });
  document.getElementById("detailRelevanceSelect").addEventListener("change", function (e) {
    ev.relevance = e.target.value;
    renderEvidenceDetail(ev);
    if (getViewRendered().evidence) renderEvidenceList();
  });

  // CODE SMELL FIX (Demo 8): closeEvidenceDetail/saveCurrentNote used to be
  // wired up via onclick="..." strings baked into the HTML above, which
  // only works because both functions are also attached to `window` (see
  // the removed comment at the bottom of this file) - modules don't leak
  // into the global scope the way classic <script> top-level functions
  // did, so an inline onclick="foo()" has nothing to find unless you
  // explicitly re-expose foo as a global. That's a real ongoing cost: every
  // function referenced this way is now effectively public API forever,
  // reachable and overwritable from anywhere (including the console), just
  // to satisfy a plain HTML string. Wiring them up the same way the two
  // <select> listeners above already are removes that requirement entirely
  // - closeEvidenceDetail and saveCurrentNote no longer need to live on
  // `window` at all.
  document.getElementById("closeEvidenceDetailBtn").addEventListener("click", closeEvidenceDetail);
  document.getElementById("saveNoteBtn").addEventListener("click", saveCurrentNote);
}

export function saveCurrentNote() {
  const textarea = document.getElementById("evidenceNoteInput");
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}

// closeEvidenceDetail, saveCurrentNote AND renderEvidenceList no longer
// need `window.X = X` exposure: the first two are wired up with
// addEventListener now (see the Demo-8 fix above), and renderEvidenceList
// only ever needed it because of the duplicate onchange="..." string on
// #filterStatus in main.js - removed in the same Demo-8 pass, so this file
// has nothing left on `window` except handleSortChange below, which
// index.html's own markup still calls via a static onclick="..." attribute
// we don't own from here (changing that means editing index.html itself,
// out of scope for this pass).
// index.html has onchange="handleSortChange()" as a static inline HTML
// attribute on #sortEvidence - same reason as the three above.
window.handleSortChange = handleSortChange;