/** Privacy policy for Telegram Mini App users (English legal text). */

export const PRIVACY_POLICY_TITLE = 'Seashell Mini App Privacy Policy';

export const PRIVACY_POLICY_INTRO =
  'Last updated: 11 July 2026. This version applies to users of the Seashell Telegram Mini App. Intended audience: 16+ (users under 18 should use the App with a parent or guardian’s consent and their own judgment about suitability of AI-generated content).';

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: '1. Who processes your data',
    body: [
      'Seashell (the “App”) processes personal data only as needed to provide its features. The data controller is the developer operating this Mini App (contact details in section 9). Below we describe what data is processed and why.',
    ],
  },
  {
    title: '2. Data we receive',
    list: [
      'Your Telegram user identifier and Mini App launch parameters (including initData used to authenticate API requests), as provided by Telegram under its platform rules.',
      'Dictionary content: English words and phrases you enter, generated glosses and example sentences, group names, and internal record identifiers stored in our database.',
      'Conversation practice: English text you submit and the App’s replies within a session (dialogue history is stored in limited form on our servers to keep context between turns).',
      'Billing (if you subscribe or buy credits): payment events processed by Telegram Stars; we store subscription/credit status linked to your Telegram user id, not your card or wallet secrets.',
      'Technical data: API requests, timestamps, and error logs in the minimum amount needed for reliability, abuse prevention, and rate limiting.',
    ],
    body: [
      'We do not ask for your Telegram password. Sign-in is handled by Telegram when you open the Mini App.',
    ],
  },
  {
    title: '3. Purposes of processing',
    list: [
      'providing dictionary features (save, display, group, and delete words);',
      'generating and refreshing examples and explanations using external language models when you request it;',
      'providing conversation practice and short feedback on your phrases;',
      'managing Premium subscriptions and credits via Telegram Stars;',
      'security (verifying Telegram initData, limiting request rates and payload size);',
      'complying with lawful requests from competent authorities.',
    ],
  },
  {
    title: '4. Legal bases',
    body: [
      'Processing is based on performing the service you request by using the App, your consent when you continue using features that send text to our servers, and legitimate interests in keeping the App secure and functional. Where applicable, we follow data-protection laws in the controller’s jurisdiction (including rights similar to GDPR access, correction, and deletion).',
    ],
  },
  {
    title: '5. Sharing with third parties',
    body: [
      'Text you send to AI-powered features may be transmitted to configured language-model providers (such as OpenRouter or DeepSeek) solely to generate a response. Hosting and database infrastructure are operated by our server provider with access limited to running the App. Telegram processes Stars payments under Telegram’s own terms. We do not sell your personal data.',
    ],
  },
  {
    title: '6. Retention',
    body: [
      'Data is kept while you use the App and when needed to provide the service. You can delete dictionary entries and groups in the App interface. Practice session data may be retained for a limited time for continuity and operations. Backups at the hosting provider may persist for a limited period under their schedule.',
    ],
  },
  {
    title: '7. Security',
    body: [
      'We separate data by user, authenticate API requests with Telegram initData where configured, limit request size and frequency, and use HTTPS for API traffic. No online service can guarantee absolute security — do not enter passwords, payment card numbers, or other highly sensitive secrets into practice chat or dictionary fields.',
    ],
  },
  {
    title: '8. Your rights',
    body: ['You may:'],
    list: [
      'ask what data we hold about you;',
      'request deletion of your data where the law allows (including deleting words and groups in the App);',
      'stop using the App to withdraw consent for optional processing (some records may remain if required by law).',
    ],
  },
  {
    title: '9. Contact',
    body: [
      'Privacy requests: istemiwork@gmail.com. Please describe your request and how we can reply (do not send passwords). You may also contact us through the support channel listed in the bot’s Telegram profile.',
    ],
  },
  {
    title: '10. Changes',
    body: [
      'We may update this policy; the current version is always available in this section of the App. Material changes may also be noted in the bot description or community channel.',
    ],
  },
];
