/* 2ndMBstudy — Topic Detail Drawer / Modal */

import {
  getTopicState,
  setTopicStatus,
  toggleTopicTracked,
  toggleTopicFavourite,
  saveTopicNotes,
  recordDriveFolderOpened,
  undoLastAction
} from '../state/app-store.js';
import { showToast } from './toast.js';
import { openUpgradeModal } from './upgrade-modal.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function openTopicDrawer(topic, { onNavigateView = null } = {}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !topic) return;

  modalRoot.classList.remove('hidden');
  modalRoot.setAttribute('aria-hidden', 'false');

  const closeModal = () => {
    modalRoot.innerHTML = '';
    modalRoot.classList.add('hidden');
    modalRoot.setAttribute('aria-hidden', 'true');
  };

  const renderContent = () => {
    const tState = getTopicState(topic.id);
    const metaParts = [
      topic.semesterLabel,
      topic.subject,
      topic.department,
      topic.subdivision,
      topic.courseCode ? `Course ${topic.courseCode}` : ''
    ].filter(Boolean);

    modalRoot.innerHTML = `
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="topic-drawer-title">
        <div class="modal-header">
          <div>
            <div class="topic-code">${escapeHtml(topic.code)} · ${escapeHtml(metaParts.join(' · '))}</div>
            <h2 id="topic-drawer-title" class="modal-title" style="margin-top: 4px;">${escapeHtml(topic.title)}</h2>
          </div>
          <button type="button" id="close-topic-drawer" class="icon-btn" aria-label="Close topic details">✕</button>
        </div>

        <div class="form-stack">
          <div>
            <span class="field-label">Study Status</span>
            <div class="segmented-status" role="group" aria-label="Topic study status">
              <button
                type="button"
                class="seg-btn ${tState.status === 'not_started' ? 'is-selected' : ''}"
                data-topic-status="not_started"
              >
                Not Started
              </button>
              <button
                type="button"
                class="seg-btn ${tState.status === 'in_progress' ? 'is-selected' : ''}"
                data-topic-status="in_progress"
              >
                In Progress
              </button>
              <button
                type="button"
                class="seg-btn ${tState.status === 'completed' ? 'is-selected' : ''}"
                data-topic-status="completed"
              >
                Completed
              </button>
            </div>
          </div>

          <div class="inline-actions">
            <button type="button" id="toggle-track-btn" class="btn btn-secondary btn-sm">
              ${tState.tracked ? '✓ Actively Tracked' : '+ Track Topic'}
            </button>
            <button type="button" id="toggle-fav-btn" class="btn btn-secondary btn-sm">
              ${tState.favourite ? '★ Favourited' : '☆ Favourite'}
            </button>
            ${
              topic.driveUrl
                ? `<a
                     id="open-topic-drive-link"
                     href="${escapeHtml(topic.driveUrl)}"
                     target="_blank"
                     rel="noopener noreferrer"
                     class="btn btn-primary btn-sm"
                   >
                     Open Drive Folder ↗
                   </a>`
                : ''
            }
          </div>

          <div>
            <label class="field-label" for="topic-study-notes">Topic Study Notes</label>
            <textarea
              id="topic-study-notes"
              class="textarea"
              placeholder="Write key anatomical relations, biochemical pathways, physiological mechanisms, or exam mnemonics..."
            >${escapeHtml(tState.notes || '')}</textarea>
            <div class="inline-actions" style="margin-top: 8px; justify-content: space-between; align-items: center;">
              <span class="section-subtitle">
                ${tState.lastDriveOpenedAt ? `Drive opened: ${escapeHtml(new Date(tState.lastDriveOpenedAt).toLocaleDateString())}` : 'Saved locally on this device'}
              </span>
              <button type="button" id="save-topic-notes-btn" class="btn btn-secondary btn-sm">
                Save Notes
              </button>
            </div>
          </div>

          <div class="card" style="background: var(--bg-surface-subtle);">
            <p style="margin: 0 0 8px; font-weight: 600; font-size: var(--text-sm);">Study With AI</p>
            <div class="inline-actions">
              <button type="button" id="ask-ai-topic-btn" class="btn btn-secondary btn-sm">
                Ask AI Coach About Topic
              </button>
              <button type="button" id="gen-mat-topic-btn" class="btn btn-secondary btn-sm">
                Generate Flashcards / Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close-topic-drawer')?.addEventListener('click', closeModal);

    modalRoot.querySelectorAll('[data-topic-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextStatus = btn.getAttribute('data-topic-status');
        const res = await setTopicStatus(topic.id, nextStatus);
        if (!res.ok && res.limitReached) {
          openUpgradeModal({ reason: res.message, onUnlocked: renderContent });
          return;
        }
        renderContent();
        showToast(`Status updated to ${nextStatus.replace('_', ' ')}.`, {
          variant: 'success',
          onUndo: async () => {
            await undoLastAction();
            renderContent();
          }
        });
      });
    });

    document.getElementById('toggle-track-btn')?.addEventListener('click', async () => {
      const res = await toggleTopicTracked(topic.id);
      if (!res.ok && res.limitReached) {
        openUpgradeModal({ reason: res.message, onUnlocked: renderContent });
        return;
      }
      renderContent();
      showToast(res.tracked ? 'Topic added to active tracker.' : 'Topic untracked (progress & notes kept).', {
        variant: 'info',
        onUndo: async () => {
          await undoLastAction();
          renderContent();
        }
      });
    });

    document.getElementById('toggle-fav-btn')?.addEventListener('click', async () => {
      const updated = await toggleTopicFavourite(topic.id);
      renderContent();
      showToast(updated.favourite ? 'Added to favourites.' : 'Removed from favourites.', {
        variant: 'info'
      });
    });

    document.getElementById('open-topic-drive-link')?.addEventListener('click', async () => {
      await recordDriveFolderOpened(topic.id);
      renderContent();
    });

    document.getElementById('save-topic-notes-btn')?.addEventListener('click', async () => {
      const notesEl = document.getElementById('topic-study-notes');
      await saveTopicNotes(topic.id, notesEl ? notesEl.value : '');
      renderContent();
      showToast('Topic notes saved.', { variant: 'success' });
    });

    document.getElementById('ask-ai-topic-btn')?.addEventListener('click', () => {
      closeModal();
      if (typeof onNavigateView === 'function') {
        onNavigateView('ai-coach', { topic });
      }
    });

    document.getElementById('gen-mat-topic-btn')?.addEventListener('click', () => {
      closeModal();
      if (typeof onNavigateView === 'function') {
        onNavigateView('materials', { topic });
      }
    });
  };

  modalRoot.onclick = (e) => {
    if (e.target === modalRoot) closeModal();
  };

  renderContent();
}
