// Smooth scroll (Lenis 1.3.27, vendored in js/vendor). Skipped for reduced motion,
// where the page keeps native scrolling. Anchor links respect scroll-margin-top.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = !reduceMotion && window.Lenis
  ? new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 })
  : null;

// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
});

// Video facades: show a light poster, load the player only on click.
// Drive embeds are a temporary source; swap driveEmbed() when videos move to a video host.
const driveEmbed = (id) => `https://drive.google.com/file/d/${id}/preview`;
const driveThumb = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1280`;
const modal = document.getElementById('video-modal');
const modalFrame = modal.querySelector('.modal-frame');

function makeIframe(id, title) {
  const iframe = document.createElement('iframe');
  iframe.src = driveEmbed(id);
  iframe.title = title;
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  return iframe;
}

document.querySelectorAll('.video-facade').forEach((el) => {
  const id = el.dataset.driveId;
  el.style.setProperty('--thumb', `url("${driveThumb(id)}")`);
  el.querySelector('.video-play').addEventListener('click', () => {
    if (el.dataset.modal === 'true') {
      modalFrame.replaceChildren(makeIframe(id, el.dataset.title));
      modal.showModal();
      lenis?.stop();
    } else {
      el.replaceChildren(makeIframe(id, el.dataset.title));
    }
  });
});

modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('close', () => { modalFrame.replaceChildren(); lenis?.start(); });
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// Assistant placeholder: the real knowledge-base assistant is connected in a later step.
const askForm = document.getElementById('ask-form');
const askInput = document.getElementById('ask-input');
const askReply = document.getElementById('ask-reply');
function showPlaceholderReply(question) {
  askReply.hidden = false;
  askReply.textContent = `שאלתם: "${question}". העוזר הדיגיטלי יחובר בשלב הבא. בינתיים, אפשר למלא את שאלון הזכאות או לכתוב לנו בוואטסאפ.`;
}
askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = askInput.value.trim();
  if (q) showPlaceholderReply(q);
});
document.querySelectorAll('.ask-chips button').forEach((b) => {
  b.addEventListener('click', () => { askInput.value = b.textContent; showPlaceholderReply(b.textContent); });
});
