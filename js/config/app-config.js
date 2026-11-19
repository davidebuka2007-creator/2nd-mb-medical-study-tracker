/* 2ndMBstudy — Central Application Configuration */
/* Designed by Davidesign */

export const APP_CONFIG = Object.freeze({
  brandName: '2ndMBstudy',
  tagline: 'your 2nd mb study website',
  designerCredit: 'Davidesign',
  cohortScope: '2nd MB',
  targetAudienceEstimate: 400,

  // Default examination date (ISO date string; editable by students)
  defaultExamDate: '2027-03-01',
  defaultExamTitle: '2nd MBBS Professional Examination',

  // Storage isolation (strictly separated from 3rd MB; never use Supabase)
  localStoragePrefix: 'second_mb_study_v1_',
  dbName: 'SecondMBStudyDB_v1',
  dbVersion: 1,

  // Free vs. Premium Plan Rules
  pricing: Object.freeze({
    currency: 'NGN',
    currencySymbol: '₦',
    premiumOneTimeNaira: 1000,
    premiumOneTimeKobo: 100000,
    recurring: false,
    autoExpiry: false,
    freeMaxTrackedOfficialTopics: 10,
    freeMaxAiInteractions: 2
  }),

  // Official Bank Transfer & WhatsApp Confirmation Details
  bankTransfer: Object.freeze({
    accountName: 'Okonkwo David Chukwuebuka',
    bankName: 'PalmPay',
    accountNumber: '8106625261',
    whatsappNumber: '08106625261',
    whatsappInternational: '2348106625261'
  }),

  // Paystack Public Key placeholder (replace with your real pk_test_ / pk_live_ key when ready; never put secret keys here)
  paystack: Object.freeze({
    publicKeyPlaceholder: 'pk_test_replace_with_your_paystack_public_key',
    inlineScriptUrl: 'https://js.paystack.co/v1/inline.js'
  }),

  // Timer Presets (in minutes)
  timerPresets: Object.freeze({
    focusMinutes: [25, 45, 50, 60],
    breakMinutes: [5, 10, 15],
    defaultFocusMinutes: 50,
    defaultBreakMinutes: 10
  }),

  // Gamification & XP Rules
  gamification: Object.freeze({
    xpPerQualifyingMinute: 1,
    xpPerLevel: 120
  }),

  // Document & Text Limits (kept safely within browser & serverless payload limits)
  limits: Object.freeze({
    maxFileBytes: 4 * 1024 * 1024, // 4 MB
    maxExtractedChars: 24000,
    maxPastedChars: 24000,
    chunkSizeChars: 6000,
    allowedExtensions: Object.freeze(['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png']),
    allowedMimeTypes: Object.freeze([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ])
  }),

  // API Endpoints
  endpoints: Object.freeze({
    verifyPaystack: '/api/verify-paystack',
    submitTransfer: '/api/submit-transfer',
    restoreEntitlement: '/api/restore-entitlement',
    aiCoach: '/api/ai-coach',
    generateMaterial: '/api/generate-material',
    admin: '/api/admin'
  })
});
