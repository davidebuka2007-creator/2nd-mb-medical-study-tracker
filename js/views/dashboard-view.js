/* 2ndMBstudy — Dashboard View */
/* Designed by Davidesign */

import { APP_CONFIG } from '../config/app-config.js';
import {
  getSnapshot,
  getTopicState,
  getTrackedOfficialTopicIds,
  setTopicStatus,
  toggleTopicTracked,
  updatePreferences,
  undoLastAction
} from '../state/app-store.js';
import { showToast } from '../components/toast.js';
import { openUpgradeModal } from '../components/upgrade-modal.js';
import { openTopicDrawer } from '../components/topic-drawer.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function renderPaceSummary(pace, stats) {
  if (!pace || pace.status === 'missing_date') {
    return `<p class="section-subtitle">Set a target exam date above to calculate your required daily topic pace.</p>`;
  }

  const remainingAll = stats.official.total - stats.official.completed;
  if (remainingAll <= 0) {
    return `<p class="section-subtitle" style="color: var(--success-text); font-weight: 600;">All ${stats.official.total} official 2nd MB topics are completed!</p>`;
  }

  if (pace.status === 'past_or_today') {
    return `
      <p class="section-subtitle" style="color: var(--warning-text); font-weight: 600;">
        Exam date is today or has passed (${escapeHtml(String(pace.daysRemaining))} day(s) remaining) — ${remainingAll} official topic(s) still remaining.
      </p>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 6px; font-size: var(--text-sm);">
      <div>
        <strong>${pace.daysRemaining}</strong> day(s) until exam ·
        <strong>${remainingAll}</strong> official topic(s) remaining
      </div>
      <div>
        Required pace (full official syllabus): <strong>${pace.perDayAllSyllabus} topic(s)/day</strong>
      </div>
      <div>
        Required pace (currently tracked topics): <strong>${pace.perDayTracked} topic(s)/day</strong>
      </div>
    </div>
  `;
}

export function renderDashboardView(container, { onNavigateView } = {}) {
  if (!container) return;

  const paint = () => {
    const snap = getSnapshot();
    const { stats, prefs, officialTopics, customTopics, uiCache } = snap;
    const trackedIds = getTrackedOfficialTopicIds();
    const trackedTopics = trackedIds
      .map((id) => officialTopics.find((t) => t.id === id))
      .filter(Boolean);

    const subjPercent = (subjKey) => {
      const s = stats.bySubject[subjKey] || { total: 0, completed: 0 };
      return s.total > 0 ? Math.round((s.completed / s.total) * 1000) / 10 : 0;
    };

    container.innerHTML = `
      <div class="page-stack">
        <!-- Hero & Value Banner -->
        <section class="card" style="background: linear-gradient(135deg, var(--accent-primary-soft), var(--bg-surface)); border-color: var(--border-strong);">
          <div class="section-header-row" style="align-items: flex-start;">
            <div style="max-width: 680px;">
              <span class="badge badge--anatomy" style="margin-bottom: 8px;">${escapeHtml(APP_CONFIG.brandName)} · ${escapeHtml(APP_CONFIG.tagline)}</span>
              <h1 style="margin: 0; font-size: var(--text-2xl); line-height: var(--leading-tight);">
                Track Every 2nd MB Topic, Session &amp; Drive Folder in One Place
              </h1>
              <p class="section-subtitle" style="margin-top: 8px;">
                Built for 2nd MB students across Anatomy, Biochemistry (including 341 &amp; 351), and Physiology — Free up to ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} active official topics &amp; ${APP_CONFIG.pricing.freeMaxAiInteractions} AI interactions, or <strong>₦${APP_CONFIG.pricing.premiumOneTimeNaira.toLocaleString()} once</strong> for unlimited access (no subscriptions, never expires).
              </p>
            </div>
            <div class="inline-actions">
              <button type="button" id="dash-go-syllabus" class="btn btn-primary btn-sm">Browse Syllabus</button>
              <button type="button" id="dash-go-timer" class="btn btn-secondary btn-sm">Start Timer</button>
              ${
                uiCache.isPremium
                  ? `<span class="badge badge--physio">✓ Premium Active</span>`
                  : `<button type="button" id="dash-open-upgrade" class="btn btn-secondary btn-sm">Unlock Premium (₦1,000 Once)</button>`
              }
            </div>
          </div>
        </section>

        <!-- KPI Summary Grid -->
        <section class="kpi-grid" aria-label="Study progress overview">
          <div class="card">
            <div class="kpi-label">Official Syllabus</div>
            <div class="kpi-value tabular-nums">${stats.official.percent}%</div>
            <div class="progress-track" style="margin-top: 8px;">
              <div class="progress-fill" style="width: ${Math.min(100, stats.official.percent)}%;"></div>
            </div>
            <div class="kpi-meta tabular-nums">
              ${stats.official.completed} of ${stats.official.total} completed · ${stats.official.inProgress} in progress
            </div>
          </div>

          <div class="card">
            <div class="kpi-label">Tracked Topics</div>
            <div class="kpi-value tabular-nums">
              ${stats.trackedCount}${uiCache.isPremium ? '' : ` / ${stats.freeTrackerLimit}`}
            </div>
            <div class="kpi-meta">
              ${uiCache.isPremium ? 'Unlimited official topics enabled' : `Free cap: ${stats.freeTrackerLimit} active topics`}
            </div>
          </div>

          <div class="card">
            <div class="kpi-label">Study Time &amp; Streak</div>
            <div class="kpi-value tabular-nums">${stats.totalHours}h</div>
            <div class="kpi-meta tabular-nums">
              ${stats.streakDays}d streak · Lv.${stats.level} (${stats.xp} XP)
            </div>
          </div>

          <div class="card">
            <div class="kpi-label">Custom Topics</div>
            <div class="kpi-value tabular-nums">${stats.custom.total}</div>
            <div class="kpi-meta tabular-nums">
              ${stats.custom.completed} completed · Kept separate from official %
            </div>
          </div>
        </section>

        <!-- Two-Column: Subject Breakdown + Exam Countdown & Pace -->
        <section class="two-col-grid">
          <div class="card">
            <div class="section-header-row" style="margin-bottom: 12px;">
              <h2 class="section-title" style="font-size: var(--text-lg);">Official Syllabus by Subject</h2>
              <button type="button" id="dash-view-analytics" class="btn btn-ghost btn-xs">Analytics →</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 6px;">
                  <span class="badge badge--anatomy">Anatomy</span>
                  <span class="tabular-nums"><strong>${stats.bySubject.Anatomy.completed}</strong> / ${stats.bySubject.Anatomy.total} (${subjPercent('Anatomy')}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${Math.min(100, subjPercent('Anatomy'))}%;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 6px;">
                  <span class="badge badge--biochem">Biochemistry (incl. 341 &amp; 351)</span>
                  <span class="tabular-nums"><strong>${stats.bySubject.Biochemistry.completed}</strong> / ${stats.bySubject.Biochemistry.total} (${subjPercent('Biochemistry')}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${Math.min(100, subjPercent('Biochemistry'))}%;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 6px;">
                  <span class="badge badge--physio">Physiology</span>
                  <span class="tabular-nums"><strong>${stats.bySubject.Physiology.completed}</strong> / ${stats.bySubject.Physiology.total} (${subjPercent('Physiology')}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${Math.min(100, subjPercent('Physiology'))}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 6px;">Exam Countdown &amp; Daily Pace</h2>
            <p class="section-subtitle" style="margin-bottom: 12px;">Edit your target exam date anytime to recalculate your required daily topic pace.</p>

            <form id="exam-date-form" class="form-stack" style="margin-bottom: 12px;">
              <div>
                <label class="field-label" for="dash-exam-title">Exam Label</label>
                <input
                  id="dash-exam-title"
                  type="text"
                  class="input"
                  value="${escapeHtml(prefs.examTitle || APP_CONFIG.defaultExamTitle)}"
                  maxlength="120"
                />
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 170px;">
                  <label class="field-label" for="dash-exam-date">Target Exam Date</label>
                  <input
                    id="dash-exam-date"
                    type="date"
                    class="input"
                    value="${escapeHtml(prefs.examDate || '')}"
                  />
                </div>
                <button type="submit" class="btn btn-secondary btn-sm">Save Date</button>
              </div>
            </form>

            ${renderPaceSummary(stats.pace, stats)}
          </div>
        </section>

        <!-- Active Tracked Official Topics -->
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h2 class="section-title" style="font-size: var(--text-lg);">Active Tracked Topics</h2>
              <p class="section-subtitle">
                ${
                  uiCache.isPremium
                    ? 'All actively tracked official topics.'
                    : `Showing ${trackedTopics.length} of ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} Free tracker slots. Untracking keeps notes &amp; progress intact.`
                }
              </p>
            </div>
            <div class="inline-actions">
              <button type="button" id="dash-open-ai" class="btn btn-secondary btn-sm">AI Coach</button>
              <button type="button" id="dash-open-materials" class="btn btn-secondary btn-sm">Study Materials</button>
            </div>
          </div>

          ${
            trackedTopics.length === 0
              ? `<div class="state-card">
                   <p class="state-title">No topics actively tracked yet</p>
                   <p class="state-desc">Open the Syllabus to track up to ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} official topics on the Free plan, or unlock unlimited tracking for ₦1,000 once.</p>
                   <button type="button" id="dash-empty-syllabus-btn" class="btn btn-primary btn-sm">Go to Syllabus</button>
                 </div>`
              : `<div class="topic-list">
                   ${trackedTopics
                     .map((topic) => {
                       const tState = getTopicState(topic.id);
                       return `
                         <div class="topic-card" data-topic-id="${escapeHtml(topic.id)}">
                           <div class="topic-top">
                             <div>
                               <div class="topic-code">${escapeHtml(topic.code)} · ${escapeHtml(topic.semesterLabel)} · ${escapeHtml(topic.department)}</div>
                               <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
                             </div>
                             <div class="inline-actions">
                               <button type="button" class="btn btn-ghost btn-xs" data-action="details" data-id="${escapeHtml(topic.id)}">Details</button>
                               <button type="button" class="btn btn-ghost btn-xs" data-action="untrack" data-id="${escapeHtml(topic.id)}">Untrack</button>
                             </div>
                           </div>
                           <div class="segmented-status">
                             <button type="button" class="seg-btn ${tState.status === 'not_started' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="not_started">Not Started</button>
                             <button type="button" class="seg-btn ${tState.status === 'in_progress' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="in_progress">In Progress</button>
                             <button type="button" class="seg-btn ${tState.status === 'completed' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="completed">Completed</button>
                           </div>
                         </div>
                       `;
                     })
                     .join('')}
                 </div>`
          }
        </section>

        ${
          customTopics.length > 0
            ? `<section class="card">
                 <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 6px;">Custom Topics (${customTopics.length})</h2>
                 <p class="section-subtitle" style="margin-bottom: 10px;">Personal topics are displayed separately and excluded from official syllabus completion percentages.</p>
                 <div style="display: flex; flex-direction: column; gap: 8px;">
                   ${customTopics
                     .slice(0, 6)
                     .map(
                       (ct) => `
                         <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-md); background: var(--bg-surface-subtle); font-size: var(--text-sm);">
                           <span><strong>${escapeHtml(ct.title)}</strong> <span class="section-subtitle">(${escapeHtml(ct.subject)} · Sem ${escapeHtml(String(ct.semester))})</span></span>
                           <span class="badge badge--anatomy">${escapeHtml(ct.status.replace('_', ' '))}</span>
                         </div>
                       `
                     )
                     .join('')}
                 </div>
               </section>`
            : ''
        }
      </div>
    `;

    // Navigation & modal bindings
    container.querySelector('#dash-go-syllabus')?.addEventListener('click', () => onNavigateView?.('syllabus'));
    container.querySelector('#dash-empty-syllabus-btn')?.addEventListener('click', () => onNavigateView?.('syllabus'));
    container.querySelector('#dash-go-timer')?.addEventListener('click', () => onNavigateView?.('timer'));
    container.querySelector('#dash-view-analytics')?.addEventListener('click', () => onNavigateView?.('analytics'));
    container.querySelector('#dash-open-ai')?.addEventListener('click', () => onNavigateView?.('ai-coach'));
    container.querySelector('#dash-open-materials')?.addEventListener('click', () => onNavigateView?.('materials'));
    container.querySelector('#dash-open-upgrade')?.addEventListener('click', () => {
      openUpgradeModal({ onUnlocked: paint });
    });

    container.querySelector('#exam-date-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateVal = container.querySelector('#dash-exam-date')?.value || '';
      const titleVal = container.querySelector('#dash-exam-title')?.value || APP_CONFIG.defaultExamTitle;
      updatePreferences({ examDate: dateVal, examTitle: titleVal });
      paint();
      showToast('Exam countdown and daily study pace updated.', { variant: 'success' });
    });

    container.querySelectorAll('[data-action="details"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = officialTopics.find((t) => t.id === id);
        if (found) {
          openTopicDrawer(found, {
            onNavigateView: (viewName, ctx) => {
              onNavigateView?.(viewName, ctx);
            }
          });
        }
      });
    });

    container.querySelectorAll('[data-action="untrack"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await toggleTopicTracked(id);
        paint();
        showToast('Topic untracked (progress & notes kept).', {
          variant: 'info',
          onUndo: async () => {
            await undoLastAction();
            paint();
          }
        });
      });
    });

    container.querySelectorAll('[data-action="status"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const nextStatus = btn.getAttribute('data-status');
        const res = await setTopicStatus(id, nextStatus);
        if (!res.ok && res.limitReached) {
          openUpgradeModal({ reason: res.message, onUnlocked: paint });
          return;
        }
        paint();
        showToast(`Marked ${nextStatus.replace('_', ' ')}.`, {
          variant: 'success',
          onUndo: async () => {
            await undoLastAction();
            paint();
          }
        });
      });
    });
  };

  paint();
}
