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
// dependency. It still works because every one of these is a `function`
// declaration, which is hoisted during scope preparation (see the
// theory guide, chapter 5.6 / the "a cycle that works" exercise) - by the
// time any of them actually runs, both modules have finished loading.

import { getAllEvidence, getAllPeople, getAllLocations, setCurrentPeopleTab } from "../state.js";
import { evidenceMentionsPerson } from "../utils.js";
import { navigateTo } from "../router.js";
import { renderEvidenceList } from "./evidence.js";

function countEvidenceForPerson(person) {
  const allEvidence = getAllEvidence();
  let count = 0;
  for (let i = 0; i < allEvidence.length; i++) {
    if (evidenceMentionsPerson(allEvidence[i], person)) count++;
  }
  return count;
}

export function switchPeopleTab(tab) {
  setCurrentPeopleTab(tab);
  const peoplePanel = document.getElementById("peoplePanel");
  const locationsPanel = document.getElementById("locationsPanel");
  const peopleTabBtn = document.getElementById("tabPeopleBtn");
  const locationsTabBtn = document.getElementById("tabLocationsBtn");

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

export function renderPeople() {
  const container = document.getElementById("peoplePanel");
  const allPeople = getAllPeople();
  let html = "";
  for (let i = 0; i < allPeople.length; i++) {
    const person = allPeople[i];
    const count = countEvidenceForPerson(person);

    html += '<div class="person-card">';
    html += '<div class="person-card-header">';
    html += '<img class="person-avatar" src="' + person.avatar + '" alt="Portrait of ' + person.name + '">';
    html += "<div><h3>" + person.name + "</h3><div class=\"person-role\">" + person.role + "</div></div>";
    html += "</div>";
    html += "<p><strong>Speciality:</strong> " + person.speciality + "</p>";
    html += "<ul>";
    for (let r = 0; r < person.responsibilities.length; r++) {
      html += "<li>" + person.responsibilities[r] + "</li>";
    }
    html += "</ul>";
    html += '<div class="person-statement">&ldquo;' + person.statement + '&rdquo;</div>';
    html += "<p>" + count + " related evidence item" + (count === 1 ? "" : "s") + " &mdash; ";
    html += '<button type="button" class="evidence-count-link" data-person-id="' + person.id + '">view</button></p>';
    html += "</div>";
  }
  container.innerHTML = html;

  const links = container.querySelectorAll(".evidence-count-link");
  for (let l = 0; l < links.length; l++) {
    links[l].addEventListener("click", function (e) {
      const personId = e.target.getAttribute("data-person-id");
      document.getElementById("filterPerson").value = personId;
      navigateTo("evidence");
      setTimeout(function () {
        renderEvidenceList();
      }, 0);
    });
  }
}

export function renderLocations() {
  const container = document.getElementById("locationsPanel");
  const allLocations = getAllLocations();
  let html = "";
  for (let i = 0; i < allLocations.length; i++) {
    const loc = allLocations[i];
    html += '<div class="location-card">';
    html += "<h3>" + loc.id + " &mdash; " + loc.name + "</h3>";
    html += "<p>" + loc.description + "</p>";
    html += "<p><strong>Contains:</strong></p><ul>";
    for (let c = 0; c < loc.contains.length; c++) {
      html += "<li>" + loc.contains[c] + "</li>";
    }
    html += "</ul></div>";
  }
  container.innerHTML = html;
}

window.switchPeopleTab = switchPeopleTab;