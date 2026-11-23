/** app.js — shell, navigation, routing and theme. */

import { actions, getState, onSaveError, subscribe, syncFromStorage } from '../state.js';
import { STORAGE_KEY } from '../storage.js';
import { brandMark, icon } from './icons.js';
import { renderDashboard } from './dashboard.js';
import { renderWeek } from './week.js';
import { renderWeeks } from './weeks.js';
import { renderSettings } from './settings.js';
import { renderOnboarding } from './onboarding.js';
import { openSpendingSheet } from './spending-sheet.js';
import { toast } from './toast.js';

const ROUTES = {
  dashboard: renderDashboard,
  week: renderWeek,
  weeks: renderWeeks,
  settings: renderSettings,
};

const NAV = [
  { key: 'dashboard', short: 'Home', long: 'Dashboard', icon: 'home' },
  { key: 'week', short: 'Week', long: 'This week', icon: 'list' },
  { key: 'weeks', short: 'Weeks', long: 'Week by week', icon: 'bars' },
  { key: 'settings', short: 'Settings', long: 'Settings', icon: 'sliders' },
];

let shell = null;

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return ROUTES[hash] ? hash : 'dashboard';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.getElementById('theme-color');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F7F4' : '#080B0A');
}

function toggleTheme() {
  const next = getState().settings.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.add('theme-fade');
  actions.updateSettings({ theme: next });
  setTimeout(() => document.documentElement.classList.remove('theme-fade'), 340);
}

function syncThemeButtons(theme) {
  if (!shell) return;
  const dark = theme === 'dark';
  shell.themeButtons.forEach((button) => {
    button.innerHTML = `${icon(dark ? 'sun' : 'moon')}${
      button.dataset.labelled ? `<span>${dark ? 'Light mode' : 'Dark mode'}</span>` : ''
    }`;
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function buildShell(app) {
  app.innerHTML = `<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#/dashboard">${brandMark(30)}<span>ZakFlow</span></a>
      <nav class="sidenav" aria-label="Main">
        ${NAV.map(
          (item) =>
            `<a class="navlink" data-nav="${item.key}" href="#/${item.key}">${icon(item.icon)}<span>${item.long}</span></a>`
        ).join('')}
      </nav>
      <div class="sidebar-foot">
        <button type="button" class="btn btn--primary btn--block" data-add>${icon('plus')} Add spending</button>
        <button type="button" class="navlink navlink--quiet" data-theme data-labelled="1"></button>
        <p class="sidebar-note">${icon('lock')} Saved on this device</p>
      </div>
    </aside>

    <div class="topbar">
      <a class="brand" href="#/dashboard">${brandMark(28)}<span>ZakFlow</span></a>
      <button type="button" class="icon-btn" data-theme></button>
    </div>

    <main class="main" id="view" tabindex="-1"></main>

    <nav class="tabbar" aria-label="Main">
      <a class="tab" data-nav="dashboard" href="#/dashboard"><span class="tab-ico">${icon('home')}</span><span class="tab-label">Home</span></a>
      <a class="tab" data-nav="week" href="#/week"><span class="tab-ico">${icon('list')}</span><span class="tab-label">Week</span></a>
      <button type="button" class="fab" data-add aria-label="Add spending">${icon('plus')}</button>
      <a class="tab" data-nav="weeks" href="#/weeks"><span class="tab-ico">${icon('bars')}</span><span class="tab-label">Weeks</span></a>
      <a class="tab" data-nav="settings" href="#/settings"><span class="tab-ico">${icon('sliders')}</span><span class="tab-label">Settings</span></a>
    </nav>
  </div>`;

  app.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => openSpendingSheet());
  });
  const themeButtons = [...app.querySelectorAll('[data-theme]')];
  themeButtons.forEach((button) => button.addEventListener('click', toggleTheme));

  shell = {
    app,
    view: app.querySelector('#view'),
    navs: [...app.querySelectorAll('[data-nav]')],
    themeButtons,
  };
}

function paint({ animate = false } = {}) {
  const state = getState();
  applyTheme(state.settings.theme);
  const app = document.getElementById('app');

  if (!state.onboarded) {
    shell = null;
    renderOnboarding(app);
    return;
  }

  if (!shell) buildShell(app);
  syncThemeButtons(state.settings.theme);

  const route = readRoute();
  shell.navs.forEach((nav) => nav.classList.toggle('is-active', nav.dataset.nav === route));

  const view = shell.view;
  const routeChanged = view.dataset.route !== route;
  view.dataset.route = route;
  view.innerHTML = '';
  const slot = document.createElement('div');
  slot.className = 'view-slot';
  view.appendChild(slot);
  ROUTES[route](slot, state);

  if (animate || routeChanged) {
    slot.classList.add('is-entering');
    window.scrollTo(0, 0);
  }
}

export function startApp() {
  subscribe(() => paint());
  window.addEventListener('hashchange', () => paint({ animate: true }));
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) syncFromStorage();
  });
  onSaveError(() => toast('Could not save to this browser. Storage may be full or blocked.'));
  paint({ animate: true });
}
