/* ===========================================================================
   tweaks.js — in-design Tweaks panel (vanilla), shared across pages.
   Persists to localStorage + posts host protocol (__edit_mode_*).
   =========================================================================== */
(function () {
  const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "clay",
    "font": "newsreader",
    "theme": "clair",
    "anim": "subtle",
    "corners": "doux",
    "hero": "A"
  }/*EDITMODE-END*/;

  const STORE = 'ew_tweaks';

  const ACCENTS = {
    clay:   { label: 'Terre cuite', v: ['#B26646', '#94512F', '#D8A989'] },
    rose:   { label: 'Terracotta rosé', v: ['#B16F5C', '#925240', '#E0B4A4'] },
    ocre:   { label: 'Ocre doré', v: ['#BB8A46', '#996D2E', '#E4C68F'] },
    sauge:  { label: 'Sauge', v: ['#7E8460', '#5E6446', '#BDC09A'] },
    argile: { label: 'Argile profonde', v: ['#A2553B', '#7E3F28', '#CF9C80'] },
  };
  const FONTS = {
    newsreader: { label: 'Newsreader', v: "'Newsreader', Georgia, serif" },
    cormorant:  { label: 'Cormorant', v: "'Cormorant Garamond', Georgia, serif" },
    spectral:   { label: 'Spectral', v: "'Spectral', Georgia, serif" },
  };

  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) {}
    return Object.assign({}, TWEAKS_DEFAULTS, saved);
  }
  let T = load();

  function apply() {
    const root = document.documentElement, body = document.body;
    const a = ACCENTS[T.accent] || ACCENTS.clay;
    root.style.setProperty('--accent', a.v[0]);
    root.style.setProperty('--accent-deep', a.v[1]);
    root.style.setProperty('--accent-soft', a.v[2]);
    root.style.setProperty('--display', (FONTS[T.font] || FONTS.newsreader).v);
    root.style.setProperty('--radius', T.corners === 'nets' ? '3px' : '16px');
    root.style.setProperty('--radius-sm', T.corners === 'nets' ? '2px' : '10px');
    root.style.setProperty('--radius-lg', T.corners === 'nets' ? '4px' : '26px');
    body.setAttribute('data-theme', T.theme === 'sombre' ? 'dark' : 'light');
    body.setAttribute('data-anim', T.anim);
    body.setAttribute('data-hero', T.hero);
  }
  apply();
  window.ewTweaks = () => T;

  function setKey(k, val) {
    T[k] = val;
    localStorage.setItem(STORE, JSON.stringify(T));
    apply();
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: val } }, '*'); } catch (e) {}
    render();
    if (window.ewObserveReveals) window.ewObserveReveals();
  }

  /* ---------- panel styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .ew-tw{ position:fixed; right:18px; bottom:18px; z-index:9999; width:312px; max-width:calc(100vw - 36px);
    background:var(--paper); color:var(--ink); border:1px solid var(--line); border-radius:18px;
    box-shadow:0 30px 70px -28px rgba(40,28,16,.55); font-family:var(--body); overflow:hidden;
    transform:translateY(14px) scale(.98); opacity:0; pointer-events:none; transition:.34s cubic-bezier(.2,.7,.3,1); }
  .ew-tw.open{ transform:none; opacity:1; pointer-events:auto; }
  .ew-tw__hd{ display:flex; align-items:center; justify-content:space-between; padding:15px 16px;
    border-bottom:1px solid var(--line); cursor:grab; }
  .ew-tw__hd h3{ font-family:var(--display); font-size:1.18rem; }
  .ew-tw__x{ background:none; border:0; color:var(--ink-2); font-size:1.3rem; line-height:1; width:30px; height:30px;
    border-radius:50%; transition:.25s; }
  .ew-tw__x:hover{ background:var(--cream-2); color:var(--ink); }
  .ew-tw__body{ padding:8px 16px 18px; max-height:min(74vh,560px); overflow:auto; }
  .ew-tw__sec{ font-size:.66rem; letter-spacing:.2em; text-transform:uppercase; color:var(--ink-3);
    font-weight:700; margin:18px 0 10px; }
  .ew-tw__row{ margin-bottom:4px; }
  .ew-tw__lab{ font-size:.82rem; color:var(--ink-2); margin-bottom:8px; }
  .ew-seg{ display:flex; gap:5px; background:var(--cream-2); padding:4px; border-radius:999px; }
  .ew-seg button{ flex:1; border:0; background:none; padding:8px 6px; border-radius:999px; font-family:var(--body);
    font-weight:600; font-size:.8rem; color:var(--ink-2); transition:.25s; white-space:nowrap; }
  .ew-seg button.on{ background:var(--paper); color:var(--accent); box-shadow:0 2px 8px -3px rgba(0,0,0,.25); }
  .ew-sw{ display:flex; gap:9px; flex-wrap:wrap; }
  .ew-sw button{ width:40px; height:40px; border-radius:50%; border:2px solid transparent; padding:0; position:relative;
    background:none; transition:.2s; }
  .ew-sw button i{ position:absolute; inset:4px; border-radius:50%; display:block; }
  .ew-sw button.on{ border-color:var(--ink); }
  .ew-fonts{ display:grid; gap:7px; }
  .ew-fonts button{ text-align:left; padding:10px 13px; border:1px solid var(--line); border-radius:12px;
    background:var(--paper); color:var(--ink); transition:.25s; }
  .ew-fonts button .nm{ font-size:1.18rem; }
  .ew-fonts button.on{ border-color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,var(--paper)); }
  .ew-tw__note{ font-size:.72rem; color:var(--ink-3); margin-top:14px; line-height:1.5; }
  `;
  document.head.appendChild(css);

  const panel = document.createElement('div');
  panel.className = 'ew-tw';
  document.body.appendChild(panel);

  function seg(key, opts) {
    return `<div class="ew-seg">` + opts.map(([v, l]) =>
      `<button data-k="${key}" data-v="${v}" class="${T[key] === v ? 'on' : ''}">${l}</button>`).join('') + `</div>`;
  }
  function swatches(key, map) {
    return `<div class="ew-sw">` + Object.entries(map).map(([v, o]) =>
      `<button data-k="${key}" data-v="${v}" title="${o.label}" class="${T[key] === v ? 'on' : ''}">` +
      `<i style="background:${o.v[0]}"></i></button>`).join('') + `</div>`;
  }
  function fonts(key, map) {
    return `<div class="ew-fonts">` + Object.entries(map).map(([v, o]) =>
      `<button data-k="${key}" data-v="${v}" class="${T[key] === v ? 'on' : ''}">` +
      `<span class="nm" style="font-family:${o.v}">${o.label}</span></button>`).join('') + `</div>`;
  }

  function render() {
    const onHome = document.body.getAttribute('data-page') === 'home';
    panel.innerHTML = `
      <div class="ew-tw__hd" data-drag>
        <h3>Réglages</h3>
        <button class="ew-tw__x" aria-label="Fermer">×</button>
      </div>
      <div class="ew-tw__body">
        <div class="ew-tw__sec">Ambiance</div>
        <div class="ew-tw__row"><div class="ew-tw__lab">Thème</div>
          ${seg('theme', [['clair', 'Clair'], ['sombre', 'Sombre']])}</div>
        <div class="ew-tw__row" style="margin-top:14px"><div class="ew-tw__lab">Couleur d’accent</div>
          ${swatches('accent', ACCENTS)}</div>

        <div class="ew-tw__sec">Typographie</div>
        <div class="ew-tw__row">${fonts('font', FONTS)}</div>

        <div class="ew-tw__sec">Style</div>
        <div class="ew-tw__row"><div class="ew-tw__lab">Coins</div>
          ${seg('corners', [['doux', 'Doux'], ['nets', 'Nets']])}</div>
        <div class="ew-tw__row" style="margin-top:14px"><div class="ew-tw__lab">Animations</div>
          ${seg('anim', [['off', 'Aucune'], ['subtle', 'Douces'], ['lively', 'Amples']])}</div>

        ${onHome ? `<div class="ew-tw__sec">Page d’accueil</div>
        <div class="ew-tw__row"><div class="ew-tw__lab">Variante de l’en-tête</div>
          ${seg('hero', [['A', 'Plein cadre'], ['B', 'Éditorial'], ['C', 'Épuré']])}</div>` : ``}

        <p class="ew-tw__note">Ces réglages s’appliquent à tout le site et sont mémorisés sur cet appareil.</p>
      </div>`;
    panel.querySelectorAll('button[data-k]').forEach(b =>
      b.addEventListener('click', () => setKey(b.getAttribute('data-k'), b.getAttribute('data-v'))));
    panel.querySelector('.ew-tw__x').addEventListener('click', dismiss);
    makeDraggable(panel.querySelector('[data-drag]'));
  }

  /* ---------- drag ---------- */
  function makeDraggable(handle) {
    if (!handle) return;
    let sx, sy, ox, oy, drag = false;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.ew-tw__x')) return;
      drag = true; handle.setPointerCapture(e.pointerId);
      const r = panel.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.left = ox + 'px'; panel.style.top = oy + 'px';
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      panel.style.left = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, ox + e.clientX - sx)) + 'px';
      panel.style.top = Math.max(8, Math.min(window.innerHeight - 60, oy + e.clientY - sy)) + 'px';
    });
    handle.addEventListener('pointerup', () => { drag = false; });
  }

  /* ---------- host protocol ---------- */
  let open = false;
  function setOpen(v) { open = v; panel.classList.toggle('open', v); if (v) render(); }
  function dismiss() { setOpen(false); try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {} }

  window.addEventListener('message', (e) => {
    const ty = e && e.data && e.data.type;
    if (ty === '__activate_edit_mode') setOpen(true);
    else if (ty === '__deactivate_edit_mode') setOpen(false);
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

  render();
})();
