// ---------------------------------------------------------------------
// INVESTIGATOR WORKSPACE VIEW
// ---------------------------------------------------------------------
//
// renderWorkspace is the one thing router.js needs from here -> default
// export, same reasoning as views/dashboard.js. saveHypothesis is called
// from onclick="saveHypothesis()" in index.html, so (like switchPeopleTab
// and closeEvidenceDetail elsewhere) it also has to be attached to
// `window` explicitly.

import {
  getAllEvidence,
  getAllPeople,
  getNotesStore,
  STORAGE_KEY_HYPOTHESIS,
} from "../state.js";
import { getSelectedOptions } from "../utils.js";
import { navigateTo } from "../router.js";
import { openEvidenceDetail } from "./evidence.js";

interface HypothesisDraft {
  suspectId: string;
  nature: string;
  evidenceIds: string[];
  confidence: string;
  explanation: string;
  alternative: string;
  savedAt: string;
}

function renderBookmarksList(): void {
  const container = document.getElementById("bookmarksList");
  if (!container) return;

  const bookmarkedItems = getAllEvidence().filter((ev) => ev.bookmarked);

  if (bookmarkedItems.length === 0) {
    container.innerHTML =
      "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (const ev of bookmarkedItems) {
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' +
      ev.id +
      '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll<HTMLElement>(
    "[data-open-evidence]",
  );
  for (const btn of openButtons) {
    btn.addEventListener("click", (e) => {
      navigateTo("evidence");
      const id = (e.target as HTMLElement).getAttribute("data-open-evidence");
      setTimeout(() => {
        if (id) openEvidenceDetail(id);
      }, 0);
    });
  }
}

function renderNotesList(): void {
  const container = document.getElementById("notesList");
  if (!container) return;

  const allEvidence = getAllEvidence();
  const notesStore = getNotesStore();
  const noteEntries: {
    index: number;
    evidenceId: string;
    title: string;
    text: string;
  }[] = [];
  allEvidence.forEach((ev, i) => {
    const note = notesStore[ev.id];
    if (note) {
      noteEntries.push({
        index: i,
        evidenceId: ev.id,
        title: ev.title,
        text: note,
      });
    }
  });

  if (noteEntries.length === 0) {
    container.innerHTML =
      "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (const entry of noteEntries) {
    html +=
      '<div class="mini-list-item"><strong>' +
      entry.evidenceId +
      "</strong> &mdash; " +
      entry.title;
    html +=
      '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // unsafe innerHTML rendering, same as the note preview
  }
  container.innerHTML = html;
}

export function populateHypothesisDropdowns(): void {
  const suspectSelect = document.getElementById(
    "hypSuspect",
  ) as HTMLSelectElement | null;
  const evidenceSelect = document.getElementById(
    "hypEvidence",
  ) as HTMLSelectElement | null;
  if (!suspectSelect || !evidenceSelect) return;

  const allPeople = getAllPeople();
  const allEvidence = getAllEvidence();

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = '<option value="">Select a person…</option>';
  for (const person of allPeople) {
    suspectSelect.innerHTML +=
      '<option value="' + person.id + '">' + person.name + "</option>";
  }
  suspectSelect.value = currentSuspect;

  evidenceSelect.innerHTML = "";
  for (const ev of allEvidence) {
    evidenceSelect.innerHTML +=
      '<option value="' + ev.id + '">' + ev.id + " - " + ev.title + "</option>";
  }
}

export function saveHypothesis(): void {
  const draft: HypothesisDraft = {
    suspectId: (document.getElementById("hypSuspect") as HTMLSelectElement)
      .value,
    nature: (document.getElementById("hypNature") as HTMLInputElement).value,
    evidenceIds: getSelectedOptions(
      document.getElementById("hypEvidence") as HTMLSelectElement,
    ),
    confidence: (document.getElementById("hypConfidence") as HTMLInputElement)
      .value,
    explanation: (
      document.getElementById("hypExplanation") as HTMLTextAreaElement
    ).value,
    alternative: (
      document.getElementById("hypAlternative") as HTMLTextAreaElement
    ).value,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draft));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = document.getElementById("hypothesisSavedMsg")!;
  msg.classList.remove("hidden");
  setTimeout(() => {
    msg.classList.add("hidden");
  }, 2000);
}

function loadHypothesisFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
  if (!raw) return;

  const draft = JSON.parse(raw) as Partial<HypothesisDraft>;

  (document.getElementById("hypSuspect") as HTMLSelectElement).value =
    draft.suspectId || "";
  (document.getElementById("hypNature") as HTMLInputElement).value =
    draft.nature || "";
  (document.getElementById("hypConfidence") as HTMLInputElement).value =
    draft.confidence || "50";
  document.getElementById("hypConfidenceValue")!.textContent =
    draft.confidence || "50";
  (document.getElementById("hypExplanation") as HTMLTextAreaElement).value =
    draft.explanation || "";
  (document.getElementById("hypAlternative") as HTMLTextAreaElement).value =
    draft.alternative || "";

  const evidenceSelect = document.getElementById(
    "hypEvidence",
  ) as HTMLSelectElement;
  const savedIds = draft.evidenceIds || [];
  for (const option of evidenceSelect.options) {
    option.selected = savedIds.indexOf(option.value) !== -1;
  }
}

export default function renderWorkspace(): void {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

declare global {
  interface Window {
    saveHypothesis: typeof saveHypothesis;
  }
}
window.saveHypothesis = saveHypothesis;
