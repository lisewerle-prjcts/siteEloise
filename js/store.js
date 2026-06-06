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
    { id: 'thai', builtin: true, published: true, durations: DEFAULT_DURATIONS['thai'], img: 'assets/thai-etirement.png',
      name: 'Thaï Yoga Massage', tag: 'Étirements & énergie',
      description: 'Aussi appelé massage thaï traditionnel. Il se pratique habillé, dans des vêtements amples et confortables, sur futon au sol, avec de nombreux étirements passifs pour le receveur.',
      benefitsPhysical: ['Augmente la souplesse.', 'Améliore la mobilité articulaire.', 'Débloque certaines tensions musculaires.', 'Stimule la circulation sanguine et énergétique.'],
      benefitsEmotional: ['Travaille sur les lignes énergétiques (Sen).', 'Donne souvent une sensation de vitalité et d\'ouverture du corps.', 'Peut améliorer la respiration.', 'Favorise l\'alignement corporel.', 'Libère les tensions liées aux mauvaises postures.'],
      idealFor: ['Personnes qui aiment le mouvement.', 'Pratiquants de yoga ou d\'activités corporelles.', 'Ceux qui ressentent un manque de mobilité ou de fluidité dans le corps.'],
      note: '', benefits: [], options: [] },
    { id: 'balinais', builtin: true, published: true, durations: DEFAULT_DURATIONS['balinais'], img: 'assets/soin-mains.png',
      name: 'Massage Balinais', tag: 'Enveloppant & circulatoire',
      description: 'Le massage balinais est un merveilleux mélange d\'influences indonésiennes, indiennes et chinoises. (Mélange d\'huile d\'amande douce et de coco fractionné)',
      benefitsPhysical: ['Détend les muscles tout en stimulant la circulation.', 'Améliore la souplesse.', 'Réduit les tensions corporelles.', 'Apporte une sensation de légèreté.'],
      benefitsEmotional: ['Favorise la détente mentale.', 'Procure une sensation de détente et d\'évasion.', 'Aide au relâchement émotionnel.'],
      idealFor: ['Personnes recherchant un équilibre entre détente et tonicité.', 'Ceux qui trouvent l\'Abhyanga trop doux et le Deep Tissue trop intense.'],
      note: 'Il alterne mouvements enveloppants, pétrissages, étirements doux et pressions énergétiques.', benefits: [], options: [] },
    { id: 'deep', builtin: true, published: true, durations: DEFAULT_DURATIONS['deep'], img: 'assets/relaxation.png',
      name: 'Deep Tissue', tag: 'Tensions profondes',
      description: 'Le Deep Tissue est un massage occidental ciblant les couches musculaires profondes et les fascias. (Mélange d\'huile d\'amande douce et de coco fractionné)',
      benefitsPhysical: ['Relâche les tensions musculaires chroniques.', 'Améliore la mobilité.', 'Diminue les douleurs liées aux contractures.', 'Travaille les adhérences fasciales.', 'Favorise une meilleure posture.'],
      benefitsEmotional: ['Très apprécié des sportifs.', 'Aide à récupérer après des efforts importants.', 'Peut améliorer certaines douleurs cervicales, lombaires ou dorsales liées aux tensions musculaires.'],
      idealFor: ['Sportifs.', 'Personnes souffrant de tensions musculaires persistantes.', 'Travail de bureau avec douleurs du dos, nuque et épaules.'],
      note: 'Le massage peut être intense et parfois légèrement inconfortable par moments, mais il ne devrait jamais être insupportable.', benefits: [], options: [] },
    { id: 'drainage', builtin: true, published: true, durations: DEFAULT_DURATIONS['drainage'], img: 'assets/drainage-visage.png',
      name: 'Drainage lymphatique', tag: 'Détox & légèreté',
      description: 'Le drainage lymphatique est une technique très douce visant à stimuler la circulation de la lymphe.',
      benefitsPhysical: ['Réduit la rétention d\'eau.', 'Diminue les sensations de jambes lourdes.', 'Favorise l\'élimination des déchets métaboliques.'],
      benefitsEmotional: ['Aide à diminuer certains gonflements.', 'Peut affiner temporairement la silhouette lorsque celle-ci est liée à la rétention hydrique.', 'Améliore l\'aspect de certaines zones congestionnées.', 'Sensation de légèreté.', 'Effet relaxant sur le système nerveux.'],
      idealFor: ['Jambes lourdes.', 'Rétention d\'eau.', 'Sensation de gonflement.', 'Personnes restant longtemps debout ou assises.'],
      note: '', benefits: [], options: [] },
    { id: 'ayurvedique', builtin: true, published: true, durations: DEFAULT_DURATIONS['ayurvedique'], img: 'assets/thai-dos.png',
      name: 'Ayurvédique & Abhyanga', tag: 'Chaleureux & nourrissant',
      description: 'L\'Abhyanga est un massage traditionnel issu de l\'Inde et de l\'Ayurvéda. Il est généralement réalisé avec une grande quantité d\'huile (de sésame chaude de préférence).',
      benefitsPhysical: ['Détend profondément les muscles et les articulations.', 'Améliore la circulation sanguine.', 'Nourrit et assouplit la peau.', 'Favorise un meilleur sommeil.', 'Soutient la récupération en cas de fatigue physique.'],
      benefitsEmotional: ['Apaise le système nerveux.', 'Réduit le stress et l\'anxiété.', 'Procure une sensation de sécurité et d\'ancrage.', 'Favorise l\'équilibre émotionnel.', 'Selon l\'Ayurvéda, aide à harmoniser les doshas (Vata, Pitta, Kapha).'],
      idealFor: ['Personnes stressées, anxieuses ou en surcharge mentale.', 'Accompagnement du burn-out ou de la fatigue chronique.', 'Recherche de détente profonde et de reconnexion à soi.'],
      note: '', benefits: [], options: [] },
    { id: 'yoga', builtin: true, published: true, durations: DEFAULT_DURATIONS['yoga'], img: 'assets/yoga-equilibre.png',
      name: 'Yoga personnalisé', tag: 'Mobilité & souffle',
      description: 'Séance de yoga adaptée à vos besoins, votre niveau et vos objectifs du moment.',
      benefitsPhysical: ['Améliore la souplesse et la mobilité.', 'Renforce les muscles profonds.', 'Améliore la posture et l\'alignement corporel.', 'Favorise une meilleure respiration.'],
      benefitsEmotional: ['Réduit le stress et l\'anxiété.', 'Favorise la pleine conscience.', 'Procure un sentiment de calme et de centrage.', 'Aide à mieux se connaître et se reconnecter à soi.'],
      idealFor: ['Débutants souhaitant découvrir le yoga.', 'Personnes cherchant à compléter leur pratique sportive.', 'Ceux qui souhaitent un accompagnement personnalisé.'],
      note: '', benefits: [], options: [] }
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
  function migrateServicesV2() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEYS.services)); } catch(e) {}
    if (!stored || !Array.isArray(stored)) return;
    var changed = false;
    stored.forEach(function(s) {
      var def = null;
      for (var i = 0; i < BUILTIN_SERVICES.length; i++) { if (BUILTIN_SERVICES[i].id === s.id) { def = BUILTIN_SERVICES[i]; break; } }
      if (!def) return;
      if (!s.benefitsPhysical) { s.benefitsPhysical = def.benefitsPhysical.slice(); changed = true; }
      if (!s.benefitsEmotional) { s.benefitsEmotional = def.benefitsEmotional.slice(); changed = true; }
      if (!s.idealFor) { s.idealFor = def.idealFor.slice(); changed = true; }
      if (s.note === undefined) { s.note = def.note || ''; changed = true; }
      if (!s.description && def.description) { s.description = def.description; changed = true; }
    });
    if (changed) try { localStorage.setItem(KEYS.services, JSON.stringify(stored)); } catch(e) {}
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
    migrateServicesV2();
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
    removeSubscriberCity: function (id, city) {
      var list = read(KEYS.subs, []);
      var sub = list.find(function (s) { return s.id === id; });
      if (!sub) return;
      sub.cities = (sub.cities || []).filter(function (c) { return c !== city; });
      if (sub.cities.length === 0) {
        write(KEYS.subs, list.filter(function (s) { return s.id !== id; }));
      } else {
        write(KEYS.subs, list);
      }
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
        dateISO: a.dateISO || '', time: a.time || '', confirmed: false, createdAt: Date.now() };
      list.push(rec); write(KEYS.appts, list); return rec;
    },
    removeAppointment: function (id) {
      write(KEYS.appts, read(KEYS.appts, []).filter(function (a) { return a.id !== id; }));
    },
    confirmAppointment: function(id) {
      var list = read(KEYS.appts, []);
      list.forEach(function(a) { if (a.id === id) a.confirmed = true; });
      write(KEYS.appts, list);
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
    serviceOptions: function (id) { var s = API.service(id); return (s && Array.isArray(s.options)) ? s.options.slice() : []; },
    serviceBenefitsPhysical: function(id) { var s = API.service(id); return (s && s.benefitsPhysical) ? s.benefitsPhysical.slice() : []; },
    serviceBenefitsEmotional: function(id) { var s = API.service(id); return (s && s.benefitsEmotional) ? s.benefitsEmotional.slice() : []; },
    serviceIdealFor: function(id) { var s = API.service(id); return (s && s.idealFor) ? s.idealFor.slice() : []; },
    serviceNote: function(id) { var s = API.service(id); return (s && s.note) || ''; },
    reorderService: function (id, delta) {
      var list = read(KEYS.services, BUILTIN_SERVICES);
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) { idx = i; break; }
      if (idx < 0) return;
      var newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= list.length) return;
      var tmp = list[idx]; list[idx] = list[newIdx]; list[newIdx] = tmp;
      write(KEYS.services, list);
    },
    getAdminCode: function () { return localStorage.getItem('ew_admin_pw') || 'aum'; },
    setAdminCode: function (pw) { if (pw) localStorage.setItem('ew_admin_pw', pw); else localStorage.removeItem('ew_admin_pw'); },
    getAdminSessions: function () { try { return JSON.parse(localStorage.getItem('ew_sessions') || '[]'); } catch (e) { return []; } },
    logAdminSession: function () {
      var list = API.getAdminSessions();
      list.unshift({ at: Date.now(), ua: navigator.userAgent });
      if (list.length > 20) list.length = 20;
      try { localStorage.setItem('ew_sessions', JSON.stringify(list)); } catch (e) {}
    },
    clearAdminSessions: function () { localStorage.removeItem('ew_sessions'); },
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
        options: s.options || [],
        benefitsPhysical: s.benefitsPhysical || [], benefitsEmotional: s.benefitsEmotional || [], idealFor: s.idealFor || [], note: (s.note || '').trim(),
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

  /* =========================================================
     Supabase sync — requires db.js loaded before store.js
     Strategy: localStorage = cache (sync, instant UI)
               Supabase     = source of truth (async, persists across devices)
     On init  : fetch DB → overwrite localStorage → fire ew:datachange
     On write : update localStorage immediately, then push to DB async
     ========================================================= */
  (function () {
    var DB = window.EWDB;
    if (!DB) return;

    var SYNC = [
      { key: KEYS.subs,   table: 'subscribers'  },
      { key: KEYS.appts,  table: 'appointments' },
      { key: KEYS.dates,  table: 'dates'        },
      { key: KEYS.testi,  table: 'testimonials' }
    ];

    /* ---- wrap write methods ---- */

    var _addSub = API.addSubscriber;
    API.addSubscriber = function (sub) {
      var r = _addSub.call(API, sub); if (r) DB.save('subscribers', r); return r;
    };
    var _remSub = API.removeSubscriber;
    API.removeSubscriber = function (id) {
      _remSub.call(API, id); DB.del('subscribers', id);
    };
    var _remSubCity = API.removeSubscriberCity;
    API.removeSubscriberCity = function (id, city) {
      _remSubCity.call(API, id, city);
      var s = API.subscriber(id);
      if (s) DB.save('subscribers', s); else DB.del('subscribers', id);
    };

    var _addAppt = API.addAppointment;
    API.addAppointment = function (a) {
      var r = _addAppt.call(API, a); if (r) DB.save('appointments', r); return r;
    };
    var _remAppt = API.removeAppointment;
    API.removeAppointment = function (id) {
      _remAppt.call(API, id); DB.del('appointments', id);
    };
    var _confAppt = API.confirmAppointment;
    API.confirmAppointment = function (id) {
      _confAppt.call(API, id);
      var a = read(KEYS.appts, []).filter(function (x) { return x.id === id; })[0];
      if (a) DB.save('appointments', a);
    };

    var _addDate = API.addDate;
    API.addDate = function (d) {
      var r = _addDate.call(API, d); if (r) DB.save('dates', r); return r;
    };
    var _updDate = API.updateDate;
    API.updateDate = function (id, patch) {
      _updDate.call(API, id, patch);
      var d = read(KEYS.dates, []).filter(function (x) { return x.id === id; })[0];
      if (d) DB.save('dates', d);
    };
    var _remDate = API.removeDate;
    API.removeDate = function (id) {
      _remDate.call(API, id); DB.del('dates', id);
    };

    var _addTesti = API.addTestimonial;
    API.addTestimonial = function (t) {
      var r = _addTesti.call(API, t); if (r) DB.save('testimonials', r); return r;
    };
    var _setTesti = API.setTestimonialStatus;
    API.setTestimonialStatus = function (id, status) {
      _setTesti.call(API, id, status);
      var t = read(KEYS.testi, []).filter(function (x) { return x.id === id; })[0];
      if (t) DB.save('testimonials', t);
    };
    var _remTesti = API.removeTestimonial;
    API.removeTestimonial = function (id) {
      _remTesti.call(API, id); DB.del('testimonials', id);
    };

    var _addSvc = API.addService;
    API.addService = function (s) {
      var r = _addSvc.call(API, s); if (r) DB.save('services', r); return r;
    };
    var _updSvc = API.updateService;
    API.updateService = function (id, patch) {
      _updSvc.call(API, id, patch);
      var s = API.service(id); if (s) DB.save('services', s);
    };
    var _setPub = API.setServicePublished;
    API.setServicePublished = function (id, on) {
      _setPub.call(API, id, on);
      var s = API.service(id); if (s) DB.save('services', s);
    };
    var _remSvc = API.removeService;
    API.removeService = function (id) {
      var ok = _remSvc.call(API, id); if (ok) DB.del('services', id); return ok;
    };

    /* ---- initial load from DB ---- */
    Promise.all(SYNC.map(function (t) {
      return DB.load(t.table).then(function (rows) {
        if (rows && rows.length) write(t.key, rows);
      }).catch(function () {});
    })).then(function () {
      window.dispatchEvent(new Event('ew:datachange'));
    });
  })();

  window.EWStore = API;
})();
