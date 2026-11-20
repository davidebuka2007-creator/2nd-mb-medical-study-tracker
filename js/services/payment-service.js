/* 2ndMBstudy — Payment & Entitlement Client Service */
/* Never grants Premium client-side without server verification; bank transfers stay pending until manually approved. */

import { APP_CONFIG } from '../config/app-config.js';
import { postJson } from './api-client.js';
import { syncUiEntitlementCache } from '../state/app-store.js';

let paystackScriptPromise = null;

function loadPaystackInlineScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Browser window unavailable.'));
  }
  if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
    return Promise.resolve(window.PaystackPop);
  }
  if (paystackScriptPromise) {
    return paystackScriptPromise;
  }

  paystackScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${APP_CONFIG.paystack.inlineScriptUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = APP_CONFIG.paystack.inlineScriptUrl;
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
        resolve(window.PaystackPop);
      } else {
        reject(new Error('Paystack checkout library did not initialize.'));
      }
    };
    script.onerror = () => {
      paystackScriptPromise = null;
      reject(new Error('Unable to reach Paystack checkout script. Check your connection or use Bank Transfer.'));
    };
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
}

export async function verifyPaystackReference(reference, email = '') {
  const cleanRef = String(reference || '').trim();
  if (!cleanRef) {
    throw new Error('Payment reference is required for verification.');
  }

  const result = await postJson(APP_CONFIG.endpoints.verifyPaystack, {
    reference: cleanRef,
    email: String(email || '').trim()
  });

  if (result && result.verified && result.entitled) {
    syncUiEntitlementCache({
      isPremium: true,
      paymentReference: result.reference || cleanRef
    });
  }

  return result;
}

export async function startPaystackCheckout({ email, studentName = '' }) {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address for your ₦1,000 receipt and entitlement lookup.');
  }

  const pubKey = APP_CONFIG.paystack.publicKeyPlaceholder;
  if (!pubKey || pubKey.startsWith('pk_test_replace_with_')) {
    throw new Error(
      'Paystack public key is not configured yet. Please complete PalmPay transfer to 8106625261 or set your Paystack public key.'
    );
  }

  const PaystackPop = await loadPaystackInlineScript();
  const generatedRef = `2MB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  return new Promise((resolve, reject) => {
    let settled = false;

    const handler = PaystackPop.setup({
      key: pubKey,
      email: cleanEmail,
      amount: APP_CONFIG.pricing.premiumOneTimeKobo,
      currency: APP_CONFIG.pricing.currency,
      ref: generatedRef,
      metadata: {
        custom_fields: [
          {
            display_name: 'App',
            variable_name: 'app_name',
            value: APP_CONFIG.brandName
          },
          {
            display_name: 'Student Name',
            variable_name: 'student_name',
            value: String(studentName || '2nd MB Student').slice(0, 80)
          }
        ]
      },
      callback: (response) => {
        if (settled) return;
        settled = true;
        const ref = (response && response.reference) || generatedRef;
        verifyPaystackReference(ref, cleanEmail)
          .then(resolve)
          .catch(reject);
      },
      onClose: () => {
        if (settled) return;
        settled = true;
        reject(new Error('Payment window closed before completion.'));
      }
    });

    handler.openIframe();
  });
}

export function buildWhatsappTransferUrl({ senderName = '', payerNote = '' }) {
  const cleanName = String(senderName || '').trim() || 'A 2nd MB student';
  const cleanNote = String(payerNote || '').trim();
  const text = [
    `Hello Okonkwo David Chukwuebuka, I have made a ₦1,000 one-time bank transfer on PalmPay (8106625261) for 2ndMBstudy (your 2nd mb study website).`,
    `Name/Sender: ${cleanName}`,
    cleanNote ? `Reference/Note: ${cleanNote}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${APP_CONFIG.bankTransfer.whatsappInternational}?text=${encodeURIComponent(text)}`;
}

export async function submitBankTransferClaim({ senderName, email, transferRefOrNote }) {
  const cleanSender = String(senderName || '').trim();
  if (!cleanSender) {
    throw new Error('Please enter the sender name used on your PalmPay transfer.');
  }

  // Bank transfers stay pending until manually verified by admin; never auto-grant Premium here.
  const response = await postJson(APP_CONFIG.endpoints.submitTransfer, {
    senderName: cleanSender.slice(0, 100),
    email: String(email || '').trim().slice(0, 120),
    transferRefOrNote: String(transferRefOrNote || '').trim().slice(0, 160),
    amountNaira: APP_CONFIG.pricing.premiumOneTimeNaira,
    bankName: APP_CONFIG.bankTransfer.bankName,
    accountNumber: APP_CONFIG.bankTransfer.accountNumber,
    accountName: APP_CONFIG.bankTransfer.accountName
  });

  return {
    ...response,
    whatsappUrl: buildWhatsappTransferUrl({
      senderName: cleanSender,
      payerNote: transferRefOrNote
    })
  };
}

export async function restorePremiumEntitlement({ reference, email }) {
  const cleanRef = String(reference || '').trim();
  const cleanEmail = String(email || '').trim();
  if (!cleanRef && !cleanEmail) {
    throw new Error('Enter your payment reference or the email used for payment to restore access.');
  }

  const result = await postJson(APP_CONFIG.endpoints.restoreEntitlement, {
    reference: cleanRef,
    email: cleanEmail
  });

  if (result && result.restored && result.entitled) {
    syncUiEntitlementCache({
      isPremium: true,
      paymentReference: result.reference || cleanRef
    });
  }

  return result;
    }
                      
