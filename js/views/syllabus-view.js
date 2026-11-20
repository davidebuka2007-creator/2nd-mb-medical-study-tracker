/* 2ndMBstudy — Interactive 2nd MB Syllabus View */
/* Features sticky course headers with Google Drive folder links that follow while scrolling. */

import { APP_CONFIG } from '../config/app-config.js';
import {
  getSnapshot,
  getTopicState,
  setTopicStatus,
  toggleTopicTracked,
  toggleTopicFavourite,
  recordDriveFolderOpened,
  addCustomTopic,
  updateCustomTopicStatus,
  deleteCustomTopic,
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

export function renderSyllabusView(container, { onNavigateView } = {}) {
  if (!container) return;

  const filters = {
    query: '',
    semester: 'all',
    subject: 'all',
    status: 'all',
    onlyTracked: false,
    onlyFavourites: false
  };

  const paint = () => {
    const snap = getSnapshot();
    const { sections, officialTopics, customTopics, uiCache } = snap;
    const q = filters.query.trim().toLowerCase();

    const matchesTopic = (topic) => {
      const tState = getTopicState(topic.id);
      if (filters.semester !== 'all' && String(topic.semester) !== String(filters.semester)) {
        return false;
      }
      if (filters.subject !== 'all' && topic.subject !== filters.subject) {
        return false;
      }
      if (filters.status !== 'all' && tState.status !== filters.status) {
        return false;
      }
      if (filters.onlyTracked && !tState.tracked) {
        return false;
      }
      if (filters.onlyFavourites && !tState.favourite) {
        return false;
      }
      if (q) {
        const hay = `${topic.title} ${topic.department} ${topic.subdivision || ''} ${topic.courseCode || ''} ${topic.semesterLabel} ${topic.subject} ${tState.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };

    const sectionBlocks = sections
      .map((sec) => {
        const secTopics = officialTopics.filter((t) => t.sectionId === sec.id);
        const filteredTopics = secTopics.filter(matchesTopic);
        if (filteredTopics.length === 0) return '';

        const completedInSection = secTopics.filter(
          (t) => getTopicState(t.id).status === 'completed'
        ).length;

        return `
          <section class="course-section" aria-label="${escapeHtml(sec.sectionTitle)}">
            <div class="sticky-course-bar">
              <div class="sticky-course-info">
                <h3 class="sticky-course-title">${escapeHtml(sec.sectionTitle)}</h3>
                <span class="sticky-course-meta tabular-nums">
                  ${completedInSection} / ${secTopics.length} completed · Showing ${filteredTopics.length} topic(s)
                </span>
              </div>
              <div class="inline-actions">
                ${
                  sec.driveUrl
                    ? `<a
                         href="${escapeHtml(sec.driveUrl)}"
                         target="_blank"
                         rel="noopener noreferrer"
                         class="btn btn-primary btn-xs js-section-drive"
                         data-first-topic-id="${escapeHtml(filteredTopics[0].id)}"
                       >
                         Drive Folder ↗
                       </a>`
                    : ''
                }
              </div>
            </div>

            <div class="topic-list">
              ${filteredTopics
                .map((topic) => {
                  const tState = getTopicState(topic.id);
                  const statusLabel =
                    tState.status === 'completed'
                      ? 'Completed'
                      : tState.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started';
                  const statusClass =
                    tState.status === 'completed'
                      ? 'status-pill--completed'
                      : tState.status === 'in_progress'
                        ? 'status-pill--in-progress'
                        : 'status-pill--not-started';

                  return `
                    <article class="topic-card" data-topic-id="${escapeHtml(topic.id)}">
                      <div class="topic-top">
                        <div>
                          <div class="topic-code">${escapeHtml(topic.code)} · ${escapeHtml(topic.department)}${topic.subdivision ? ` · ${escapeHtml(topic.subdivision)}` : ''}${topic.courseCode ? ` · ${escapeHtml(topic.courseCode)}` : ''}</div>
                          <h4 class="topic-title">${escapeHtml(topic.title)}</h4>
                          <div class="inline-actions" style="margin-top: 6px;">
                            <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                            ${tState.tracked ? `<span class="badge badge--physio">Tracked</span>` : ''}
                            ${tState.favourite ? `<span class="badge badge--anatomy">★ Favourite</span>` : ''}
                            ${tState.notes ? `<span class="badge badge--biochem">Notes</span>` : ''}
                          </div>
                        </div>

                        <div class="inline-actions">
                          <button type="button" class="btn btn-secondary btn-xs" data-action="track" data-id="${escapeHtml(topic.id)}">
                            ${tState.tracked ? 'Untrack' : '+ Track'}
                          </button>
                          <button type="button" class="btn btn-ghost btn-xs" data-action="fav" data-id="${escapeHtml(topic.id)}">
                            ${tState.favourite ? '★' : '☆'}
                          </button>
                          <button type="button" class="btn btn-secondary btn-xs" data-action="open" data-id="${escapeHtml(topic.id)}">
                            Notes &amp; Details
                          </button>
                        </div>
                      </div>

                      <div class="segmented-status" role="group" aria-label="Change status for ${escapeHtml(topic.title)}">
                        <button type="button" class="seg-btn ${tState.status === 'not_started' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="not_started">Not Started</button>
                        <button type="button" class="seg-btn ${tState.status === 'in_progress' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="in_progress">In Progress</button>
                        <button type="button" class="seg-btn ${tState.status === 'completed' ? 'is-selected' : ''}" data-action="status" data-id="${escapeHtml(topic.id)}" data-status="completed">Completed</button>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          </section>
        `;
      })
      .filter(Boolean)
      .join('');

    container.innerHTML = `
      <div class="page-stack">
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h1 class="section-title">2nd MB Official Syllabus</h1>
              <p class="section-subtitle">
                Semesters 1–3 · Anatomy, Biochemistry (341 &amp; 351), and Physiology · Sticky course headers link directly to Google Drive folders while you scroll.
              </p>
            </div>
            <span class="badge badge--anatomy tabular-nums">
              ${snap.stats.trackedCount}${uiCache.isPremium ? '' : ` / ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics}`} Tracked
            </span>
          </div>

          <div class="two-col-grid" style="margin-bottom: 12px;">
            <div>
              <label class="field-label" for="syllabus-search">Search Topics, Departments, Course Codes (341/351) or Notes</label>
              <input
                id="syllabus-search"
                type="search"
                class="input"
                placeholder="e.g., Brachial Plexus, Glycolysis, 341, Renal..."
                value="${escapeHtml(filters.query)}"
              />
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <div>
                <label class="field-label" for="filter-semester">Semester</label>
                <select id="filter-semester" class="select">
                  <option value="all" ${filters.semester === 'all' ? 'selected' : ''}>All Semesters</option>
                  <option value="1" ${filters.semester === '1' ? 'selected' : ''}>1st Semester</option>
                  <option value="2" ${filters.semester === '2' ? 'selected' : ''}>2nd Semester</option>
                  <option value="3" ${filters.semester === '3' ? 'selected' : ''}>3rd Semester</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="filter-subject">Subject</label>
                <select id="filter-subject" class="select">
                  <option value="all" ${filters.subject === 'all' ? 'selected' : ''}>All Subjects</option>
                  <option value="Anatomy" ${filters.subject === 'Anatomy' ? 'selected' : ''}>Anatomy</option>
                  <option value="Biochemistry" ${filters.subject === 'Biochemistry' ? 'selected' : ''}>Biochemistry</option>
                  <option value="Physiology" ${filters.subject === 'Physiology' ? 'selected' : ''}>Physiology</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="filter-status">Status</label>
                <select id="filter-status" class="select">
                  <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="not_started" ${filters.status === 'not_started' ? 'selected' : ''}>Not Started</option>
                  <option value="in_progress" ${filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="completed" ${filters.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div class="inline-actions">
            <button type="button" id="toggle-filter-tracked" class="btn ${filters.onlyTracked ? 'btn-primary' : 'btn-secondary'} btn-xs">
              Tracked Only
            </button>
            <button type="button" id="toggle-filter-fav" class="btn ${filters.onlyFavourites ? 'btn-primary' : 'btn-secondary'} btn-xs">
              Favourites Only
            </button>
            <button type="button" id="clear-syllabus-filters" class="btn btn-ghost btn-xs">
              Reset Filters
            </button>
          </div>
        </section>

        ${
          sectionBlocks ||
          `<div class="state-card">
             <p class="state-title">No syllabus topics match your current filters</p>
             <p class="state-desc">Try clearing search text or switching Semester, Subject, or Status filters.</p>
             <button type="button" id="empty-reset-filters" class="btn btn-secondary btn-sm">Reset Filters</button>
           </div>`
        }

        <!-- Personal Custom Topics (Kept Separate from Official Syllabus %) -->
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 10px;">
            <div>
              <h2 class="section-title" style="font-size: var(--text-lg);">Personal Custom Topics</h2>
              <p class="section-subtitle">
                Stored separately from official syllabus completion percentages. ${uiCache.isPremium ? 'Premium unlocked.' : 'Requires ₦1,000 one-time Premium.'}
              </p>
            </div>
          </div>

          <form id="add-custom-topic-form" class="form-stack" style="margin-bottom: 14px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
              <div>
                <label class="field-label" for="custom-topic-title">Topic Title</label>
                <input id="custom-topic-title" type="text" class="input" placeholder="e.g., Extra past-question drill" required />
              </div>
              <div>
                <label class="field-label" for="custom-topic-subject">Subject</label>
                <select id="custom-topic-subject" class="select">
                  <option value="Anatomy">Anatomy</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Physiology">Physiology</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="custom-topic-semester">Semester</label>
                <select id="custom-topic-semester" class="select">
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                </select>
              </div>
            </div>
            <div>
              <button type="submit" class="btn btn-secondary btn-sm">Add Custom Topic</button>
            </div>
          </form>

          ${
            customTopics.length === 0
              ? `<p class="section-subtitle">No custom topics added yet.</p>`
              : `<div class="topic-list">
                   ${customTopics
                     .map(
                       (ct) => `
                         <div class="topic-card">
                           <div class="topic-top">
                             <div>
                               <div class="topic-code">Custom · ${escapeHtml(ct.subject)} · Semester ${escapeHtml(String(ct.semester))}</div>
                               <h4 class="topic-title">${escapeHtml(ct.title)}</h4>
                             </div>
                             <div class="inline-actions">
                               <select class="select" style="width: auto; min-height: 34px;" data-custom-status-id="${escapeHtml(ct.id)}">
                                 <option value="not_started" ${ct.status === 'not_started' ? 'selected' : ''}>Not Started</option>
                                 <option value="in_progress" ${ct.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                 <option value="completed" ${ct.status === 'completed' ? 'selected' : ''}>Completed</option>
                               </select>
                               <button type="button" class="btn btn-ghost btn-xs" data-delete-custom-id="${escapeHtml(ct.id)}">Delete</button>
                             </div>
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

    // Bind filter events
    const searchInput = container.querySelector('#syllabus-search');
    searchInput?.addEventListener('input', (e) => {
      filters.query = e.target.value || '';
      paint();
    });

    container.querySelector('#filter-semester')?.addEventListener('change', (e) => {
      filters.semester = e.target.value;
      paint();
    });

    container.querySelector('#filter-subject')?.addEventListener('change', (e) => {
      filters.subject = e.target.value;
      paint();
    });

    container.querySelector('#filter-status')?.addEventListener('change', (e) => {
      filters.status = e.target.value;
      paint();
    });

    container.querySelector('#toggle-filter-tracked')?.addEventListener('click', () => {
      filters.onlyTracked = !filters.onlyTracked;
      paint();
    });

    container.querySelector('#toggle-filter-fav')?.addEventListener('click', () => {
      filters.onlyFavourites = !filters.onlyFavourites;
      paint();
    });

    const resetAllFilters = () => {
      filters.query = '';
      filters.semester = 'all';
      filters.subject = 'all';
      filters.status = 'all';
      filters.onlyTracked = false;
      filters.onlyFavourites = false;
      paint();
    };
    container.querySelector('#clear-syllabus-filters')?.addEventListener('click', resetAllFilters);
    container.querySelector('#empty-reset-filters')?.addEventListener('click', resetAllFilters);

    // Sticky course Drive link click -> records Drive open without downgrading Completed
    container.querySelectorAll('.js-section-drive').forEach((linkEl) => {
      linkEl.addEventListener('click', async () => {
        const tId = linkEl.getAttribute('data-first-topic-id');
        if (tId) {
          await recordDriveFolderOpened(tId);
        }
      });
    });

    // Topic actions
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
        showToast(`Status set to ${nextStatus.replace('_', ' ')}.`, {
          variant: 'success',
          onUndo: async () => {
            await undoLastAction();
            paint();
          }
        });
      });
    });

    container.querySelectorAll('[data-action="track"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await toggleTopicTracked(id);
        if (!res.ok && res.limitReached) {
          openUpgradeModal({ reason: res.message, onUnlocked: paint });
          return;
        }
        paint();
        showToast(res.tracked ? 'Topic tracked.' : 'Topic untracked (progress & notes kept).', {
          variant: 'info',
          onUndo: async () => {
            await undoLastAction();
            paint();
          }
        });
      });
    });

    container.querySelectorAll('[data-action="fav"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const updated = await toggleTopicFavourite(id);
        paint();
        showToast(updated.favourite ? 'Added to favourites.' : 'Removed from favourites.', {
          variant: 'info'
        });
      });
    });

    container.querySelectorAll('[data-action="open"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const found = officialTopics.find((t) => t.id === id);
        if (found) {
          openTopicDrawer(found, {
            onNavigateView: (viewName, ctx) => onNavigateView?.(viewName, ctx)
          });
        }
      });
    });

    // Custom topics
    container.querySelector('#add-custom-topic-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = container.querySelector('#custom-topic-title')?.value || '';
      const subject = container.querySelector('#custom-topic-subject')?.value || 'Anatomy';
      const semester = Number(container.querySelector('#custom-topic-semester')?.value || 1);
      try {
        const res = await addCustomTopic({ title, subject, semester });
        if (!res.ok && res.requiresPremium) {
          openUpgradeModal({ reason: res.message, onUnlocked: paint });
          return;
        }
        paint();
        showToast('Custom topic added.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not add custom topic.', { variant: 'error' });
      }
    });

    container.querySelectorAll('[data-custom-status-id]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-custom-status-id');
        await updateCustomTopicStatus(id, sel.value);
        paint();
      });
    });

    container.querySelectorAll('[data-delete-custom-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-custom-id');
        await deleteCustomTopic(id);
        paint();
        showToast('Custom topic deleted.', { variant: 'info' });
      });
    });
  };

  paint();
}
