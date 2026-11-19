/* 2ndMBstudy — IndexedDB Structured Storage & JSON Backup/Restore */
/* Stores local student study data in IndexedDB; never uses Supabase. */
/* JSON import strictly ignores/strips payment, entitlement, or admin fields. */

import { APP_CONFIG } from '../config/app-config.js';

const STORE_NAMES = Object.freeze([
  'topicStates',
  'customTopics',
  'categories',
  'sessions',
  'tasks',
  'timetable',
  'materials',
  'aiChats'
]);

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(APP_CONFIG.dbName, APP_CONFIG.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('topicStates')) {
        db.createObjectStore('topicStates', { keyPath: 'topicId' });
      }
      if (!db.objectStoreNames.contains('customTopics')) {
        const store = db.createObjectStore('customTopics', { keyPath: 'id' });
        store.createIndex('subject', 'subject', { unique: false });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('dateKey', 'dateKey', { unique: false });
        store.createIndex('subject', 'subject', { unique: false });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' });
        store.createIndex('completed', 'completed', { unique: false });
      }
      if (!db.objectStoreNames.contains('timetable')) {
        db.createObjectStore('timetable', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('materials')) {
        const store = db.createObjectStore('materials', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('subject', 'subject', { unique: false });
      }
      if (!db.objectStoreNames.contains('aiChats')) {
        db.createObjectStore('aiChats', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
  });

  return dbPromise;
}

async function runTx(storeName, mode, operationFn) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let result;
    try {
      result = operationFn(store);
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error(`Transaction failed on ${storeName}.`));
    tx.onabort = () => reject(tx.error || new Error(`Transaction aborted on ${storeName}.`));
  });
}

function promisifyRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request error.'));
  });
}

export async function getAllFromStore(storeName) {
  if (!STORE_NAMES.includes(storeName)) {
    throw new Error(`Unknown store: ${storeName}`);
  }
  return runTx(storeName, 'readonly', (store) => promisifyRequest(store.getAll()));
}

export async function putRecord(storeName, record) {
  if (!STORE_NAMES.includes(storeName)) {
    throw new Error(`Unknown store: ${storeName}`);
  }
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid record payload.');
  }
  return runTx(storeName, 'readwrite', (store) => promisifyRequest(store.put(record)));
}

export async function deleteRecord(storeName, key) {
  if (!STORE_NAMES.includes(storeName)) {
    throw new Error(`Unknown store: ${storeName}`);
  }
  return runTx(storeName, 'readwrite', (store) => promisifyRequest(store.delete(key)));
}

export async function clearStore(storeName) {
  if (!STORE_NAMES.includes(storeName)) {
    throw new Error(`Unknown store: ${storeName}`);
  }
  return runTx(storeName, 'readwrite', (store) => promisifyRequest(store.clear()));
}

export async function loadAllLocalStudyData() {
  const entries = await Promise.all(
    STORE_NAMES.map(async (name) => [name, await getAllFromStore(name)])
  );
  return Object.fromEntries(entries);
}

export async function exportStudyBackupJson() {
  const data = await loadAllLocalStudyData();
  return JSON.stringify(
    {
      app: APP_CONFIG.brandName,
      cohort: APP_CONFIG.cohortScope,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data
    },
    null,
    2
  );
}

function sanitizeArray(arr, validatorFn) {
  if (!Array.isArray(arr)) return [];
  const clean = [];
  for (const item of arr) {
    const validated = validatorFn(item);
    if (validated) clean.push(validated);
  }
  return clean;
}

function validateAndSanitizeBackup(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Backup file or text is empty.');
  }
  if (rawText.length > 8 * 1024 * 1024) {
    throw new Error('Backup file is too large to import safely.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid JSON format in backup file.');
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Backup JSON is missing a valid "data" structure.');
  }

  // Explicitly ignore any forbidden/privileged fields if present in an untrusted backup
  const d = parsed.data;

  const topicStates = sanitizeArray(d.topicStates, (item) => {
    if (!item || typeof item.topicId !== 'string' || !item.topicId.trim()) return null;
    const status = ['not_started', 'in_progress', 'completed'].includes(item.status)
      ? item.status
      : 'not_started';
    return {
      topicId: item.topicId.trim().slice(0, 80),
      status,
      tracked: Boolean(item.tracked),
      favourite: Boolean(item.favourite),
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 4000) : '',
      lastDriveOpenedAt: typeof item.lastDriveOpenedAt === 'string' ? item.lastDriveOpenedAt : null,
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString()
    };
  });

  const customTopics = sanitizeArray(d.customTopics, (item) => {
    if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' || !item.title.trim()) {
      return null;
    }
    const subject = ['Anatomy', 'Biochemistry', 'Physiology'].includes(item.subject)
      ? item.subject
      : 'Anatomy';
    const status = ['not_started', 'in_progress', 'completed'].includes(item.status)
      ? item.status
      : 'not_started';
    return {
      id: item.id.trim().slice(0, 80),
      title: item.title.trim().slice(0, 200),
      subject,
      semester: [1, 2, 3].includes(Number(item.semester)) ? Number(item.semester) : 1,
      department: typeof item.department === 'string' ? item.department.trim().slice(0, 100) : 'Custom',
      status,
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 4000) : '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
    };
  });

  const categories = sanitizeArray(d.categories, (item) => {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || !item.name.trim()) {
      return null;
    }
    const color =
      typeof item.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.color.trim())
        ? item.color.trim()
        : '#0f766e';
    return {
      id: item.id.trim().slice(0, 60),
      name: item.name.trim().slice(0, 60),
      color,
      subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(item.subject)
        ? item.subject
        : 'General'
    };
  });

  const sessions = sanitizeArray(d.sessions, (item) => {
    if (!item || typeof item.id !== 'string') return null;
    const durationMinutes = Number(item.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) {
      return null;
    }
    const dateKey =
      typeof item.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dateKey)
        ? item.dateKey
        : new Date().toISOString().slice(0, 10);
    return {
      id: item.id.trim().slice(0, 80),
      mode: ['pomodoro', 'stopwatch', 'manual'].includes(item.mode) ? item.mode : 'manual',
      subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(item.subject)
        ? item.subject
        : 'General',
      topicId: typeof item.topicId === 'string' ? item.topicId.slice(0, 80) : '',
      topicTitle: typeof item.topicTitle === 'string' ? item.topicTitle.slice(0, 200) : '',
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 1000) : '',
      dateKey,
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : new Date().toISOString()
    };
  });

  const tasks = sanitizeArray(d.tasks, (item) => {
    if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' || !item.title.trim()) {
      return null;
    }
    return {
      id: item.id.trim().slice(0, 80),
      title: item.title.trim().slice(0, 220),
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
      dueDate: typeof item.dueDate === 'string' ? item.dueDate.slice(0, 20) : '',
      completed: Boolean(item.completed),
      dailyChecklist: Boolean(item.dailyChecklist),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
    };
  });

  const timetable = sanitizeArray(d.timetable, (item) => {
    if (!item || typeof item.id !== 'string' || typeof item.activity !== 'string' || !item.activity.trim()) {
      return null;
    }
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      id: item.id.trim().slice(0, 80),
      day: validDays.includes(item.day) ? item.day : 'Monday',
      startTime: typeof item.startTime === 'string' ? item.startTime.slice(0, 10) : '08:00',
      endTime: typeof item.endTime === 'string' ? item.endTime.slice(0, 10) : '09:00',
      subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(item.subject)
        ? item.subject
        : 'General',
      activity: item.activity.trim().slice(0, 140),
      location: typeof item.location === 'string' ? item.location.trim().slice(0, 120) : '',
      notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 500) : ''
    };
  });

  const materials = sanitizeArray(d.materials, (item) => {
    if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' || !item.title.trim()) {
      return null;
    }
    return {
      id: item.id.trim().slice(0, 80),
      type: ['flashcards', 'questions', 'summary', 'revision'].includes(item.type)
        ? item.type
        : 'summary',
      title: item.title.trim().slice(0, 200),
      subject: ['Anatomy', 'Biochemistry', 'Physiology', 'General'].includes(item.subject)
        ? item.subject
        : 'General',
      topicId: typeof item.topicId === 'string' ? item.topicId.slice(0, 80) : '',
      sourceType: typeof item.sourceType === 'string' ? item.sourceType.slice(0, 40) : 'curriculum',
      sourceFilename: typeof item.sourceFilename === 'string' ? item.sourceFilename.slice(0, 160) : '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      content: item.content ?? null,
      reviewHistory: Array.isArray(item.reviewHistory) ? item.reviewHistory.slice(-200) : []
    };
  });

  const aiChats = sanitizeArray(d.aiChats, (item) => {
    if (!item || typeof item.id !== 'string' || !Array.isArray(item.messages)) return null;
    const cleanMsgs = item.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
      .slice(-60)
      .map((m) => ({
        role: m.role,
        text: m.text.slice(0, 6000),
        timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString()
      }));
    return {
      id: item.id.trim().slice(0, 80),
      title: typeof item.title === 'string' ? item.title.slice(0, 140) : 'Study Session',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      messages: cleanMsgs
    };
  });

  return {
    topicStates,
    customTopics,
    categories,
    sessions,
    tasks,
    timetable,
    materials,
    aiChats
  };
}

export async function restoreStudyBackupJson(rawText) {
  const sanitized = validateAndSanitizeBackup(rawText);

  for (const storeName of STORE_NAMES) {
    await clearStore(storeName);
    const rows = sanitized[storeName] || [];
    for (const row of rows) {
      await putRecord(storeName, row);
    }
  }

  return sanitized;
}
