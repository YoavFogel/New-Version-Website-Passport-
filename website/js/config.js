// Site settings, in one place. Edit these values; nothing else needs to change.
window.EUP_CONFIG = {
  // WhatsApp Business number, international format, digits only (972 + number without the 0).
  // NOTE: 02-509-0307 is the number the current site links to. Confirm it is the verified
  // WhatsApp Business line before going live.
  whatsapp: '97225090307',
  whatsappText: 'שלום, הגעתי מהאתר ואשמח לבדוק זכאות לאזרחות רומנית',

  // Where the lead form sends its data (an HTTPS endpoint that accepts a JSON POST),
  // e.g. a Make.com webhook that adds the lead to monday, or a Formspree form URL.
  // While this is empty the form cannot deliver leads, and says so to the visitor.
  leadEndpoint: '',
};
