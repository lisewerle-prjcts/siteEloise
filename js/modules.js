/* ===========================================================================
   modules.js — public dynamic blocks fed by EWStore:
     • [data-dates]  upcoming dates by city
     • [data-insta]  Instagram strip (@elo_aum)
     • [data-testi]  approved testimonials
     • [data-review] leave-a-review form
   Re-renders on ew:datachange and ew:langchange.
   Load AFTER store.js + i18n.js + site.js.
   =========================================================================== */
(function () {
  'use strict';
  if (!window.EWStore) return;
  var S = window.EWStore;
  var t = function (k) { return window.t ? window.t(k) : k; };
  var lang = function () { return window.ewLang ? window.ewLang() : 'fr'; };
  var LOC = { fr: 'fr-FR', de: 'de-DE', en: 'en-GB' };
  function locale() { return LOC[lang()] || 'fr-FR'; }
  function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var IG = 'https://instagram.com/elo_aum';
  var IG_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>';

  function cityName(id) { return S.cityName(id); }
  function svcName(id) { return id ? S.serviceName(id) : ''; }
  function stars(n) { n = Math.max(0, Math.min(5, n || 5)); var s = ''; for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆'; return s; }

  /* -------------------- upcoming dates -------------------- */
  var datesFilter = null;
  var datesExpanded = false;
  var DATES_INITIAL = 3;
  function chipBtn(label, active, attr) {
    return '<button type="button" style="padding:8px 16px;border:1px solid '+(active?'var(--accent)':'var(--line)')+';border-radius:999px;font-size:.83rem;font-weight:600;color:'+(active?'var(--accent)':'var(--ink-2)')+';background:transparent;cursor:pointer;transition:.3s" '+attr+'>'+label+'</button>';
  }
  function renderDates() {
    var host = document.querySelector('[data-dates]');
    if (!host) return;
    var all = S.upcomingDates();
    // cities present in upcoming dates
    var cityIds = [];
    all.forEach(function(d) { if (d.city && cityIds.indexOf(d.city) < 0) cityIds.push(d.city); });
    // filter chips
    var chipsHtml = '';
    if (cityIds.length > 1) {
      chipsHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">' +
        chipBtn(esc(t('dates.filter.all') || 'Toutes les villes'), datesFilter===null, 'data-dcity=""') +
        cityIds.map(function(id) {
          return chipBtn(esc(cityName(id)), datesFilter===id, 'data-dcity="'+id+'"');
        }).join('') +
      '</div>';
    }
    var filtered = datesFilter ? all.filter(function(d) { return d.city === datesFilter; }) : all;
    var visible = datesExpanded ? filtered : filtered.slice(0, DATES_INITIAL);
    var rowsHtml;
    if (!filtered.length) {
      rowsHtml = '<p class="dates-empty">' + esc(t('dates.none')) + '</p>';
    } else {
      rowsHtml = visible.map(function (d) {
        var dt = new Date(d.date + 'T00:00:00');
        var day = dt.toLocaleDateString(locale(), { day: '2-digit' });
        var mon = dt.toLocaleDateString(locale(), { month: 'short' }).replace('.', '');
        var meta = [];
        var time = '';
        if (d.start && d.end) time = d.start + ' – ' + d.end;
        else if (d.start) time = t('dates.from') + ' ' + d.start;
        if (time) meta.push('<span>' + esc(time) + '</span>');
        if (d.service) meta.push('<span class="svc">' + esc(svcName(d.service)) + '</span>');
        return '<div class="date-row reveal">' +
          '<div class="date-row__day"><div class="d">' + esc(day) + '</div><div class="m">' + esc(mon) + '</div></div>' +
          '<div class="date-row__body"><div class="date-row__city">' + esc(cityName(d.city)) + '</div>' +
          '<div class="date-row__meta">' + meta.join('') + '</div></div>' +
          '<a class="btn btn-ghost btn-sm" href="reservation.html">' + esc(t('dates.book')) + '</a>' +
          '</div>';
      }).join('');
    }
    var moreHtml = '';
    if (!datesExpanded && filtered.length > DATES_INITIAL) {
      moreHtml = '<div style="text-align:center;margin-top:20px">' +
        '<button type="button" class="btn btn-ghost" data-dates-more>' +
          esc(t('dates.more') || 'Voir plus') + ' (' + (filtered.length - DATES_INITIAL) + ')' +
        '</button></div>';
    }
    host.className = 'dates-list';
    host.innerHTML = chipsHtml + rowsHtml + moreHtml;
    [].slice.call(host.querySelectorAll('[data-dcity]')).forEach(function(b) {
      b.addEventListener('click', function() {
        datesFilter = b.getAttribute('data-dcity') || null;
        datesExpanded = false;
        renderDates();
      });
    });
    var moreBtn = host.querySelector('[data-dates-more]');
    if (moreBtn) moreBtn.addEventListener('click', function() { datesExpanded = true; renderDates(); });
    if (window.ewObserveReveals) window.ewObserveReveals();
  }

  /* -------------------- instagram -------------------- */
  function renderInsta() {
    var host = document.querySelector('[data-insta]');
    if (!host) return;
    var posts = S.insta().slice(0, 6);
    host.innerHTML = posts.map(function (p) {
      return '<a class="insta-cell" href="' + IG + '" target="_blank" rel="noopener" aria-label="Instagram @elo_aum">' +
        '<img src="' + esc(p.img) + '" alt="" loading="lazy">' +
        '<span class="insta-cell__ig">' + IG_SVG + '</span>' +
        (p.caption ? '<span class="insta-cell__cap">' + esc(p.caption) + '</span>' : '') +
        '</a>';
    }).join('');
  }

  /* -------------------- testimonials -------------------- */
  function renderTesti() {
    var host = document.querySelector('[data-testi]');
    if (!host) return;
    var list = S.approvedTestimonials();
    // keep a calm count on the home grid
    list = list.slice(0, 6);
    host.innerHTML = list.map(function (item, i) {
      var q, name, role;
      if (item.key) { q = t(item.key + '.q'); name = t(item.key + '.n'); role = t(item.key + '.r'); }
      else {
        q = item.text; name = item.name || '—';
        role = item.service ? svcName(item.service) : cityName(item.city);
      }
      return '<figure class="quote reveal"' + (i ? ' data-d="' + i + '"' : '') + '>' +
        '<div class="mk">“</div>' +
        (item.rating ? '<div class="stars" aria-hidden="true">' + stars(item.rating) + '</div>' : '') +
        '<p>' + esc(q) + '</p>' +
        '<figcaption class="who"><b>' + esc(name) + '</b><small>' + esc(role) + '</small></figcaption>' +
        '</figure>';
    }).join('');
    if (window.ewObserveReveals) window.ewObserveReveals();
  }

  /* -------------------- leave a review -------------------- */
  function buildReview() {
    var host = document.querySelector('[data-review]');
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';
    var svcOpts = S.publishedServices().map(function (s) { return s.id; });
    var cityOpts = S.activeCityIds();
    host.innerHTML =
      '<form class="review-form" novalidate>' +
        '<div class="field"><label data-i18n="rev.rating">Votre note</label>' +
          '<div class="star-pick" data-stars>' +
            [1,2,3,4,5].map(function (n) { return '<button type="button" data-star="' + n + '" aria-label="' + n + '">★</button>'; }).join('') +
          '</div></div>' +
        '<div class="field-row">' +
          '<div class="field"><label data-i18n="rev.name">Votre prénom</label><input name="name" required></div>' +
          '<div class="field"><label data-i18n="rev.city">Lieu de la séance</label><select name="city">' +
            cityOpts.map(function (c) { return '<option value="' + c + '">' + esc(cityName(c)) + '</option>'; }).join('') +
          '</select></div>' +
        '</div>' +
        '<div class="field"><label data-i18n="rev.service">Soin reçu (facultatif)</label><select name="service">' +
          '<option value="">—</option>' +
          svcOpts.map(function (s) { return '<option value="' + s + '">' + esc(svcName(s)) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label data-i18n="rev.msg">Votre message</label><textarea name="text" required></textarea></div>' +
        '<button class="btn btn-primary" type="submit" data-i18n="rev.send">Envoyer mon avis</button>' +
      '</form>';

    var rating = 5;
    var starWrap = host.querySelector('[data-stars]');
    function paint() { [].slice.call(starWrap.children).forEach(function (b, i) { b.classList.toggle('on', i < rating); }); }
    paint();
    starWrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-star]'); if (!b) return;
      rating = +b.getAttribute('data-star'); paint();
    });

    var form = host.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (!(fd.get('text') || '').trim() || !(fd.get('name') || '').trim()) return;
      S.addTestimonial({
        name: fd.get('name'), city: fd.get('city'), service: fd.get('service'),
        text: fd.get('text'), rating: rating, status: 'pending', lang: lang()
      });
      host.innerHTML = '<div class="review-thanks"><div class="mk">♥</div><p class="lead" data-i18n="rev.thanks">' +
        esc(t('rev.thanks')) + '</p></div>';
    });
    if (window.ewApplyI18n) window.ewApplyI18n();
  }

  /* -------------------- soins (home grid) -------------------- */
  var SVC_ANCHOR = { thai: '#thai', balinais: '#balinais', deep: '#deep', drainage: '#drainage', ayurvedique: '#ayurvedique', yoga: '#yoga' };
  function renderSoins() {
    var host = document.querySelector('[data-soins]');
    if (!host) return;
    var list = S.publishedServices();
    host.innerHTML = list.map(function (s, i) {
      var href = 'services.html' + (SVC_ANCHOR[s.id] || '');
      return '<a class="svc reveal"' + (i % 3 ? ' data-d="' + (i % 3) + '"' : '') + ' href="' + href + '">' +
        '<div class="svc__media"><img src="' + esc(S.serviceImg(s.id)) + '" alt="' + esc(S.serviceName(s.id)) + '"></div>' +
        '<div class="svc__body">' +
          '<span class="svc__tag">' + esc(S.serviceTag(s.id)) + '</span>' +
          '<span class="svc__name">' + esc(S.serviceName(s.id)) + '</span>' +
          '<div class="svc__foot"><span class="svc__price">' + esc(S.servicePrice(s.id)) + '\u00a0\u20ac</span><span class="svc__go">\u2192</span></div>' +
        '</div></a>';
    }).join('');
    if (window.ewObserveReveals) window.ewObserveReveals();
  }

  function renderAll() { renderDates(); renderInsta(); renderTesti(); renderSoins(); }
  function init() { renderAll(); buildReview(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('ew:datachange', renderAll);
  window.addEventListener('ew:langchange', function () { renderAll(); });
})();
