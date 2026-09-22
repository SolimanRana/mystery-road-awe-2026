import {
  setCaseData,
  setAllPeople,
  setAllLocations,
  setAllEvidence,
  setAllTimeline,
  getAllEvidence,
  setFilteredEvidence,
  getCurrentPage,
  getLoadingStepsRemaining,
  setLoadingStepsRemaining,
  setEvidenceViewLoading,
} from "./state.js";
import renderDashboard from "./views/dashboard.js";
import {
  renderEvidenceList,
  populateEvidenceDropdowns,
  applyStoredBookmarkFlags,
} from "./views/evidence.js";
import { renderTimeline, populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";
import type {
  CaseData,
  Person,
  Location,
  Evidence,
  TimelineEvent,
} from "./types.js";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return (await res.json()) as T;
}

function showLoadingOverlay(msg: string): void {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep(): void {
  setLoadingStepsRemaining(getLoadingStepsRemaining() - 1);
  if (getLoadingStepsRemaining() <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

function populateAllDropdowns(): void {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}

async function loadCorePeopleAndLocations(): Promise<void> {
  const caseJson = await fetchJson<CaseData>("data/case.json");
  setCaseData(caseJson);

  const peopleJson = await fetchJson<Person[]>("data/people.json");
  setAllPeople(peopleJson);

  const locationsJson = await fetchJson<Location[]>("data/locations.json");
  setAllLocations(locationsJson);

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

async function loadEvidenceData(): Promise<void> {
  try {
    const data = await fetchJson<Evidence[]>("data/evidence.json");
    setAllEvidence(data);
    applyStoredBookmarkFlags();
    setEvidenceViewLoading(false);
    setFilteredEvidence((getAllEvidence() as Evidence[]).slice());
    renderDashboard();
    populateAllDropdowns();
    if (getCurrentPage() === "evidence") renderEvidenceList();
  } catch (err) {
    console.error("Failed to load evidence.json", err);
    alert("Evidence could not be loaded. Some views may be incomplete.");
  }
}

async function loadTimelineData(): Promise<void> {
  try {
    const data = await fetchJson<TimelineEvent[]>("data/timeline.json");
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

export default async function loadAllData(): Promise<void> {
  showLoadingOverlay("Loading case file…");
  setLoadingStepsRemaining(2);
  await loadCorePeopleAndLocations();
  loadEvidenceData();
  loadTimelineData();
}
