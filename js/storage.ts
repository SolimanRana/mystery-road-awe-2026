import {
  STORAGE_KEY_BOOKMARKS,
  STORAGE_KEY_NOTES,
  getBookmarks,
  setBookmarks,
  getNotesStore,
  setNotesStore,
} from "./state.js";

type NotesStore = Record<string, string>;

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(getBookmarks()));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    setBookmarks(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    setBookmarks([]);
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  const notesStore = getNotesStore() as NotesStore;
  notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return (getNotesStore() as NotesStore)[evidenceId] || "";
}

export function loadNotesFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_NOTES);
  if (!raw) {
    setNotesStore({});
    return;
  }

  setNotesStore(JSON.parse(raw) as NotesStore);
}

export function loadNoteAsync(evidenceId: string): Promise<string> {
  return new Promise((resolve) => {
    resolve((getNotesStore() as NotesStore)[evidenceId] || "");
  });
}
