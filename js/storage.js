// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
//
// Hypothesis save/load stayed in views/workspace.js on purpose - those two
// functions are tightly wired to the hypothesis form's DOM elements, so
// moving just the localStorage.setItem/getItem call here would split one
// coherent piece of behaviour across two files for no real benefit.

import {
  STORAGE_KEY_BOOKMARKS,
  STORAGE_KEY_NOTES,
  getBookmarks,
  setBookmarks,
  getNotesStore,
  setNotesStore
} from "./state.js";

export function saveBookmarksToStorage() {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(getBookmarks()));
}

export function loadBookmarksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed = raw ? JSON.parse(raw) : [];
    setBookmarks(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    setBookmarks([]);
  }
}

export function saveNoteForEvidence(evidenceId, text) {
  const notesStore = getNotesStore();
  notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notesStore));
}

export function loadNoteForEvidence(evidenceId) {
  return getNotesStore()[evidenceId] || "";
}

export function loadNotesFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_NOTES);
  if (!raw) {
    setNotesStore({});
    return;
  }

  setNotesStore(JSON.parse(raw));
}

export function loadNoteAsync(evidenceId) {
  return new Promise(function (resolve) {
    resolve(getNotesStore()[evidenceId] || "");
  });
}