// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS VIEW
// ---------------------------------------------------------------------
//
// Two roughly equally important render functions (people, locations) plus
// the tab-switch - no single "primary" export here, so named exports.
//
// switchPeopleTab is invoked from onclick="switchPeopleTab('people')" in
// index.html, so (like closeEvidenceDetail/saveCurrentNote in evidence.js)
// it needs to exist on `window`, not just be exported from this module.
//
// Note: this module imports navigateTo from router.js, and router.js
// imports renderPeople/renderLocations from this module - a circular
// dependency, unaffected by the TS conversion (see the note in router.ts).

import {
  getAllEvidence,
  getAllPeople,
  getAllLocations,
  setCurrentPeopleTab,
} from "../state.js";
import { evidenceMentionsPerson } from "../utils.js";
import type { Person } from "../types.js";
import { navigateTo } from "../router.js";
import { renderEvidenceList } from "./evidence.js";

function countEvidenceForPerson(person: Person): number {
  const allEvidence = getAllEvidence();
  let count = 0;
  for (const ev of allEvidence) {
    if (evidenceMentionsPerson(ev, person)) count++;
  }
  return count;
}

export function switchPeopleTab(tab: string): void {
  setCurrentPeopleTab(tab);
  const peoplePanel = document.getElementById("peoplePanel")!;
  const locationsPanel = document.getElementById("locationsPanel")!;
  const peopleTabBtn = document.getElementById("tabPeopleBtn")!;
  const locationsTabBtn = document.getElementById("tabLocationsBtn")!;

  if (tab === "people") {
    peoplePanel.classList.remove("hidden");
    locationsPanel.classList.add("hidden");
    peopleTabBtn.classList.add("active");
    locationsTabBtn.classList.remove("active");
  } else {
    peoplePanel.classList.add("hidden");
    locationsPanel.classList.remove("hidden");
    peopleTabBtn.classList.remove("active");
    locationsTabBtn.classList.add("active");
  }
}

export function renderPeople(): void {
  const container = document.getElementById("peoplePanel");
  if (!container) return;
  const allPeople = getAllPeople();
  let html = "";
  for (const person of allPeople) {
    const count = countEvidenceForPerson(person);

    html += '<div class="person-card">';
    html += '<div class="person-card-header">';
    html +=
      '<img class="person-avatar" src="' +
      person.avatar +
      '" alt="Portrait of ' +
      person.name +
      '">';
    html +=
      "<div><h3>" +
      person.name +
      '</h3><div class="person-role">' +
      person.role +
      "</div></div>";
    html += "</div>";
    html += "<p><strong>Speciality:</strong> " + person.speciality + "</p>";
    html += "<ul>";
    for (const responsibility of person.responsibilities) {
      html += "<li>" + responsibility + "</li>";
    }
    html += "</ul>";
    html +=
      '<div class="person-statement">&ldquo;' +
      person.statement +
      "&rdquo;</div>";
    html +=
      "<p>" +
      count +
      " related evidence item" +
      (count === 1 ? "" : "s") +
      " &mdash; ";
    html +=
      '<button type="button" class="evidence-count-link" data-person-id="' +
      person.id +
      '">view</button></p>';
    html += "</div>";
  }
  container.innerHTML = html;

  const links = container.querySelectorAll<HTMLElement>(".evidence-count-link");
  for (const link of links) {
    link.addEventListener("click", (e) => {
      const personId = (e.target as HTMLElement).getAttribute("data-person-id");
      if (!personId) return;
      (document.getElementById("filterPerson") as HTMLSelectElement).value =
        personId;
      navigateTo("evidence");
      setTimeout(() => {
        renderEvidenceList();
      }, 0);
    });
  }
}

export function renderLocations(): void {
  const container = document.getElementById("locationsPanel");
  if (!container) return;
  const allLocations = getAllLocations();
  let html = "";
  for (const loc of allLocations) {
    html += '<div class="location-card">';
    html += "<h3>" + loc.id + " &mdash; " + loc.name + "</h3>";
    html += "<p>" + loc.description + "</p>";
    html += "<p><strong>Contains:</strong></p><ul>";
    for (const item of loc.contains) {
      html += "<li>" + item + "</li>";
    }
    html += "</ul></div>";
  }
  container.innerHTML = html;
}

declare global {
  interface Window {
    switchPeopleTab: typeof switchPeopleTab;
  }
}
window.switchPeopleTab = switchPeopleTab;
