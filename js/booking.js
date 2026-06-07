/* ===========================================================================
   booking.js — interactive booking flow + slot alerts (vanilla)
   =========================================================================== */
(function () {
  const root = document.getElementById('booking-root');
  const alertRoot = document.getElementById('alert-root');
  if (!root) return;

  const LOC_MAP = { fr: 'fr-FR', de: 'de-DE', en: 'en-GB' };
  const locale = () => LOC_MAP[window.ewLang ? window.ewLang() : 'fr'] || 'fr-FR';
  const t = (k) => (window.t ? window.t(k) : k);

  /* ---------- data ---------- */
  const IMG = { thai: 'thai-etirement', balinais: 'soin-mains', deep: 'relaxation',
                drainage: 'drainage-visage', ayurvedique: 'thai-dos', yoga: 'yoga-equilibre' };

  function publishedServices() {
    if (EWS && EWS.publishedServices) return EWS.publishedServices();
    return [
      { id: 'thai', category: 'massage' }, { id: 'balinais', category: 'massage' },
      { id: 'deep', category: 'massage' }, { id: 'ayurvedique', category: 'massage' },
      { id: 'drainage', category: 'drainage' }, { id: 'yoga', category: 'yoga' }
    ];
  }

  /* Fallback prices if store not loaded */
  const FALLBACK_OPTIONS = {
    thai:        [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    balinais:    [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    deep:        [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    drainage:    [{min:60,price:80},{min:120,price:150}],
    ayurvedique: [{min:60,price:70},{min:90,price:100}],
    yoga:        [{min:60,price:65},{min:90,price:90}],
  };

  var EWS = window.EWStore;
  function serviceOptions(id) {
    if (EWS) { const s = EWS.service(id); if (s && s.durations && s.durations.length) return s.durations; }
    return FALLBACK_OPTIONS[id] || [{min:60,price:70}];
  }
  function serviceDurations(id) { return serviceOptions(id).map(o => o.min); }

  function locations() {
    return (EWS ? EWS.activeCityIds() : ['sucy', 'chesnay', 'wehingen']).map(function (id) {
      return { id: id, days: EWS ? EWS.cityDays(id) : [2, 3, 4] };
    });
  }
  const SLOT_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];
  const BUFFER_MIN = 15;

  function svc(id) { return publishedServices().find(s => s.id === id); }
  function locName(id) { return EWS ? EWS.cityName(id) : id; }
  function locRegion(id) { return EWS ? EWS.cityRegion(id) : ''; }
  function price(serviceId, min) {
    const opts = serviceOptions(serviceId);
    const opt = opts.find(o => o.min === min);
    return opt ? opt.price : (opts.length ? opts[0].price : 0);
  }

  function iso(d) {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }
  function timeToMin(t) { if (!t) return 0; const p = t.split(':'); return +p[0]*60 + (+p[1]||0); }

  /* Real slot availability — checks against stored appointments with buffer */
  function bookedRanges(locId, dateISO) {
    if (!EWS) return [];
    return EWS.appointmentsForDate(locId, dateISO).map(a => ({
      start: timeToMin(a.time) - BUFFER_MIN,
      end:   timeToMin(a.time) + (a.duration || 60) + BUFFER_MIN
    }));
  }
  function isSlotFree(locId, dateISO, slotTime, duration) {
    const start = timeToMin(slotTime), end = start + duration;
    return !bookedRanges(locId, dateISO).some(r => start < r.end && end > r.start);
  }
  function freeSlots(locId, dateISO, duration) {
    const dur = duration || S.duration || 60;
    const openTo = EWS && EWS.cityOpenTo ? timeToMin(EWS.cityOpenTo(locId)) : timeToMin('18:00');
    return SLOT_TIMES.filter(tm => {
      const start = timeToMin(tm);
      return start + dur <= openTo && isSlotFree(locId, dateISO, tm, dur);
    });
  }
  function dayAvailable(locId, d, duration) {
    const loc = locations().find(l => l.id === locId);
    if (!loc || !loc.days.includes(d.getDay())) return false;
    return freeSlots(locId, iso(d), duration || S.duration || 60).length > 0;
  }
  function upcomingDays(locId, n, duration) {
    const out = []; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 90 && out.length < n; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      out.push({ date: d, avail: dayAvailable(locId, d, duration || S.duration || 60) });
    }
    return out;
  }

  /* ---------- state ---------- */
  const SKEY = 'ew_booking';
  let S = { step: 1, service: null, option: null, duration: null, location: null, dateISO: null, time: null,
            form: { first: '', last: '', email: '', phone: '', notes: '', consent: false },
            gift: false, done: false };
  try {
    const sv = JSON.parse(localStorage.getItem(SKEY) || 'null');
    if (sv) {
      if (sv.done) {
        // Previous session was completed — start fresh
        S.gift = sv.gift || false;
      } else {
        S = Object.assign(S, sv);
      }
    }
  } catch (e) {}
  S.done = false;

  // URL params
  const params = new URLSearchParams(location.search);
  if (params.get('gift') === '1') { S.gift = true; document.body.classList.add('is-gift'); }
  const ps = params.get('service');
  if (ps && svc(ps) && S.service !== ps) { S.service = ps; S.duration = serviceOptions(ps)[0].min; if (S.step < 2) S.step = 2; }
  if (S.gift) document.body.classList.add('is-gift');

  function save() { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- date formatting ---------- */
  function fmtFull(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function durLabel(min) {
    if (min % 60 === 0) return (min / 60) + ' ' + t('rv.h');
    return min + ' ' + t('rv.min');
  }
  function weekdayShort(wd) {
    const ref = new Date(2024, 0, 7 + wd); // Jan 7 2024 = Sunday
    return ref.toLocaleDateString(locale(), { weekday: 'short' }).replace('.', '');
  }
  function daysHint(loc) { return loc.days.map(weekdayShort).join(' · '); }

  /* ---------- step gating ---------- */
  function canAdvance(step) {
    if (step === 1) return !!S.service;
    if (step === 2) return !!S.location && !!S.duration;
    if (step === 3) return !!S.dateISO && !!S.time;
    if (step === 4) return validForm(false);
    return true;
  }
  function validForm(mark) {
    const f = S.form; let ok = true;
    const need = ['first', 'last', 'email'];
    need.forEach(k => { if (!String(f[k] || '').trim()) ok = false; });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || '');
    if (!emailOk) ok = false;
    if (!f.consent) ok = false;
    if (mark) renderInvalid(emailOk);
    return ok;
  }

  /* ---------- render ---------- */
  function render() {
    if (S.done) { renderDone(); renderAlerts(); return; }
    root.innerHTML = `
      <div class="booking">
        <div class="booking__main">
          ${stepper()}
          <div class="step">${stepBody()}</div>
          ${nav()}
        </div>
        <aside class="summary">${summary()}</aside>
      </div>`;
    bind();
    renderAlerts();
  }

  function stepper() {
    const steps = [1, 2, 3, 4, 5];
    return `<div class="stepper">` + steps.map(n => {
      const cls = n === S.step ? 'active' : (n < S.step ? 'done' : '');
      return `<div class="stepper__i ${cls}"><div class="stepper__n">${n < S.step ? '&#10003;' : n}</div>` +
        `<div class="stepper__l">${t('rv.step.' + n)}</div></div>`;
    }).join('') + `</div>`;
  }

  function stepBody() {
    if (S.step === 1) return step1();
    if (S.step === 2) return step2();
    if (S.step === 3) return step3();
    if (S.step === 4) return step4();
    return step5();
  }

  function svcName(id) { return EWS ? EWS.serviceName(id) : t('svc.' + id + '.name'); }
  function svcTag(id)  { return EWS ? EWS.serviceTag(id)  : t('svc.' + id + '.tag');  }

  function svcImg(id) {
    if (EWS && EWS.serviceImg) { const u = EWS.serviceImg(id); if (u) return u; }
    return IMG[id] ? 'assets/' + IMG[id] + '.png' : 'assets/relaxation.png';
  }

  function optCard(s) {
    const on = S.service === s.id ? 'on' : '';
    const opts = serviceOptions(s.id);
    const minPrice = opts.reduce((m, o) => Math.min(m, o.price), opts[0].price);
    const maxPrice = opts.reduce((m, o) => Math.max(m, o.price), opts[0].price);
    const priceStr = minPrice === maxPrice ? `${minPrice} €` : `${minPrice}–${maxPrice} €`;
    return `<button type="button" class="opt ${on}" data-svc="${s.id}">
      <img class="opt__img" src="${svcImg(s.id)}" alt="">
      <span class="opt__tx"><b>${svcName(s.id)}</b>
        <small>${svcTag(s.id)}</small>
        <span class="pr">${priceStr}</span></span>
    </button>`;
  }

  const CAT_LABEL = { massage: 'rv.cat.massage', drainage: 'rv.cat.drainage', yoga: 'rv.cat.yoga' };
  const CAT_ORDER = ['massage', 'drainage', 'yoga'];

  function step1() {
    const svcs = publishedServices();
    const seen = new Set();
    const cats = [];
    CAT_ORDER.forEach(c => { if (svcs.some(s => (s.category||'massage') === c)) { cats.push(c); seen.add(c); } });
    svcs.forEach(s => { const c = s.category || 'massage'; if (!seen.has(c)) { cats.push(c); seen.add(c); } });

    const body = cats.map(c => {
      const cards = svcs.filter(s => (s.category || 'massage') === c).map(optCard).join('');
      const label = CAT_LABEL[c] ? t(CAT_LABEL[c]) : c;
      return `<div class="step__cat">${label}</div><div class="opt-grid">${cards}</div>`;
    }).join('');

    return `<div class="step__h"><h2>${t('rv.s1.title')}</h2><p>${t('rv.s1.sub')}</p></div>${body}`;
  }

  function step2() {
    const locs = locations().map(l => {
      const on = S.location === l.id ? 'on' : '';
      return `<button type="button" class="loc ${on}" data-loc="${l.id}">
        <span class="loc__pin">${locName(l.id).charAt(0)}</span>
        <span class="loc__tx"><b>${locName(l.id)}</b><small>${locRegion(l.id)}</small></span>
        </button>`;
    }).join('');
    const durs = serviceOptions(S.service).map(o => {
      const on = S.duration === o.min ? 'on' : '';
      return `<button type="button" class="dur ${on}" data-dur="${o.min}">${durLabel(o.min)}<small>${o.price}&nbsp;€</small></button>`;
    }).join('');
    const svcOpts = EWS ? EWS.serviceOptions(S.service) : [];
    const optsHtml = svcOpts.length
      ? `<div class="step__cat">${t('rv.s2.option') || 'Option'}</div>
         <div class="dur-row">${svcOpts.map(o => {
           const on = S.option === o ? 'on' : '';
           return `<button type="button" class="dur ${on}" data-opt="${o}">${o}</button>`;
         }).join('')}</div>`
      : '';
    return `<div class="step__h"><h2>${t('rv.s2.title')}</h2></div>
      <div class="step__cat">${t('rv.s2.loc')}</div><div class="loc-list">${locs}</div>
      <div class="step__cat">${t('rv.s2.dur')}</div><div class="dur-row">${durs}</div>
      ${optsHtml}`;
  }

  function step3() {
    if (!S.location) { S.step = 2; return step2(); }
    const days = upcomingDays(S.location, 14, S.duration);
    const strip = days.map(o => {
      const d = o.date, isoStr = iso(d);
      const on = S.dateISO === isoStr ? 'on' : '';
      const wd = d.toLocaleDateString(locale(), { weekday: 'short' }).replace('.', '');
      const mo = d.toLocaleDateString(locale(), { month: 'short' }).replace('.', '');
      return `<button type="button" class="day ${on}" data-day="${isoStr}" ${o.avail ? '' : 'disabled'}>
        <span class="wd">${wd}</span><span class="dn">${d.getDate()}</span><span class="mo">${mo}</span>
        ${o.avail ? '<span class="dot"></span>' : ''}</button>`;
    }).join('');

    let slotsHtml = `<p class="empty-note">${t('rv.pickday')}</p>`;
    if (S.dateISO) {
      const d = new Date(S.dateISO + 'T00:00:00');
      const free = freeSlots(S.location, S.dateISO, S.duration);
      const all = SLOT_TIMES;
      if (free.length === 0) {
        slotsHtml = `<p class="empty-note">${t('rv.noslots')}</p>`;
      } else {
        const groups = [['rv.morning', tm => tm < '12:00'], ['rv.afternoon', tm => tm >= '12:00' && tm < '17:00'], ['rv.evening', tm => tm >= '17:00']];
        slotsHtml = groups.map(([lab, fn]) => {
          const times = all.filter(fn); if (!times.length) return '';
          const chips = times.map(tm => {
            const free1 = free.includes(tm);
            const on = S.time === tm ? 'on' : '';
            return `<button type="button" class="slot ${on}" data-slot="${tm}" ${free1 ? '' : 'disabled'}>${tm}</button>`;
          }).join('');
          return `<div class="slot-group"><h4>${t(lab)}</h4><div class="slot-row">${chips}</div></div>`;
        }).join('');
      }
    }
    const sub = `${t('rv.s3.sub')} ${locName(S.location)}`;
    return `<div class="step__h"><h2>${t('rv.s3.title')}</h2><p>${sub}</p></div>
      <div class="date-strip">${strip}</div>
      <div class="slots">${slotsHtml}</div>
      <div class="inline-alert">
        <span>${t('rv.alert.inline')}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-jump-alert>${t('rv.alert.submit')}</button>
      </div>`;
  }

  function field(name, type, req) {
    const f = S.form;
    const val = (f[name] || '').toString().replace(/"/g, '&quot;');
    const lab = t('rv.f.' + name) + (req ? ' *' : '');
    if (type === 'textarea') {
      return `<div class="field full" data-field="${name}"><label>${lab}</label>
        <textarea data-input="${name}" data-i18n-ph="rv.f.notes.ph">${f[name] || ''}</textarea></div>`;
    }
    return `<div class="field" data-field="${name}"><label>${lab}</label>
      <input type="${type}" data-input="${name}" value="${val}">
      <span class="msg">${name === 'email' ? t('rv.req.email') : t('rv.req')}</span></div>`;
  }
  function step4() {
    return `<div class="step__h"><h2>${t('rv.s4.title')}</h2><p>${t('rv.s4.sub')}</p></div>
      <div class="form-grid">
        ${field('first', 'text', true)}
        ${field('last', 'text', true)}
        ${field('email', 'email', true)}
        ${field('phone', 'tel', false)}
        ${field('notes', 'textarea', false)}
        <label class="consent"><input type="checkbox" data-input="consent" ${S.form.consent ? 'checked' : ''}>
          <span>${t('rv.f.consent')}</span></label>
      </div>`;
  }

  function step5() {
    return `<div class="step__h"><h2>${t('rv.step.5')}</h2><p>${t('rv.s4.sub')}</p></div>
      ${reviewBlock()}`;
  }
  function reviewBlock() {
    const f = S.form;
    const rows = [
      [t('rv.sum.service'), S.service ? (svcName(S.service) + (S.option ? ' — ' + S.option : '')) : '—'],
      [t('rv.sum.loc'), S.location ? locName(S.location) : '—'],
      [t('rv.sum.when'), S.dateISO ? (fmtFull(S.dateISO) + (S.time ? ' · ' + S.time : '')) : '—'],
      [t('rv.sum.duration'), S.duration ? durLabel(S.duration) : '—'],
      ['', ''],
      [t('rv.f.first'), [f.first, f.last].filter(Boolean).join(' ') || '—'],
      [t('rv.f.email'), f.email || '—'],
      [t('rv.f.phone'), f.phone || '—'],
    ].filter(r => r[0] !== '' || r[1] !== '');
    const html = rows.map(r => r[0] === '' ?
      `<div class="sum-line" style="border-top:1px solid var(--line);padding:6px 0"></div>` :
      `<div class="sum-line"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('');
    return `<div class="recap" style="background:var(--cream);border:1px solid var(--line);border-radius:14px;padding:8px 20px">${html}</div>`;
  }

  function nav() {
    const back = S.step > 1 ? `<button type="button" class="btn btn-ghost" data-back>${t('rv.back')}</button>` : `<span class="spacer"></span>`;
    const next = S.step < 5
      ? `<button type="button" class="btn btn-primary" data-next>${t('rv.next')}</button>`
      : `<button type="button" class="btn btn-primary" data-confirm>${t('rv.confirm')}</button>`;
    return `<div class="step-nav">${back}<span class="spacer"></span>${next}</div>`;
  }

  function summary() {
    const img = S.service ? `<img src="assets/${IMG[S.service]}.png" alt="">` : `<div class="ph">${t('brand.sub')}</div>`;
    const line = (k, v) => `<div class="sum-line"><span class="k">${k}</span><span class="v ${v ? '' : 'empty'}">${v || t('rv.sum.empty')}</span></div>`;
    const total = (S.service && S.duration) ? price(S.service, S.duration) + ' €' : '—';
    return `<div class="summary__img">${img}</div>
      <div class="summary__body">
        <h3>${t('rv.summary')}</h3>
        ${line(t('rv.sum.service'), S.service ? (svcName(S.service) + (S.option ? ' — ' + S.option : '')) : '')}
        ${line(t('rv.sum.loc'), S.location ? locName(S.location) : '')}
        ${line(t('rv.sum.when'), S.dateISO ? (fmtFull(S.dateISO) + (S.time ? ' · ' + S.time : '')) : '')}
        ${line(t('rv.sum.duration'), S.duration ? durLabel(S.duration) : '')}
        <div class="sum-total"><span class="k">${t('rv.sum.total')}</span><span class="v">${total}</span></div>
      </div>`;
  }

  function renderDone() {
    root.innerHTML = `<div class="done">
      <div class="done__seal"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2>${t('rv.done.title')}</h2>
      <p>${t('rv.done.text')}</p>
      <div class="recap">${reviewBlock()}</div>
      <div class="cta-row"><button type="button" class="btn btn-primary" data-again>${t('rv.done.again')}</button>
        <a class="btn btn-ghost" href="contact.html">${t('cta.contact')}</a></div>
      <p class="note">${t('rv.done.note')}</p>
    </div>`;
  }

  function renderInvalid(emailOk) {
    ['first', 'last', 'email'].forEach(k => {
      const wrap = root.querySelector('[data-field="' + k + '"]');
      if (!wrap) return;
      const bad = !String(S.form[k] || '').trim() || (k === 'email' && !emailOk);
      wrap.classList.toggle('err', bad);
    });
  }

  /* ---------- bind ---------- */
  function bind() {
    root.querySelectorAll('[data-svc]').forEach(b => b.onclick = () => {
      S.service = b.getAttribute('data-svc');
      const opts = serviceOptions(S.service);
      if (!opts.find(o => o.min === S.duration)) S.duration = opts[0].min;
      save(); render();
    });
    root.querySelectorAll('[data-loc]').forEach(b => b.onclick = () => {
      if (S.location !== b.getAttribute('data-loc')) { S.dateISO = null; S.time = null; }
      S.location = b.getAttribute('data-loc'); save(); render();
    });
    root.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { S.duration = +b.getAttribute('data-dur'); save(); render(); });
    root.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => { S.option = b.getAttribute('data-opt'); save(); render(); });
    root.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { S.dateISO = b.getAttribute('data-day'); S.time = null; save(); render(); });
    root.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { S.time = b.getAttribute('data-slot'); save(); render(); });

    root.querySelectorAll('[data-input]').forEach(el => {
      const k = el.getAttribute('data-input');
      el.oninput = el.onchange = () => {
        S.form[k] = el.type === 'checkbox' ? el.checked : el.value;
        save();
        if (k === 'service' || k === 'consent') {}
        // live-update summary total not needed
        const wrap = el.closest('[data-field]'); if (wrap) wrap.classList.remove('err');
      };
    });

    const back = root.querySelector('[data-back]'); if (back) back.onclick = () => { S.step = Math.max(1, S.step - 1); save(); render(); };
    const next = root.querySelector('[data-next]'); if (next) next.onclick = () => {
      if (S.step === 4) { if (!validForm(true)) return; }
      if (!canAdvance(S.step)) { pulse(); return; }
      S.step = Math.min(5, S.step + 1); save(); render();
      root.scrollIntoView ? null : null; window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    };
    const conf = root.querySelector('[data-confirm]'); if (conf) conf.onclick = () => {
      const fullName = [S.form.first, S.form.last].filter(Boolean).join(' ');
      if (EWS && S.form.email && S.service && S.dateISO) {
        EWS.addAppointment({
          email: S.form.email,
          name: fullName,
          city: S.location, service: S.service, duration: S.duration,
          price: price(S.service, S.duration), dateISO: S.dateISO, time: S.time
        });
      }
      fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          type: 'booking',
          name: fullName,
          email: S.form.email,
          clientEmail: S.form.email,
          phone: S.form.phone || '',
          notes: S.form.notes || '',
          service: S.service ? (svcName(S.service) + (S.option ? ' — ' + S.option : '')) : '',
          location: S.location ? locName(S.location) : '',
          date: S.dateISO || '',
          time: S.time || '',
          duration: S.duration || '',
          price: (S.service && S.duration) ? price(S.service, S.duration) : '',
          message: S.form.notes || '(pas de notes)'
        })
      }).catch(() => {});
      S.done = true; render(); save();
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    };
    const again = root.querySelector('[data-again]'); if (again) again.onclick = () => {
      S = { step: 1, service: null, option: null, duration: null, location: null, dateISO: null, time: null,
            form: { first: '', last: '', email: '', phone: '', notes: '', consent: false }, gift: S.gift, done: false };
      save(); render();
    };
    const ja = root.querySelector('[data-jump-alert]'); if (ja) ja.onclick = () => {
      alertRoot.scrollIntoView ? window.scrollTo({ top: alertRoot.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }) : null;
    };
  }

  function pulse() {
    const n = root.querySelector('[data-next]'); if (!n) return;
    n.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 280 });
  }

  /* ---------- ALERTS panel ---------- */
  const AKEY = 'ew_alerts';
  let A = { locs: [], email: '', freq: 'instant', done: false };
  try { const av = JSON.parse(localStorage.getItem(AKEY) || 'null'); if (av) A = Object.assign(A, av); } catch (e) {}
  A.done = false;
  function saveA() { try { localStorage.setItem(AKEY, JSON.stringify(A)); } catch (e) {} }

  function renderAlerts() {
    if (!alertRoot) return;
    const check = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const locs = locations().map(l => {
      const on = A.locs.includes(l.id) ? 'on' : '';
      return `<button type="button" class="aloc ${on}" data-aloc="${l.id}">
        <span class="cb">${check}</span>
        <span style="flex:1"><b>${locName(l.id)}</b><small>${locRegion(l.id)}</small></span></button>`;
    }).join('');
    const freqs = [['instant', 'rv.alert.freq.instant'], ['weekly', 'rv.alert.freq.weekly']].map(([v, k]) =>
      `<button type="button" class="afreq ${A.freq === v ? 'on' : ''}" data-afreq="${v}">${t(k)}</button>`).join('');

    alertRoot.innerHTML = `
      <div class="alerts">
        <div class="alerts__media"><img src="assets/thai-parc.png" alt=""></div>
        <div>
          <div class="alerts__form" data-alert-form>
            <span class="eyebrow" data-i18n="rv.alert.eyebrow">Alertes créneaux</span>
            <h2 style="font-family:var(--display);font-weight:400;font-size:clamp(1.7rem,3vw,2.4rem);line-height:1.1;margin:12px 0 10px">${t('rv.alert.title')}</h2>
            <p style="color:var(--ink-2)">${t('rv.alert.text')}</p>
            <div class="alerts__lab">${t('rv.alert.loc')}</div>
            <div class="alert-locs">${locs}</div>
            <div class="alerts__lab">${t('rv.alert.freq')}</div>
            <div class="alert-freq">${freqs}</div>
            <div class="alerts__lab">${t('rv.alert.email')}</div>
            <input type="email" id="alert-email" value="${(A.email || '').replace(/"/g, '&quot;')}" placeholder="${t('news.placeholder')}"
              style="font-family:var(--body);font-size:1rem;width:100%;background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:13px 15px">
            <div class="alert-msg" data-amsg></div>
            <button type="button" class="btn btn-primary" style="margin-top:18px" data-asubmit>${t('rv.alert.submit')}</button>
          </div>
          <div class="alerts__done" data-alert-done>
            <div class="done__seal" style="margin:0 0 18px"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h2 style="font-family:var(--display);font-weight:400;font-size:clamp(1.7rem,3vw,2.4rem);line-height:1.1">${t('rv.alert.done.title')}</h2>
            <p style="color:var(--ink-2);margin:12px 0 4px">${t('rv.alert.done.text')}</p>
            <p style="font-family:var(--display);font-style:italic;font-size:1.3rem" data-alocs></p>
            <button type="button" class="btn btn-ghost" style="margin-top:18px" data-aedit>${t('rv.alert.done.again')}</button>
          </div>
        </div>
      </div>`;

    alertRoot.querySelectorAll('[data-aloc]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-aloc');
      A.locs = A.locs.includes(id) ? A.locs.filter(x => x !== id) : A.locs.concat(id);
      saveA(); b.classList.toggle('on');
      const m = alertRoot.querySelector('[data-amsg]'); if (m) m.classList.remove('show');
    });
    alertRoot.querySelectorAll('[data-afreq]').forEach(b => b.onclick = () => {
      A.freq = b.getAttribute('data-afreq'); saveA();
      alertRoot.querySelectorAll('[data-afreq]').forEach(x => x.classList.toggle('on', x === b));
    });
    const em = alertRoot.querySelector('#alert-email'); if (em) em.oninput = () => { A.email = em.value; saveA(); };
    const sub = alertRoot.querySelector('[data-asubmit]'); if (sub) sub.onclick = () => {
      const msg = alertRoot.querySelector('[data-amsg]');
      if (!A.locs.length) { msg.textContent = t('rv.alert.pickloc'); msg.classList.add('show'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(A.email || '')) { msg.textContent = t('rv.req.email'); msg.classList.add('show'); return; }
      A.done = true;
      alertRoot.querySelector('[data-alert-form]').style.display = 'none';
      const done = alertRoot.querySelector('[data-alert-done]'); done.classList.add('show');
      alertRoot.querySelector('[data-alocs]').textContent = A.locs.map(locName).join(' · ');
    };
    const edit = alertRoot.querySelector('[data-aedit]'); if (edit) edit.onclick = () => { A.done = false; renderAlerts(); };
  }

  /* ---------- re-render on language change ---------- */
  window.addEventListener('ew:langchange', () => { render(); });

  render();
})();
