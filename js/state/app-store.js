/* 2ndMBstudy — Central Application State & Business Rules Store */

import { APP_CONFIG } from '../config/app-config.js';
import { CURRICULUM_SECTIONS, OFFICIAL_TOPICS } from '../config/curriculum-data.js';
import { loadPreferences, savePreferences, loadUiCache, saveUiCache } from './storage-local.js';
import {
  loadAllLocalStudyData,
  putRecord,
  deleteRecord,
  exportStudyBackupJson,
  restoreStudyBackupJson
} from './storage-db.js';

const listeners = new Set();

function todayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const state = {
  initialized: false,
  loading: true,
  error: null,
  prefs: loadPreferences(),
  uiCache: loadUiCache(),
  topicStatesMap: new Map(),
  customTopics: [],
  categories: [],
  sessions: [],
  tasks: [],
  timetable: [],
  materials: [],
  aiChats: [],
  lastUndoAction: null
};

function notify() {
  for (const fn of listeners) {
    try {
      fn(getSnapshot());
    } catch {
      // Isolate listener errors
    }
  }
}

export function subscribe(listenerFn) {
  listeners.add(listenerFn);
  return () => listeners.delete(listenerFn);
}

export function getTopicState(topicId) {
  return (
    state.topicStatesMap.get(topicId) || {
      topicId,
      status: 'not_started',
      tracked: false,
      favourite: false,
      notes: '',
      lastDriveOpenedAt: null,
      updatedAt: null
    }
  );
}

export function getTrackedOfficialTopicIds() {
  const ids = [];
  for (const [topicId, rec] of state.topicStatesMap.entries()) {
    if (rec && rec.tracked && OFFICIAL_TOPICS.some((t) => t.id === topicId)) {
      ids.push(topicId);
    }
  }
  return ids;
}

export function isPremiumActive() {
  return Boolean(state.uiCache && state.uiCache.isPremium);
}

export function getRemainingFreeAiInteractions() {
  if (isPremiumActive()) return Infinity;
  const used = Number(state.uiCache?.usedAiInteractions || 0);
  return Math.max(0, APP_CONFIG.pricing.freeMaxAiInteractions - used);
}

export function computeStudyStats() {
  const totalOfficial = OFFICIAL_TOPICS.length;
  let completedOfficial = 0;
  let inProgressOfficial = 0;
  let notStartedOfficial = 0;

  const bySubject = {
    Anatomy: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    Biochemistry: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    Physiology: { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
  };

  const bySemester = {
    1: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    2: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
    3: { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
  };

  for (const topic of OFFICIAL_TOPICS) {
    const rec = getTopicState(topic.id);
    const status = rec.status || 'not_started';

    const subj = bySubject[topic.subject];
    if (subj) {
      subj.total += 1;
      if (status === 'completed') subj.completed += 1;
      else if (status === 'in_progress') subj.inProgress += 1;
      else subj.notStarted += 1;
    }

    const sem = bySemester[topic.semester];
    if (sem) {
      sem.total += 1;
      if (status === 'completed') sem.completed += 1;
      else if (status === 'in_progress') sem.inProgress += 1;
      else sem.notStarted += 1;
    }

    if (status === 'completed') completedOfficial += 1;
    else if (status === 'in_progress') inProgressOfficial += 1;
    else notStartedOfficial += 1;
  }

  const officialPercent =
    totalOfficial > 0 ? Math.round((completedOfficial / totalOfficial) * 1000) / 10 : 0;

  // Custom topics are tracked separately so they never inflate official syllabus completion %
  const customCompleted = state.customTopics.filter((c) => c.status === 'completed').length;

  // Study sessions, streaks, and XP
  let totalMinutes = 0;
  const minutesByDay = new Map();
  const minutesBySubject = { Anatomy: 0, Biochemistry: 0, Physiology: 0, General: 0 };

  for (const s of state.sessions) {
    const mins = Number(s.durationMinutes) || 0;
    if (mins <= 0) continue;
    totalMinutes += mins;
    const key = s.dateKey || todayDateKey();
    minutesByDay.set(key, (minutesByDay.get(key) || 0) + mins);
    const subjKey = Object.prototype.hasOwnProperty.call(minutesBySubject, s.subject)
      ? s.subject
      : 'General';
    minutesBySubject[subjKey] += mins;
  }

  // Compute current consecutive daily streak
  let streakDays = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i += 1) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const k = `${y}-${m}-${d}`;
    const dayMins = minutesByDay.get(k) || 0;
    if (dayMins > 0) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Allow today to still be in progress if yesterday had study activity
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const xp = Math.floor(totalMinutes * APP_CONFIG.gamification.xpPerQualifyingMinute);
  const level = Math.floor(xp / APP_CONFIG.gamification.xpPerLevel) + 1;
  const xpIntoLevel = xp % APP_CONFIG.gamification.xpPerLevel;

  // Daily study pace calculator
  const pace = computePace(
    totalOfficial - completedOfficial,
    getTrackedOfficialTopicIds().filter((id) => getTopicState(id).status !== 'completed').length,
    state.prefs.examDate
  );

  return {
    official: {
      total: totalOfficial,
      completed: completedOfficial,
      inProgress: inProgressOfficial,
      notStarted: notStartedOfficial,
      percent: officialPercent
    },
    custom: {
      total: state.customTopics.length,
      completed: customCompleted
    },
    trackedCount: getTrackedOfficialTopicIds().length,
    freeTrackerLimit: APP_CONFIG.pricing.freeMaxTrackedOfficialTopics,
    bySubject,
    bySemester,
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    minutesByDay,
    minutesBySubject,
    streakDays,
    xp,
    level,
    xpIntoLevel,
    xpPerLevel: APP_CONFIG.gamification.xpPerLevel,
    pace
  };
}

function computePace(remainingAllOfficial, remainingTrackedOfficial, examDateStr) {
  if (!examDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(examDateStr)) {
    return {
      status: 'missing_date',
      daysRemaining: null,
      perDayAllSyllabus: null,
      perDayTracked: null
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [ey, em, ed] = examDateStr.split('-').map(Number);
  const examStart = new Date(ey, em - 1, ed);
  examStart.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((examStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return {
      status: 'past_or_today',
      daysRemaining: diffDays,
      perDayAllSyllabus: remainingAllOfficial > 0 ? remainingAllOfficial : 0,
      perDayTracked: remainingTrackedOfficial > 0 ? remainingTrackedOfficial : 0
    };
  }

  return {
    status: 'active',
    daysRemaining: diffDays,
    perDayAllSyllabus:
      remainingAllOfficial > 0 ? Math.ceil((remainingAllOfficial / diffDays) * 10) / 10 : 0,
    perDayTracked:
      remainingTrackedOfficial > 0 ? Math.ceil((remainingTrackedOfficial / diffDays) * 10) / 10 : 0
  };
}

export function getSnapshot() {
  return {
    initialized: state.initialized,
    loading: state.loading,
    error: state.error,
    prefs: { ...state.prefs },
    uiCache: { ...state.uiCache },
    sections: CURRICULUM_SECTIONS,
    officialTopics: OFFICIAL_TOPICS,
    topicStatesMap: state.topicStatesMap,
    customTopics: [...state.customTopics],
    categories: [...state.categories],
    sessions: [...state.sessions],
    tasks: [...state.tasks],
    timetable: [...state.timetable],
    materials: [...state.materials],
    aiChats: [...state.aiChats],
    lastUndoAction: state.lastUndoAction,
    stats: computeStudyStats()
  };
}

export async function initStore() {
  state.loading = true;
  state.error = null;
  notify();

  try {
    const localData = await loadAllLocalStudyData();
    state.topicStatesMap.clear();
    for (const item of localData.topicStates || []) {
      state.topicStatesMap.set(item.topicId, item);
    }
    state.customTopics = localData.customTopics || [];
    state.categories = localData.categories || [];
    state.sessions = localData.sessions || [];
    state.tasks = localData.tasks || [];
    state.timetable = localData.timetable || [];
    state.materials = localData.materials || [];
    state.aiChats = localData.aiChats || [];
    state.initialized = true;
    state.loading = false;
    notify();
  } catch (err) {
    state.loading = false;
    state.error = err?.message || 'Unable to initialize local study storage.';
    notify();
  }
}

export function updatePreferences(partial) {
  state.prefs = savePreferences(partial);
  notify();
  return state.prefs;
}

export function syncUiEntitlementCache({ isPremium, paymentReference, usedAiInteractions }) {
  state.uiCache = saveUiCache({
    ...(typeof isPremium === 'boolean' ? { isPremium } : {}),
    ...(typeof paymentReference === 'string' ? { paymentReference } : {}),
    ...(typeof usedAiInteractions === 'number' ? { usedAiInteractions } : {})
  });
  notify();
  return state.uiCache;
}

export async function setTopicStatus(topicId, nextStatus) {
  if (!['not_started', 'in_progress', 'completed'].includes(nextStatus)) {
    throw new Error('Invalid topic status.');
  }
  const prev = getTopicState(topicId);
  const updated = {
    ...prev,
    topicId,
    status: nextStatus,
    tracked: true,
    updatedAt: new Date().toISOString()
  };

  // Enforce 10-topic Free tracker limit if enabling tracking on a new topic
  if (!isPremiumActive() && !prev.tracked) {
    const trackedCount = getTrackedOfficialTopicIds().length;
    if (trackedCount >= APP_CONFIG.pricing.freeMaxTrackedOfficialTopics) {
      return {
        ok: false,
        limitReached: true,
        message: `Free plan tracks up to ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} official topics at once. Untrack one or upgrade to ₦1,000 Premium for unlimited topics.`
      };
    }
  }

  await putRecord('topicStates', updated);
  state.topicStatesMap.set(topicId, updated);
  state.lastUndoAction = {
    type: 'topicState',
    topicId,
    previousRecord: { ...prev }
  };
  notify();
  return { ok: true, record: updated };
}

export async function toggleTopicTracked(topicId) {
  const prev = getTopicState(topicId);
  if (prev.tracked) {
    // Untrack preserves status, notes, and history safely
    const updated = {
      ...prev,
      tracked: false,
      updatedAt: new Date().toISOString()
    };
    await putRecord('topicStates', updated);
    state.topicStatesMap.set(topicId, updated);
    state.lastUndoAction = {
      type: 'topicState',
      topicId,
      previousRecord: { ...prev }
    };
    notify();
    return { ok: true, tracked: false, record: updated };
  }

  if (!isPremiumActive()) {
    const trackedCount = getTrackedOfficialTopicIds().length;
    if (trackedCount >= APP_CONFIG.pricing.freeMaxTrackedOfficialTopics) {
      return {
        ok: false,
        limitReached: true,
        message: `Free plan limit reached (${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} active official topics). Untrack an active topic to swap slots or upgrade for ₦1,000 once.`
      };
    }
  }

  const updated = {
    ...prev,
    tracked: true,
    updatedAt: new Date().toISOString()
  };
  await putRecord('topicStates', updated);
  state.topicStatesMap.set(topicId, updated);
  state.lastUndoAction = {
    type: 'topicState',
    topicId,
    previousRecord: { ...prev }
  };
  notify();
  return { ok: true, tracked: true, record: updated };
}

export async function toggleTopicFavourite(topicId) {
  const prev = getTopicState(topicId);
  const updated = {
    ...prev,
    favourite: !prev.favourite,
    updatedAt: new Date().toISOString()
  };
  await putRecord('topicStates', updated);
  state.topicStatesMap.set(topicId, updated);
  notify();
  return updated;
}

export async function saveTopicNotes(topicId, notesText) {
  const prev = getTopicState(topicId);
  const updated = {
    ...prev,
    notes: String(notesText || '').slice(0, 4000),
    updatedAt: new Date().toISOString()
  };
  await putRecord('topicStates', updated);
  state.topicStatesMap.set(topicId, updated);
  notify();
  return updated;
}

// Drive open rule: Not Started -> In Progress; NEVER downgrade Completed -> In Progress
export async function recordDriveFolderOpened(topicId) {
  const prev = getTopicState(topicId);
  const nextStatus = prev.status === 'not_started' ? 'in_progress' : prev.status;
  const updated = {
    ...prev,
    status: nextStatus,
    tracked: prev.tracked || (isPremiumActive() || getTrackedOfficialTopicIds().length < APP_CONFIG.pricing.freeMaxTrackedOfficialTopics),
    lastDriveOpenedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await putRecord('topicStates', updated);
  state.topicStatesMap.set(topicId, updated);
  state.lastUndoAction = {
    type: 'topicState',
    topicId,
    previousRecord: { ...prev }
  };
  notify();
  return updated;
}

export async function undoLastAction() {
  const action = state.lastUndoAction;
  if (!action) return false;
  if (action.type === 'topicState') {
    const rec = action.previousRecord;
    if (rec && (rec.tracked || rec.favourite || rec.notes || rec.status !== 'not_started' || rec.lastDriveOpenedAt)) {
      await putRecord('topicStates', rec);
      state.topicStatesMap.set(action.topicId, rec);
    } else {
      await deleteRecord('topicStates', action.topicId);
      state.topicStatesMap.delete(action.topicId);
    }
    state.lastUndoAction = null;
    notify();
    return true;
  }
  return false;
}

export async function addCustomTopic({ title, subject, semester, department, notes }) {
  if (!isPremiumActive()) {
    return {
      ok: false,
      requiresPremium: true,
      message: 'Custom topics are a ₦1,000 one-time Premium feature.'
    };
  }
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    throw new Error('Please enter a custom topic title.');
  }
  const record = {
    id: makeId('ctopic'),
    title: cleanTitle.slice(0, 200),
    subject: ['Anatomy', 'Biochemistry', 'Physiology'].includes(subject) ? subject : 'Anatomy',
    semester: [1, 2, 3].includes(Number(semester)) ? Number(semester) : 1,
    department: String(department || 'Custom Topic').trim().slice(0, 100),
    status: 'not_started',
    notes: String(notes || '').slice(0, 4000),
    createdAt: new Date().toISOString()
  };
  await putRecord('customTopics', record);
  state.customTopics.unshift(record);
  notify();
  return { ok: true, topic: record };
}

export async function updateCustomTopicStatus(id, status) {
  if (!['not_started', 'in_progress', 'completed'].includes(status)) return;
  const idx = state.customTopics.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const updated = { ...state.customTopics[idx], status };
  await putRecord('customTopics', updated);
  state.customTopics[idx] = updated;
  notify();
}

export async function deleteCustomTopic(id) {
  await deleteRecord('customTopics', id);
  state.customTopics = state.customTopics.filter((t) => t.id !== id);
  notify();
}

export async function addCategory({ name, color, subject }) {
  if (!isPremiumActive()) {
    return {
      ok: false,
      requiresPremium: true,
      message: 'Custom colour-coded categories are a ₦1,000 one-time Premium feature.'
    };
  }
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Category name is required.');
  const record = {
    id: makeId('cat'),
    name: cleanName.slice(0, 60),
    color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#0f766e',
    subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(subject) ? subject : 'General'
  };
  await putRecord('categories', record);
  state.categories.push(record);
  notify();
  return { ok: true, category: record };
}

export async function logStudySession({ mode, subject, topicId, topicTitle, durationMinutes, notes, dateKey }) {
  const mins = Number(durationMinutes);
  if (!Number.isFinite(mins) || mins <= 0) {
    throw new Error('Study duration must be greater than zero.');
  }
  const record = {
    id: makeId('sess'),
    mode: ['pomodoro', 'stopwatch', 'manual'].includes(mode) ? mode : 'manual',
    subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(subject) ? subject : 'General',
    topicId: String(topicId || '').slice(0, 80),
    topicTitle: String(topicTitle || '').slice(0, 200),
    durationMinutes: Math.round(mins * 10) / 10,
    notes: String(notes || '').slice(0, 1000),
    dateKey: /^\d{4}-\d{2}-\d{2}$/.test(dateKey || '') ? dateKey : todayDateKey(),
    completedAt: new Date().toISOString()
  };
  await putRecord('sessions', record);
  state.sessions.unshift(record);
  notify();
  return record;
}

export async function deleteStudySession(id) {
  await deleteRecord('sessions', id);
  state.sessions = state.sessions.filter((s) => s.id !== id);
  notify();
}

export async function addTask({ title, priority, dueDate, dailyChecklist }) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) throw new Error('Task title is required.');
  const record = {
    id: makeId('task'),
    title: cleanTitle.slice(0, 220),
    priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
    dueDate: String(dueDate || '').slice(0, 20),
    completed: false,
    dailyChecklist: Boolean(dailyChecklist),
    createdAt: new Date().toISOString()
  };
  await putRecord('tasks', record);
  state.tasks.unshift(record);
  notify();
  return record;
}

export async function toggleTaskCompleted(id) {
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const updated = { ...state.tasks[idx], completed: !state.tasks[idx].completed };
  await putRecord('tasks', updated);
  state.tasks[idx] = updated;
  notify();
}

export async function deleteTask(id) {
  await deleteRecord('tasks', id);
  state.tasks = state.tasks.filter((t) => t.id !== id);
  notify();
}

export async function saveTimetableSlot(slot) {
  const cleanActivity = String(slot.activity || '').trim();
  if (!cleanActivity) throw new Error('Activity is required for a timetable slot.');
  const record = {
    id: slot.id || makeId('slot'),
    day: slot.day || 'Monday',
    startTime: String(slot.startTime || '08:00').slice(0, 10),
    endTime: String(slot.endTime || '09:00').slice(0, 10),
    subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(slot.subject)
      ? slot.subject
      : 'General',
    activity: cleanActivity.slice(0, 140),
    location: String(slot.location || '').slice(0, 120),
    notes: String(slot.notes || '').slice(0, 500)
  };
  await putRecord('timetable', record);
  const existingIdx = state.timetable.findIndex((s) => s.id === record.id);
  if (existingIdx >= 0) state.timetable[existingIdx] = record;
  else state.timetable.push(record);
  notify();
  return record;
}

export async function deleteTimetableSlot(id) {
  await deleteRecord('timetable', id);
  state.timetable = state.timetable.filter((s) => s.id !== id);
  notify();
}

export async function saveMaterial(material) {
  const record = {
    id: material.id || makeId('mat'),
    type: ['flashcards', 'questions', 'summary', 'revision'].includes(material.type)
      ? material.type
      : 'summary',
    title: String(material.title || 'Study Material').trim().slice(0, 200),
    subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(material.subject)
      ? material.subject
      : 'General',
    topicId: String(material.topicId || '').slice(0, 80),
    sourceType: String(material.sourceType || 'curriculum').slice(0, 40),
    sourceFilename: String(material.sourceFilename || '').slice(0, 160),
    createdAt: material.createdAt || new Date().toISOString(),
    content: material.content ?? null,
    reviewHistory: Array.isArray(material.reviewHistory) ? material.reviewHistory : []
  };
  await putRecord('materials', record);
  const idx = state.materials.findIndex((m) => m.id === record.id);
  if (idx >= 0) state.materials[idx] = record;
  else state.materials.unshift(record);
  notify();
  return record;
}

export async function appendMaterialReview(materialId, reviewEntry) {
  const idx = state.materials.findIndex((m) => m.id === materialId);
  if (idx === -1) return;
  const item = state.materials[idx];
  const updated = {
    ...item,
    reviewHistory: [
      ...(item.reviewHistory || []),
      { ...reviewEntry, reviewedAt: new Date().toISOString() }
    ].slice(-200)
  };
  await putRecord('materials', updated);
  state.materials[idx] = updated;
  notify();
}

export async function deleteMaterial(id) {
  await deleteRecord('materials', id);
  state.materials = state.materials.filter((m) => m.id !== id);
  notify();
}

export async function saveAiChat(chat) {
  const record = {
    id: chat.id || makeId('chat'),
    title: String(chat.title || '2nd MB Study Coach').slice(0, 140),
    updatedAt: new Date().toISOString(),
    messages: Array.isArray(chat.messages) ? chat.messages.slice(-60) : []
  };
  await putRecord('aiChats', record);
  const idx = state.aiChats.findIndex((c) => c.id === record.id);
  if (idx >= 0) state.aiChats[idx] = record;
  else state.aiChats.unshift(record);
  notify();
  return record;
}

export async function exportBackup() {
  return exportStudyBackupJson();
}

export async function importBackup(rawJsonText) {
  await restoreStudyBackupJson(rawJsonText);
  await initStore();
  return true;
}
