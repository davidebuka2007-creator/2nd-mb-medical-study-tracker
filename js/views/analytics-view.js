/* 2ndMBstudy — Analytics, Study Activity Grid & JSON Backup/Restore View */

import { getSnapshot, exportBackup, importBackup } from '../state/app-store.js';
import { showToast } from '../components/toast.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function getLastNDates(count = 14) {
  const list = [];
  const cursor = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    list.push(`${y}-${m}-${day}`);
  }
  return list;
}

function activityLevelForMinutes(mins) {
  if (!mins || mins <= 0) return 0;
  if (mins < 30) return 1;
  if (mins < 90) return 2;
  return 3;
}

export function renderAnalyticsView(container) {
  if (!container) return;

  let subjectChartInstance = null;
  let semesterChartInstance = null;

  const destroyCharts = () => {
    if (subjectChartInstance && typeof subjectChartInstance.destroy === 'function') {
      subjectChartInstance.destroy();
      subjectChartInstance = null;
    }
    if (semesterChartInstance && typeof semesterChartInstance.destroy === 'function') {
      semesterChartInstance.destroy();
      semesterChartInstance = null;
    }
  };

  const cleanup = () => {
    destroyCharts();
  };

  const paint = () => {
    destroyCharts();
    const snap = getSnapshot();
    const { stats } = snap;
    const recentDays = getLastNDates(14);

    container.innerHTML = `
      <div class="page-stack">
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h1 class="section-title">Study Analytics &amp; Consistency</h1>
              <p class="section-subtitle">
                Official syllabus progress across Anatomy, Biochemistry &amp; Physiology · Streak, XP, study hours, and local JSON backup.
              </p>
            </div>
            <span class="badge badge--physio tabular-nums">
              ${stats.streakDays}d Streak · Lv.${stats.level} · ${stats.xp} XP
            </span>
          </div>

          <div class="kpi-grid">
            <div class="card" style="background: var(--bg-surface-subtle);">
              <div class="kpi-label">Official Completed</div>
              <div class="kpi-value tabular-nums">${stats.official.completed} / ${stats.official.total}</div>
              <div class="kpi-meta tabular-nums">${stats.official.percent}% complete</div>
            </div>
            <div class="card" style="background: var(--bg-surface-subtle);">
              <div class="kpi-label">In Progress</div>
              <div class="kpi-value tabular-nums">${stats.official.inProgress}</div>
              <div class="kpi-meta tabular-nums">${stats.official.notStarted} not started</div>
            </div>
            <div class="card" style="background: var(--bg-surface-subtle);">
              <div class="kpi-label">Logged Study Time</div>
              <div class="kpi-value tabular-nums">${stats.totalHours}h</div>
              <div class="kpi-meta tabular-nums">${stats.totalMinutes} total minutes</div>
            </div>
            <div class="card" style="background: var(--bg-surface-subtle);">
              <div class="kpi-label">Level Progress</div>
              <div class="kpi-value tabular-nums">Lv.${stats.level}</div>
              <div class="kpi-meta tabular-nums">${stats.xpIntoLevel} / ${stats.xpPerLevel} XP to next level</div>
            </div>
          </div>
        </section>

        <!-- Charts -->
        <section class="two-col-grid">
          <div class="card">
            <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 8px;">Subject Completion</h2>
            <div class="chart-box">
              <canvas id="subject-progress-chart" aria-label="Subject completion chart"></canvas>
            </div>
            <p class="section-subtitle" style="margin-top: 8px;">
              Anatomy: ${stats.bySubject.Anatomy.completed}/${stats.bySubject.Anatomy.total} ·
              Biochemistry: ${stats.bySubject.Biochemistry.completed}/${stats.bySubject.Biochemistry.total} ·
              Physiology: ${stats.bySubject.Physiology.completed}/${stats.bySubject.Physiology.total}
            </p>
          </div>

          <div class="card">
            <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 8px;">Semester Completion</h2>
            <div class="chart-box">
              <canvas id="semester-progress-chart" aria-label="Semester completion chart"></canvas>
            </div>
            <p class="section-subtitle" style="margin-top: 8px;">
              Sem 1: ${stats.bySemester[1].completed}/${stats.bySemester[1].total} ·
              Sem 2: ${stats.bySemester[2].completed}/${stats.bySemester[2].total} ·
              Sem 3: ${stats.bySemester[3].completed}/${stats.bySemester[3].total}
            </p>
          </div>
        </section>

        <!-- 14-Day Activity Grid -->
        <section class="card">
          <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 6px;">Last 14 Days Study Activity</h2>
          <p class="section-subtitle" style="margin-bottom: 12px;">Darker cells indicate more logged study minutes on that day.</p>
          <div class="activity-grid" role="list" aria-label="14 day study activity">
            ${recentDays
              .map((dayKey) => {
                const mins = stats.minutesByDay.get(dayKey) || 0;
                const lvl = activityLevelForMinutes(mins);
                return `
                  <div
                    class="activity-cell"
                    data-level="${lvl}"
                    title="${escapeHtml(dayKey)}: ${escapeHtml(String(mins))} min"
                    aria-label="${escapeHtml(dayKey)}: ${escapeHtml(String(mins))} minutes"
                  ></div>
                `;
              })
              .join('')}
          </div>
        </section>

        <!-- JSON Backup & Restore -->
        <section class="card">
          <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 6px;">JSON Study Backup &amp; Restore</h2>
          <p class="section-subtitle" style="margin-bottom: 12px;">
            Export a full local JSON backup of your syllabus progress, notes, sessions, tasks, timetable, and study materials — or restore from a previous backup file.
          </p>

          <div class="inline-actions" style="margin-bottom: 12px;">
            <button type="button" id="export-backup-btn" class="btn btn-primary btn-sm">
              Download JSON Backup
            </button>
            <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
              Restore JSON File
              <input id="import-backup-file" type="file" accept="application/json,.json" style="display: none;" />
            </label>
          </div>

          <textarea
            id="backup-json-preview"
            class="textarea"
            rows="5"
            placeholder="Exported JSON backup appears here, or paste a backup JSON payload to restore..."
          ></textarea>
          <div style="margin-top: 8px;">
            <button type="button" id="restore-pasted-backup-btn" class="btn btn-secondary btn-sm">
              Restore Pasted JSON
            </button>
          </div>
        </section>
      </div>
    `;

    // Render Chart.js visualizations if available globally
    if (typeof window !== 'undefined' && typeof window.Chart === 'function') {
      const subjCanvas = container.querySelector('#subject-progress-chart');
      if (subjCanvas) {
        subjectChartInstance = new window.Chart(subjCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Anatomy', 'Biochemistry', 'Physiology'],
            datasets: [
              {
                label: 'Completed',
                data: [
                  stats.bySubject.Anatomy.completed,
                  stats.bySubject.Biochemistry.completed,
                  stats.bySubject.Physiology.completed
                ],
                backgroundColor: '#0f766e'
              },
              {
                label: 'In Progress',
                data: [
                  stats.bySubject.Anatomy.inProgress,
                  stats.bySubject.Biochemistry.inProgress,
                  stats.bySubject.Physiology.inProgress
                ],
                backgroundColor: '#2563eb'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }

      const semCanvas = container.querySelector('#semester-progress-chart');
      if (semCanvas) {
        semesterChartInstance = new window.Chart(semCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['1st Semester', '2nd Semester', '3rd Semester'],
            datasets: [
              {
                label: 'Completed Topics',
                data: [
                  stats.bySemester[1].completed,
                  stats.bySemester[2].completed,
                  stats.bySemester[3].completed
                ],
                backgroundColor: '#7c3aed'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }

    // Export backup
    container.querySelector('#export-backup-btn')?.addEventListener('click', async () => {
      try {
        const jsonStr = await exportBackup();
        const previewEl = container.querySelector('#backup-json-preview');
        if (previewEl) previewEl.value = jsonStr;

        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `2ndmbstudy-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Study backup JSON downloaded.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not export backup.', { variant: 'error' });
      }
    });

    // Restore from file
    container.querySelector('#import-backup-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importBackup(text);
        paint();
        showToast('Study data restored from backup file.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not restore backup file.', { variant: 'error' });
      }
    });

    // Restore from pasted textarea
    container.querySelector('#restore-pasted-backup-btn')?.addEventListener('click', async () => {
      const text = container.querySelector('#backup-json-preview')?.value || '';
      try {
        await importBackup(text);
        paint();
        showToast('Study data restored from JSON.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not restore pasted JSON.', { variant: 'error' });
      }
    });
  };

  paint();
  return cleanup;
}
