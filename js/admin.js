/* ===========================================================================
   admin.js — Espace Eloïse dashboard (prototype, localStorage via EWStore)
   Tabs: dates → targeted notify · subscribers · reviews · instagram
   =========================================================================== */
(function () {
  'use strict';
  var S = window.EWStore;
  var t = function (k) { return window.t ? window.t(k) : k; };
  var lang = function () { return window.ewLang ? window.ewLang() : 'fr'; };
  var LOC = { fr: 'fr-FR', de: 'de-DE', en: 'en-GB' };
  function locale() { return LOC[lang()] || 'fr-FR'; }
  var CODE = 'aum';
  var AUTH_KEY = 'ew_admin_ok';

  var ASSETS = ['assets/thai-parc.png','assets/eloise-meditation.png','assets/drainage-visage.png',
    'assets/yoga-equilibre.png','assets/relaxation.png','assets/thai-backbend.png',
    'assets/soin-mains.png','assets/thai-dos.png','assets/thai-etirement.png'];
  var SVC = ['thai','balinais','deep','drainage','ayurvedique','yoga'];

  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function cityName(id){ return S.cityName(id); }
  function cityRegion(id){ return S.cityRegion(id); }
  function svcName(id){ return id ? t('svc.'+id+'.name') : ''; }
  function fmtDate(iso){ return new Date(iso+'T00:00:00').toLocaleDateString(locale(),{weekday:'long',day:'numeric',month:'long'}); }
  function fmtShort(iso){ return new Date(iso+'T00:00:00').toLocaleDateString(locale(),{day:'numeric',month:'short',year:'numeric'}); }
  function stars(n){ n=Math.max(0,Math.min(5,n||5)); var s=''; for(var i=0;i<5;i++) s+=i<n?'★':'☆'; return s; }
  function today(){ return new Date().toISOString().slice(0,10); }
  var $ = function (s, r){ return (r||document).querySelector(s); };

  var toastEl;
  function toast(msg){
    if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='toast'; document.body.appendChild(toastEl); }
    toastEl.textContent=msg; toastEl.classList.add('on');
    clearTimeout(toast._t); toast._t=setTimeout(function(){ toastEl.classList.remove('on'); },2200);
  }
  function copyText(txt){
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).catch(function(){}); }
    else { var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); }
  }

  /* ============================ AUTH ============================ */
  var gate = $('#adm-gate'), app = $('#adm-app');
  function authed(){ return localStorage.getItem(AUTH_KEY)==='1'; }
  function showApp(){
    gate.style.display='none'; app.hidden=false;
    render(); if(window.ewApplyI18n) window.ewApplyI18n();
  }
  function initGate(){
    gate.querySelector('.hint').textContent = t('adm.login.hint') + ' ' + CODE;
    var f = gate.querySelector('form'), err = gate.querySelector('.err');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var v = (f.code.value||'').trim().toLowerCase();
      if(v===CODE){ localStorage.setItem(AUTH_KEY,'1'); showApp(); }
      else { err.textContent = t('adm.login.err'); f.code.value=''; }
    });
  }

  /* ============================ TABS ============================ */
  var current = 'dates';
  function setTab(name){
    current = name;
    [].slice.call(document.querySelectorAll('.adm-tab')).forEach(function(b){ b.classList.toggle('on', b.dataset.tab===name); });
    [].slice.call(document.querySelectorAll('.adm-panel')).forEach(function(p){ p.classList.toggle('on', p.dataset.panel===name); });
  }

  /* ====================== DATES TAB ====================== */
  function citySelect(name, val){
    return '<select name="'+name+'">'+ S.cityIds().map(function(c){
      return '<option value="'+c+'"'+(c===val?' selected':'')+'>'+esc(cityName(c))+'</option>'; }).join('') +'</select>';
  }
  function svcSelect(name, val){
    return '<select name="'+name+'"><option value="">—</option>'+ SVC.map(function(s){
      return '<option value="'+s+'"'+(s===val?' selected':'')+'>'+esc(svcName(s))+'</option>'; }).join('') +'</select>';
  }
  function renderDates(){
    var panel = $('[data-panel="dates"]'); if(!panel) return;
    var dates = S.dates();
    var up = dates.filter(function(d){ return d.date>=today(); });
    var past = dates.filter(function(d){ return d.date<today(); }).reverse();

    function dateItem(d){
      var n = S.subscribersForCity(d.city).length;
      var time = (d.start&&d.end)?(d.start+' – '+d.end):(d.start||'');
      var notifiedBtn = d.notified
        ? '<span class="pill-tag ok">'+esc(t('adm.d.notified'))+'</span>'
        : '<button class="btn-mini solid" data-notify="'+d.id+'">'+esc(t('adm.d.notify'))+'</button>';
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title">'+esc(cityName(d.city))+
          (d.service?' <span class="pill-tag">'+esc(svcName(d.service))+'</span>':'')+'</div>'+
        '<div class="adm-item__meta"><span>'+esc(fmtDate(d.date))+'</span>'+(time?'<span>'+esc(time)+'</span>':'')+
          '<span>'+n+' '+esc(t('adm.d.match'))+'</span></div>'+
        (d.note?'<div class="adm-item__text">'+esc(d.note)+'</div>':'')+
      '</div><div class="adm-item__actions">'+notifiedBtn+
        '<button class="btn-mini danger" data-deldate="'+d.id+'">'+esc(t('adm.d.delete'))+'</button>'+
      '</div></div>';
    }

    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.d.add'))+'</h3>'+
        '<form class="adm-form" data-adddate>'+
          '<div><label>'+esc(t('adm.d.city'))+'</label>'+citySelect('city')+'</div>'+
          '<div><label>'+esc(t('adm.d.date'))+'</label><input type="date" name="date" required min="'+today()+'"></div>'+
          '<div class="row2"><div><label>'+esc(t('adm.d.start'))+'</label><input type="time" name="start" value="09:00"></div>'+
            '<div><label>'+esc(t('adm.d.end'))+'</label><input type="time" name="end" value="18:00"></div></div>'+
          '<div><label>'+esc(t('adm.d.service'))+'</label>'+svcSelect('service')+'</div>'+
          '<div><label>'+esc(t('adm.d.note'))+'</label><textarea name="note"></textarea></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.d.save'))+'</button>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.d.upcoming'))+'</div>'+
          '<div class="adm-list">'+(up.length?up.map(dateItem).join(''):'<div class="adm-empty">'+esc(t('adm.d.none'))+'</div>')+'</div>'+
          (past.length?'<div class="adm-sub">'+esc(t('adm.d.past'))+'</div><div class="adm-list">'+past.map(dateItem).join('')+'</div>':'')+
        '</div></div>';

    var form = $('[data-adddate]', panel);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(form);
      if(!fd.get('date')) return;
      var rec = S.addDate({ city:fd.get('city'), date:fd.get('date'), start:fd.get('start'),
        end:fd.get('end'), service:fd.get('service'), note:fd.get('note') });
      // immediately offer to notify matching subscribers
      openNotify(rec);
    });
    [].slice.call(panel.querySelectorAll('[data-notify]')).forEach(function(b){
      b.addEventListener('click', function(){ openNotify(S.dates().filter(function(d){return d.id===b.dataset.notify;})[0]); });
    });
    [].slice.call(panel.querySelectorAll('[data-deldate]')).forEach(function(b){
      b.addEventListener('click', function(){ S.removeDate(b.dataset.deldate); });
    });
  }

  /* ====================== NOTIFY MODAL ====================== */
  var modal;
  function ensureModal(){
    if(modal) return modal;
    modal = document.createElement('div'); modal.className='adm-modal';
    modal.innerHTML = '<div class="adm-modal__bg" data-close></div><div class="adm-modal__box"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target.hasAttribute('data-close')) close(); });
    return modal;
  }
  function close(){ if(modal) modal.classList.remove('on'); }
  function fill(str, map){ return str.replace(/\{(\w+)\}/g, function(_,k){ return map[k]!=null?map[k]:''; }); }

  function openNotify(d){
    if(!d) return;
    ensureModal();
    var box = $('.adm-modal__box', modal);
    var recips = S.subscribersForCity(d.city);
    var emails = recips.map(function(r){ return r.email; });
    var url = new URL('reservation.html', location.href).href;
    var timeStr = (d.start&&d.end) ? (' · '+d.start+'–'+d.end) : (d.start?(' · '+d.start):'');
    var subject = fill(t('adm.n.defSubject'), { city:cityName(d.city), date:fmtDate(d.date) });
    var body = fill(t('adm.n.defBody'), { city:cityName(d.city), date:fmtDate(d.date), time:timeStr, url:url });

    box.innerHTML =
      '<h3>'+esc(t('adm.n.title'))+'</h3>'+
      '<p style="color:var(--ink-2);margin-bottom:6px">'+esc(cityName(d.city))+' · '+esc(fmtDate(d.date))+'</p>'+
      '<label style="font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--ink-2)">'+
        esc(t('adm.n.recipients'))+' ('+recips.length+')</label>'+
      (recips.length
        ? '<div class="adm-recipients">'+recips.map(function(r){ return '<span class="rcpt">'+esc(r.name||r.email)+'</span>'; }).join('')+'</div>'
        : '<p class="adm-empty" style="margin:10px 0 0">'+esc(t('adm.n.empty'))+'</p>')+
      '<div class="adm-form" style="margin-top:14px">'+
        '<div><label>'+esc(t('adm.n.subject'))+'</label><input type="text" data-subject value="'+esc(subject)+'"></div>'+
        '<div><label>'+esc(t('adm.n.body'))+'</label><textarea data-body style="min-height:170px">'+esc(body)+'</textarea></div>'+
      '</div>'+
      '<div class="adm-modal__actions">'+
        (recips.length?'<button class="btn btn-primary btn-sm" data-open>'+esc(t('adm.n.open'))+'</button>'+
          '<button class="btn-mini" data-copy>'+esc(t('adm.n.copy'))+'</button>'+
          '<button class="btn-mini solid" data-mark>'+esc(t('adm.n.mark'))+'</button>':'')+
        '<button class="btn-mini" data-close>'+esc(t('adm.n.cancel'))+'</button>'+
      '</div>';

    modal.classList.add('on');

    if(recips.length){
      $('[data-open]',box).addEventListener('click', function(){
        var subj = $('[data-subject]',box).value, bdy = $('[data-body]',box).value;
        window.location.href = 'mailto:?bcc='+encodeURIComponent(emails.join(','))+
          '&subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(bdy);
      });
      $('[data-copy]',box).addEventListener('click', function(){ copyText(emails.join(', ')); toast(t('adm.n.copied')); });
      $('[data-mark]',box).addEventListener('click', function(){
        S.logCampaign({ city:d.city, dateId:d.id, subject:$('[data-subject]',box).value, recipients:emails });
        close(); toast(t('adm.n.sent'));
      });
    }
  }

  /* ====================== SUBSCRIBERS TAB ====================== */
  function renderSubs(){
    var panel = $('[data-panel="subs"]'); if(!panel) return;
    var subs = S.subscribers();
    var stats = '<div class="adm-stats">'+
      '<div class="adm-stat"><div class="n">'+subs.length+'</div><div class="l">'+esc(t('adm.s.total'))+'</div></div>'+
      S.cityIds().map(function(c){ return '<div class="adm-stat"><div class="n">'+S.subscribersForCity(c).length+
        '</div><div class="l">'+esc(cityName(c))+'</div></div>'; }).join('')+'</div>';

    var byCity = S.cityIds().map(function(c){
      var list = S.subscribersForCity(c);
      if(!list.length) return '';
      return '<div class="adm-sub" style="display:flex;justify-content:space-between;align-items:center">'+
          '<span>'+esc(cityName(c))+' · '+list.length+'</span>'+
          '<button class="btn-mini" data-copycity="'+c+'">'+esc(t('adm.s.copyCity'))+'</button></div>'+
        '<div class="adm-list">'+list.map(function(s){
          var nb = S.appointmentsForEmail(s.email).length;
          return '<div class="adm-item adm-item--click" data-subid="'+s.id+'"><div class="adm-item__main">'+
            '<div class="adm-item__title" style="font-size:1.05rem">'+esc(s.name||'—')+
              (nb?' <span class="pill-tag">'+nb+' '+esc(t('adm.s.appts'))+'</span>':'')+'</div>'+
            '<div class="adm-item__meta"><span>'+esc(s.email)+'</span><span>'+esc(t('adm.s.since'))+' '+esc(fmtShort(s.date))+'</span>'+
              '<span>'+s.cities.map(cityName).map(esc).join(', ')+'</span></div></div>'+
            '<div class="adm-item__actions"><button class="btn-mini" data-history="'+s.id+'">'+esc(t('adm.s.history'))+'</button>'+
              '<button class="btn-mini danger" data-delsub="'+s.id+'">'+esc(t('adm.s.del'))+'</button></div>'+
          '</div>'; }).join('')+'</div>';
    }).join('');

    panel.innerHTML = stats + (subs.length ? byCity : '<div class="adm-empty">'+esc(t('adm.s.none'))+'</div>');

    [].slice.call(panel.querySelectorAll('[data-copycity]')).forEach(function(b){
      b.addEventListener('click', function(){
        var em = S.subscribersForCity(b.dataset.copycity).map(function(s){return s.email;});
        copyText(em.join(', ')); toast(t('adm.n.copied'));
      });
    });
    [].slice.call(panel.querySelectorAll('[data-delsub]')).forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); S.removeSubscriber(b.dataset.delsub); });
    });
    [].slice.call(panel.querySelectorAll('[data-history]')).forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); openSubscriber(b.dataset.history); });
    });
    [].slice.call(panel.querySelectorAll('[data-subid]')).forEach(function(row){
      row.addEventListener('click', function(){ openSubscriber(row.dataset.subid); });
    });
  }

  /* ====================== REVIEWS TAB ====================== */
  function renderReviews(){
    var panel = $('[data-panel="reviews"]'); if(!panel) return;
    var all = S.testimonials();
    var pending = all.filter(function(r){ return r.status==='pending'; }).sort(function(a,b){return b.createdAt-a.createdAt;});
    var pub = all.filter(function(r){ return r.status==='approved'; }).sort(function(a,b){return b.createdAt-a.createdAt;});

    function revText(r){ return r.key ? t(r.key+'.q') : r.text; }
    function revRole(r){ return r.key ? t(r.key+'.r') : (r.service?svcName(r.service):cityName(r.city)); }
    function revName(r){ return r.key ? t(r.key+'.n') : (r.name||'—'); }
    function item(r){
      var actions = r.status==='pending'
        ? '<button class="btn-mini solid" data-approve="'+r.id+'">'+esc(t('adm.r.approve'))+'</button>'+
          '<button class="btn-mini danger" data-delrev="'+r.id+'">'+esc(t('adm.r.reject'))+'</button>'
        : '<button class="btn-mini" data-unpub="'+r.id+'">'+esc(t('adm.r.unpublish'))+'</button>'+
          '<button class="btn-mini danger" data-delrev="'+r.id+'">'+esc(t('adm.r.reject'))+'</button>';
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1.05rem">'+esc(revName(r))+
          ' <span class="stars-mini">'+stars(r.rating)+'</span></div>'+
        '<div class="adm-item__meta"><span class="svc">'+esc(revRole(r))+'</span><span>'+esc(fmtShort(new Date(r.createdAt).toISOString().slice(0,10)))+'</span></div>'+
        '<div class="adm-item__text">'+esc(revText(r))+'</div></div>'+
        '<div class="adm-item__actions">'+actions+'</div></div>';
    }

    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.r.add'))+'</h3>'+
        '<form class="adm-form" data-addrev>'+
          '<div class="row2"><div><label>'+esc(t('adm.s.name'))+'</label><input name="name" required></div>'+
            '<div><label>'+esc(t('rev.city'))+'</label>'+citySelect('city')+'</div></div>'+
          '<div><label>'+esc(t('rev.service'))+'</label>'+svcSelect('service')+'</div>'+
          '<div><label>'+esc(t('rev.rating'))+'</label><select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>'+
          '<div><label>'+esc(t('rev.msg'))+'</label><textarea name="text" required></textarea></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.r.addBtn'))+'</button>'+
        '</form></div>'+
        '<div>'+
          '<div class="adm-sub">'+esc(t('adm.r.pending'))+' · '+pending.length+'</div>'+
          '<div class="adm-list">'+(pending.length?pending.map(item).join(''):'<div class="adm-empty">'+esc(t('adm.r.none'))+'</div>')+'</div>'+
          '<div class="adm-sub">'+esc(t('adm.r.published'))+' · '+pub.length+'</div>'+
          '<div class="adm-list">'+(pub.length?pub.map(item).join(''):'<div class="adm-empty">'+esc(t('adm.r.none'))+'</div>')+'</div>'+
        '</div></div>';

    var f = $('[data-addrev]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      if(!(fd.get('text')||'').trim()){ return; }
      S.addTestimonial({ name:fd.get('name'), city:fd.get('city'), service:fd.get('service'),
        rating:+fd.get('rating'), text:fd.get('text'), status:'approved', lang:lang() });
    });
    [].slice.call(panel.querySelectorAll('[data-approve]')).forEach(function(b){ b.addEventListener('click',function(){ S.setTestimonialStatus(b.dataset.approve,'approved'); }); });
    [].slice.call(panel.querySelectorAll('[data-unpub]')).forEach(function(b){ b.addEventListener('click',function(){ S.setTestimonialStatus(b.dataset.unpub,'pending'); }); });
    [].slice.call(panel.querySelectorAll('[data-delrev]')).forEach(function(b){ b.addEventListener('click',function(){ S.removeTestimonial(b.dataset.delrev); }); });
  }

  /* ====================== INSTAGRAM TAB ====================== */
  function renderInsta(){
    var panel = $('[data-panel="insta"]'); if(!panel) return;
    var posts = S.insta();
    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.i.add'))+'</h3>'+
        '<form class="adm-form" data-addinsta>'+
          '<div><label>'+esc(t('adm.i.pick'))+'</label><select name="asset">'+
            ASSETS.map(function(a){ return '<option value="'+a+'">'+esc(a.replace('assets/','').replace('.png',''))+'</option>'; }).join('')+
          '</select></div>'+
          '<div><label>'+esc(t('adm.i.url'))+'</label><input name="url" placeholder="https://…"></div>'+
          '<div><label>'+esc(t('adm.i.caption'))+'</label><textarea name="caption"></textarea></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.i.save'))+'</button>'+
          '<p style="color:var(--ink-3);font-size:.82rem;line-height:1.4">'+esc(t('adm.i.hint'))+'</p>'+
        '</form></div>'+
        '<div>'+(posts.length
          ? '<div class="adm-insta">'+posts.map(function(p){
              return '<div class="adm-insta__cell"><img src="'+esc(p.img)+'" alt="">'+
                '<button class="del" data-delinsta="'+p.id+'" aria-label="x">×</button>'+
                (p.caption?'<span class="cap">'+esc(p.caption)+'</span>':'')+'</div>'; }).join('')+'</div>'
          : '<div class="adm-empty">'+esc(t('adm.i.none'))+'</div>')+'</div></div>';

    var f = $('[data-addinsta]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      var img = (fd.get('url')||'').trim() || fd.get('asset');
      if(!img) return;
      S.addInsta({ img:img, caption:fd.get('caption') });
    });
    [].slice.call(panel.querySelectorAll('[data-delinsta]')).forEach(function(b){ b.addEventListener('click',function(){ S.removeInsta(b.dataset.delinsta); }); });
  }

  /* ====================== SUBSCRIBER HISTORY MODAL ====================== */
  function openSubscriber(id){
    var s = S.subscriber(id); if(!s) return;
    ensureModal();
    var box = $('.adm-modal__box', modal);
    var appts = S.appointmentsForEmail(s.email);
    var up = appts.filter(function(a){ return a.dateISO >= today(); }).sort(function(a,b){ return a.dateISO<b.dateISO?-1:1; });
    var past = appts.filter(function(a){ return a.dateISO < today(); });

    function apptItem(a){
      var bits = [];
      if(a.service) bits.push('<span class="svc">'+esc(svcName(a.service))+'</span>');
      if(a.duration) bits.push('<span>'+a.duration+' min</span>');
      if(a.time) bits.push('<span>'+esc(a.time)+'</span>');
      if(a.price) bits.push('<span>'+a.price+' €</span>');
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1.05rem">'+esc(cityName(a.city))+
          ' <span style="color:var(--ink-2);font-family:var(--body);font-size:.9rem">'+esc(fmtDate(a.dateISO))+'</span></div>'+
        '<div class="adm-item__meta">'+bits.join('')+'</div></div></div>';
    }

    box.innerHTML =
      '<h3>'+esc(t('adm.h.title'))+'</h3>'+
      '<p style="color:var(--ink-2);margin-bottom:4px"><b style="color:var(--ink)">'+esc(s.name||'—')+'</b> · '+esc(s.email)+'</p>'+
      '<p style="color:var(--ink-2);margin-bottom:18px;font-size:.9rem">'+esc(t('adm.s.cities'))+': '+s.cities.map(cityName).map(esc).join(', ')+'</p>'+
      (appts.length
        ? (up.length?'<div class="adm-sub">'+esc(t('adm.h.upcoming'))+' · '+up.length+'</div><div class="adm-list">'+up.map(apptItem).join('')+'</div>':'')+
          (past.length?'<div class="adm-sub">'+esc(t('adm.h.past'))+' · '+past.length+'</div><div class="adm-list">'+past.map(apptItem).join('')+'</div>':'')
        : '<div class="adm-empty">'+esc(t('adm.h.none'))+'</div>')+
      '<div class="adm-modal__actions"><button class="btn-mini" data-close>'+esc(t('adm.h.close'))+'</button></div>';
    modal.classList.add('on');
  }

  /* ====================== PLACES (LIEUX) TAB ====================== */
  function weekdays(){
    // Monday-first order, localized short labels
    var order = [1,2,3,4,5,6,0], ref = new Date(2024,0,1); // Jan 1 2024 = Monday
    return order.map(function(d,i){
      var dt = new Date(ref); dt.setDate(ref.getDate()+i);
      return { d:d, label: dt.toLocaleDateString(locale(),{weekday:'short'}).replace('.','') };
    });
  }
  function renderPlaces(){
    var panel = $('[data-panel="places"]'); if(!panel) return;
    var cities = S.cities();
    var wd = weekdays();

    function dayChips(days){ return wd.map(function(w){
      return '<label class="wd-chip"><input type="checkbox" name="day" value="'+w.d+'"'+(days.indexOf(w.d)!==-1?' checked':'')+'><span>'+esc(w.label)+'</span></label>'; }).join(''); }

    function cityItem(c){
      var dayLabels = wd.filter(function(w){ return c.days && c.days.indexOf(w.d)!==-1; }).map(function(w){ return w.label; }).join(' · ');
      var active = c.active !== false;
      return '<div class="adm-item'+(active?'':' is-off')+'"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1.15rem">'+esc(cityName(c.id))+
          ' <span class="pill-tag '+(c.builtin?'':'ok')+'">'+esc(t(c.builtin?'adm.p.builtin':'adm.p.custom'))+'</span></div>'+
        '<div class="adm-item__meta"><span>'+esc(cityRegion(c.id))+'</span>'+(dayLabels?'<span>'+esc(dayLabels)+'</span>':'')+'</div></div>'+
        '<div class="adm-item__actions">'+
          '<label class="sw" title="'+esc(t('adm.p.active'))+'"><input type="checkbox" data-togglecity="'+c.id+'"'+(active?' checked':'')+'><span></span></label>'+
          '<div class="adm-row-actions">'+
            '<button class="btn-mini" data-editcity="'+c.id+'">'+esc(t('adm.p.edit'))+'</button>'+
            (c.builtin?'':'<button class="btn-mini danger" data-delcity="'+c.id+'">'+esc(t('adm.p.del'))+'</button>')+
          '</div>'+
        '</div></div>';
    }

    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.p.add'))+'</h3>'+
        '<form class="adm-form" data-addcity>'+
          '<div><label>'+esc(t('adm.p.name'))+'</label><input name="name" required></div>'+
          '<div><label>'+esc(t('adm.p.region'))+'</label><input name="region"></div>'+
          '<div><label>'+esc(t('adm.p.map'))+'</label><input name="map"></div>'+
          '<div><label>'+esc(t('adm.p.days'))+'</label><div class="wd-chips">'+dayChips([2,3,4])+'</div></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.p.save'))+'</button>'+
          '<p style="color:var(--ink-3);font-size:.82rem;line-height:1.4">'+esc(t('adm.p.hint'))+'</p>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.p.list'))+'</div>'+
          '<div class="adm-list">'+(cities.length?cities.map(cityItem).join(''):'<div class="adm-empty">'+esc(t('adm.p.none'))+'</div>')+'</div>'+
        '</div></div>';

    var f = $('[data-addcity]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      if(!(fd.get('name')||'').trim()) return;
      var days = [].slice.call(f.querySelectorAll('input[name="day"]:checked')).map(function(i){ return +i.value; });
      S.addCity({ name:fd.get('name'), region:fd.get('region'), mapLabel:fd.get('map'), days:days });
    });
    [].slice.call(panel.querySelectorAll('[data-delcity]')).forEach(function(b){
      b.addEventListener('click', function(){ if(confirm(t('adm.p.delconfirm'))) S.removeCity(b.dataset.delcity); });
    });
    [].slice.call(panel.querySelectorAll('[data-togglecity]')).forEach(function(b){
      b.addEventListener('change', function(){ S.setCityActive(b.dataset.togglecity, b.checked); });
    });
    [].slice.call(panel.querySelectorAll('[data-editcity]')).forEach(function(b){
      b.addEventListener('click', function(){ openCityEdit(b.dataset.editcity); });
    });
  }

  function openCityEdit(id){
    var c = S.city(id); if(!c) return;
    ensureModal();
    var box = $('.adm-modal__box', modal);
    var wd = weekdays();
    function chips(days){ return wd.map(function(w){ return '<label class="wd-chip"><input type="checkbox" name="eday" value="'+w.d+'"'+(days.indexOf(w.d)!==-1?' checked':'')+'><span>'+esc(w.label)+'</span></label>'; }).join(''); }
    box.innerHTML =
      '<h3>'+esc(t('adm.p.editTitle'))+'</h3>'+
      '<div class="adm-form" style="margin-top:10px">'+
        '<div><label>'+esc(t('adm.p.name'))+'</label><input data-e-name value="'+esc(cityName(id))+'"></div>'+
        '<div><label>'+esc(t('adm.p.region'))+'</label><input data-e-region value="'+esc(cityRegion(id))+'"></div>'+
        '<div><label>'+esc(t('adm.p.map'))+'</label><input data-e-map value="'+esc(c.mapLabel||'')+'"></div>'+
        '<div><label>'+esc(t('adm.p.days'))+'</label><div class="wd-chips" data-e-days>'+chips(c.days||[])+'</div></div>'+
      '</div>'+
      '<div class="adm-modal__actions"><button class="btn btn-primary btn-sm" data-e-save>'+esc(t('adm.p.save2'))+'</button>'+
        '<button class="btn-mini" data-close>'+esc(t('adm.h.close'))+'</button></div>';
    modal.classList.add('on');
    $('[data-e-save]',box).addEventListener('click', function(){
      var days = [].slice.call(box.querySelectorAll('[data-e-days] input:checked')).map(function(i){ return +i.value; });
      S.updateCity(id, { name:$('[data-e-name]',box).value, region:$('[data-e-region]',box).value,
        mapLabel:$('[data-e-map]',box).value, days:days });
      close();
    });
  }

  /* ====================== SOINS (SERVICES) TAB ====================== */
  function renderServices(){
    var panel = $('[data-panel="soins"]'); if(!panel) return;
    var list = S.services();

    function item(s){
      var pub = s.published !== false;
      var unit = S.serviceUnit(s.id);
      return '<div class="adm-item'+(pub?'':' is-off')+'">'+
        '<div class="adm-thumb"><img src="'+esc(S.serviceImg(s.id))+'" alt=""></div>'+
        '<div class="adm-item__main">'+
          '<div class="adm-item__title" style="font-size:1.1rem">'+esc(S.serviceName(s.id))+
            ' <span class="pill-tag '+(s.builtin?'':'ok')+'">'+esc(t(s.builtin?'adm.sv.builtin':'adm.sv.custom'))+'</span></div>'+
          '<div class="adm-item__meta"><span class="svc">'+esc(S.serviceTag(s.id))+'</span><span>'+esc(S.servicePrice(s.id))+' €'+(unit?' '+esc(unit):'')+'</span></div>'+
        '</div>'+
        '<div class="adm-item__actions">'+
          '<label class="sw" title="'+esc(t('adm.sv.published'))+'"><input type="checkbox" data-togglesvc="'+s.id+'"'+(pub?' checked':'')+'><span></span></label>'+
          '<div class="adm-row-actions">'+
            '<button class="btn-mini" data-editsvc="'+s.id+'">'+esc(t('adm.sv.edit'))+'</button>'+
            (s.builtin?'':'<button class="btn-mini danger" data-delsvc="'+s.id+'">'+esc(t('adm.sv.del'))+'</button>')+
          '</div>'+
        '</div></div>';
    }

    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.sv.add'))+'</h3>'+
        '<form class="adm-form" data-addsvc>'+
          '<div><label>'+esc(t('adm.sv.name'))+'</label><input name="name" required></div>'+
          '<div><label>'+esc(t('adm.sv.tag'))+'</label><input name="tag"></div>'+
          '<div class="row2"><div><label>'+esc(t('adm.sv.price'))+'</label><input type="number" name="price" min="0" value="60"></div>'+
            '<div><label>'+esc(t('adm.sv.unit'))+'</label><input name="unit" value="'+esc(t('common.perHour'))+'"></div></div>'+
          '<div><label>'+esc(t('adm.sv.img'))+'</label><select name="asset">'+
            ASSETS.map(function(a){ return '<option value="'+a+'">'+esc(a.replace('assets/','').replace('.png',''))+'</option>'; }).join('')+'</select></div>'+
          '<div><label>'+esc(t('adm.sv.url'))+'</label><input name="url" placeholder="https://…"></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.sv.save'))+'</button>'+
          '<p style="color:var(--ink-3);font-size:.82rem;line-height:1.4">'+esc(t('adm.sv.hint'))+'</p>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.sv.list'))+'</div>'+
          '<div class="adm-list">'+(list.length?list.map(item).join(''):'<div class="adm-empty">'+esc(t('adm.sv.none'))+'</div>')+'</div>'+
        '</div></div>';

    var f = $('[data-addsvc]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      if(!(fd.get('name')||'').trim()) return;
      var img = (fd.get('url')||'').trim() || fd.get('asset');
      S.addService({ name:fd.get('name'), tag:fd.get('tag'), price:fd.get('price'), unit:fd.get('unit'), img:img, published:true });
    });
    [].slice.call(panel.querySelectorAll('[data-togglesvc]')).forEach(function(b){ b.addEventListener('change', function(){ S.setServicePublished(b.dataset.togglesvc, b.checked); }); });
    [].slice.call(panel.querySelectorAll('[data-editsvc]')).forEach(function(b){ b.addEventListener('click', function(){ openServiceEdit(b.dataset.editsvc); }); });
    [].slice.call(panel.querySelectorAll('[data-delsvc]')).forEach(function(b){ b.addEventListener('click', function(){ if(confirm(t('adm.sv.delconfirm'))) S.removeService(b.dataset.delsvc); }); });
  }

  function openServiceEdit(id){
    var s = S.service(id); if(!s) return;
    ensureModal();
    var box = $('.adm-modal__box', modal);
    var customUrl = (s.img && s.img.indexOf('assets/') !== 0) ? s.img : '';
    box.innerHTML =
      '<h3>'+esc(t('adm.sv.editTitle'))+'</h3>'+
      '<div class="adm-form" style="margin-top:10px">'+
        '<div><label>'+esc(t('adm.sv.name'))+'</label><input data-e-name value="'+esc(S.serviceName(id))+'"></div>'+
        '<div><label>'+esc(t('adm.sv.tag'))+'</label><input data-e-tag value="'+esc(S.serviceTag(id))+'"></div>'+
        '<div class="row2"><div><label>'+esc(t('adm.sv.price'))+'</label><input type="number" data-e-price value="'+esc(S.servicePrice(id))+'"></div>'+
          '<div><label>'+esc(t('adm.sv.unit'))+'</label><input data-e-unit value="'+esc(S.serviceUnit(id))+'"></div></div>'+
        '<div><label>'+esc(t('adm.sv.img'))+'</label><select data-e-asset>'+
          ASSETS.map(function(a){ return '<option value="'+a+'"'+(a===s.img?' selected':'')+'>'+esc(a.replace('assets/','').replace('.png',''))+'</option>'; }).join('')+'</select></div>'+
        '<div><label>'+esc(t('adm.sv.url'))+'</label><input data-e-url placeholder="https://…" value="'+esc(customUrl)+'"></div>'+
        '<div class="adm-thumb adm-thumb--lg"><img src="'+esc(S.serviceImg(id))+'" alt=""></div>'+
      '</div>'+
      '<div class="adm-modal__actions"><button class="btn btn-primary btn-sm" data-e-save>'+esc(t('adm.sv.saveEdit'))+'</button>'+
        '<button class="btn-mini" data-close>'+esc(t('adm.h.close'))+'</button></div>';
    modal.classList.add('on');
    $('[data-e-save]',box).addEventListener('click', function(){
      var img = ($('[data-e-url]',box).value||'').trim() || $('[data-e-asset]',box).value;
      S.updateService(id, { name:$('[data-e-name]',box).value, tag:$('[data-e-tag]',box).value,
        price:+$('[data-e-price]',box).value, unit:$('[data-e-unit]',box).value, img:img });
      close();
    });
  }

  /* ====================== RENDER + BADGES ====================== */
  function updateBadges(){
    var pend = S.testimonials().filter(function(r){return r.status==='pending';}).length;
    var b = document.querySelector('.adm-tab[data-tab="reviews"] .badge');
    if(b){ b.textContent = pend; b.style.display = pend?'inline-flex':'none'; }
  }
  function render(){
    renderDates(); renderSubs(); renderReviews(); renderInsta(); renderPlaces(); renderServices();
    updateBadges();
    // NOTE: do not call ewApplyI18n() here — dynamic panels already use t().
    // Calling it would dispatch ew:langchange and recurse via the listener below.
  }

  /* ============================ INIT ============================ */
  function init(){
    if(!S){ return; }
    initGate();
    document.querySelector('.adm-logout').addEventListener('click', function(){
      localStorage.removeItem(AUTH_KEY); location.reload();
    });
    [].slice.call(document.querySelectorAll('.adm-tab')).forEach(function(b){
      b.addEventListener('click', function(){ setTab(b.dataset.tab); });
    });
    setTab('dates');
    if(authed()) showApp();
    window.addEventListener('ew:datachange', function(){ if(authed()) render(); });
    window.addEventListener('ew:langchange', function(){ if(authed()) render(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
