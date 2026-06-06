/* ===========================================================================
   site.js — shared chrome (header + footer), nav behaviour, reveal, newsletter
   Loaded at end of <body>, AFTER strings + i18n.js.
   =========================================================================== */
(function () {
  const page = document.body.getAttribute('data-page') || 'home';
  const P = { home: 'index.html', services: 'services.html', about: 'a-propos.html',
              booking: 'reservation.html', contact: 'contact.html' };

  const mark = '<img src="assets/logo.png" alt="" width="46" height="36" loading="eager" decoding="async">';

  /* ---------- HEADER ---------- */
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="wrap nav">
      <a class="brand" href="${P.home}" aria-label="Eloïse Werle">
        <span class="mark">${mark}</span>
        <span>
          <span class="name" data-i18n="brand.name">Eloïse Werle</span>
          <span class="sub" data-i18n="brand.sub">Massage &amp; Yoga</span>
        </span>
      </a>
      <nav class="nav-links" aria-label="Principal">
        <a href="${P.home}"     data-nav="home"     data-i18n="nav.home">Accueil</a>
        <a href="${P.services}" data-nav="services" data-i18n="nav.services">Les soins</a>
        <a href="${P.about}"    data-nav="about"    data-i18n="nav.about">À propos</a>
        <a href="${P.contact}"  data-nav="contact"  data-i18n="nav.contact">Contact</a>
      </nav>
      <div class="nav-right">
        <div class="lang" role="group" aria-label="Langue">
          <button data-lang="fr">FR</button>
          <button data-lang="de">DE</button>
          <button data-lang="en">EN</button>
        </div>
        <a class="btn btn-primary btn-sm" href="${P.booking}" data-i18n="cta.book.short">Réserver</a>
        <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>
    <div class="drawer">
      <a href="${P.home}"     data-i18n="nav.home">Accueil</a>
      <a href="${P.services}" data-i18n="nav.services">Les soins</a>
      <a href="${P.about}"    data-i18n="nav.about">À propos</a>
      <a href="${P.contact}"  data-i18n="nav.contact">Contact</a>
      <a class="btn btn-primary" href="${P.booking}" data-i18n="cta.book">Prendre rendez-vous</a>
      <div class="lang" style="margin-top:22px;display:inline-flex" role="group" aria-label="Langue">
        <button data-lang="fr">FR</button>
        <button data-lang="de">DE</button>
        <button data-lang="en">EN</button>
      </div>
    </div>`;
  document.body.prepend(header);

  // active link
  header.querySelectorAll('[data-nav]').forEach(a => {
    if (a.getAttribute('data-nav') === page) a.classList.add('active');
  });

  // scroll shadow
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // burger / drawer
  const burger = header.querySelector('.burger');
  const drawer = header.querySelector('.drawer');
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open'); drawer.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }));

  /* ---------- FOOTER ---------- */
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <span class="name">Eloïse Werle</span>
          <p data-i18n="footer.tagline">Réharmoniser le corps et l’esprit, pour vivre en parfaite symbiose.</p>
          <p style="margin-top:18px">
            <a class="link-underline" href="mailto:eloiserose.werle@gmail.com">eloiserose.werle@gmail.com</a><br>
            <a class="link-underline" href="tel:+33608044818">+33 6 08 04 48 18</a>
          </p>
        </div>
        <div>
          <h4 data-i18n="footer.nav">Navigation</h4>
          <ul>
            <li><a href="${P.home}"     data-i18n="nav.home">Accueil</a></li>
            <li><a href="${P.services}" data-i18n="nav.services">Les soins</a></li>
            <li><a href="${P.about}"    data-i18n="nav.about">À propos</a></li>
            <li><a href="${P.booking}"  data-i18n="nav.booking">Rendez-vous</a></li>
            <li><a href="${P.contact}"  data-i18n="nav.contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 data-i18n="footer.places">Lieux de pratique</h4>
          <ul data-footer-places></ul>
        </div>
        <div>
          <h4 data-i18n="footer.news">Lettre du bien-être</h4>
          <p style="color:#C2B49E;margin-bottom:14px" data-i18n="footer.news.text">Rituels, créneaux et inspirations douces, une fois par saison.</p>
          <form class="news-form" data-newsletter>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input type="text" name="firstName" data-i18n-ph="news.firstname.ph" placeholder="Prénom">
              <input type="text" name="lastName" data-i18n-ph="news.lastname.ph" placeholder="Nom">
            </div>
            <input type="email" name="email" required data-i18n-ph="news.placeholder" placeholder="Votre adresse e-mail">
            <div class="news-cities">
              <span class="news-cities__lbl" data-i18n="news.cities">Recevoir les dates à :</span>
              <div class="news-chips" data-news-chips></div>
            </div>
            <button class="btn btn-primary btn-sm" type="submit" data-i18n="news.submit">S’inscrire</button>
          </form>
          <p class="news-msg" style="margin-top:12px;color:var(--accent-soft);font-size:.86rem;display:none" data-i18n="news.done2">Merci ! Vous serez prévenu·e des prochaines dates.</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year></span> Eloïse Werle · <span data-i18n="footer.made">Massothérapeute & professeure de yoga certifiée</span></span>
        <span><a class="link-underline" href="admin.html" data-i18n="adm.footer.link">Espace Eloïse</a> · <a class="link-underline" data-i18n="footer.legal" href="#">Mentions légales</a></span>
      </div>
    </div>`;
  document.body.appendChild(footer);

  footer.querySelector('[data-year]').textContent = new Date().getFullYear();

  // newsletter — persists subscriber + chosen cities via EWStore
  const nf = footer.querySelector('[data-newsletter]');
  nf.addEventListener('submit', (e) => {
    e.preventDefault();
    const cities = [].slice.call(nf.querySelectorAll('input[name="city"]:checked')).map(i => i.value);
    const firstName = (nf.querySelector('input[name="firstName"]') || {}).value || '';
    const lastName  = (nf.querySelector('input[name="lastName"]')  || {}).value || '';
    if (window.EWStore) {
      window.EWStore.addSubscriber({
        firstName, lastName,
        name: [firstName, lastName].filter(Boolean).join(' '),
        email: nf.email.value, cities, lang: window.ewLang ? window.ewLang() : 'fr'
      });
    }
    nf.style.display = 'none';
    footer.querySelector('.news-msg').style.display = 'block';
  });

  /* ---------- dynamic CITY rendering (footer + [data-places] grids) ---------- */
  const S = window.EWStore;
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function renderFooterCities() {
    if (!S) return;
    const ids = S.activeCityIds();
    const ul = footer.querySelector('[data-footer-places]');
    if (ul) ul.innerHTML = ids.map(id => `<li><span>${esc(S.cityName(id))}</span></li>`).join('');
    const chips = footer.querySelector('[data-news-chips]');
    if (chips) chips.innerHTML = ids.map((id, i) =>
      `<label class="news-chip"><input type="checkbox" name="city" value="${esc(id)}"${i===0?' checked':''}><span>${esc(S.cityName(id))}</span></label>`).join('');
  }

  function renderPlaces() {
    if (!S) return;
    document.querySelectorAll('[data-places]').forEach(host => {
      const ids = S.activeCityIds();
      host.innerHTML = ids.map((id, i) => `
        <div class="place reveal"${i ? ` data-d="${i}"` : ''}>
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(S.cityName(id))}</h3>
          <p class="reg">${esc(S.cityRegion(id))}</p>
          <div class="map"><span>${esc(S.cityMapLabel(id))}</span></div>
        </div>`).join('');
    });
    if (window.ewObserveReveals) window.ewObserveReveals();
  }

  function renderCityUI() { renderFooterCities(); renderPlaces(); }
  renderCityUI();
  window.addEventListener('ew:datachange', renderCityUI);
  window.addEventListener('ew:langchange', renderCityUI);

  /* ---------- reusable SUBSCRIBE modal (same action as footer) ---------- */
  let subModal;
  window.ewSubscribeModal = function () {
    if (!S) return;
    const t = window.t || (k => k);
    if (!subModal) {
      subModal = document.createElement('div');
      subModal.className = 'ew-modal';
      subModal.innerHTML = '<div class="ew-modal__bg" data-close></div><div class="ew-modal__box"></div>';
      document.body.appendChild(subModal);
      subModal.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) subModal.classList.remove('on'); });
    }
    const ids = S.activeCityIds();
    const box = subModal.querySelector('.ew-modal__box');
    box.innerHTML = `
      <button class="ew-modal__x" data-close aria-label="Fermer">×</button>
      <span class="eyebrow">${esc(t('dates.eyebrow'))}</span>
      <h3>${esc(t('news.modal.title'))}</h3>
      <p class="ew-modal__lead">${esc(t('news.modal.text'))}</p>
      <form class="news-form news-form--modal" data-submodal>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input type="text" name="firstName" placeholder="${esc(t('news.firstname.ph'))}">
          <input type="text" name="lastName" placeholder="${esc(t('news.lastname.ph'))}">
        </div>
        <input type="email" name="email" required placeholder="${esc(t('news.placeholder'))}">
        <div class="news-cities">
          <span class="news-cities__lbl">${esc(t('news.cities'))}</span>
          <div class="news-chips">${ids.map((id, i) =>
            `<label class="news-chip"><input type="checkbox" name="city" value="${esc(id)}"${i===0?' checked':''}><span>${esc(S.cityName(id))}</span></label>`).join('')}</div>
        </div>
        <button class="btn btn-primary" type="submit">${esc(t('news.submit'))}</button>
      </form>`;
    const f = box.querySelector('[data-submodal]');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const cities = [].slice.call(f.querySelectorAll('input[name="city"]:checked')).map(i => i.value);
      const firstNameEl = f.querySelector('input[name="firstName"]');
      const lastNameEl  = f.querySelector('input[name="lastName"]');
      const firstName = firstNameEl ? firstNameEl.value : '';
      const lastName  = lastNameEl  ? lastNameEl.value  : '';
      S.addSubscriber({ firstName, lastName, name: [firstName, lastName].filter(Boolean).join(' '), email: f.email.value, cities: cities, lang: window.ewLang ? window.ewLang() : 'fr' });
      box.innerHTML = `<button class="ew-modal__x" data-close aria-label="Fermer">×</button>
        <div class="ew-modal__ok"><div class="mk">♥</div><p class="lead">${esc(t('news.done2'))}</p></div>`;
    });
    subModal.classList.add('on');
  };
  document.addEventListener('click', e => {
    const trg = e.target.closest('[data-subscribe]');
    if (trg) { e.preventDefault(); window.ewSubscribeModal(); }
  });

  /* ---------- REVEAL on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  function observeReveals() { document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el)); }
  window.ewObserveReveals = observeReveals;
  observeReveals();

  /* ---------- apply i18n to freshly injected chrome ---------- */
  if (window.ewApplyI18n) window.ewApplyI18n();

  /* ---------- close drawer on resize up ---------- */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820 && drawer.classList.contains('open')) {
      burger.classList.remove('open'); drawer.classList.remove('open'); document.body.style.overflow = '';
    }
  });
})();
