/* 2ndMBstudy — Lightweight Browser Preferences (localStorage) */
/* Note: localStorage is for UI preferences and non-authoritative display cache only. */
/* Never use localStorage alone to authenticate users, enforce AI caps, or prove Premium access. */

import { APP_CONFIG } from '../config/app-config.js';

const DEFAULT_FOCUS_MINUTES = Number(APP_CONFIG?.timerPresets?.defaultFocusMinutes) || 25;
const DEFAULT_BREAK_MINUTES = Number(APP_CONFIG?.timerPresets?.defaultBreakMinutes) || 5;
const DEFAULT_EXAM_DATE =
  typeof APP_CONFIG?.defaultExamDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(APP_CONFIG.defaultExamDate)
    ? APP_CONFIG.defaultExamDate
    : '2027-03-01';
const DEFAULT_EXAM_TITLE =
  typeof APP_CONFIG?.defaultExamTitle === 'string' && APP_CONFIG.defaultExamTitle.trim()
    ? APP_CONFIG.defaultExamTitle.trim()
    : '2nd MB Professional Exams';
const STORAGE_PREFIX =
  typeof APP_CONFIG?.localStoragePrefix === 'string' && APP_CONFIG.localStoragePrefix.trim()
    ? APP_CONFIG.localStoragePrefix.trim()
    : '2ndmbstudy_';

const DEFAULT_PREFS = Object.freeze({
  theme: 'light',
  fontScale: 'md',
  accent: 'teal',
  soundEnabled: true,
  focusMinutes: DEFAULT_FOCUS_MINUTES,
  breakMinutes: DEFAULT_BREAK_MINUTES,
  activeView: 'dashboard',
  examDate: DEFAULT_EXAM_DATE,
  examTitle: DEFAULT_EXAM_TITLE,
  studentName: 'Student'
});

const DEFAULT_UI_CACHE = Object.freeze({
  isPremium: false,
  paymentReference: '',
  usedAiInteractions: 0,
  updatedAt: null
});

function keyFor(name) {
  return `${STORAGE_PREFIX}${name}`;
}

function safeGetRaw(fullKey) {
  try {
    return window.localStorage.getItem(fullKey);
  } catch {
    return null;
  }
}

function safeSetRaw(fullKey, value) {
  try {
    window.localStorage.setItem(fullKey, value);
    return true;
  } catch {
    return false;
  }
}

export function loadPreferences() {
  const raw = safeGetRaw(keyFor('prefs'));
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(raw);
    const theme = parsed && parsed.theme === 'dark' ? 'dark' : 'light';
    const fontScale =
      parsed && ['sm', 'md', 'lg'].includes(parsed.fontScale) ? parsed.fontScale : DEFAULT_PREFS.fontScale;
    const accent =
      parsed && ['teal', 'indigo', 'emerald'].includes(parsed.accent) ? parsed.accent : DEFAULT_PREFS.accent;
    const soundEnabled = parsed && typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true;
    const focusMinutes =
      parsed && Number.isFinite(Number(parsed.focusMinutes)) && Number(parsed.focusMinutes) >= 1 && Number(parsed.focusMinutes) <= 240
        ? Number(parsed.focusMinutes)
        : DEFAULT_PREFS.focusMinutes;
    const breakMinutes =
      parsed && Number.isFinite(Number(parsed.breakMinutes)) && Number(parsed.breakMinutes) >= 1 && Number(parsed.breakMinutes) <= 120
        ? Number(parsed.breakMinutes)
        : DEFAULT_PREFS.breakMinutes;
    const activeView =
      parsed && typeof parsed.activeView === 'string' && parsed.activeView.trim()
        ? parsed.activeView.trim()
        : DEFAULT_PREFS.activeView;
    const examDate =
      parsed && typeof parsed.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.examDate)
        ? parsed.examDate
        : DEFAULT_PREFS.examDate;
    const examTitle =
      parsed && typeof parsed.examTitle === 'string' && parsed.examTitle.trim()
        ? parsed.examTitle.trim().slice(0, 120)
        : DEFAULT_PREFS.examTitle;
    const studentName =
      parsed && typeof parsed.studentName === 'string' && parsed.studentName.trim()
        ? parsed.studentName.trim().slice(0, 60)
        : DEFAULT_PREFS.studentName;

    return {
      theme,
      fontScale,
      accent,
      soundEnabled,
      focusMinutes,
      breakMinutes,
      activeView,
      examDate,
      examTitle,
      studentName
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePreferences(partialPrefs = {}) {
  const current = loadPreferences();
  const next = {
    ...current,
    ...(partialPrefs && typeof partialPrefs === 'object' ? partialPrefs : {})
  };
  const normalized = {
    theme: next.theme === 'dark' ? 'dark' : 'light',
    fontScale: ['sm', 'md', 'lg'].includes(next.fontScale) ? next.fontScale : DEFAULT_PREFS.fontScale,
    accent: ['teal', 'indigo', 'emerald'].includes(next.accent) ? next.accent : DEFAULT_PREFS.accent,
    soundEnabled: Boolean(next.soundEnabled),
    focusMinutes: Math.min(240, Math.max(1, Number(next.focusMinutes) || DEFAULT_PREFS.focusMinutes)),
    breakMinutes: Math.min(120, Math.max(1, Number(next.breakMinutes) || DEFAULT_PREFS.breakMinutes)),
    activeView: typeof next.activeView === 'string' && next.activeView ? next.activeView : DEFAULT_PREFS.activeView,
    examDate: typeof next.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(next.examDate) ? next.examDate : DEFAULT_PREFS.examDate,
    examTitle: typeof next.examTitle === 'string' && next.examTitle.trim() ? next.examTitle.trim().slice(0, 120) : DEFAULT_PREFS.examTitle,
    studentName: typeof next.studentName === 'string' && next.studentName.trim() ? next.studentName.trim().slice(0, 60) : DEFAULT_PREFS.studentName
  };
  safeSetRaw(keyFor('prefs'), JSON.stringify(normalized));
  return normalized;
}

export function loadUiCache() {
  const raw = safeGetRaw(keyFor('ui_cache'));
  if (!raw) return { ...DEFAULT_UI_CACHE };
  try {
    const parsed = JSON.parse(raw);
    return {
      isPremium: Boolean(parsed && parsed.isPremium),
      paymentReference: parsed && typeof parsed.paymentReference === 'string' ? parsed.paymentReference.trim().slice(0, 80) : '',
      usedAiInteractions:
        parsed && Number.isFinite(Number(parsed.usedAiInteractions))
          ? Math.max(0, Math.floor(Number(parsed.usedAiInteractions)))
          : 0,
      updatedAt: parsed && typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null
    };
  } catch {
    return { ...DEFAULT_UI_CACHE };
  }
}

export function saveUiCache(partialCache = {}) {
  const current = loadUiCache();
  const next = {
    isPremium: partialCache && typeof partialCache.isPremium === 'boolean' ? partialCache.isPremium : current.isPremium,
    paymentReference:
      partialCache && typeof partialCache.paymentReference === 'string'
        ? partialCache.paymentReference.trim().slice(0, 80)
        : current.paymentReference,
    usedAiInteractions:
      partialCache && Number.isFinite(Number(partialCache.usedAiInteractions))
        ? Math.max(0, Math.floor(Number(partialCache.usedAiInteractions)))
        : current.usedAiInteractions,
    updatedAt: new Date().toISOString()
  };
  safeSetRaw(keyFor('ui_cache'), JSON.stringify(next));
  return next;
}
