/* 2ndMBstudy — Study Planner, Tasks & Weekly Timetable View */

import {
  getSnapshot,
  addTask,
  toggleTaskCompleted,
  deleteTask,
  saveTimetableSlot,
  deleteTimetableSlot,
  addCategory
} from '../state/app-store.js';
import { showToast } from '../components/toast.js';
import { openUpgradeModal } from '../components/upgrade-modal.js';

const DAYS_OF_WEEK = Object.freeze([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]);

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function renderPlannerView(container) {
  if (!container) return;

  let editingSlotId = null;

  const paint = () => {
    const snap = getSnapshot();
    const { tasks, timetable, categories, uiCache } = snap;
    const editingSlot = editingSlotId ? timetable.find((s) => s.id === editingSlotId) : null;

    container.innerHTML = `
      <div class="page-stack">
        <!-- Tasks & Daily Study Checklist -->
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h1 class="section-title">Study Tasks &amp; Daily Checklist</h1>
              <p class="section-subtitle">Organize lecture reviews, past-question drills, and daily study targets.</p>
            </div>
            <span class="badge badge--anatomy tabular-nums">
              ${tasks.filter((t) => t.completed).length} / ${tasks.length} Done
            </span>
          </div>

          <form id="add-task-form" class="form-stack" style="margin-bottom: 14px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
              <div style="grid-column: span 2; min-width: 220px;">
                <label class="field-label" for="task-title-input">Task / Checklist Item</label>
                <input id="task-title-input" type="text" class="input" placeholder="e.g., Revise Urea Cycle & Hyperammonemia past questions" required />
              </div>
              <div>
                <label class="field-label" for="task-priority-input">Priority</label>
                <select id="task-priority-input" class="select">
                  <option value="high">High</option>
                  <option value="medium" selected>Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="task-due-input">Due Date (Optional)</label>
                <input id="task-due-input" type="date" class="input" />
              </div>
            </div>

            <div class="inline-actions" style="justify-content: space-between; align-items: center;">
              <label style="display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-sm); cursor: pointer;">
                <input id="task-daily-check" type="checkbox" />
                <span>Mark as recurring daily checklist item</span>
              </label>
              <button type="submit" class="btn btn-primary btn-sm">Add Task</button>
            </div>
          </form>

          ${
            tasks.length === 0
              ? `<p class="section-subtitle">No tasks added yet. Add a task or daily checklist item above.</p>`
              : `<div class="topic-list">
                   ${tasks
                     .map(
                       (task) => `
                         <div class="topic-card" style="padding: var(--space-3);">
                           <div class="topic-top" style="align-items: center;">
                             <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; flex: 1;">
                               <input
                                 type="checkbox"
                                 data-toggle-task-id="${escapeHtml(task.id)}"
                                 ${task.completed ? 'checked' : ''}
                                 style="margin-top: 3px;"
                               />
                               <div>
                                 <div style="font-weight: 600; font-size: var(--text-sm); ${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                                   ${escapeHtml(task.title)}
                                 </div>
                                 <div class="inline-actions" style="margin-top: 4px;">
                                   <span class="badge badge--anatomy">${escapeHtml(task.priority)}</span>
                                   ${task.dailyChecklist ? `<span class="badge badge--physio">Daily</span>` : ''}
                                   ${task.dueDate ? `<span class="topic-code">Due ${escapeHtml(task.dueDate)}</span>` : ''}
                                 </div>
                               </div>
                             </label>
                             <button type="button" class="btn btn-ghost btn-xs" data-delete-task-id="${escapeHtml(task.id)}">Delete</button>
                           </div>
                         </div>
                       `
                     )
                     .join('')}
                 </div>`
          }
        </section>

        <!-- Weekly Reading & Lecture Timetable -->
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h2 class="section-title" style="font-size: var(--text-lg);">Weekly Reading Timetable</h2>
              <p class="section-subtitle">Plan recurring blocks across Monday–Sunday for Anatomy, Biochemistry, Physiology, and practicals.</p>
            </div>
          </div>

          <form id="timetable-slot-form" class="form-stack" style="margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
              <div>
                <label class="field-label" for="slot-day">Day</label>
                <select id="slot-day" class="select">
                  ${DAYS_OF_WEEK.map(
                    (d) => `<option value="${d}" ${(editingSlot?.day || 'Monday') === d ? 'selected' : ''}>${d}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="field-label" for="slot-start">Start Time</label>
                <input id="slot-start" type="time" class="input" value="${escapeHtml(editingSlot?.startTime || '08:00')}" required />
              </div>
              <div>
                <label class="field-label" for="slot-end">End Time</label>
                <input id="slot-end" type="time" class="input" value="${escapeHtml(editingSlot?.endTime || '10:00')}" required />
              </div>
              <div>
                <label class="field-label" for="slot-subject">Subject</label>
                <select id="slot-subject" class="select">
                  <option value="Anatomy" ${(editingSlot?.subject || 'Anatomy') === 'Anatomy' ? 'selected' : ''}>Anatomy</option>
                  <option value="Biochemistry" ${editingSlot?.subject === 'Biochemistry' ? 'selected' : ''}>Biochemistry</option>
                  <option value="Physiology" ${editingSlot?.subject === 'Physiology' ? 'selected' : ''}>Physiology</option>
                  <option value="General" ${editingSlot?.subject === 'General' ? 'selected' : ''}>General</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
              <div>
                <label class="field-label" for="slot-activity">Activity / Topic Block</label>
                <input
                  id="slot-activity"
                  type="text"
                  class="input"
                  placeholder="e.g., Gross Anatomy: Thorax & Heart"
                  value="${escapeHtml(editingSlot?.activity || '')}"
                  required
                />
              </div>
              <div>
                <label class="field-label" for="slot-location">Venue / Notes (Optional)</label>
                <input
                  id="slot-location"
                  type="text"
                  class="input"
                  placeholder="e.g., Anatomy Hall / Past questions"
                  value="${escapeHtml(editingSlot?.location || '')}"
                />
              </div>
            </div>

            <div class="inline-actions">
              <button type="submit" class="btn btn-primary btn-sm">
                ${editingSlot ? 'Update Timetable Slot' : 'Add Timetable Slot'}
              </button>
              ${
                editingSlot
                  ? `<button type="button" id="cancel-edit-slot-btn" class="btn btn-secondary btn-sm">Cancel Edit</button>`
                  : ''
              }
            </div>
          </form>

          <div class="timetable-grid">
            ${DAYS_OF_WEEK.map((day) => {
              const daySlots = timetable
                .filter((s) => s.day === day)
                .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

              return `
                <div class="card" style="background: var(--bg-surface-subtle);">
                  <h3 style="margin: 0 0 8px; font-size: var(--text-base);">${day}</h3>
                  ${
                    daySlots.length === 0
                      ? `<p class="section-subtitle">No blocks scheduled.</p>`
                      : `<div style="display: flex; flex-direction: column; gap: 8px;">
                           ${daySlots
                             .map(
                               (slot) => `
                                 <div style="padding: 8px 10px; border-radius: var(--radius-md); background: var(--bg-surface); border: 1px solid var(--border-subtle);">
                                   <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                                     <span class="topic-code tabular-nums">${escapeHtml(slot.startTime)}–${escapeHtml(slot.endTime)} · ${escapeHtml(slot.subject)}</span>
                                     <div class="inline-actions">
                                       <button type="button" class="btn btn-ghost btn-xs" data-edit-slot-id="${escapeHtml(slot.id)}">Edit</button>
                                       <button type="button" class="btn btn-ghost btn-xs" data-delete-slot-id="${escapeHtml(slot.id)}">✕</button>
                                     </div>
                                   </div>
                                   <div style="font-weight: 600; font-size: var(--text-sm); margin-top: 2px;">${escapeHtml(slot.activity)}</div>
                                   ${slot.location ? `<div class="section-subtitle">${escapeHtml(slot.location)}</div>` : ''}
                                 </div>
                               `
                             )
                             .join('')}
                         </div>`
                  }
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Custom Colour-Coded Categories (Premium Feature) -->
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 10px;">
            <div>
              <h2 class="section-title" style="font-size: var(--text-lg);">Custom Colour-Coded Categories</h2>
              <p class="section-subtitle">
                ${uiCache.isPremium ? 'Create custom colour labels for your study blocks.' : 'Available with ₦1,000 one-time Premium.'}
              </p>
            </div>
          </div>

          <form id="add-category-form" class="inline-actions" style="margin-bottom: 12px;">
            <input id="cat-name-input" type="text" class="input" style="max-width: 220px;" placeholder="e.g., High-Yield Embryo" required />
            <input id="cat-color-input" type="color" value="#0f766e" style="height: 40px; width: 52px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: transparent;" />
            <button type="submit" class="btn btn-secondary btn-sm">Add Category</button>
          </form>

          <div class="inline-actions">
            ${
              categories.length === 0
                ? `<span class="section-subtitle">No custom categories yet.</span>`
                : categories
                    .map(
                      (c) => `
                        <span class="badge" style="background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); color: var(--text-primary);">
                          <span style="width: 10px; height: 10px; border-radius: 999px; background: ${escapeHtml(c.color)}; display: inline-block;"></span>
                          ${escapeHtml(c.name)}
                        </span>
                      `
                    )
                    .join('')
            }
          </div>
        </section>
      </div>
    `;

    // Task bindings
    container.querySelector('#add-task-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = container.querySelector('#task-title-input')?.value || '';
      const priority = container.querySelector('#task-priority-input')?.value || 'medium';
      const dueDate = container.querySelector('#task-due-input')?.value || '';
      const dailyChecklist = Boolean(container.querySelector('#task-daily-check')?.checked);
      try {
        await addTask({ title, priority, dueDate, dailyChecklist });
        paint();
        showToast('Task added to planner.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not add task.', { variant: 'error' });
      }
    });

    container.querySelectorAll('[data-toggle-task-id]').forEach((chk) => {
      chk.addEventListener('change', async () => {
        const id = chk.getAttribute('data-toggle-task-id');
        await toggleTaskCompleted(id);
        paint();
      });
    });

    container.querySelectorAll('[data-delete-task-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-task-id');
        await deleteTask(id);
        paint();
        showToast('Task removed.', { variant: 'info' });
      });
    });

    // Timetable bindings
    container.querySelector('#timetable-slot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const day = container.querySelector('#slot-day')?.value || 'Monday';
      const startTime = container.querySelector('#slot-start')?.value || '08:00';
      const endTime = container.querySelector('#slot-end')?.value || '09:00';
      const subject = container.querySelector('#slot-subject')?.value || 'General';
      const activity = container.querySelector('#slot-activity')?.value || '';
      const location = container.querySelector('#slot-location')?.value || '';

      try {
        await saveTimetableSlot({
          id: editingSlotId || undefined,
          day,
          startTime,
          endTime,
          subject,
          activity,
          location
        });
        editingSlotId = null;
        paint();
        showToast('Timetable saved.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not save timetable slot.', { variant: 'error' });
      }
    });

    container.querySelector('#cancel-edit-slot-btn')?.addEventListener('click', () => {
      editingSlotId = null;
      paint();
    });

    container.querySelectorAll('[data-edit-slot-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingSlotId = btn.getAttribute('data-edit-slot-id');
        paint();
      });
    });

    container.querySelectorAll('[data-delete-slot-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-slot-id');
        if (editingSlotId === id) editingSlotId = null;
        await deleteTimetableSlot(id);
        paint();
        showToast('Timetable slot deleted.', { variant: 'info' });
      });
    });

    // Category bindings
    container.querySelector('#add-category-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = container.querySelector('#cat-name-input')?.value || '';
      const color = container.querySelector('#cat-color-input')?.value || '#0f766e';
      try {
        const res = await addCategory({ name, color, subject: 'General' });
        if (!res.ok && res.requiresPremium) {
          openUpgradeModal({ reason: res.message, onUnlocked: paint });
          return;
        }
        paint();
        showToast('Category added.', { variant: 'success' });
      } catch (err) {
        showToast(err?.message || 'Could not add category.', { variant: 'error' });
      }
    });
  };

  paint();
}
