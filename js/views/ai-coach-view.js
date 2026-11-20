/* 2ndMBstudy — 2nd MB AI Study Coach View */

import { APP_CONFIG } from '../config/app-config.js';
import {
  getSnapshot,
  getRemainingFreeAiInteractions,
  saveAiChat
} from '../state/app-store.js';
import { sendAiCoachMessage } from '../services/ai-service.js';
import { showToast } from '../components/toast.js';
import { openUpgradeModal } from '../components/upgrade-modal.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function renderAiCoachView(container, { initialContext = null } = {}) {
  if (!container) return;

  const snapInit = getSnapshot();
  const existingChat = snapInit.aiChats[0] || null;

  const chatState = {
    id: existingChat?.id || null,
    title: existingChat?.title || '2nd MB Study Coach',
    messages: Array.isArray(existingChat?.messages) ? [...existingChat.messages] : [],
    selectedTopicId: initialContext?.topic?.id || '',
    mode: 'coach', // 'coach' | 'essay_breakdown' | 'clinical_correlate'
    sending: false,
    lastError: ''
  };

  if (initialContext?.topic && chatState.messages.length === 0) {
    chatState.messages.push({
      role: 'assistant',
      text: `Ready to break down **${initialContext.topic.title}** (${initialContext.topic.subject} · ${initialContext.topic.semesterLabel}). Ask for a structured essay outline, high-yield key points, or practice questions.`
    });
  }

  const paint = () => {
    const snap = getSnapshot();
    const { officialTopics, uiCache } = snap;
    const isPremium = Boolean(uiCache.isPremium);
    const remainingFree = getRemainingFreeAiInteractions();

    const selectedTopic = officialTopics.find((t) => t.id === chatState.selectedTopicId) || null;
    const topicOptions = officialTopics
      .slice(0, 140)
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${chatState.selectedTopicId === t.id ? 'selected' : ''}>${escapeHtml(t.code)} · ${escapeHtml(t.title.slice(0, 56))}</option>`
      )
      .join('');

    container.innerHTML = `
      <div class="page-stack">
        <section class="card">
          <div class="section-header-row" style="margin-bottom: 10px;">
            <div>
              <h1 class="section-title">2nd MB AI Coach</h1>
              <p class="section-subtitle">
                Focused explanations, essay structures, and exam breakdowns across Anatomy, Biochemistry &amp; Physiology.
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
                  ? `<button type="button" id="ai-upgrade-btn" class="btn btn-secondary btn-xs">Unlock Unlimited (₦1,000 Once)</button>`
                  : ''
              }
            </div>
          </div>

          <div class="two-col-grid" style="margin-bottom: 12px;">
            <div>
              <label class="field-label" for="ai-topic-context">Attach Syllabus Topic Context (Optional)</label>
              <select id="ai-topic-context" class="select">
                <option value="">General 2nd MB Study Question</option>
                ${topicOptions}
              </select>
            </div>

            <div>
              <label class="field-label" for="ai-coach-mode">Response Style</label>
              <select id="ai-coach-mode" class="select">
                <option value="coach" ${chatState.mode === 'coach' ? 'selected' : ''}>Structured Study Coach</option>
                <option value="essay_breakdown" ${chatState.mode === 'essay_breakdown' ? 'selected' : ''}>Exam Essay Outline</option>
                <option value="clinical_correlate" ${chatState.mode === 'clinical_correlate' ? 'selected' : ''}>Clinical &amp; High-Yield Points</option>
              </select>
            </div>
          </div>

          <!-- Quick Prompts -->
          <div class="inline-actions" style="margin-bottom: 12px;">
            <button type="button" class="btn btn-secondary btn-xs js-quick-prompt" data-prompt="Give me a clear exam essay structure with headings and key points for this topic.">
              Exam Essay Structure
            </button>
            <button type="button" class="btn btn-secondary btn-xs js-quick-prompt" data-prompt="Summarize the 5 highest-yield exam traps and clinical correlations for this topic.">
              High-Yield Traps
            </button>
            <button type="button" class="btn btn-secondary btn-xs js-quick-prompt" data-prompt="Quiz me with 3 short-answer 2nd MB questions and explain the model answers clearly.">
              3-Question Drill
            </button>
            <button type="button" id="ai-new-chat-btn" class="btn btn-ghost btn-xs">
              New Thread
            </button>
          </div>

          ${
            chatState.lastError
              ? `<div class="state-card state-error" style="padding: 10px 12px; margin-bottom: 12px; text-align: left;">
                   <p class="state-desc" style="color: inherit;">${escapeHtml(chatState.lastError)}</p>
                 </div>`
              : ''
          }

          <!-- Chat Thread -->
          <div class="chat-thread" id="ai-chat-thread" aria-live="polite">
            ${
              chatState.messages.length === 0
                ? `<div class="state-card">
                     <p class="state-title">Ask your 2nd MB AI Coach anything</p>
                     <p class="state-desc">
                       Pick a topic above or type a question on Anatomy, Biochemistry (341/351), or Physiology. Free accounts include ${APP_CONFIG.pricing.freeMaxAiInteractions} complimentary AI interactions; upgrade once for ₦1,000 for unlimited AI.
                     </p>
                   </div>`
                : chatState.messages
                    .map(
                      (m) => `
                        <div class="chat-bubble ${m.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}">
                          <div class="topic-code" style="margin-bottom: 4px;">${m.role === 'user' ? 'You' : '2ndMBstudy AI Coach'}</div>
                          <div style="white-space: pre-wrap;">${escapeHtml(m.text)}</div>
                        </div>
                      `
                    )
                    .join('')
            }
          </div>

          <!-- Composer -->
          <form id="ai-coach-form" class="form-stack" style="margin-top: 12px;">
            <div>
              <label class="field-label" for="ai-prompt-input">Your Question or Study Prompt</label>
              <textarea
                id="ai-prompt-input"
                class="textarea"
                rows="3"
                placeholder="Ask a specific question, paste a confusing concept, or request a revision plan..."
                ${chatState.sending ? 'disabled' : ''}
              ></textarea>
            </div>
            <div class="inline-actions" style="justify-content: space-between; align-items: center;">
              <span class="section-subtitle">
                ${selectedTopic ? `Context: ${escapeHtml(selectedTopic.title)}` : 'No specific topic attached'}
              </span>
              <button type="submit" id="ai-send-btn" class="btn btn-primary btn-sm" ${chatState.sending ? 'disabled' : ''}>
                ${chatState.sending ? 'Thinking...' : 'Send to AI Coach'}
              </button>
            </div>
          </form>
        </section>
      </div>
    `;

    const threadEl = container.querySelector('#ai-chat-thread');
    if (threadEl) {
      threadEl.scrollTop = threadEl.scrollHeight;
    }

    container.querySelector('#ai-upgrade-btn')?.addEventListener('click', () => {
      openUpgradeModal({ onUnlocked: paint });
    });

    container.querySelector('#ai-topic-context')?.addEventListener('change', (e) => {
      chatState.selectedTopicId = e.target.value;
      paint();
    });

    container.querySelector('#ai-coach-mode')?.addEventListener('change', (e) => {
      chatState.mode = e.target.value;
    });

    container.querySelector('#ai-new-chat-btn')?.addEventListener('click', () => {
      chatState.id = null;
      chatState.messages = [];
      chatState.lastError = '';
      paint();
      showToast('Started a fresh AI Coach thread.', { variant: 'info' });
    });

    const submitPrompt = async (rawPrompt) => {
      const promptText = String(rawPrompt || '').trim();
      if (!promptText || chatState.sending) return;

      const topicObj = officialTopics.find((t) => t.id === chatState.selectedTopicId) || null;
      const contextualPrompt = topicObj
        ? `[Topic: ${topicObj.title} | Subject: ${topicObj.subject} | ${topicObj.semesterLabel}]\n${promptText}`
        : promptText;

      chatState.lastError = '';
      chatState.sending = true;
      chatState.messages.push({ role: 'user', text: promptText });
      paint();

      try {
        const apiMessages = chatState.messages.map((m, index) =>
          index === chatState.messages.length - 1 && m.role === 'user'
            ? { role: 'user', text: contextualPrompt }
            : { role: m.role, text: m.text }
        );

        const res = await sendAiCoachMessage({
          messages: apiMessages,
          topicContext: topicObj
            ? {
                id: topicObj.id,
                title: topicObj.title,
                subject: topicObj.subject,
                semesterLabel: topicObj.semesterLabel,
                department: topicObj.department
              }
            : null,
          mode: chatState.mode
        });

        chatState.messages.push({ role: 'assistant', text: res.reply });
        chatState.title = topicObj
          ? `${topicObj.subject}: ${topicObj.title.slice(0, 50)}`
          : promptText.slice(0, 60);

        const saved = await saveAiChat({
          id: chatState.id || undefined,
          title: chatState.title,
          messages: chatState.messages
        });
        chatState.id = saved.id;
      } catch (err) {
        chatState.messages.pop();
        const msg = err?.message || 'Unable to reach AI Coach right now.';
        chatState.lastError = msg;

        if (err && err.code === 'AI_QUOTA_EXCEEDED') {
          openUpgradeModal({ reason: msg, onUnlocked: paint });
        } else {
          showToast(msg, { variant: 'error' });
        }
      } finally {
        chatState.sending = false;
        paint();
      }
    };

    container.querySelectorAll('.js-quick-prompt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qPrompt = btn.getAttribute('data-prompt') || '';
        submitPrompt(qPrompt);
      });
    });

    container.querySelector('#ai-coach-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputEl = container.querySelector('#ai-prompt-input');
      submitPrompt(inputEl ? inputEl.value : '');
    });
  };

  paint();
}
