// ---------------------------------------------------------------------
// TIMELINE VIEW
// ---------------------------------------------------------------------

import {
  getAllPeople,
  getAllLocations,
  getAllTimeline,
  getModalCloseListenerCount,
  setModalCloseListenerCount,
} from "../state.js";
import { findLocationById, findEvidenceById, formatDate } from "../utils.js";
import { navigateTo } from "../router.js";
import { openEvidenceDetail } from "./evidence.js";

export function populateTimelineDropdowns(): void {
  const personSelect = document.getElementById(
    "timelinePersonFilter",
  ) as HTMLSelectElement | null;
  const locationSelect = document.getElementById(
    "timelineLocationFilter",
  ) as HTMLSelectElement | null;
  const typeSelect = document.getElementById(
    "timelineTypeFilter",
  ) as HTMLSelectElement | null;
  if (!personSelect || !locationSelect || !typeSelect) return;

  const allPeople = getAllPeople();
  const allLocations = getAllLocations();
  const allTimeline = getAllTimeline();

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of allPeople) {
    personSelect.innerHTML +=
      '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of allLocations) {
    locationSelect.innerHTML +=
      '<option value="' + loc.id + '">' + loc.id + "</option>";
  }

  const types: string[] = [];
  for (const evt of allTimeline) {
    if (types.indexOf(evt.type) === -1) types.push(evt.type);
  }
  typeSelect.innerHTML = '<option value="">All event types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }
}

export function renderTimeline(): void {
  const container = document.getElementById("timelineContainer");
  if (!container) return;

  const allTimeline = getAllTimeline();

  const order = (document.getElementById("timelineOrder") as HTMLSelectElement)
    .value;
  const personFilter = (
    document.getElementById("timelinePersonFilter") as HTMLSelectElement
  ).value;
  const locationFilter = (
    document.getElementById("timelineLocationFilter") as HTMLSelectElement
  ).value;
  const typeFilter = (
    document.getElementById("timelineTypeFilter") as HTMLSelectElement
  ).value;

  let events = [];
  for (const evt of allTimeline) {
    if (personFilter && evt.personIds.indexOf(personFilter) === -1) continue;
    if (locationFilter && evt.locationIds.indexOf(locationFilter) === -1)
      continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    events.push(evt);
  }

  events = events.slice().sort((a, b) => {
    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (const item of events) {
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html +=
      '<div class="timeline-time">' +
      formatDate(item.time) +
      '&nbsp;&middot;&nbsp;<span class="badge badge-' +
      certaintyBadgeClass(item.certainty) +
      '">' +
      item.certainty +
      "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    // DEMO 7 - real bug, not just compiler noise: the original JS pushed
    // `evtLoc || item.locationIds[el]` straight into eventLocationNames.
    // findLocationById returns a whole Location object (or null), and
    // Array<string>.push(Location) is exactly the kind of mistake plain
    // JS never complains about - the array silently ends up holding
    // objects, and .join(", ") on it would print "[object Object]"
    // instead of a location name for every ID that DID resolve.
    // Typing eventLocationNames as string[] makes TypeScript refuse to
    // compile `eventLocationNames.push(evtLoc || ...)` as-is - which is
    // exactly what forced writing `evtLoc.name` here instead. See the
    // Demo 7 writeup for what this looked like on screen before the fix.
    const eventLocationNames: string[] = [];
    for (const locId of item.locationIds) {
      const evtLoc = findLocationById(locId);
      eventLocationNames.push(evtLoc ? evtLoc.name : locId);
    }
    if (eventLocationNames.length > 0) {
      html +=
        '<p class="evidence-meta">Location: ' +
        eventLocationNames.join(", ") +
        "</p>";
    }

    for (const evidenceId of item.evidenceIds) {
      html +=
        '<button type="button" class="evidence-link-btn" data-evidence-id="' +
        evidenceId +
        '">View ' +
        evidenceId +
        "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons =
    container.querySelectorAll<HTMLElement>(".evidence-link-btn");
  for (const btn of linkButtons) {
    btn.addEventListener("click", (e) => {
      const id = (e.target as HTMLElement).getAttribute("data-evidence-id");
      if (id) openEvidenceModal(id);
    });
  }
}

function certaintyBadgeClass(certainty: string): string {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
}

// --- Quick-view modal (used from the timeline) -------------------------
// Not exported: nothing outside this module ever calls it directly, it's
// only reached through the click listener wired up in renderTimeline above.
function openEvidenceModal(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  // FIX (Demo 5): the old code reused the SAME #quickViewModal element
  // across every call and, every time, attached ANOTHER click listener to
  // it with addEventListener - the old listeners were never removed, so
  // modalCloseListenerCount climbed by 1 on every open. Fix: throw away
  // the old modal element entirely (its listener goes with it) and build
  // a fresh one every time, so there's always exactly one listener attached.
  const oldModal = document.getElementById("quickViewModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "quickViewModal";
  document.body.appendChild(modal);

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" +
    ev.title +
    "</h3>" +
    '<p class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</p>" +
    "<p>" +
    ev.summary +
    "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' +
    ev.id +
    '">Open full evidence</button>' +
    "</div></div>";

  // Always exactly 1 now - this counter existed to make the leak above
  // observable; it staying at 1 no matter how many times you reopen the
  // modal is how you verify the fix.
  setModalCloseListenerCount(1);
  console.log(
    "modal opened, active close listeners:",
    getModalCloseListenerCount(),
  );

  modal.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("modal-close-btn") ||
      target.classList.contains("modal-backdrop")
    ) {
      modal.remove();
    }
    const openFullId =
      target.getAttribute && target.getAttribute("data-open-full");
    if (openFullId) {
      modal.remove();
      navigateTo("evidence");
      setTimeout(() => {
        openEvidenceDetail(openFullId);
      }, 0);
    }
  });
}
