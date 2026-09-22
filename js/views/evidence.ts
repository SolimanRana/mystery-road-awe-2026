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
// NOT in this module's scope, so both functions are exported *and*
// explicitly attached to `window` at the bottom of this file.

import {
  getAllEvidence,
  getAllPeople,
  getAllLocations,
  setFilteredEvidence,
  getBookmarks,
  setBookmarks,
  getEvidenceViewLoading,
  getCurrentPage,
  getViewRendered,
  setSelectedEvidence,
} from "../state.js";
import {
  findEvidenceById,
  findPersonById,
  findLocationById,
  formatDate,
  getStatusBadgeClass,
  getRelevanceBadgeClass,
  statusOptionHTML,
  evidenceMentionsPerson as evidenceMentionsPersonLocal,
} from "../utils.js";
import {
  saveBookmarksToStorage,
  saveNoteForEvidence,
  loadNoteForEvidence,
} from "../storage.js";
import type { Evidence } from "../types.js";

// --- dropdowns --------------------------------------------------------

export function populateEvidenceDropdowns(): void {
  const typeSelect = document.getElementById(
    "filterType",
  ) as HTMLSelectElement | null;
  const personSelect = document.getElementById(
    "filterPerson",
  ) as HTMLSelectElement | null;
  const locationSelect = document.getElementById(
    "filterLocation",
  ) as HTMLSelectElement | null;
  if (!typeSelect || !personSelect || !locationSelect) return;

  const allEvidence = getAllEvidence();
  const allPeople = getAllPeople();
  const allLocations = getAllLocations();

  const types: string[] = [];
  for (const ev of allEvidence) {
    const t = ev.type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of allPeople) {
    personSelect.innerHTML +=
      '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of allLocations) {
    locationSelect.innerHTML +=
      '<option value="' +
      loc.id +
      '">' +
      loc.id +
      " - " +
      loc.name +
      "</option>";
  }
}

// --- list / filter / sort ---------------------------------------------

// FIX (Demo 5): shared by getFilteredEvidence/renderEvidenceList and
// handleSortChange, so the currently selected sort order is re-applied
// every time the list renders.
function applySelectedSortOrder(results: Evidence[]): void {
  const sortValue = (
    document.getElementById("sortEvidence") as HTMLSelectElement
  ).value;
  if (sortValue === "title-asc") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "title-desc") {
    results.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortValue === "date-asc") {
    results.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  } else {
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}

export function getFilteredEvidence(): Evidence[] {
  const allEvidence = getAllEvidence();
  const searchBox = document.getElementById(
    "evidenceSearch",
  ) as HTMLInputElement | null;
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = (document.getElementById("filterType") as HTMLSelectElement)
    .value;
  const personVal = (
    document.getElementById("filterPerson") as HTMLSelectElement
  ).value;
  const locationVal = (
    document.getElementById("filterLocation") as HTMLSelectElement
  ).value;
  const statusVal = (
    document.getElementById("filterStatus") as HTMLSelectElement
  ).value;
  const relevanceVal = (
    document.getElementById("filterRelevance") as HTMLSelectElement
  ).value;

  const results: Evidence[] = [];
  for (const item of allEvidence) {
    let matches = true;

    if (searchTerm) {
      const haystack = (
        item.title +
        " " +
        item.summary +
        " " +
        item.tags.join(" ")
      ).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal)
      matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPersonLocal(item, person))
        matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1)
      matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal)
      matches = false;
    if (
      matches &&
      relevanceVal &&
      (item.relevance || "").toLowerCase() !== relevanceVal
    )
      matches = false;

    if (matches) results.push(item);
  }

  setFilteredEvidence(results);
  return results;
}

export function renderEvidenceList(): void {
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
  // every call and overwrites the filteredEvidence state with it - so the
  // sort has to be re-applied here, on every render, to survive filter
  // changes too.
  applySelectedSortOrder(results);

  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (const ev of results) {
    html += renderEvidenceCardHTML(ev);
  }
  container.innerHTML = html;

  // Event delegation for card clicks / bookmark button.
  container.addEventListener("click", handleEvidenceListClick);
}

function renderEvidenceCardHTML(ev: Evidence): string {
  const isBookmarked = getBookmarks().indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html +=
    '<button class="bookmark-btn ' +
    (isBookmarked ? "active" : "") +
    '" data-action="bookmark" data-id="' +
    ev.id +
    '" aria-label="Toggle bookmark for ' +
    ev.title +
    '"><span class="bookmark-icon">' +
    (isBookmarked ? "★" : "☆") +
    "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html +=
    '<span class="badge ' +
    getStatusBadgeClass(ev.status) +
    '">' +
    ev.status +
    "</span>";
  html +=
    '<span class="badge ' +
    getRelevanceBadgeClass(ev.relevance) +
    '">' +
    ev.relevance +
    "</span>";
  html += "<div>";
  for (const tag of ev.tags) {
    html += '<span class="tag-chip">' + tag + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

function handleEvidenceListClick(event: Event): void {
  const target = event.target as HTMLElement;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    const id = target.dataset.id;
    if (id) handleBookmarkClick(id);
    return;
  }

  const card = target.closest(".evidence-card");
  if (card) {
    const id = card.getAttribute("data-id");
    if (id) openEvidenceDetail(id);
  }
}

function handleBookmarkClick(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  const bookmarks = getBookmarks();
  if (bookmarks.indexOf(evidenceId) === -1) {
    bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    setBookmarks(bookmarks.filter((id) => id !== evidenceId));
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (getCurrentPage() === "evidence") renderEvidenceList();
}

export function applyStoredBookmarkFlags(): void {
  const allEvidence = getAllEvidence();
  const bookmarks = getBookmarks();
  for (const ev of allEvidence) {
    ev.bookmarked = bookmarks.indexOf(ev.id) !== -1;
  }
}

export function handleSortChange(): void {
  // FIX (Demo 5): sorting now happens inside renderEvidenceList() itself
  // (via applySelectedSortOrder), every time it renders.
  renderEvidenceList();
}

export function clearFilters(): void {
  (document.getElementById("evidenceSearch") as HTMLInputElement).value = "";
  (document.getElementById("filterType") as HTMLSelectElement).value = "";
  (document.getElementById("filterPerson") as HTMLSelectElement).value = "";
  (document.getElementById("filterLocation") as HTMLSelectElement).value = "";
  (document.getElementById("filterStatus") as HTMLSelectElement).value = "";
  (document.getElementById("filterRelevance") as HTMLSelectElement).value = "";
  renderEvidenceList();
}

function simulateAsyncSearch(term: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(term);
    }, 300);
  });
}

let latestSearchRequestId = 0;

export function handleSearchInput(event: Event): void {
  const term = (event.target as HTMLInputElement).value;
  const requestId = ++latestSearchRequestId;

  simulateAsyncSearch(term).then(() => {
    // Only apply this response if nothing newer has been typed meanwhile.
    if (requestId !== latestSearchRequestId) return;
    renderEvidenceList();
  });
}

// --- evidence detail ----------------------------------------------------

export function openEvidenceDetail(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  setSelectedEvidence(ev);

  const section = document.getElementById("evidenceDetailSection")!;
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function closeEvidenceDetail(): void {
  const section = document.getElementById("evidenceDetailSection")!;
  section.classList.add("hidden");
  section.innerHTML = "";
  setSelectedEvidence(null);
}

function renderEvidenceDetail(ev: Evidence): void {
  const section = document.getElementById("evidenceDetailSection")!;

  const personNames: string[] = [];
  for (const personId of ev.personIds) {
    const person = findPersonById(personId);
    personNames.push(person ? person.name : personId);
  }

  const locationNames: string[] = [];
  for (const locationId of ev.locationIds) {
    const loc = findLocationById(locationId);
    locationNames.push(loc ? loc.id + " - " + loc.name : locationId);
  }

  let tagsHtml = "";
  for (const tag of ev.tags) {
    tagsHtml += '<span class="tag-chip">' + tag + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div></div>";
  html +=
    '<button type="button" id="closeEvidenceDetailBtn" class="btn btn-secondary btn-small">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html +=
      '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html +=
    '<div class="detail-field"><strong>Summary</strong>' +
    ev.summary +
    "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html +=
    '<div class="detail-field"><strong>Related people</strong>' +
    personNames.join(", ") +
    "</div>";
  html +=
    '<div class="detail-field"><strong>Related locations</strong>' +
    locationNames.join(", ") +
    "</div>";
  html +=
    '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

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
  html +=
    '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' +
    ev.id +
    '" placeholder="Add a private note about this evidence...">' +
    storedNote +
    "</textarea>";
  html +=
    '<button type="button" id="saveNoteBtn" class="btn btn-primary btn-small" style="margin-top:6px;">Save note</button>';
  html += "</div>";

  html +=
    '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' +
    storedNote +
    "</div></div>";

  section.innerHTML = html;

  document
    .getElementById("detailStatusSelect")!
    .addEventListener("change", (e) => {
      ev.status = (e.target as HTMLSelectElement).value; // direct mutation of the loaded evidence object
      renderEvidenceDetail(ev);
      if (getViewRendered().evidence) renderEvidenceList();
    });
  document
    .getElementById("detailRelevanceSelect")!
    .addEventListener("change", (e) => {
      ev.relevance = (e.target as HTMLSelectElement).value;
      renderEvidenceDetail(ev);
      if (getViewRendered().evidence) renderEvidenceList();
    });

  document
    .getElementById("closeEvidenceDetailBtn")!
    .addEventListener("click", closeEvidenceDetail);
  document
    .getElementById("saveNoteBtn")!
    .addEventListener("click", saveCurrentNote);
}

export function saveCurrentNote(): void {
  const textarea = document.getElementById(
    "evidenceNoteInput",
  ) as HTMLTextAreaElement | null;
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  if (!evidenceId) return;
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}

declare global {
  interface Window {
    handleSortChange: typeof handleSortChange;
  }
}
// index.html has onchange="handleSortChange()" as a static inline HTML
// attribute on #sortEvidence - out of scope to change from here.
window.handleSortChange = handleSortChange;
