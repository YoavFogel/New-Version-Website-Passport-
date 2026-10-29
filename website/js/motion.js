// Motion setting, read before the page is drawn (loaded in <head>, not deferred).
// By default the site follows the device's "reduce motion" setting; a visitor can override it
// with the "אנימציות" switch (menu and footer), and the choice is kept on this device.
// html.is-still = the page is shown at rest (see the end of css/style.css and `still` in main.js).
(() => {
  let pref = null;
  try { pref = localStorage.getItem('eup-motion'); } catch (e) { /* storage blocked */ }
  const system = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = pref === 'on' ? false : pref === 'off' ? true : system;
  document.documentElement.classList.toggle('is-still', still);
  window.EUP_MOTION = {
    still,
    set(on) {
      try { localStorage.setItem('eup-motion', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
      location.reload();
    },
  };
})();
