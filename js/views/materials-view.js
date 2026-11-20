/* 2ndMBstudy — Study Materials Generator & Active Recall Library View */

import { APP_CONFIG } from '../config/app-config.js';
import {
  getSnapshot,
  getRemainingFreeAiInteractions,
  saveMaterial,
  appendMaterialReview,
  deleteMaterial
} from '../state/app-store.js';
import { generateStudyMaterialPayload } from '../services/ai-service.js';
import { parseUploadedStudyFile, normalizePastedNotes } from '../services/doc-parser.js';
import { showToast } from '../components/toast.js';
import { openUpgradeModal } from '../components/upgrade-modal.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function renderMaterialContentBlock(material) {
  const c = material.content;
  if (!c) {
    return `<p class="section-subtitle">No structured content stored for this item.</p>`;
  }

  if (Array.isArray(c.cards) && c.cards.length > 0) {
    return `
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
        ${c.cards
          .map(
            (card, idx) => `
              <details class="card" style="background: var(--bg-surface-subtle);">
                <summary style="cursor: pointer; font-weight: 600; font-size: var(--text-sm);">
                  Card ${idx + 1}: ${escapeHtml(card.front || card.question || '')}
                </summary>
                <div style="margin-top: 8px; font-size: var(--text-sm); color: var(--text-secondary); white-space: pre-wrap;">
                  ${escapeHtml(card.back || card.answer || '')}
                </div>
              </details>
            `
          )
          .join('')}
      </div>
    `;
  }

  if (Array.isArray(c.questions) && c.questions.length > 0) {
    return `
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
        ${c.questions
          .map(
            (q, idx) => `
              <details class="card" style="background: var(--bg-surface-subtle);">
                <summary style="cursor: pointer; font-weight: 600; font-size: var(--text-sm);">
                  Q${idx + 1}: ${escapeHtml(q.prompt || q.question || '')}
                </summary>
                <div style="margin-top: 8px; font-size: var(--text-sm); color: var(--text-secondary); white-space: pre-wrap;">
                  <strong>Answer / Key Points:</strong> ${escapeHtml(q.answer || q.explanation || '')}
                </div>
              </details>
            `
          )
          .join('')}
      </div>
    `;
  }

  if (typeof c === 'string') {
    return `<div style="margin-top: 10px; font-size: var(--text-sm); white-space: pre-wrap;">${escapeHtml(c)}</div>`;
  }

  if (typeof c.text === 'string') {
    return `<div style="margin-top: 10px; font-size: var(--text-sm); white-space: pre-wrap;">${escapeHtml(c.text)}</div>`;
  }

  return `<pre style="margin-top: 10px; font-size: var(--text-xs); white-space: pre-wrap; overflow-x: auto;">${escapeHtml(JSON.stringify(c, null, 2))}</pre>`;
}

export function renderMaterialsView(container, { initialContext = null } = {}) {
  if (!container) return;

  const snapInit = getSnapshot();
  const studio = {
    sourceMode: 'curriculum', // 'curriculum' | 'pasted' | 'upload'
    selectedTopicId: initialContext?.topic?.id || snapInit.officialTopics[0]?.id || '',
    pastedText: '',
    uploadedFilename: '',
    extractedText: '',
    materialType: 'flashcards', // 'flashcards' | 'questions' | 'summary' | 'revision'
    subject: initialContext?.topic?.subject || 'Anatomy',
    customTitle: '',
    generating: false,
    parsing: false,
    errorMsg: ''
  };

  const paint = () => {
    const snap = getSnapshot();
    const { officialTopics, materials, uiCache } = snap;
    const isPremium = Boolean(uiCache.isPremium);
    const remainingFree = getRemainingFreeAiInteractions();

    const selectedTopic = officialTopics.find((t) => t.id === studio.selectedTopicId) || null;
    const topicOptions = officialTopics
      .slice(0, 140)
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${studio.selectedTopicId === t.id ? 'selected' : ''}>${escapeHtml(t.code)} · ${escapeHtml(t.title.slice(0, 58))}</option>`
      )
      .join('');

    container.innerHTML = `
      <div class="page-stack">
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div>
              <h1 class="section-title">AI Study Materials Studio</h1>
              <p class="section-subtitle">
                Generate flashcards, practice questions, summaries, and revision sheets from syllabus topics, pasted notes, or uploaded files (.txt, .pdf, .docx).
              </p>
            </div>
            <div class="inline-actions">
              <span class="badge ${isPremium ? 'badge--physio' : 'badge--anatomy'} tabular-nums">
                ${
                  isPremium
                    ? '✓ Unlimited AI (Premium)'
                    : `Free AI Left: ${remainingFree} / ${APP_CONFIG.pricing.freeMaxAiInteractions}`
                }
              </span>
              ${
                !isPremium
                  ? `<button type="button" id="mat-upgrade-btn" class="btn btn-secondary btn-xs">Unlock Unlimited (₦1,000 Once)</button>`
                  : ''
              }
            </div>
          </div>

          ${
            studio.errorMsg
              ? `<div class="state-card state-error" style="padding: 10px 12px; margin-bottom: 12px; text-align: left;">
                   <p class="state-desc" style="color: inherit;">${escapeHtml(studio.errorMsg)}</p>
                 </div>`
              : ''
          }

          <form id="generate-material-form" class="form-stack">
            <div>
              <span class="field-label">1. Choose Study Source</span>
              <div class="inline-actions">
                <button type="button" class="btn ${studio.sourceMode === 'curriculum' ? 'btn-primary' : 'btn-secondary'} btn-xs" data-source-mode="curriculum">
                  Syllabus Topic
                </button>
                <button type="button" class="btn ${studio.sourceMode === 'pasted' ? 'btn-primary' : 'btn-secondary'} btn-xs" data-source-mode="pasted">
                  Pasted Notes
                </button>
                <button type="button" class="btn ${studio.sourceMode === 'upload' ? 'btn-primary' : 'btn-secondary'} btn-xs" data-source-mode="upload">
                  Upload File (.txt, .pdf, .docx)
                </button>
              </div>
            </div>

            ${
              studio.sourceMode === 'curriculum'
                ? `<div>
                     <label class="field-label" for="mat-topic-select">Select 2nd MB Official Topic</label>
                     <select id="mat-topic-select" class="select">${topicOptions}</select>
                   </div>`
                : studio.sourceMode === 'pasted'
                  ? `<div>
                       <label class="field-label" for="mat-pasted-notes">Paste Lecture Notes or Summary (Up to ${APP_CONFIG.limits.maxPastedChars.toLocaleString()} chars)</label>
                       <textarea id="mat-pasted-notes" class="textarea" rows="5" placeholder="Paste your anatomy, biochemistry, or physiology notes here...">${escapeHtml(studio.pastedText)}</textarea>
                     </div>`
                  : `<div class="form-stack">
                       <div>
                         <label class="field-label" for="mat-file-input">Upload Study File (Max ${Math.round(APP_CONFIG.limits.maxFileBytes / (1024 * 1024))} MB)</label>
                         <input id="mat-file-input" type="file" class="input" accept=".txt,.pdf,.docx,.jpg,.jpeg,.png" />
                       </div>
                       ${
                         studio.parsing
                           ? `<p class="section-subtitle">Extracting text from uploaded file...</p>`
                           : studio.extractedText
                             ? `<div class="card" style="background: var(--bg-surface-subtle);">
                                  <div class="topic-code">Extracted from ${escapeHtml(studio.uploadedFilename)} (${studio.extractedText.length.toLocaleString()} chars)</div>
                                  <div style="margin-top: 6px; font-size: var(--text-xs); color: var(--text-secondary); max-height: 120px; overflow-y: auto; white-space: pre-wrap;">${escapeHtml(studio.extractedText.slice(0, 800))}${studio.extractedText.length > 800 ? '...' : ''}</div>
                                </div>`
                             : ''
                       }
                     </div>`
            }

            <div class="two-col-grid">
              <div>
                <label class="field-label" for="mat-type-select">2. Material Format</label>
                <select id="mat-type-select" class="select">
                  <option value="flashcards" ${studio.materialType === 'flashcards' ? 'selected' : ''}>Flashcards</option>
                  <option value="questions" ${studio.materialType === 'questions' ? 'selected' : ''}>Practice Questions</option>
                  <option value="summary" ${studio.materialType === 'summary' ? 'selected' : ''}>Structured Summary</option>
                  <option value="revision" ${studio.materialType === 'revision' ? 'selected' : ''}>High-Yield Revision Sheet</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="mat-subject-select">Subject Tag</label>
                <select id="mat-subject-select" class="select">
                  <option value="Anatomy" ${studio.subject === 'Anatomy' ? 'selected' : ''}>Anatomy</option>
                  <option value="Biochemistry" ${studio.subject === 'Biochemistry' ? 'selected' : ''}>Biochemistry</option>
                  <option value="Physiology" ${studio.subject === 'Physiology' ? 'selected' : ''}>Physiology</option>
                  <option value="General" ${studio.subject === 'General' ? 'selected' : ''}>General</option>
                </select>
              </div>
            </div>

            <div>
              <label class="field-label" for="mat-custom-title">Title (Optional)</label>
              <input
                id="mat-custom-title"
                type="text"
                class="input"
                placeholder="${selectedTopic ? escapeHtml(`${selectedTopic.title} — ${studio.materialType}`) : 'e.g., Glycolysis & Gluconeogenesis Flashcards'}"
                value="${escapeHtml(studio.customTitle)}"
              />
            </div>

            <div>
              <button type="submit" id="mat-generate-btn" class="btn btn-primary btn-sm" ${studio.generating || studio.parsing ? 'disabled' : ''}>
                ${studio.generating ? 'Generating Material...' : 'Generate & Save Study Material'}
              </button>
            </div>
          </form>
        </section>

        <!-- Saved Materials Library -->
        <section class="card">
          <h2 class="section-title" style="font-size: var(--text-lg); margin-bottom: 10px;">Saved Study Materials (${materials.length})</h2>
          ${
            materials.length === 0
              ? `<div class="state-card">
                   <p class="state-title">No saved study materials yet</p>
                   <p class="state-desc">Generate flashcards, practice questions, summaries, or revision sheets above to build your personal 2nd MB deck.</p>
                 </div>`
              : `<div class="topic-list">
                   ${materials
                     .map((mat) => {
                       const reviewsCount = Array.isArray(mat.reviewHistory) ? mat.reviewHistory.length : 0;
                       return `
                         <article class="topic-card" data-mat-id="${escapeHtml(mat.id)}">
                           <div class="topic-top">
                             <div>
                               <div class="topic-code">${escapeHtml(String(mat.type || 'summary').toUpperCase())} · ${escapeHtml(mat.subject || 'General')} · ${reviewsCount} review(s)</div>
                               <h3 class="topic-title">${escapeHtml(mat.title)}</h3>
                             </div>
                             <div class="inline-actions">
                               <button type="button" class="btn btn-secondary btn-xs" data-mark-reviewed-id="${escapeHtml(mat.id)}">
                                 Log Review
                               </button>
                               <button type="button" class="btn btn-ghost btn-xs" data-delete-mat-id="${escapeHtml(mat.id)}">
                                 Delete
                               </button>
                             </div>
                           </div>
                           ${renderMaterialContentBlock(mat)}
                         </article>
                       `;
                     })
                     .join('')}
                 </div>`
          }
        </section>
      </div>
    `;

    container.querySelector('#mat-upgrade-btn')?.addEventListener('click', () => {
      openUpgradeModal({ onUnlocked: paint });
    });

    container.querySelectorAll('[data-source-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        studio.sourceMode = btn.getAttribute('data-source-mode') || 'curriculum';
        studio.errorMsg = '';
        paint();
      });
    });

    container.querySelector('#mat-topic-select')?.addEventListener('change', (e) => {
      studio.selectedTopicId = e.target.value;
      const found = officialTopics.find((t) => t.id === studio.selectedTopicId);
      if (found) studio.subject = found.subject;
      paint();
    });

    container.querySelector('#mat-pasted-notes')?.addEventListener('input', (e) => {
      studio.pastedText = e.target.value || '';
    });

    container.querySelector('#mat-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      studio.parsing = true;
      studio.errorMsg = '';
      paint();
      try {
        const parsed = await parseUploadedStudyFile(file);
        studio.uploadedFilename = parsed.filename;
        studio.extractedText = parsed.text;
        studio.parsing = false;
        paint();
        showToast(`Extracted ${parsed.charCount.toLocaleString()} characters from ${parsed.filename}.`, {
          variant: 'success'
        });
      } catch (err) {
        studio.parsing = false;
        studio.extractedText = '';
        studio.uploadedFilename = '';
        studio.errorMsg = err?.message || 'Could not extract text from uploaded file.';
        paint();
        showToast(studio.errorMsg, { variant: 'error' });
      }
    });

    container.querySelector('#mat-type-select')?.addEventListener('change', (e) => {
      studio.materialType = e.target.value;
      paint();
    });

    container.querySelector('#mat-subject-select')?.addEventListener('change', (e) => {
      studio.subject = e.target.value;
    });

    container.querySelector('#mat-custom-title')?.addEventListener('input', (e) => {
      studio.customTitle = e.target.value || '';
    });

    container.querySelector('#generate-material-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (studio.generating || studio.parsing) return;
      studio.errorMsg = '';

      let sourceText = '';
      let sourceFilename = '';
      let defaultTitle = '';
      let topicId = '';

      if (studio.sourceMode === 'curriculum') {
        const tObj = officialTopics.find((t) => t.id === studio.selectedTopicId);
        if (!tObj) {
          studio.errorMsg = 'Please choose an official syllabus topic.';
          paint();
          return;
        }
        topicId = tObj.id;
        sourceText = `Official 2nd MB Syllabus Topic: ${tObj.title}\nSubject: ${tObj.subject}\nSemester: ${tObj.semesterLabel}\nDepartment: ${tObj.department}${tObj.subdivision ? `\nSubdivision: ${tObj.subdivision}` : ''}`;
        defaultTitle = `${tObj.title} (${studio.materialType})`;
      } else if (studio.sourceMode === 'pasted') {
        try {
          const norm = normalizePastedNotes(studio.pastedText);
          sourceText = norm.text;
          defaultTitle = `Pasted Notes (${studio.materialType})`;
        } catch (err) {
          studio.errorMsg = err?.message || 'Please paste study notes first.';
          paint();
          return;
        }
      } else {
        if (!studio.extractedText) {
          studio.errorMsg = 'Upload a readable .txt, .pdf, or .docx study file first.';
          paint();
          return;
        }
        sourceText = studio.extractedText;
        sourceFilename = studio.uploadedFilename;
        defaultTitle = `${studio.uploadedFilename || 'Uploaded Notes'} (${studio.materialType})`;
      }

      const finalTitle = (studio.customTitle || '').trim() || defaultTitle;
      studio.generating = true;
      paint();

      try {
        const gen = await generateStudyMaterialPayload({
          materialType: studio.materialType,
          title: finalTitle,
          subject: studio.subject,
          topicId,
          sourceType: studio.sourceMode,
          sourceFilename,
          sourceText
        });

        await saveMaterial({
          type: gen.type,
          title: gen.title,
          subject: studio.subject,
          topicId,
          sourceType: studio.sourceMode,
          sourceFilename,
          content: gen.content
        });

        studio.customTitle = '';
        showToast('Study material generated and saved to your library.', { variant: 'success' });
      } catch (err) {
        const msg = err?.message || 'Could not generate study material.';
        studio.errorMsg = msg;
        if (err && err.code === 'AI_QUOTA_EXCEEDED') {
          openUpgradeModal({ reason: msg, onUnlocked: paint });
        } else {
          showToast(msg, { variant: 'error' });
        }
      } finally {
        studio.generating = false;
        paint();
      }
    });

    container.querySelectorAll('[data-mark-reviewed-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-mark-reviewed-id');
        await appendMaterialReview(id, { outcome: 'reviewed' });
        paint();
        showToast('Review logged.', { variant: 'success' });
      });
    });

    container.querySelectorAll('[data-delete-mat-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-mat-id');
        await deleteMaterial(id);
        paint();
        showToast('Study material deleted.', { variant: 'info' });
      });
    });
  };

  paint();
}
