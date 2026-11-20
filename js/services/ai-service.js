/* 2ndMBstudy — AI Coach & Study Material Generation Client Service */
/* Calls backend /api/* endpoints; syncs server-reported quota/entitlement state without client bypass. */

import { APP_CONFIG } from '../config/app-config.js';
import { postJson } from './api-client.js';
import { syncUiEntitlementCache } from '../state/app-store.js';

function quotaTokenKey() {
  return `${APP_CONFIG.localStoragePrefix}ai_quota_token`;
}

function getStoredQuotaToken() {
  try {
    return window.localStorage.getItem(quotaTokenKey()) || '';
  } catch {
    return '';
  }
}

function setStoredQuotaToken(token) {
  try {
    if (typeof token === 'string' && token.trim()) {
      window.localStorage.setItem(quotaTokenKey(), token.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

function applyServerUsageSync(data) {
  if (!data || typeof data !== 'object') return;
  if (typeof data.quotaToken === 'string' && data.quotaToken.trim()) {
    setStoredQuotaToken(data.quotaToken);
  }
  const updates = {};
  if (typeof data.isPremium === 'boolean') {
    updates.isPremium = data.isPremium;
  }
  if (Number.isFinite(Number(data.usedAiInteractions))) {
    updates.usedAiInteractions = Math.max(0, Math.floor(Number(data.usedAiInteractions)));
  }
  if (Object.keys(updates).length > 0) {
    syncUiEntitlementCache(updates);
  }
}

export async function sendAiCoachMessage({ messages, topicContext = null, mode = 'coach' }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Please enter a study question or prompt first.');
  }

  const cleanMessages = messages.slice(-16).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    text: String(m.text || '').slice(0, 4000)
  }));

  try {
    const result = await postJson(APP_CONFIG.endpoints.aiCoach, {
      messages: cleanMessages,
      topicContext,
      mode,
      quotaToken: getStoredQuotaToken()
    });

    applyServerUsageSync(result);

    if (!result || typeof result.reply !== 'string' || !result.reply.trim()) {
      throw new Error('AI Coach returned an empty response. Please try again.');
    }

    return {
      reply: result.reply.trim(),
      remainingFree:
        typeof result.remainingFree === 'number' ? result.remainingFree : null,
      isPremium: Boolean(result.isPremium)
    };
  } catch (err) {
    if (err && err.data) {
      applyServerUsageSync(err.data);
    }
    if (err && (err.status === 402 || err.status === 403 || err.data?.quotaExceeded)) {
      const limitErr = new Error(
        err.message ||
          `You have used your ${APP_CONFIG.pricing.freeMaxAiInteractions} complimentary Free AI interactions. Upgrade for ₦1,000 once for unlimited AI study tools.`
      );
      limitErr.code = 'AI_QUOTA_EXCEEDED';
      throw limitErr;
    }
    throw err;
  }
}

export async function generateStudyMaterialPayload({
  materialType,
  title,
  subject,
  topicId,
  sourceType,
  sourceFilename,
  sourceText,
  count = 8
}) {
  const validTypes = ['flashcards', 'questions', 'summary', 'revision'];
  const type = validTypes.includes(materialType) ? materialType : 'flashcards';
  const cleanSource = String(sourceText || '').trim();

  if (!cleanSource) {
    throw new Error('Provide a syllabus topic, pasted notes, or uploaded document text before generating materials.');
  }

  try {
    const result = await postJson(APP_CONFIG.endpoints.generateMaterial, {
      materialType: type,
      title: String(title || '').trim().slice(0, 200),
      subject: String(subject || 'General').trim().slice(0, 60),
      topicId: String(topicId || '').trim().slice(0, 80),
      sourceType: String(sourceType || 'curriculum').trim().slice(0, 40),
      sourceFilename: String(sourceFilename || '').trim().slice(0, 160),
      sourceText: cleanSource.slice(0, APP_CONFIG.limits.maxExtractedChars),
      count: Math.min(20, Math.max(3, Number(count) || 8)),
      quotaToken: getStoredQuotaToken()
    });

    applyServerUsageSync(result);

    if (!result || !result.content) {
      throw new Error('Could not generate study material content. Please try again.');
    }

    return {
      type,
      title: String(result.title || title || 'Generated Study Material').trim().slice(0, 200),
      content: result.content,
      remainingFree:
        typeof result.remainingFree === 'number' ? result.remainingFree : null,
      isPremium: Boolean(result.isPremium)
    };
  } catch (err) {
    if (err && err.data) {
      applyServerUsageSync(err.data);
    }
    if (err && (err.status === 402 || err.status === 403 || err.data?.quotaExceeded)) {
      const limitErr = new Error(
        err.message ||
          `You have used your ${APP_CONFIG.pricing.freeMaxAiInteractions} complimentary Free AI interactions. Upgrade for ₦1,000 once for unlimited AI study tools.`
      );
      limitErr.code = 'AI_QUOTA_EXCEEDED';
      throw limitErr;
    }
    throw err;
  }
      }
