/* 2ndMBstudy — Main Application Entry & View Router */
/* Designed by Davidesign */

import { APP_CONFIG } from './config/app-config.js';
import { initStore, getSnapshot, updatePreferences } from './state/app-store.js';
import { renderDashboardView } from './views/dashboard-view.js';
import { renderSyllabusView } from './views/syllabus-view.js';
import { renderTimerView } from './views/timer-view.js';
import { renderPlannerView } from './views/planner-view.js';
import { renderAnalyticsView } from './views/analytics-view.js';
import { renderAiCoachView } from './views/ai-coach-view.js';
import { renderMaterialsView } from './views/materials-view.js';
import { openUpgradeModal } from './components/upgrade-modal.js';
import { showToast } from './components/toast.js';

const VALID_VIEWS = Object.freeze([
  'dashboard',
  'syllabus',
  'timer',
  'planner',
  'analytics',
  'ai-coach',
  'materials'
]);

const VIEW_TITLES = Object.freeze({
  dashboard: 'Dashboard',
  syllabus: '2nd MB Syllabus',
  timer: 'Study Timer',
  planner: 'Planner & Timetable',
  analytics: 'Analytics & Backup',
  'ai-coach': '2nd MB AI Coach',
  materials: 'Study Materials'
});

let activeView = 'dashboard';
let activeCleanup = null;

function applyPreferencesToDom(prefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.theme === 'dark' ? 'dark' : 'light');
  root.setAttribute('data-font-scale', prefs.fontScale || 'md');
  root.setAttribute(
    'data-accent',
    ['teal', 'indigo', 'emerald'].includes(prefs.accent) ? prefs.accent : 'teal'
  );
}

function syncHeaderAndNavState() {
  const snap = getSnapshot();
  const { prefs, uiCache } = snap;
  applyPreferencesToDom(prefs);

  document.querySelectorAll('[data-nav-view]').forEach((btn) => {
    const target = btn.getAttribute('data-nav-view');
    const isCurrent = target === activeView;
    btn.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  const contextTitle = document.getElementById('header-context-title');
  if (contextTitle) {
    contextTitle.textContent = VIEW_TITLES[activeView] || 'Dashboard';
  }

  const planBadge = document.getElementById('header-plan-badge');
  if (planBadge) {
    planBadge.textContent = uiCache.isPremium ? 'Premium · Unlimited' : 'Free · ₦1,000 Once';
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    const isDark = prefs.theme === 'dark';
    themeBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  const fontBtn = document.getElementById('font-scale-btn');
  if (fontBtn) {
    const order = ['sm', 'md', 'lg'];
    const idx = order.indexOf(prefs.fontScale || 'md');
    const nextScale = order[(idx + 1) % order.length];
    fontBtn.textContent = `A/a (${(prefs.fontScale || 'md').toUpperCase()})`;
    fontBtn.setAttribute('title', `Cycle text size to ${nextScale.toUpperCase()}`);
  }
}

function parseViewFromHash() {
  const raw = String(window.location.hash || '').replace(/^#\/?/, '').trim();
  return VALID_VIEWS.includes(raw) ? raw : null;
}

export function navigateToView(viewName, context = null, { updateHash = true } = {}) {
  const nextView = VALID_VIEWS.includes(viewName) ? viewName : 'dashboard';
  activeView = nextView;

  if (updateHash && window.location.hash !== `#${nextView}`) {
    try {
      window.history.replaceState(null, '', `#${nextView}`);
    } catch {
      window.location.hash = `#${nextView}`;
    }
  }

  syncHeaderAndNavState();

  const viewHost = document.getElementById('view-container');
  if (!viewHost) return;

  if (typeof activeCleanup === 'function') {
    try {
      activeCleanup();
    } catch {
      // Ignore cleanup errors
    }
    activeCleanup = null;
  }

  const snap = getSnapshot();
  if (snap.loading && !snap.initialized) {
    viewHost.innerHTML = `
      <div class="state-card">
        <p class="state-title">Loading ${APP_CONFIG.brandName}...</p>
        <p class="state-desc">Preparing your local 2nd MB syllabus progress and study workspace.</p>
      </div>
    `;
    return;
  }

  if (snap.error) {
    viewHost.innerHTML = `
      <div class="state-card state-error">
        <p class="state-title">Storage Initialization Issue</p>
        <p class="state-desc">${String(snap.error)}</p>
        <button type="button" id="retry-init-btn" class="btn btn-primary btn-sm">Retry</button>
      </div>
    `;
    document.getElementById('retry-init-btn')?.addEventListener('click', () => {
      initStore();
    });
    return;
  }

  const navCallbacks = {
    onNavigateView: (targetView, ctx) => navigateToView(targetView, ctx),
    initialContext: context
  };

  if (nextView === 'dashboard') {
    activeCleanup = renderDashboardView(viewHost, navCallbacks) || null;
  } else if (nextView === 'syllabus') {
    activeCleanup = renderSyllabusView(viewHost, navCallbacks) || null;
  } else if (nextView === 'timer') {
    activeCleanup = renderTimerView(viewHost, navCallbacks) || null;
  } else if (nextView === 'planner') {
    activeCleanup = renderPlannerView(viewHost, navCallbacks) || null;
  } else if (nextView === 'analytics') {
    activeCleanup = renderAnalyticsView(viewHost, navCallbacks) || null;
  } else if (nextView === 'ai-coach') {
    activeCleanup = renderAiCoachView(viewHost, navCallbacks) || null;
  } else if (nextView === 'materials') {
    activeCleanup = renderMaterialsView(viewHost, navCallbacks) || null;
  }

  document.title = `${VIEW_TITLES[nextView] || 'Dashboard'} · ${APP_CONFIG.brandName}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindShellControls() {
  document.querySelectorAll('[data-nav-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-nav-view');
      if (targetView) {
        navigateToView(targetView);
      }
    });
  });

  document.getElementById('header-upgrade-btn')?.addEventListener('click', () => {
    openUpgradeModal({
      onUnlocked: () => {
        syncHeaderAndNavState();
        navigateToView(activeView);
      }
    });
  });

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    const current = getSnapshot().prefs.theme;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
    syncHeaderAndNavState();
    showToast(`Switched to ${nextTheme} theme.`, { variant: 'info' });
  });

  document.getElementById('font-scale-btn')?.addEventListener('click', () => {
    const order = ['sm', 'md', 'lg'];
    const current = getSnapshot().prefs.fontScale || 'md';
    const nextScale = order[(order.indexOf(current) + 1) % order.length];
    updatePreferences({ fontScale: nextScale });
    syncHeaderAndNavState();
    showToast(`Text size set to ${nextScale.toUpperCase()}.`, { variant: 'info' });
  });

  window.addEventListener('hashchange', () => {
    const hashView = parseViewFromHash();
    if (hashView && hashView !== activeView) {
      navigateToView(hashView, null, { updateHash: false });
    }
  });
}

async function boot() {
  const initialHashView = parseViewFromHash();
  if (initialHashView) {
    activeView = initialHashView;
  }

  syncHeaderAndNavState();
  bindShellControls();
  navigateToView(activeView, null, { updateHash: false });

  await initStore();
  syncHeaderAndNavState();
  navigateToView(activeView, null, { updateHash: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
