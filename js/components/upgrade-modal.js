/* 2ndMBstudy — ₦1,000 One-Time Premium & Entitlement Restore Modal */
/* Designed by Davidesign */

import { APP_CONFIG } from '../config/app-config.js';
import {
  startPaystackCheckout,
  submitBankTransferClaim,
  restorePremiumEntitlement,
  buildWhatsappTransferUrl
} from '../services/payment-service.js';
import { showToast } from './toast.js';

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function openUpgradeModal({ reason = '', onUnlocked = null } = {}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.classList.remove('hidden');
  modalRoot.setAttribute('aria-hidden', 'false');

  const closeModal = () => {
    modalRoot.innerHTML = '';
    modalRoot.classList.add('hidden');
    modalRoot.setAttribute('aria-hidden', 'true');
  };

  modalRoot.innerHTML = `
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
      <div class="modal-header">
        <div>
          <h2 id="upgrade-modal-title" class="modal-title">Upgrade to 2ndMBstudy Premium</h2>
          <p class="section-subtitle">₦1,000 one-time payment · No subscriptions · Never expires</p>
        </div>
        <button type="button" id="close-upgrade-modal" class="icon-btn" aria-label="Close modal">✕</button>
      </div>

      ${
        reason
          ? `<div class="state-card state-error" style="padding: 12px; margin-bottom: 14px; text-align: left;">
               <p class="state-desc" style="color: inherit;">${escapeHtml(reason)}</p>
             </div>`
          : ''
      }

      <div class="card" style="background: var(--bg-surface-subtle); margin-bottom: 16px;">
        <p style="margin: 0 0 8px; font-weight: 700; font-size: var(--text-sm);">What ₦1,000 One-Time Unlocks:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: var(--text-sm); color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
          <li>Track <strong>unlimited official 2nd MB topics</strong> across Anatomy, Biochemistry &amp; Physiology (Free tracks up to ${APP_CONFIG.pricing.freeMaxTrackedOfficialTopics} at once).</li>
          <li><strong>Unlimited AI Coach &amp; Study Material generation</strong> (Free includes ${APP_CONFIG.pricing.freeMaxAiInteractions} complimentary AI interactions).</li>
          <li>Add <strong>custom topics</strong> and <strong>custom colour-coded categories</strong>.</li>
        </ul>
      </div>

      <!-- Option 1: Paystack Instant Checkout -->
      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 6px; font-size: var(--text-base);">1. Pay ₦1,000 with Paystack</h3>
        <p class="section-subtitle" style="margin-bottom: 12px;">Automatic verification after payment.</p>
        <form id="paystack-upgrade-form" class="form-stack">
          <div>
            <label class="field-label" for="paystack-email">Email Address (for receipt &amp; restore)</label>
            <input id="paystack-email" name="email" type="email" class="input" placeholder="student@example.com" required />
          </div>
          <button type="submit" id="paystack-submit-btn" class="btn btn-primary">
            Pay ₦1,000 via Paystack
          </button>
        </form>
      </div>

      <!-- Option 2: Direct Bank Transfer (PalmPay) -->
      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 6px; font-size: var(--text-base);">2. Direct Bank Transfer (PalmPay)</h3>
        <p class="section-subtitle" style="margin-bottom: 10px;">
          Transfer <strong>₦1,000</strong> to the details below, submit your transfer note, and confirm on WhatsApp. <strong>Bank transfer upgrades stay pending until manually verified.</strong>
        </p>

        <div class="card" style="background: var(--bg-surface-subtle); margin-bottom: 12px; font-size: var(--text-sm);">
          <div><strong>Account Name:</strong> ${escapeHtml(APP_CONFIG.bankTransfer.accountName)}</div>
          <div><strong>Bank:</strong> ${escapeHtml(APP_CONFIG.bankTransfer.bankName)}</div>
          <div>
            <strong>Account Number:</strong>
            <span class="tabular-nums" style="font-weight: 700;">${escapeHtml(APP_CONFIG.bankTransfer.accountNumber)}</span>
            <button type="button" id="copy-acct-btn" class="btn btn-secondary btn-xs" style="margin-left: 8px;">Copy Number</button>
          </div>
          <div><strong>WhatsApp Confirmation:</strong> ${escapeHtml(APP_CONFIG.bankTransfer.whatsappNumber)}</div>
        </div>

        <form id="transfer-claim-form" class="form-stack">
          <div>
            <label class="field-label" for="transfer-sender-name">Sender Name on Transfer</label>
            <input id="transfer-sender-name" name="senderName" type="text" class="input" placeholder="Your full name as shown on PalmPay/bank" required />
          </div>
          <div>
            <label class="field-label" for="transfer-email">Email Address (optional, helps entitlement lookup)</label>
            <input id="transfer-email" name="email" type="email" class="input" placeholder="student@example.com" />
          </div>
          <div>
            <label class="field-label" for="transfer-ref-note">Session ID / Transfer Note (optional)</label>
            <input id="transfer-ref-note" name="transferRefOrNote" type="text" class="input" placeholder="e.g., 2ndMBstudy upgrade" />
          </div>
          <div class="inline-actions">
            <button type="submit" id="transfer-claim-btn" class="btn btn-secondary">
              Log Pending Transfer Claim
            </button>
            <a
              id="whatsapp-confirm-link"
              href="${buildWhatsappTransferUrl({})}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary"
            >
              Confirm on WhatsApp
            </a>
          </div>
        </form>
        <div id="transfer-claim-status" style="margin-top: 10px; font-size: var(--text-xs); color: var(--text-secondary);"></div>
      </div>

      <!-- Option 3: Restore Access -->
      <div class="card">
        <h3 style="margin: 0 0 6px; font-size: var(--text-base);">3. Already Upgraded? Restore Access</h3>
        <p class="section-subtitle" style="margin-bottom: 10px;">
          Restore server-verified Premium access on a new browser or device using your payment reference or email.
        </p>
        <form id="restore-entitlement-form" class="form-stack">
          <div>
            <label class="field-label" for="restore-ref">Payment Reference</label>
            <input id="restore-ref" name="reference" type="text" class="input" placeholder="e.g., 2MB-..." />
          </div>
          <div>
            <label class="field-label" for="restore-email">Email Used for Payment</label>
            <input id="restore-email" name="email" type="email" class="input" placeholder="student@example.com" />
          </div>
          <button type="submit" id="restore-entitlement-btn" class="btn btn-secondary">
            Restore Access
          </button>
        </form>
      </div>
    </div>
  `;

  modalRoot.addEventListener('click', (e) => {
    if (e.target === modalRoot) closeModal();
  });
  document.getElementById('close-upgrade-modal')?.addEventListener('click', closeModal);

  document.getElementById('copy-acct-btn')?.addEventListener('click', async () => {
    const acct = APP_CONFIG.bankTransfer.accountNumber;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(acct);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = acct;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      }
      showToast(`Copied PalmPay account number: ${acct}`, { variant: 'success' });
    } catch {
      showToast(`Account number: ${acct}`, { variant: 'info' });
    }
  });

  // Live update WhatsApp link as user types sender name/note
  const senderInput = document.getElementById('transfer-sender-name');
  const noteInput = document.getElementById('transfer-ref-note');
  const waLink = document.getElementById('whatsapp-confirm-link');
  const refreshWaHref = () => {
    if (waLink) {
      waLink.href = buildWhatsappTransferUrl({
        senderName: senderInput?.value || '',
        payerNote: noteInput?.value || ''
      });
    }
  };
  senderInput?.addEventListener('input', refreshWaHref);
  noteInput?.addEventListener('input', refreshWaHref);

  // Paystack checkout form
  document.getElementById('paystack-upgrade-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('paystack-submit-btn');
    const emailVal = document.getElementById('paystack-email')?.value || '';
    if (btn) btn.disabled = true;
    try {
      const res = await startPaystackCheckout({ email: emailVal });
      if (res && res.verified && res.entitled) {
        showToast('₦1,000 Premium unlocked and verified!', { variant: 'success' });
        closeModal();
        if (typeof onUnlocked === 'function') onUnlocked(res);
      } else {
        showToast('Payment could not be verified automatically. If charged, contact support on WhatsApp.', {
          variant: 'error'
        });
      }
    } catch (err) {
      showToast(err?.message || 'Could not complete Paystack checkout.', { variant: 'error' });
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // Bank transfer pending claim form
  document.getElementById('transfer-claim-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('transfer-claim-btn');
    const statusBox = document.getElementById('transfer-claim-status');
    const senderName = document.getElementById('transfer-sender-name')?.value || '';
    const email = document.getElementById('transfer-email')?.value || '';
    const transferRefOrNote = document.getElementById('transfer-ref-note')?.value || '';

    if (btn) btn.disabled = true;
    try {
      const res = await submitBankTransferClaim({ senderName, email, transferRefOrNote });
      if (res && res.whatsappUrl && waLink) {
        waLink.href = res.whatsappUrl;
      }
      if (statusBox) {
        statusBox.innerHTML = `<span style="color: var(--warning-text); font-weight: 600;">Pending verification:</span> ${escapeHtml(
          res?.message || 'Transfer claim recorded. Please send proof on WhatsApp (08106625261) for manual verification.'
        )}`;
      }
      showToast('Transfer claim logged as pending manual verification.', { variant: 'info' });
    } catch (err) {
      showToast(err?.message || 'Could not log transfer claim.', { variant: 'error' });
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // Restore access form
  document.getElementById('restore-entitlement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('restore-entitlement-btn');
    const reference = document.getElementById('restore-ref')?.value || '';
    const email = document.getElementById('restore-email')?.value || '';

    if (btn) btn.disabled = true;
    try {
      const res = await restorePremiumEntitlement({ reference, email });
      if (res && res.restored && res.entitled) {
        showToast('Server-verified Premium access restored!', { variant: 'success' });
        closeModal();
        if (typeof onUnlocked === 'function') onUnlocked(res);
      } else {
        showToast(res?.message || 'No verified Premium entitlement found for those details.', {
          variant: 'error'
        });
      }
    } catch (err) {
      showToast(err?.message || 'Could not restore entitlement.', { variant: 'error' });
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
