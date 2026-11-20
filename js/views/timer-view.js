/* 2ndMBstudy — Pomodoro, Stopwatch & Manual Study Session Logger */

import { APP_CONFIG } from '../config/app-config.js';
import {
  getSnapshot,
  logStudySession,
  deleteStudySession,
  updatePreferences
} from '../state/app-store.js';
import { showToast } from '../components/toast.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function formatClock(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function playCompletionBeep(soundEnabled) {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Ignore audio errors on restricted devices
  }
}

export function renderTimerView(container) {
  if (!container) return;

  const snapInit = getSnapshot();
  const timerState = {
    mode: 'pomodoro', // 'pomodoro' | 'stopwatch'
    phase: 'focus', // 'focus' | 'break'
    focusMinutes: snapInit.prefs.focusMinutes || APP_CONFIG.timerPresets.defaultFocusMinutes,
    breakMinutes: snapInit.prefs.breakMinutes || APP_CONFIG.timerPresets.defaultBreakMinutes,
    remainingSeconds: (snapInit.prefs.focusMinutes || APP_CONFIG.timerPresets.defaultFocusMinutes) * 60,
    elapsedSeconds: 0,
    running: false,
    intervalId: null,
    subject: 'Anatomy',
    topicId: '',
    notes: ''
  };

  const stopTick = () => {
    if (timerState.intervalId !== null) {
      window.clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    timerState.running = false;
  };

  const cleanup = () => {
    stopTick();
  };

  const updateClockDomOnly = () => {
    const displayEl = container.querySelector('#live-timer-display');
    if (!displayEl) return;
    if (timerState.mode === 'pomodoro') {
      displayEl.textContent = formatClock(timerState.remainingSeconds);
    } else {
      displayEl.textContent = formatClock(timerState.elapsedSeconds);
    }
  };

  const handlePomodoroFinished = async () => {
    stopTick();
    const currentPrefs = getSnapshot().prefs;
    playCompletionBeep(currentPrefs.soundEnabled);

    if (timerState.phase === 'focus') {
      const completedMins = timerState.focusMinutes;
      const snapNow = getSnapshot();
      const chosenTopic = snapNow.officialTopics.find((t) => t.id === timerState.topicId);
      await logStudySession({
        mode: 'pomodoro',
        subject: timerState.subject,
        topicId: chosenTopic ? chosenTopic.id : '',
        topicTitle: chosenTopic ? chosenTopic.title : '',
        durationMinutes: completedMins,
        notes: timerState.notes || 'Pomodoro focus block'
      });
      timerState.phase = 'break';
      timerState.remainingSeconds = timerState.breakMinutes * 60;
      paint();
      showToast(`Focus complete! Logged ${completedMins} min. Break timer ready.`, { variant: 'success' });
    } else {
      timerState.phase = 'focus';
      timerState.remainingSeconds = timerState.focusMinutes * 60;
      paint();
      showToast('Break finished! Ready for another focus block.', { variant: 'info' });
    }
  };

  const startTick = () => {
    stopTick();
    timerState.running = true;
    timerState.intervalId = window.setInterval(async () => {
      if (timerState.mode === 'pomodoro') {
        timerState.remainingSeconds -= 1;
        if (timerState.remainingSeconds <= 0) {
          timerState.remainingSeconds = 0;
          updateClockDomOnly();
          await handlePomodoroFinished();
        } else {
          updateClockDomOnly();
        }
      } else {
        timerState.elapsedSeconds += 1;
        updateClockDomOnly();
      }
    }, 1000);
  };

  const paint = () => {
    const snap = getSnapshot();
    const { sessions, officialTopics, prefs, stats } = snap;
    const topicOptions = officialTopics
      .slice(0, 120)
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${timerState.topicId === t.id ? 'selected' : ''}>${escapeHtml(t.code)} · ${escapeHtml(t.title.slice(0, 58))}</option>`
      )
      .join('');

    const displayVal =
      timerState.mode === 'pomodoro'
        ? formatClock(timerState.remainingSeconds)
        : formatClock(timerState.elapsedSeconds);

    container.innerHTML = `
      <div class="page-stack">
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h1 class="section-title">Study Timer &amp; Session Logger</h1>
              <p class="section-subtitle">
                Pomodoro blocks, stopwatch tracking, and manual study logs · Every logged minute earns ${APP_CONFIG.gamification.xpPerQualifyingMinute} XP.
              </p>
            </div>
            <div class="inline-actions">
              <span class="badge badge--physio tabular-nums">${stats.totalHours}h Total · ${stats.streakDays}d Streak · Lv.${stats.level}</span>
              <button type="button" id="toggle-timer-sound" class="btn btn-secondary btn-xs">
                ${prefs.soundEnabled ? '🔊 Sound On' : '🔇 Sound Muted'}
              </button>
            </div>
          </div>

          <div class="inline-actions" style="justify-content: center; margin-bottom: 10px;">
            <button type="button" id="mode-pomodoro-btn" class="btn ${timerState.mode === 'pomodoro' ? 'btn-primary' : 'btn-secondary'} btn-sm">
              Pomodoro
            </button>
            <button type="button" id="mode-stopwatch-btn" class="btn ${timerState.mode === 'stopwatch' ? 'btn-primary' : 'btn-secondary'} btn-sm">
              Stopwatch
            </button>
          </div>

          <div style="text-align: center;">
            <span class="badge badge--anatomy">
              ${
                timerState.mode === 'pomodoro'
                  ? timerState.phase === 'focus'
                    ? `Focus Phase (${timerState.focusMinutes}m)`
                    : `Break Phase (${timerState.breakMinutes}m)`
                  : 'Elapsed Stopwatch'
              }
            </span>
          </div>

          <div id="live-timer-display" class="timer-display tabular-nums">${escapeHtml(displayVal)}</div>

          ${
            timerState.mode === 'pomodoro'
              ? `<div class="preset-row" style="margin-bottom: 14px;">
                   ${APP_CONFIG.timerPresets.focusMinutes
                     .map(
                       (m) => `
                         <button type="button" class="btn ${timerState.focusMinutes === m ? 'btn-primary' : 'btn-secondary'} btn-xs" data-focus-preset="${m}">
                           ${m}m Focus
                         </button>
                       `
                     )
                     .join('')}
                   ${APP_CONFIG.timerPresets.breakMinutes
                     .map(
                       (b) => `
                         <button type="button" class="btn ${timerState.breakMinutes === b ? 'btn-primary' : 'btn-secondary'} btn-xs" data-break-preset="${b}">
                           ${b}m Break
                         </button>
                       `
                     )
                     .join('')}
                 </div>`
              : ''
          }

          <div class="inline-actions" style="justify-content: center; margin-bottom: 16px;">
            <button type="button" id="timer-start-pause-btn" class="btn btn-primary btn-sm">
              ${timerState.running ? 'Pause' : 'Start'}
            </button>
            <button type="button" id="timer-reset-btn" class="btn btn-secondary btn-sm">Reset</button>
            ${
              timerState.mode === 'stopwatch'
                ? `<button type="button" id="stopwatch-log-btn" class="btn btn-secondary btn-sm">Log Elapsed Time</button>`
                : ''
            }
          </div>

          <div class="two-col-grid">
            <div>
              <label class="field-label" for="timer-subject">Subject</label>
              <select id="timer-subject" class="select">
                <option value="Anatomy" ${timerState.subject === 'Anatomy' ? 'selected' : ''}>Anatomy</option>
                <option value="Biochemistry" ${timerState.subject === 'Biochemistry' ? 'selected' : ''}>Biochemistry</option>
                <option value="Physiology" ${timerState.subject === 'Physiology' ? 'selected' : ''}>Physiology</option>
                <option value="General" ${timerState.subject === 'General' ? 'selected' : ''}>General</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="timer-topic">Link Official Topic (Optional)</label>
              <select id="timer-topic" class="select">
                <option value="">None / General Reading</option>
                ${topicOptions}
              </select>
            </div>
          </div>
        </section>

        <!-- Manual Session Log -->
        <section class="card">
          <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 8px;">Log Manual Study Session</h2>
          <form id="manual-session-form" class="form-stack">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <label class="field-label" for="manual-subject">Subject</label>
                <select id="manual-subject" class="select">
                  <option value="Anatomy">Anatomy</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Physiology">Physiology</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="manual-minutes">Duration (Minutes)</label>
                <input id="manual-minutes" type="number" class="input" min="1" max="1440" step="1" placeholder="e.g., 60" required />
              </div>
              <div>
                <label class="field-label" for="manual-date">Date</label>
                <input id="manual-date" type="date" class="input" value="${new Date().toISOString().slice(0, 10)}" />
              </div>
            </div>
            <div>
              <label class="field-label" for="manual-notes">Session Notes (Optional)</label>
              <input id="manual-notes" type="text" class="input" placeholder="e.g., Reviewed Cardiac Cycle & ECG waves" />
            </div>
            <div>
              <button type="submit" class="btn btn-primary btn-sm">Save Study Session</button>
            </div>
          </form>
        </section>

        <!-- Recent Sessions -->
        <section class="card">
          <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 10px;">Recent Study Sessions (${sessions.length})</h2>
          ${
            sessions.length === 0
              ? `<p class="section-subtitle">No study sessions logged yet. Start a Pomodoro/stopwatch block or log a manual session above.</p>`
              : `<div class="topic-list">
                   ${sessions
                     .slice(0, 20)
                     .map(
                       (s) => `
                         <div class="topic-card" style="padding: var(--space-3);">
                           <div class="topic-top">
                             <div>
                               <div class="topic-code">${escapeHtml(s.dateKey)} · ${escapeHtml(String(s.mode || 'manual').toUpperCase())} · ${escapeHtml(s.subject)}</div>
                               <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 2px;">
                                 ${escapeHtml(String(s.durationMinutes))} min${s.topicTitle ? ` · ${escapeHtml(s.topicTitle)}` : ''}
                               </div>
                               ${s.notes ? `<div class="section-subtitle" style="margin-top: 2px;">${escapeHtml(s.notes)}</div>` : ''}
                             </div>
                             <button type="button" class="btn btn-ghost btn-xs" data-delete-session-id="${escapeHtml(s.id)}">Delete</button>
                           </div>
                         </div>
                       `
                     )
                     .join('')}
                 </div>`
          }
        </section>
      </div>
    `;

    container.querySelector('#toggle-timer-sound')?.addEventListener('click', () => {
      updatePreferences({ soundEnabled: !prefs.soundEnabled });
      paint();
      showToast(!prefs.soundEnabled ? 'Timer sound enabled.' : 'Timer sound muted.', { variant: 'info' });
    });

    container.querySelector('#mode-pomodoro-btn')?.addEventListener('click', () => {
      stopTick();
      timerState.mode = 'pomodoro';
      timerState.phase = 'focus';
      timerState.remainingSeconds = timerState.focusMinutes * 60;
      paint();
    });

    container.querySelector('#mode-stopwatch-btn')?.addEventListener('click', () => {
      stopTick();
      timerState.mode = 'stopwatch';
      paint();
    });

    container.querySelectorAll('[data-focus-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopTick();
        const mins = Number(btn.getAttribute('data-focus-preset')) || APP_CONFIG.timerPresets.defaultFocusMinutes;
        timerState.focusMinutes = mins;
        timerState.phase = 'focus';
        timerState.remainingSeconds = mins * 60;
        updatePreferences({ focusMinutes: mins });
        paint();
      });
    });

    container.querySelectorAll('[data-break-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopTick();
        const bMins = Number(btn.getAttribute('data-break-preset')) || APP_CONFIG.timerPresets.defaultBreakMinutes;
        timerState.breakMinutes = bMins;
        if (timerState.phase === 'break') {
          timerState.remainingSeconds = bMins * 60;
        }
        updatePreferences({ breakMinutes: bMins });
        paint();
      });
    });

    container.querySelector('#timer-start-pause-btn')?.addEventListener('click', () => {
      if (timerState.running) {
        stopTick();
        paint();
      } else {
        startTick();
        paint();
      }
    });

    container.querySelector('#timer-reset-btn')?.addEventListener('click', () => {
      stopTick();
      if (timerState.mode === 'pomodoro') {
        timerState.remainingSeconds =
          (timerState.phase === 'focus' ? timerState.focusMinutes : timerState.breakMinutes) * 60;
      } else {
        timerState.elapsedSeconds = 0;
      }
      paint();
    });

    container.querySelector('#stopwatch-log-btn')?.addEventListener('click', async () => {
      const mins = Math.round((timerState.elapsedSeconds / 60) * 10) / 10;
      if (mins < 0.1) {
        showToast('Run the stopwatch a little longer before logging.', { variant: 'info' });
        return;
      }
      stopTick();
      const chosenTopic = getSnapshot().officialTopics.find((t) => t.id === timerState.topicId);
      await logStudySession({
        mode: 'stopwatch',
        subject: timerState.subject,
        topicId: chosenTopic ? chosenTopic.id : '',
        topicTitle: chosenTopic ? chosenTopic.title : '',
        durationMinutes: mins,
        notes: 'Logged from stopwatch'
      });
      timerState.elapsedSeconds = 0;
      paint();
      showToast(`Logged ${mins} min from stopwatch.`, { variant: 'success' });
    });

    container.querySelector('#timer-subject')?.addEventListener('change', (e) => {
      timerState.subject = e.target.value;
    });

    container.querySelector('#timer-topic')?.addEventListener('change', (e) => {
      timerState.topicId = e.target.value;
    });

    container.querySelector('#manual-session-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = container.querySelector('#manual-subject')?.value || 'General';
      const durationMinutes = Number(container.querySelector('#manual-minutes')?.value || 0);
      const dateKey = container.querySelector('#manual-date')?.value || '';
      const notes = container.querySelector('#manual-notes')?.value || '';
      try {
        await logStudySession({
          mode: 'manual',
          subject,
          durationMinutes,
          dateKey,
          notes
        });
        paint();
        showToast(`Logged ${durationMinutes} min session.`, { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not log session.', { variant: 'error' });
      }
    });

    container.querySelectorAll('[data-delete-session-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-session-id');
        await deleteStudySession(id);
        paint();
        showToast('Study session removed.', { variant: 'info' });
      });
    });
  };

  paint();
  return cleanup;
}
