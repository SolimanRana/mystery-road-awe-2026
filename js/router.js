// ---------------------------------------------------------------------
// NAVIGATION / HASH ROUTING
// ---------------------------------------------------------------------
//
// Both functions are needed elsewhere: navigateTo from onclick="..." in
// index.html (-> window) and from other view modules (-> named export);
// handleHashChange from main.js, to wire up the hashchange listener and
// to run once on startup.
//
// DEMO 10 - deliberately NOT converted to arrow functions: this module and
// views/people.js import from each other (router.js imports
// renderPeople/renderLocations from people.js on line 13; people.js
// imports navigateTo back from router.js). Function declarations are
// fully hoisted - usable the instant a module starts evaluating, before
// any of its other top-level code has run. `const`/`let` bindings
// (including `const navigateTo = () => {}`) are NOT usable until their
// declaration line has actually executed; they sit in the "temporal dead
// zone" until then. In a normal, non-circular import that distinction
// never matters. But in a circular import, one module can start running
// while the other is only partially finished initializing - if anything
// ever called into this cycle during that window, a function declaration
// would still work while a const arrow function would throw
// "Cannot access 'navigateTo' before initialization". Nothing in this
// app hits that window today (navigateTo is only ever called from inside
// later event handlers, not from top-level module code), so nothing
// would break right now - but converting it would trade a real safety
// margin for a purely cosmetic win, so it stays a function declaration.

import { getViewRendered, setCurrentPage } from "./state.js";
import renderDashboard from "./views/dashboard.js";
import { renderEvidenceList } from "./views/evidence.js";
import { renderPeople, renderLocations } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import renderWorkspace from "./views/workspace.js";

export function navigateTo(viewName) {
  window.location.hash = viewName;
  // handleHashChange() will pick this up via the hashchange listener
}

export function handleHashChange() {
  let hash = window.location.hash.replace("#", "");
  const validViews = ["dashboard", "evidence", "people", "timeline", "workspace"];
  if (validViews.indexOf(hash) === -1) {
    hash = "dashboard";
  }
  setCurrentPage(hash);

  const sections = document.querySelectorAll(".view");
  for (let i = 0; i < sections.length; i++) {
    sections[i].classList.remove("active");
  }
  document.getElementById("view-" + hash).classList.add("active");

  const navButtons = document.querySelectorAll(".nav-btn");
  for (let n = 0; n < navButtons.length; n++) {
    navButtons[n].classList.remove("active");
    if (navButtons[n].getAttribute("data-view") === hash) {
      navButtons[n].classList.add("active");
    }
  }

  const viewRendered = getViewRendered();

  if (hash === "dashboard" && !viewRendered.dashboard) {
    renderDashboard();
    viewRendered.dashboard = true;
  } else if (hash === "evidence" && !viewRendered.evidence) {
    renderEvidenceList();
    viewRendered.evidence = true;
  } else if (hash === "people" && !viewRendered.people) {
    renderPeople();
    renderLocations();
    viewRendered.people = true;
  } else if (hash === "timeline" && !viewRendered.timeline) {
    renderTimeline();
    viewRendered.timeline = true;
  } else if (hash === "workspace") {
    // workspace is cheap enough that it always re-renders
    renderWorkspace();
  }
}

window.navigateTo = navigateTo;