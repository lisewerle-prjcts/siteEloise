/* ===========================================================================
   store.js — shared local data layer (prototype, no backend)
   Persists in localStorage. Loaded BEFORE i18n / site / modules / admin.
   Exposes window.EWStore.
   =========================================================================== */
(function () {
  'use strict';

  var KEYS = {
    subs:      'ew_subscribers_v1',
    dates:     'ew_dates_v1',
    testi:     'ew_testimonials_v1',
    insta:     'ew_insta_v1',
    campaigns: 'ew_campaigns_v1',
    cities:    'ew_cities_v1',
    appts:     'ew_appointments_v1',
    services:  'ew_services_v2',   // v2: durations array replaces price+unit
    seeded:    'ew_seeded_v1'
  };

  var BUILTIN_CITIES = [
    { id: 'sucy',     builtin: true, active: true, days: [1, 2, 3], mapLabel: 'Sucy-en-Brie · 94', name: 'Sucy-en-Brie', region: 'Val-de-Marne, France' },
    { id: 'chesnay',  builtin: true, active: true, days: [3, 4, 5], mapLabel: 'Le Chesnay · 78',   name: 'Le Chesnay',   region: 'Yvelines, France' },
    { id: 'wehingen', builtin: true, active: true, days: [5, 6, 0], mapLabel: 'Wehingen · DE',     name: 'Wehingen',     region: 'Bade-Wurtemberg, Allemagne' }
  ];

  /* Duration+price combos per service (Eloïse can override from admin) */
  var DEFAULT_DURATIONS = {
    'thai':        [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    'balinais':    [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    'deep':        [{min:60,price:70},{min:75,price:85},{min:90,price:100}],
    'drainage':    [{min:60,price:80},{min:120,price:150}],
    'ayurvedique': [{min:60,price:70},{min:90,price:100}],
    'yoga':        [{min:60,price:65},{min:90,price:90}]
  };

  var BUILTIN_SERVICES = [
    { id: 'thai',        builtin: true, published: true, durations: DEFAULT_DURATIONS['thai'],        img: 'assets/thai-etirement.png',  name: 'Thaï Yoga Massage',    tag: 'Étirements & énergie',      description: '', benefits: [] },
    { id: 'balinais',    builtin: true, published: true, durations: DEFAULT_DURATIONS['balinais'],    img: 'assets/soin-mains.png',       name: 'Massage Balinais',       tag: 'Enveloppant & circulatoire', description: '', benefits: [] },
    { id: 'deep',        builtin: true, published: true, durations: DEFAULT_DURATIONS['deep'],        img: 'assets/relaxation.png',       name: 'Deep Tissue',            tag: 'Tensions profondes',         description: '', benefits: [] },
    { id: 'drainage',    builtin: true, published: true, durations: DEFAULT_DURATIONS['drainage'],    img: 'assets/drainage-visage.png',  name: 'Drainage lymphatique',   tag: 'Détox & légèreté',           description: '', benefits: [] },
    { id: 'ayurvedique', builtin: true, published: true, durations: DEFAULT_DURATIONS['ayurvedique'], img: 'assets/thai-dos.png',         name: 'Ayurvédique & Abhyanga', tag: 'Chaleureux & nourrissant',   description: '', benefits: [] },
    { id: 'yoga',        builtin: true, published: true, durations: DEFAULT_DURATIONS['yoga'],        img: 'assets/yoga-equilibre.png',   name: 'Yoga personnalisé',      tag: 'Mobilité & souffle',         description: '', benefits: [] }
  ];

  /* ---------- low-level ---------- */
  function read(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeRaw(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function write(key, val) { writeRaw(key, val); emit(); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function slug(s) {
    return (s || '').toString().toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28) || ('v' + uid());
  }
  var listeners = [];
  function emit() {
    listeners.forEach(function (fn) { try { fn(); } catch (e) {} });
    try { window.dispatchEvent(new CustomEvent('ew:datachange')); } catch (e) {}
  }
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('ew_') === 0) emit(); });

  function daysFromNow(n, h, m) {
    var d = new Date(); d.setDate(d.getDate() + n); d.setHours(h || 10, m || 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  /* ---------- migrations ---------- */
  function ensureCities() {
    if (!localStorage.getItem(KEYS.cities)) writeRaw(KEYS.cities, BUILTIN_CITIES.slice());
  }
  function ensureServices() {
    if (!localStorage.getItem(KEYS.services)) writeRaw(KEYS.services, BUILTIN_SERVICES.slice());
  }
  function ensureAppointments() {
    if (localStorage.getItem(KEYS.appts)) return;
    writeRaw(KEYS.appts, [
      { id: uid(), email: 'camille.r@example.com', name: 'Camille Roux',  city: 'sucy',     service: 'thai',        duration: 75,  price: 85,  dateISO: daysFromNow(-58), time: '10:30' },
      { id: uid(), email: 'camille.r@example.com', name: 'Camille Roux',  city: 'sucy',     service: 'thai',        duration: 90,  price: 100, dateISO: daysFromNow(-21), time: '14:00' },
      { id: uid(), email: 'camille.r@example.com', name: 'Camille Roux',  city: 'sucy',     service: 'deep',        duration: 60,  price: 70,  dateISO: daysFromNow(6),   time: '09:00' },
      { id: uid(), email: 'sarah.m@example.com',   name: 'Sarah Meyer',   city: 'chesnay',  service: 'drainage',    duration: 60,  price: 80,  dateISO: daysFromNow(-40), time: '12:00' },
      { id: uid(), email: 'sarah.m@example.com',   name: 'Sarah Meyer',   city: 'chesnay',  service: 'drainage',    duration: 60,  price: 80,  dateISO: daysFromNow(-12), time: '15:30' },
      { id: uid(), email: 'lea.b@example.com',     name: 'Léa Bonnet',    city: 'chesnay',  service: 'yoga',        duration: 60,  price: 65,  dateISO: daysFromNow(-30), time: '17:00' },
      { id: uid(), email: 'anna.s@example.de',     name: 'Anna Schmidt',  city: 'wehingen', service: 'balinais',    duration: 90,  price: 100, dateISO: daysFromNow(-18), time: '10:30' },
      { id: uid(), email: 'emma.l@example.com',    name: 'Emma Laurent',  city: 'sucy',     service: 'ayurvedique', duration: 90,  price: 100, dateISO: daysFromNow(9),   time: '11:00' }
    ]);
  }

  function seed() {
    ensureCities();
    ensureServices();
    ensureAppointments();
    if (localStorage.getItem(KEYS.seeded)) { emit(); return; }

    writeRaw(KEYS.subs, [
      { id: uid(), name: 'Camille Roux',  email: 'camille.r@example.com', cities: ['sucy'],             lang: 'fr', date: daysFromNow(-40) },
      { id: uid(), name: 'Sarah Meyer',   email: 'sarah.m@example.com',   cities: ['sucy', 'chesnay'],  lang: 'fr', date: daysFromNow(-32) },
      { id: uid(), name: 'Léa Bonnet',    email: 'lea.b@example.com',     cities: ['chesnay'],          lang: 'fr', date: daysFromNow(-25) },
      { id: uid(), name: 'Anna Schmidt',  email: 'anna.s@example.de',     cities: ['wehingen'],         lang: 'de', date: daysFromNow(-20) },
      { id: uid(), name: 'Julia Wagner',  email: 'julia.w@example.de',    cities: ['wehingen'],         lang: 'de', date: daysFromNow(-15) },
      { id: uid(), name: 'Emma Laurent',  email: 'emma.l@example.com',    cities: ['sucy', 'wehingen'], lang: 'fr', date: daysFromNow(-9)  },
      { id: uid(), name: 'Sophie Klein',  email: 'sophie.k@example.de',   cities: ['chesnay', 'wehingen'], lang: 'de', date: daysFromNow(-4) }
    ]);
    writeRaw(KEYS.dates, [
      { id: uid(), city: 'sucy',     date: daysFromNow(6),  start: '09:00', end: '18:00', service: 'thai',     note: '', createdAt: Date.now(), notified: true },
      { id: uid(), city: 'chesnay',  date: daysFromNow(9),  start: '10:00', end: '17:00', service: '',         note: '', createdAt: Date.now(), notified: true },
      { id: uid(), city: 'wehingen', date: daysFromNow(13), start: '09:30', end: '16:00', service: 'balinais', note: '', createdAt: Date.now(), notified: true }
    ]);
    writeRaw(KEYS.testi, [
      { id: uid(), key: 'testi.1', name: 'Camille R.', city: 'sucy',    service: '', rating: 5, text: '', lang: '', status: 'approved', createdAt: Date.now() - 9e8 },
      { id: uid(), key: 'testi.2', name: 'Sarah M.',   city: 'chesnay', service: '', rating: 5, text: '', lang: '', status: 'approved', createdAt: Date.now() - 7e8 },
      { id: uid(), key: 'testi.3', name: 'Léa B.',     city: 'chesnay', service: '', rating: 5, text: '', lang: '', status: 'approved', createdAt: Date.now() - 5e8 }
    ]);
    writeRaw(KEYS.insta, [
      { id: uid(), img: 'assets/thai-parc.png',         caption: 'Thaï Yoga Massage au grand air 🌿' },
      { id: uid(), img: 'assets/eloise-meditation.png', caption: 'Respirer, revenir à soi.' },
      { id: uid(), img: 'assets/drainage-visage.png',   caption: 'Drainage du visage, éclat naturel ✨' },
      { id: uid(), img: 'assets/yoga-equilibre.png',    caption: 'Trouver son équilibre, un souffle à la fois.' },
      { id: uid(), img: 'assets/relaxation.png',        caption: 'Le relâchement, jusqu’au bout des doigts.' },
      { id: uid(), img: 'assets/thai-backbend.png',     caption: 'Ouvrir le corps, libérer le mental.' }
    ]);
    writeRaw(KEYS.campaigns, []);
    localStorage.setItem(KEYS.seeded, '1');
    emit();
  }

  function cityById(id) {
    var list = read(KEYS.cities, BUILTIN_CITIES);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function i18nName(id) {
    if (window.t) { var k = 'loc.' + id + '.city'; var v = window.t(k); if (v && v !== k) return v; }
    return null;
  }
  function i18nRegion(id) {
    if (window.t) { var k = 'loc.' + id + '.region'; var v = window.t(k); if (v && v !== k) return v; }
    return null;
  }

  /* ---------- public API ---------- */
  var API = {
    onChange: function (fn) { listeners.push(fn); return function () {
      listeners = listeners.filter(function (f) { return f !== fn; }); }; },

    /* cities */
    cities: function () { return read(KEYS.cities, BUILTIN_CITIES).slice(); },
    cityIds: function () { return API.cities().map(function (c) { return c.id; }); },
    city: function (id) { return cityById(id); },
    cityName: function (id) { var c = cityById(id);
      if (c && c.builtin && !c.edited) return i18nName(id) || c.name || id;
      return (c && c.name) || i18nName(id) || id; },
    cityRegion: function (id) { var c = cityById(id);
      if (c && c.builtin && !c.edited) return i18nRegion(id) || c.region || '';
      return (c && c.region) || i18nRegion(id) || ''; },
    cityMapLabel: function (id) { var c = cityById(id); return (c && c.mapLabel) || API.cityName(id); },
    cityDays: function (id) { var c = cityById(id); return (c && c.days && c.days.length) ? c.days : [2, 3, 4]; },
    activeCityIds: function () { return API.cities().filter(function (c) { return c.active !== false; }).map(function (c) { return c.id; }); },
    setCityActive: function (id, on) {
      var list = read(KEYS.cities, BUILTIN_CITIES);
      list.forEach(function (c) { if (c.id === id) c.active = !!on; });
      write(KEYS.cities, list);
    },
    addCity: function (c) {
      var list = read(KEYS.cities, BUILTIN_CITIES);
      var id = slug(c.id || c.name);
      var n = id, i = 2;
      while (list.some(function (x) { return x.id === n; })) { n = id + '-' + (i++); }
      var rec = { id: n, builtin: false, name: (c.name || '').trim(),
        region: (c.region || '').trim(), mapLabel: (c.mapLabel || '').trim() || (c.name || '').trim(),
        days: (c.days && c.days.length) ? c.days : [2, 3, 4], createdAt: Date.now() };
      list.push(rec); write(KEYS.cities, list); return rec;
    },
    updateCity: function (id, patch) {
      var list = read(KEYS.cities, BUILTIN_CITIES);
      list.forEach(function (c) { if (c.id === id) { Object.assign(c, patch); if (c.builtin) c.edited = true; } });
      write(KEYS.cities, list);
    },
    removeCity: function (id) {
      var c = cityById(id); if (!c || c.builtin) return false;
      write(KEYS.cities, read(KEYS.cities, BUILTIN_CITIES).filter(function (x) { return x.id !== id; }));
      return true;
    },

    /* subscribers */
    subscribers: function () { return read(KEYS.subs, []); },
    subscriber: function (id) { return read(KEYS.subs, []).filter(function (s) { return s.id === id; })[0] || null; },
    addSubscriber: function (sub) {
      var list = read(KEYS.subs, []);
      var email = (sub.email || '').trim().toLowerCase();
      if (!email) return null;
      var existing = list.filter(function (s) { return s.email.toLowerCase() === email; })[0];
      if (existing) {
        (sub.cities || []).forEach(function (c) { if (existing.cities.indexOf(c) === -1) existing.cities.push(c); });
        if (sub.name) existing.name = sub.name;
        if (sub.lang) existing.lang = sub.lang;
        write(KEYS.subs, list); return existing;
      }
      var rec = { id: uid(), name: (sub.name || '').trim(), email: email,
        cities: sub.cities || [], lang: sub.lang || 'fr', date: new Date().toISOString().slice(0, 10) };
      list.push(rec); write(KEYS.subs, list); return rec;
    },
    removeSubscriber: function (id) {
      write(KEYS.subs, read(KEYS.subs, []).filter(function (s) { return s.id !== id; }));
    },
    subscribersForCity: function (city) {
      return read(KEYS.subs, []).filter(function (s) { return s.cities.indexOf(city) !== -1; });
    },

    /* appointments */
    appointments: function () { return read(KEYS.appts, []); },
    appointmentsForEmail: function (email) {
      email = (email || '').toLowerCase();
      return read(KEYS.appts, []).filter(function (a) { return (a.email || '').toLowerCase() === email; })
        .sort(function (a, b) { return a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0; });
    },
    appointmentsForDate: function (city, dateISO) {
      return read(KEYS.appts, []).filter(function (a) { return a.city === city && a.dateISO === dateISO; });
    },
    addAppointment: function (a) {
      var list = read(KEYS.appts, []);
      var rec = { id: uid(), email: (a.email || '').toLowerCase(), name: a.name || '', city: a.city || '',
        service: a.service || '', duration: a.duration || 0, price: a.price || 0,
        dateISO: a.dateISO || '', time: a.time || '', createdAt: Date.now() };
      list.push(rec); write(KEYS.appts, list); return rec;
    },
    removeAppointment: function (id) {
      write(KEYS.appts, read(KEYS.appts, []).filter(function (a) { return a.id !== id; }));
    },

    /* services */
    services: function () { return read(KEYS.services, BUILTIN_SERVICES).slice(); },
    publishedServices: function () { return API.services().filter(function (s) { return s.published !== false; }); },
    service: function (id) { var l = read(KEYS.services, BUILTIN_SERVICES); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; },
    serviceName: function (id) { var s = API.service(id);
      if (s && s.builtin && !s.edited) { var k = 'svc.' + id + '.name'; var v = window.t ? window.t(k) : k; return (v && v !== k) ? v : (s.name || id); }
      return (s && s.name) || id; },
    serviceTag: function (id) { var s = API.service(id);
      if (s && s.builtin && !s.edited) { var k = 'svc.' + id + '.tag'; var v = window.t ? window.t(k) : k; return (v && v !== k) ? v : (s.tag || ''); }
      return (s && s.tag) || ''; },
    serviceDescription: function (id) { var s = API.service(id); return (s && s.description) || ''; },
    serviceBenefits: function (id) { var s = API.service(id); return (s && s.benefits && s.benefits.length) ? s.benefits.slice() : []; },
    serviceDurations: function (id) {
      var s = API.service(id);
      if (s && s.durations && s.durations.length) return s.durations;
      return DEFAULT_DURATIONS[id] || [{min:60, price:70}];
    },
    servicePrice: function (id) {
      var opts = API.serviceDurations(id);
      return opts.length ? opts[0].price : 0;
    },
    serviceImg: function (id) { var s = API.service(id); return s ? s.img : ''; },
    addService: function (s) {
      var list = read(KEYS.services, BUILTIN_SERVICES);
      var id = slug(s.id || s.name);
      var n = id, i = 2;
      while (list.some(function (x) { return x.id === n; })) { n = id + '-' + (i++); }
      var rec = { id: n, builtin: false, published: s.published !== false,
        name: (s.name || '').trim(), tag: (s.tag || '').trim(),
        durations: s.durations || [{min:60, price:70}],
        description: (s.description || '').trim(), benefits: s.benefits || [],
        img: s.img || 'assets/relaxation.png', createdAt: Date.now() };
      list.push(rec); write(KEYS.services, list); return rec;
    },
    updateService: function (id, patch) {
      var list = read(KEYS.services, BUILTIN_SERVICES);
      list.forEach(function (s) { if (s.id === id) { Object.assign(s, patch); if (s.builtin) s.edited = true; } });
      write(KEYS.services, list);
    },
    setServicePublished: function (id, on) {
      var list = read(KEYS.services, BUILTIN_SERVICES);
      list.forEach(function (s) { if (s.id === id) s.published = !!on; });
      write(KEYS.services, list);
    },
    removeService: function (id) {
      var s = API.service(id); if (!s || s.builtin) return false;
      write(KEYS.services, read(KEYS.services, BUILTIN_SERVICES).filter(function (x) { return x.id !== id; }));
      return true;
    },

    /* dates */
    dates: function () {
      return read(KEYS.dates, []).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    },
    upcomingDates: function () {
      var today = new Date().toISOString().slice(0, 10);
      return API.dates().filter(function (d) { return d.date >= today; });
    },
    addDate: function (d) {
      var list = read(KEYS.dates, []);
      var rec = { id: uid(), city: d.city, date: d.date, start: d.start || '', end: d.end || '',
        service: d.service || '', note: d.note || '', createdAt: Date.now(), notified: false };
      list.push(rec); write(KEYS.dates, list); return rec;
    },
    updateDate: function (id, patch) {
      var list = read(KEYS.dates, []);
      list.forEach(function (d) { if (d.id === id) Object.assign(d, patch); });
      write(KEYS.dates, list);
    },
    removeDate: function (id) {
      write(KEYS.dates, read(KEYS.dates, []).filter(function (d) { return d.id !== id; }));
    },

    /* testimonials */
    testimonials: function () { return read(KEYS.testi, []); },
    approvedTestimonials: function () {
      return read(KEYS.testi, []).filter(function (t) { return t.status === 'approved'; })
        .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    },
    addTestimonial: function (t) {
      var list = read(KEYS.testi, []);
      var rec = { id: uid(), name: (t.name || '').trim(), city: t.city || '', service: t.service || '',
        rating: t.rating || 5, text: (t.text || '').trim(), lang: t.lang || (window.ewLang ? window.ewLang() : 'fr'),
        status: t.status || 'pending', createdAt: Date.now() };
      list.push(rec); write(KEYS.testi, list); return rec;
    },
    setTestimonialStatus: function (id, status) {
      var list = read(KEYS.testi, []);
      list.forEach(function (t) { if (t.id === id) t.status = status; });
      write(KEYS.testi, list);
    },
    removeTestimonial: function (id) {
      write(KEYS.testi, read(KEYS.testi, []).filter(function (t) { return t.id !== id; }));
    },

    /* instagram */
    insta: function () { return read(KEYS.insta, []); },
    addInsta: function (p) {
      var list = read(KEYS.insta, []);
      list.unshift({ id: uid(), img: p.img, caption: p.caption || '' });
      write(KEYS.insta, list);
    },
    removeInsta: function (id) {
      write(KEYS.insta, read(KEYS.insta, []).filter(function (p) { return p.id !== id; }));
    },

    /* campaigns */
    campaigns: function () {
      return read(KEYS.campaigns, []).slice().sort(function (a, b) { return b.sentAt - a.sentAt; });
    },
    logCampaign: function (c) {
      var list = read(KEYS.campaigns, []);
      list.push({ id: uid(), city: c.city, dateId: c.dateId || '', subject: c.subject || '',
        recipients: c.recipients || [], count: (c.recipients || []).length, sentAt: Date.now() });
      write(KEYS.campaigns, list);
      if (c.dateId) API.updateDate(c.dateId, { notified: true });
    },

    resetAll: function () {
      Object.keys(KEYS).forEach(function (k) { localStorage.removeItem(KEYS[k]); });
      seed();
    }
  };

  Object.defineProperty(API, 'CITIES', { get: function () { return API.cityIds(); } });

  seed();
  window.EWStore = API;
})();
