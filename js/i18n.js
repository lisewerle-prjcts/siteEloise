/* ===========================================================================
   i18n engine — FR / DE / EN
   Strings live in window.I18N (loaded from strings-*.js BEFORE this file).
   =========================================================================== */
(function () {
  const LANGS = ['fr', 'de', 'en'];
  const STORE = 'ew_lang';

  function detect() {
    const saved = localStorage.getItem(STORE);
    if (saved && LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : 'fr';
  }

  let lang = detect();
  window.EW_LANG = lang;

  function dict() { return (window.I18N && window.I18N[lang]) || {}; }
  function fallback() { return (window.I18N && window.I18N.fr) || {}; }

  function t(key) {
    const d = dict(); const f = fallback();
    return (key in d) ? d[key] : (key in f ? f[key] : key);
  }
  window.t = t;

  function apply() {
    const root = document;
    root.documentElement.setAttribute('lang', lang);
    root.documentElement.setAttribute('data-lang', lang);

    root.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      const v = t(k);
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.getAttribute('data-i18n-html');
      const v = t(k);
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const k = el.getAttribute('data-i18n-ph');
      const v = t(k);
      if (v != null) el.setAttribute('placeholder', v);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const k = el.getAttribute('data-i18n-aria');
      const v = t(k);
      if (v != null) el.setAttribute('aria-label', v);
    });

    // document title from body[data-page]
    const page = document.body.getAttribute('data-page');
    if (page) {
      const tt = t('meta.title.' + page);
      if (tt && tt !== 'meta.title.' + page) document.title = tt;
    }

    // language buttons
    root.querySelectorAll('.lang button[data-lang]').forEach(b => {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });

    window.dispatchEvent(new CustomEvent('ew:langchange', { detail: { lang } }));
  }
  window.ewApplyI18n = apply;

  function setLang(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next; window.EW_LANG = lang;
    localStorage.setItem(STORE, lang);
    apply();
  }
  window.ewSetLang = setLang;

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button[data-lang]');
    if (b) setLang(b.getAttribute('data-lang'));
  });

  // expose for booking module
  window.ewLang = () => lang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else { apply(); }
})();
