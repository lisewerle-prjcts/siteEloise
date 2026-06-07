/* ===========================================================================
   inline-edit.js — in-place editing for admin users
   Shows a floating bar when ew_admin_ok === '1'.
   Edit mode: click any text or image to modify it directly.
   Saves: service fields → EWStore.updateService(); i18n text → localStorage overrides.
   Load AFTER store.js + i18n.js + site.js.
   =========================================================================== */
(function () {
  'use strict';
  if (sessionStorage.getItem('ew_admin_ok') !== '1') return;

  var S = window.EWStore;
  var editMode = false;
  var bar;

  /* ---- inject CSS ---- */
  var style = document.createElement('style');
  style.textContent = `
    .ew-editbar {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; align-items: center; gap: 10px;
      background: #1a1a1a; color: #fff; border-radius: 999px;
      padding: 10px 18px; font-size: .82rem; font-family: var(--body, sans-serif);
      box-shadow: 0 4px 24px rgba(0,0,0,.35); user-select: none;
    }
    .ew-editbar a { color: #C2B49E; text-decoration: none; font-size: .82rem; }
    .ew-editbar a:hover { text-decoration: underline; }
    .ew-editbar__sep { opacity: .3; }
    .ew-editbtn {
      background: #C2B49E; color: #1a1a1a; border: none; border-radius: 999px;
      padding: 6px 14px; font-size: .82rem; font-weight: 700; cursor: pointer;
      transition: background .2s;
    }
    .ew-editbtn.on { background: #e06b50; color: #fff; }
    .ew-editbtn:hover { filter: brightness(1.1); }

    body.ew-edit [data-editable] {
      outline: 2px dashed rgba(192,180,158,.6);
      outline-offset: 3px;
      cursor: pointer;
      transition: outline .15s;
      border-radius: 4px;
    }
    body.ew-edit [data-editable]:hover {
      outline-color: #C2B49E;
      background: rgba(192,180,158,.08);
    }
    body.ew-edit [data-editable].ew-editing {
      outline: 2px solid #C2B49E;
      background: rgba(192,180,158,.12);
    }
    .ew-img-overlay {
      position: absolute; inset: 0; background: rgba(26,26,26,.55);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border-radius: inherit; opacity: 0; transition: opacity .2s;
      font-size: .8rem; color: #fff; font-weight: 700; gap: 6px; letter-spacing: .05em;
    }
    body.ew-edit [data-editable-img]:hover .ew-img-overlay { opacity: 1; }
    [data-editable-img] { position: relative; }
    .ew-img-input-wrap {
      position: absolute; inset: 0; z-index: 10;
      background: rgba(26,26,26,.8); display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px; padding: 16px;
      border-radius: inherit;
    }
    .ew-img-input-wrap input {
      width: 100%; padding: 8px 12px; border-radius: 8px; border: none;
      font-size: .85rem; background: #fff; color: #1a1a1a;
    }
    .ew-img-input-wrap .ew-img-btns { display: flex; gap: 8px; }
    .ew-img-input-wrap button {
      padding: 6px 14px; border-radius: 999px; border: none;
      font-size: .8rem; font-weight: 700; cursor: pointer;
    }
    .ew-img-input-wrap .ok { background: #C2B49E; color: #1a1a1a; }
    .ew-img-input-wrap .cancel { background: rgba(255,255,255,.15); color: #fff; }
  `;
  document.head.appendChild(style);

  /* ---- inject bar ---- */
  bar = document.createElement('div');
  bar.className = 'ew-editbar';
  bar.innerHTML = `
    <a href="admin.html">← Espace Eloïse</a>
    <span class="ew-editbar__sep">|</span>
    <button class="ew-editbtn" id="ew-toggle-edit">✏ Mode édition</button>`;
  document.body.appendChild(bar);

  var btn = document.getElementById('ew-toggle-edit');
  btn.addEventListener('click', function () {
    editMode = !editMode;
    btn.textContent = editMode ? '✓ Terminer' : '✏ Mode édition';
    btn.classList.toggle('on', editMode);
    document.body.classList.toggle('ew-edit', editMode);
    if (editMode) attachEditors(); else detachEditors();
  });

  /* ---- text editing ---- */
  function attachEditors() {
    // i18n text elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.closest('.ew-editbar')) return;
      el.setAttribute('data-editable', '');
      el.addEventListener('click', onTextClick);
    });
    // service-specific elements
    document.querySelectorAll('[data-svc-id]').forEach(function (el) {
      el.setAttribute('data-editable', '');
      el.addEventListener('click', onSvcClick);
    });
    // images
    document.querySelectorAll('[data-svc-img]').forEach(function (el) {
      el.setAttribute('data-editable-img', '');
      injectImgOverlay(el);
    });
  }

  function detachEditors() {
    document.querySelectorAll('[data-editable]').forEach(function (el) {
      el.removeAttribute('data-editable');
      el.removeAttribute('contenteditable');
      el.classList.remove('ew-editing');
      el.removeEventListener('click', onTextClick);
      el.removeEventListener('click', onSvcClick);
    });
    document.querySelectorAll('[data-editable-img]').forEach(function (el) {
      el.removeAttribute('data-editable-img');
      var ov = el.querySelector('.ew-img-overlay, .ew-img-input-wrap');
      if (ov) ov.remove();
    });
  }

  /* text click → make contenteditable */
  function onTextClick(e) {
    var el = this;
    if (el.classList.contains('ew-editing')) return;
    e.stopPropagation();
    el.classList.add('ew-editing');
    el.setAttribute('contenteditable', 'true');
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function save() {
      el.removeAttribute('contenteditable');
      el.classList.remove('ew-editing');
      var key = el.getAttribute('data-i18n');
      var val = el.textContent.trim();
      if (key && val) saveTextOverride(key, val);
    }
    el.addEventListener('blur', save, { once: true });
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.blur(); }
      if (ev.key === 'Escape') { el.blur(); }
    }, { once: true });
  }

  /* service field click */
  function onSvcClick(e) {
    var el = this;
    if (el.classList.contains('ew-editing')) return;
    e.stopPropagation();
    el.classList.add('ew-editing');
    el.setAttribute('contenteditable', 'true');
    el.focus();

    function save() {
      el.removeAttribute('contenteditable');
      el.classList.remove('ew-editing');
      var svcId = el.getAttribute('data-svc-id');
      var field = el.getAttribute('data-svc-field');
      var val = el.textContent.trim();
      if (svcId && field && S && S.updateService) {
        var patch = {}; patch[field] = val;
        S.updateService(svcId, patch);
      }
    }
    el.addEventListener('blur', save, { once: true });
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.blur(); }
      if (ev.key === 'Escape') { el.blur(); }
    }, { once: true });
  }

  /* image editing */
  function injectImgOverlay(wrap) {
    var ov = document.createElement('div');
    ov.className = 'ew-img-overlay';
    ov.innerHTML = '📷 Changer l\'image';
    wrap.appendChild(ov);
    ov.addEventListener('click', function (e) {
      e.stopPropagation();
      ov.style.display = 'none';
      var inputWrap = document.createElement('div');
      inputWrap.className = 'ew-img-input-wrap';
      var img = wrap.querySelector('img');
      inputWrap.innerHTML = `
        <input type="url" placeholder="URL de l'image (https://...)" value="${img ? img.src : ''}">
        <div class="ew-img-btns">
          <button class="ok">Valider</button>
          <button class="cancel">Annuler</button>
        </div>`;
      wrap.appendChild(inputWrap);
      var input = inputWrap.querySelector('input');
      input.focus(); input.select();

      inputWrap.querySelector('.ok').addEventListener('click', function () {
        var url = input.value.trim();
        if (url && img) {
          img.src = url;
          var svcId = wrap.getAttribute('data-svc-img');
          if (svcId && S && S.updateService) S.updateService(svcId, { img: url });
        }
        inputWrap.remove(); ov.style.display = '';
      });
      inputWrap.querySelector('.cancel').addEventListener('click', function () {
        inputWrap.remove(); ov.style.display = '';
      });
    });
  }

  /* ---- i18n text override persistence ---- */
  var OVERRIDE_KEY = 'ew_text_overrides';
  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveTextOverride(i18nKey, value) {
    var lang = window.ewLang ? window.ewLang() : 'fr';
    var all = loadOverrides();
    if (!all[lang]) all[lang] = {};
    all[lang][i18nKey] = value;
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
    // inject into live i18n so the change is immediate
    if (window.I18N && window.I18N[lang]) window.I18N[lang][i18nKey] = value;
    if (window.ewApplyI18n) window.ewApplyI18n();
  }

  /* apply saved overrides on page load */
  function applyOverrides() {
    var lang = window.ewLang ? window.ewLang() : 'fr';
    var all = loadOverrides();
    var overrides = all[lang] || {};
    Object.keys(overrides).forEach(function (k) {
      if (window.I18N && window.I18N[lang]) window.I18N[lang][k] = overrides[k];
    });
    if (Object.keys(overrides).length && window.ewApplyI18n) window.ewApplyI18n();
  }

  applyOverrides();
  window.addEventListener('ew:langchange', applyOverrides);

})();
