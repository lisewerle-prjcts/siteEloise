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
  function getCode() { return S && S.getAdminCode ? S.getAdminCode() : CODE; }

  function parseUA(ua) {
    if (!ua) return 'Navigateur inconnu';
    var br = 'Navigateur';
    if (/Chrome\//.test(ua) && !/Chromium|Edg|OPR/.test(ua)) br = 'Chrome';
    else if (/Firefox\//.test(ua)) br = 'Firefox';
    else if (/Edg\//.test(ua)) br = 'Edge';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) br = 'Safari';
    var os = '';
    if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    return br + (os ? ' · ' + os : '');
  }

  var ASSETS = ['assets/thai-parc.png','assets/eloise-meditation.png','assets/drainage-visage.png',
    'assets/yoga-equilibre.png','assets/relaxation.png','assets/thai-backbend.png',
    'assets/soin-mains.png','assets/thai-dos.png','assets/thai-etirement.png'];
  var SVC = ['thai','balinais','deep','drainage','ayurvedique','yoga'];

  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function cityName(id){ return S.cityName(id); }
  function cityRegion(id){ return S.cityRegion(id); }
  function svcName(id){ return id ? (S.serviceName ? S.serviceName(id) : t('svc.'+id+'.name')) : ''; }
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
  function authed(){ return sessionStorage.getItem(AUTH_KEY)==='1'; }
  function showApp(){
    gate.style.display='none'; app.hidden=false;
    render(); setTab('rdv'); if(window.ewApplyI18n) window.ewApplyI18n();
  }
  function initGate(){
    gate.querySelector('.hint').textContent = '';
    var f = gate.querySelector('form'), err = gate.querySelector('.err');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var v = (f.code.value||'').trim();
      if(v===getCode()){
        sessionStorage.setItem(AUTH_KEY,"1");
        if(S.logAdminSession) S.logAdminSession();
        showApp();
      } else { err.textContent = t('adm.login.err'); f.code.value=''; }
    });

    /* ---- forgot password flow ---- */
    var forgotBtn  = $('#adm-forgot-btn');
    var resetPanel = $('#adm-reset-panel');
    var step1 = $('#adm-reset-step1'), step2 = $('#adm-reset-step2'), step3 = $('#adm-reset-step3');
    var err1  = $('#adm-reset-err1'),  err2  = $('#adm-reset-err2');

    forgotBtn.addEventListener('click', function(){
      var visible = resetPanel.style.display !== 'none';
      resetPanel.style.display = visible ? 'none' : 'block';
      step1.style.display='block'; step2.style.display='none'; step3.style.display='none';
      err1.textContent=''; err2.textContent='';
      $('#adm-reset-email').value='';
    });

    $('#adm-reset-verify').addEventListener('click', function(){
      var entered = ($('#adm-reset-email').value||'').trim().toLowerCase();
      var stored  = (S.getAdminEmail ? S.getAdminEmail() : '').toLowerCase();
      if (!stored) {
        // No email configured yet — first use, accept and store it
        if (!entered || !/^[^@]+@[^@]+\.[^@]+$/.test(entered)) {
          err1.textContent = t('adm.reset.err.email') || 'Adresse e-mail invalide.'; return;
        }
        if (S.setAdminEmail) S.setAdminEmail(entered);
        step1.style.display='none'; step2.style.display='block'; err1.textContent='';
      } else if (entered === stored) {
        step1.style.display='none'; step2.style.display='block'; err1.textContent='';
      } else {
        err1.textContent = t('adm.reset.err.nomatch') || 'Adresse e-mail incorrecte.';
      }
    });

    $('#adm-reset-save').addEventListener('click', function(){
      var np = ($('#adm-reset-new').value||'').trim();
      var nc = ($('#adm-reset-confirm').value||'').trim();
      if (!np || np.length < 3) { err2.textContent = t('adm.sec.pw.err.match') || 'Code trop court (3 caractères minimum).'; return; }
      if (np !== nc) { err2.textContent = t('adm.sec.pw.err.match') || 'Les codes ne correspondent pas.'; return; }
      if (S.setAdminCode) S.setAdminCode(np);
      step2.style.display='none'; step3.style.display='block'; err2.textContent='';
    });

    $('#adm-reset-back').addEventListener('click', function(){
      resetPanel.style.display='none';
      step1.style.display='block'; step2.style.display='none'; step3.style.display='none';
      f.code.value=''; f.code.focus();
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
    var ids = S.publishedServices ? S.publishedServices().map(function(s){ return s.id; }) : SVC;
    return '<select name="'+name+'"><option value="">—</option>'+ ids.map(function(id){
      return '<option value="'+id+'"'+(id===val?' selected':'')+'>'+esc(svcName(id))+'</option>'; }).join('') +'</select>';
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
            '<div class="adm-item__actions">'+
              s.cities.map(function(city){ return '<button class="btn-mini" data-delcity="'+s.id+'" data-city="'+esc(city)+'">✕ '+esc(cityName(city))+'</button>'; }).join('')+
              (function(){
                var available = S.cityIds().filter(function(c){ return s.cities.indexOf(c) === -1; });
                if(!available.length) return '';
                return '<select data-addcitysel="'+s.id+'" style="font-size:.8rem;padding:2px 4px">'+
                  available.map(function(c){ return '<option value="'+esc(c)+'">'+esc(cityName(c))+'</option>'; }).join('')+
                  '</select>'+
                  '<button class="btn-mini" data-addcity="'+s.id+'">+</button>';
              })()+
              '<button class="btn-mini" data-history="'+s.id+'">'+esc(t('adm.s.history'))+'</button>'+
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
    [].slice.call(panel.querySelectorAll('[data-delcity]')).forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); S.removeSubscriberCity(b.dataset.delcity, b.dataset.city); render(); });
    });
    [].slice.call(panel.querySelectorAll('[data-addcity]')).forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        var sel = panel.querySelector('[data-addcitysel="'+b.dataset.addcity+'"]');
        if(!sel) return;
        S.addSubscriberCity(b.dataset.addcity, sel.value);
        render();
      });
    });
    [].slice.call(panel.querySelectorAll('[data-delsub]')).forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); S.removeSubscriber(b.dataset.delsub); render(); });
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
    [].slice.call(panel.querySelectorAll('[data-approve]')).forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.approve;
        S.setTestimonialStatus(id, 'approved');
        var r = S.testimonials().filter(function(x){ return x.id===id; })[0];
        if (!r || !r.email) { toast(t('adm.r.noemail')); return; }
        if (S.hasCouponType && S.hasCouponType(r.email, 'review10')) { toast(t('adm.r.rewardskip')); return; }
        var coupon = S.addCoupon({ type:'review10', percent:10, email:r.email, name:r.name, testimonialId:id, prefix:'MERCI' });
        fetch('/api/contact', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            type:'coupon', name: r.name||'Cliente', email:r.email, clientEmail:r.email,
            code:coupon.code, percent:coupon.percent, reason:'avis', message:'Bon de réduction avis'
          })
        }).catch(function(){});
        toast(fill(t('adm.r.rewardsent'), { email:r.email }));
      });
    });
    [].slice.call(panel.querySelectorAll('[data-unpub]')).forEach(function(b){ b.addEventListener('click',function(){ S.setTestimonialStatus(b.dataset.unpub,'pending'); }); });
    [].slice.call(panel.querySelectorAll('[data-delrev]')).forEach(function(b){ b.addEventListener('click',function(){ S.removeTestimonial(b.dataset.delrev); }); });
  }

  /* ====================== PACKS & FIDÉLITÉ TAB ====================== */
  function sendCoupon(email, name, percent, reason, message){
    var coupon = S.addCoupon({ type: percent>=100?'loyalty-free':'custom', percent:percent, email:email, name:name, prefix: percent>=100?'FIDELITE':'CADEAU' });
    fetch('/api/contact', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        type:'coupon', name: name||'Cliente', email:email, clientEmail:email,
        code: coupon.code, percent: percent, reason: reason||'cadeau', message: message||'Code promo'
      })
    }).catch(function(){});
    return coupon;
  }
  function clientAppointmentStats(){
    var byEmail = {};
    S.appointments().forEach(function(a){
      var email = (a.email||'').trim().toLowerCase();
      if(!email) return;
      if(!byEmail[email]) byEmail[email] = { email:email, name:a.name||email, count:0 };
      byEmail[email].count++;
      if(a.name) byEmail[email].name = a.name;
    });
    return Object.keys(byEmail).map(function(k){ return byEmail[k]; }).sort(function(a,b){ return b.count-a.count; });
  }
  function renderPacks(){
    var panel = $('[data-panel="packs"]'); if(!panel) return;
    var packs = S.packs ? S.packs() : [];
    var clients = clientAppointmentStats();
    var coupons = S.coupons ? S.coupons().slice().sort(function(a,b){ return b.createdAt-a.createdAt; }) : [];

    function packItem(p){
      var done = p.sessionsUsed >= p.sessionsTotal;
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1.05rem">'+esc(p.name||p.email)+
          (done?' <span class="pill-tag ok">'+esc(t('adm.pk.done'))+'</span>':'')+'</div>'+
        '<div class="adm-item__meta"><span>'+esc(p.email)+'</span><span class="svc">'+esc(svcName(p.service))+'</span>'+
          '<span>'+p.sessionsUsed+' / '+p.sessionsTotal+' '+esc(t('adm.pk.used'))+'</span>'+
          '<span>'+p.price+' €</span></div></div>'+
        '<div class="adm-item__actions">'+
          (done?'':'<button class="btn-mini solid" data-usepack="'+p.id+'">'+esc(t('adm.pk.useSession'))+'</button>')+
          (p.sessionsUsed>0?'<button class="btn-mini" data-unusepack="'+p.id+'">'+esc(t('adm.pk.undo'))+'</button>':'')+
          '<button class="btn-mini danger" data-delpack="'+p.id+'">'+esc(t('adm.pk.del'))+'</button>'+
        '</div></div>';
    }
    function clientItem(c){
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1.05rem">'+esc(c.name)+
          ' <span class="pill-tag">'+c.count+' '+esc(t('adm.lo.sessions'))+'</span></div>'+
        '<div class="adm-item__meta"><span>'+esc(c.email)+'</span></div></div>'+
        '<div class="adm-item__actions">'+
          '<button class="btn-mini solid" data-sendfree="'+esc(c.email)+'" data-name="'+esc(c.name||'')+'">'+esc(t('adm.lo.sendfree'))+'</button>'+
          '<div style="display:flex;gap:6px;align-items:center">'+
            '<input type="number" class="cl-pct" value="10" min="1" max="99" style="width:56px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:.85rem">'+
            '<button class="btn-mini" data-sendpct="'+esc(c.email)+'" data-name="'+esc(c.name||'')+'">'+esc(t('adm.lo.sendpct'))+'</button>'+
          '</div>'+
        '</div></div>';
    }
    function couponItem(c){
      var typeLabel = c.type==='review10' ? t('adm.co.type.review10') : (c.type==='loyalty-free' ? t('adm.co.type.loyaltyfree') : t('adm.co.type.custom'));
      return '<div class="adm-item"><div class="adm-item__main">'+
        '<div class="adm-item__title" style="font-size:1rem;font-family:var(--body);font-weight:700;letter-spacing:.04em">'+esc(c.code)+
          ' <span class="pill-tag '+(c.used?'':'ok')+'">'+esc(c.used?t('adm.co.used'):t('adm.co.active'))+'</span></div>'+
        '<div class="adm-item__meta"><span>'+esc(typeLabel)+' · '+c.percent+'%</span><span>'+esc(c.email)+'</span></div></div>'+
        '<div class="adm-item__actions">'+
          '<button class="btn-mini" data-copycode="'+esc(c.code)+'">'+esc(t('adm.co.copy'))+'</button>'+
          '<button class="btn-mini danger" data-delcoupon="'+c.id+'">'+esc(t('adm.co.del'))+'</button>'+
        '</div></div>';
    }

    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.pk.add'))+'</h3>'+
        '<form class="adm-form" data-addpack>'+
          '<div><label>'+esc(t('adm.pk.name'))+'</label><input name="pname" required></div>'+
          '<div><label>'+esc(t('adm.pk.email'))+'</label><input name="pemail" type="email" required></div>'+
          '<div><label>'+esc(t('adm.pk.service'))+'</label>'+svcSelect('pservice','drainage')+'</div>'+
          '<div class="row2">'+
            '<div><label>'+esc(t('adm.pk.sessions'))+'</label><input type="number" name="psessions" value="5" min="1"></div>'+
            '<div><label>'+esc(t('adm.pk.price'))+'</label><input type="number" name="pprice" value="600" min="0"></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.pk.save'))+'</button>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.pk.list'))+'</div>'+
          '<div class="adm-list">'+(packs.length?packs.map(packItem).join(''):'<div class="adm-empty">'+esc(t('adm.pk.none'))+'</div>')+'</div>'+
        '</div></div>'+
      '<div class="adm-cols" style="margin-top:32px"><div class="adm-card">'+
        '<h3>'+esc(t('adm.co.add'))+'</h3>'+
        '<form class="adm-form" data-addcoupon>'+
          '<div><label>'+esc(t('adm.pk.name'))+'</label><input name="cname"></div>'+
          '<div><label>'+esc(t('adm.pk.email'))+'</label><input name="cemail" type="email" required></div>'+
          '<div><label>'+esc(t('adm.co.percent'))+'</label><input type="number" name="cpercent" value="10" min="1" max="100">'+
            '<small style="color:var(--ink-3);font-size:.78rem">'+esc(t('adm.co.percenthint'))+'</small></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.co.save'))+'</button>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.co.title'))+'</div>'+
          '<div class="adm-list">'+(coupons.length?coupons.map(couponItem).join(''):'<div class="adm-empty">'+esc(t('adm.co.none'))+'</div>')+'</div>'+
        '</div></div>'+
      '<div class="adm-sub" style="margin-top:32px">'+esc(t('adm.lo.title'))+'</div>'+
      '<div class="adm-list">'+(clients.length?clients.map(clientItem).join(''):'<div class="adm-empty">'+esc(t('adm.lo.none'))+'</div>')+'</div>';

    var f = $('[data-addpack]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      if(!(fd.get('pemail')||'').trim()) return;
      S.addPack({ name:fd.get('pname'), email:fd.get('pemail'), service:fd.get('pservice'),
        sessionsTotal:+(fd.get('psessions')||5), price:+(fd.get('pprice')||0) });
      f.reset();
    });
    [].slice.call(panel.querySelectorAll('[data-usepack]')).forEach(function(b){ b.addEventListener('click', function(){ S.usePackSession(b.dataset.usepack); }); });
    [].slice.call(panel.querySelectorAll('[data-unusepack]')).forEach(function(b){ b.addEventListener('click', function(){ S.unusePackSession(b.dataset.unusepack); }); });
    [].slice.call(panel.querySelectorAll('[data-delpack]')).forEach(function(b){ b.addEventListener('click', function(){ if(confirm(t('adm.pk.delconfirm'))) S.removePack(b.dataset.delpack); }); });

    var cf = $('[data-addcoupon]', panel);
    cf.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(cf);
      var email = (fd.get('cemail')||'').trim();
      if(!email) return;
      var pct = Math.min(100, Math.max(1, +(fd.get('cpercent')||10)));
      sendCoupon(email, (fd.get('cname')||'').trim(), pct, 'cadeau', 'Code promo créé par Eloïse');
      toast(fill(t('adm.co.createok'), { email:email }));
      cf.reset();
    });

    [].slice.call(panel.querySelectorAll('[data-sendfree]')).forEach(function(b){
      b.addEventListener('click', function(){
        var email = b.dataset.sendfree, name = b.dataset.name;
        if(!confirm(fill(t('adm.lo.sendfreeconfirm'), { name: name || email }))) return;
        sendCoupon(email, name, 100, 'fidelite', 'Séance offerte');
        toast(fill(t('adm.lo.sendfreeok'), { email:email }));
      });
    });
    [].slice.call(panel.querySelectorAll('[data-sendpct]')).forEach(function(b){
      b.addEventListener('click', function(){
        var email = b.dataset.sendpct, name = b.dataset.name;
        var row = b.closest('.adm-item__actions');
        var pct = Math.min(99, Math.max(1, +(row.querySelector('.cl-pct').value || 10)));
        if(!confirm(fill(t('adm.lo.sendpctconfirm'), { name: name || email, percent: pct }))) return;
        sendCoupon(email, name, pct, 'cadeau', 'Code promo -' + pct + '%');
        toast(fill(t('adm.lo.sendpctok'), { email:email, percent: pct }));
      });
    });
    [].slice.call(panel.querySelectorAll('[data-copycode]')).forEach(function(b){ b.addEventListener('click', function(){ copyText(b.dataset.copycode); toast(t('adm.n.copied')); }); });
    [].slice.call(panel.querySelectorAll('[data-delcoupon]')).forEach(function(b){ b.addEventListener('click', function(){ if(confirm(t('adm.co.delconfirm'))) S.removeCoupon(b.dataset.delcoupon); }); });
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

    function item(s, idx, total){
      var pub = s.published !== false;
      return '<div class="adm-item'+(pub?'':' is-off')+'">'+
        '<div class="adm-thumb"><img src="'+esc(S.serviceImg(s.id))+'" alt=""></div>'+
        '<div class="adm-item__main">'+
          '<div class="adm-item__title" style="font-size:1.1rem">'+esc(S.serviceName(s.id))+
            ' <span class="pill-tag '+(s.builtin?'':'ok')+'">'+esc(t(s.builtin?'adm.sv.builtin':'adm.sv.custom'))+'</span></div>'+
          '<div class="adm-item__meta"><span class="svc">'+esc(S.serviceTag(s.id))+'</span>'+
            S.serviceDurations(s.id).map(function(o){ return '<span>'+o.min+' min — '+o.price+' €</span>'; }).join('')+'</div>'+
        '</div>'+
        '<div class="adm-item__actions">'+
          '<label class="sw" title="'+esc(t('adm.sv.published'))+'"><input type="checkbox" data-togglesvc="'+s.id+'"'+(pub?' checked':'')+'><span></span></label>'+
          '<div class="adm-row-actions">'+
            (idx>0?'<button class="btn-mini" data-upsvc="'+s.id+'" title="Monter">↑</button>':'')+
            (idx<total-1?'<button class="btn-mini" data-downsvc="'+s.id+'" title="Descendre">↓</button>':'')+
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
          '<div><label>'+esc(t('adm.sv.category'))+'</label><select name="category">'+
            '<option value="massage">'+esc(t('rv.cat.massage'))+'</option>'+
            '<option value="drainage">'+esc(t('rv.cat.drainage'))+'</option>'+
            '<option value="yoga">'+esc(t('rv.cat.yoga'))+'</option>'+
          '</select></div>'+
          '<div><label>'+esc(t('adm.sv.durations'))+'</label>'+
            '<div data-new-durations style="display:grid;gap:8px;margin-top:6px">'+
              '<div style="display:flex;gap:8px;align-items:center">'+
                '<input type="number" class="nd-min" placeholder="min" value="60" style="width:72px"> min '+
                '<input type="number" class="nd-price" placeholder="€" value="70" style="width:72px"> €'+
                '<button type="button" class="btn-mini danger nd-del">×</button>'+
              '</div>'+
            '</div>'+
            '<button type="button" class="btn-mini" data-new-addur style="margin-top:6px">+ '+esc(t('adm.sv.addDur'))+'</button>'+
          '</div>'+
          '<div><label>'+esc(t('adm.sv.img'))+'</label><select name="asset">'+
            ASSETS.map(function(a){ return '<option value="'+a+'">'+esc(a.replace('assets/','').replace('.png',''))+'</option>'; }).join('')+'</select></div>'+
          '<div><label>'+esc(t('adm.sv.url'))+'</label><input name="url" placeholder="https://…"></div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.sv.save'))+'</button>'+
          '<p style="color:var(--ink-3);font-size:.82rem;line-height:1.4">'+esc(t('adm.sv.hint'))+'</p>'+
        '</form></div>'+
        '<div><div class="adm-sub">'+esc(t('adm.sv.list'))+'</div>'+
          '<div class="adm-list">'+(list.length?list.map(function(s,i){ return item(s,i,list.length); }).join(''):'<div class="adm-empty">'+esc(t('adm.sv.none'))+'</div>')+'</div>'+
        '</div></div>';

    // add-service durations editor
    $('[data-new-addur]', panel).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input type="number" class="nd-min" placeholder="min" style="width:72px"> min '+
        '<input type="number" class="nd-price" placeholder="€" style="width:72px"> €'+
        '<button type="button" class="btn-mini danger nd-del">×</button>';
      row.querySelector('.nd-del').addEventListener('click',function(){ row.remove(); });
      $('[data-new-durations]', panel).appendChild(row);
    });
    [].slice.call(panel.querySelectorAll('.nd-del')).forEach(function(b){
      b.addEventListener('click', function(){ b.closest('div').remove(); });
    });

    var f = $('[data-addsvc]', panel);
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(f);
      if(!(fd.get('name')||'').trim()) return;
      var img = (fd.get('url')||'').trim() || fd.get('asset');
      var durRows = [].slice.call($('[data-new-durations]', f).querySelectorAll('div'));
      var durations = durRows.map(function(row){
        return { min:+(row.querySelector('.nd-min').value)||60, price:+(row.querySelector('.nd-price').value)||0 };
      }).filter(function(o){ return o.min>0; });
      S.addService({ name:fd.get('name'), tag:fd.get('tag'), category:fd.get('category')||'massage', durations:durations.length?durations:[{min:60,price:70}], img:img, published:true });
      f.reset();
    });
    [].slice.call(panel.querySelectorAll('[data-togglesvc]')).forEach(function(b){ b.addEventListener('change', function(){ S.setServicePublished(b.dataset.togglesvc, b.checked); }); });
    [].slice.call(panel.querySelectorAll('[data-editsvc]')).forEach(function(b){ b.addEventListener('click', function(){ openServiceEdit(b.dataset.editsvc); }); });
    [].slice.call(panel.querySelectorAll('[data-delsvc]')).forEach(function(b){ b.addEventListener('click', function(){ if(confirm(t('adm.sv.delconfirm'))) S.removeService(b.dataset.delsvc); }); });
    [].slice.call(panel.querySelectorAll('[data-upsvc]')).forEach(function(b){ b.addEventListener('click', function(){ if(S.reorderService) S.reorderService(b.dataset.upsvc, -1); }); });
    [].slice.call(panel.querySelectorAll('[data-downsvc]')).forEach(function(b){ b.addEventListener('click', function(){ if(S.reorderService) S.reorderService(b.dataset.downsvc, 1); }); });
  }

  function translateBlock(lang, label, s){
    var tr = (s.translations && s.translations[lang]) || {};
    var joinLines = function(arr){ return (arr||[]).join('\n'); };
    return '<div data-e-lang-'+lang+' style="border-top:1px solid var(--line);padding-top:16px">'+
      '<div class="adm-sub">'+esc(label)+'</div>'+
      '<div><label>'+esc(t('adm.sv.name'))+'</label><input class="e-'+lang+'-name" value="'+esc(tr.name||'')+'"></div>'+
      '<div><label>'+esc(t('adm.sv.tag'))+'</label><input class="e-'+lang+'-tag" value="'+esc(tr.tag||'')+'"></div>'+
      ((s.offers && s.offers.length) ? '<div><label>'+esc(t('adm.sv.offers'))+' — '+esc(t('adm.sv.onePerLine'))+'</label><textarea class="e-'+lang+'-offers" style="min-height:60px">'+esc(joinLines(tr.offerLabels))+'</textarea></div>' : '')+
      '<div><label>'+esc(t('adm.sv.description'))+'</label><textarea class="e-'+lang+'-desc" style="min-height:80px">'+esc(tr.description||'')+'</textarea></div>'+
      '<div><label>'+esc(t('adm.sv.benefitsPhysical'))+' — '+esc(t('adm.sv.onePerLine'))+'</label><textarea class="e-'+lang+'-physical" style="min-height:70px">'+esc(joinLines(tr.benefitsPhysical))+'</textarea></div>'+
      '<div><label>'+esc(t('adm.sv.benefitsEmotional'))+' — '+esc(t('adm.sv.onePerLine'))+'</label><textarea class="e-'+lang+'-emotional" style="min-height:70px">'+esc(joinLines(tr.benefitsEmotional))+'</textarea></div>'+
      '<div><label>'+esc(t('adm.sv.idealFor'))+' — '+esc(t('adm.sv.onePerLine'))+'</label><textarea class="e-'+lang+'-idealfor" style="min-height:70px">'+esc(joinLines(tr.idealFor))+'</textarea></div>'+
      '<div><label>'+esc(t('adm.sv.note'))+'</label><textarea class="e-'+lang+'-note" style="min-height:60px">'+esc(tr.note||'')+'</textarea></div>'+
    '</div>';
  }

  function openServiceEdit(id){
    var s = S.service(id); if(!s) return;
    ensureModal();
    var box = $('.adm-modal__box', modal);
    var customUrl = (s.img && s.img.indexOf('assets/') !== 0) ? s.img : '';
    box.innerHTML =
      '<h3>'+esc(t('adm.sv.editTitle'))+'</h3>'+
      '<div class="adm-form" style="margin-top:10px">'+
        '<div><label>'+esc(t('adm.sv.name'))+'</label><input data-e-name value="'+esc(s.name||'')+'"></div>'+
        '<div><label>'+esc(t('adm.sv.tag'))+'</label><input data-e-tag value="'+esc(s.tag||'')+'"></div>'+
        '<div><label>'+esc(t('adm.sv.category'))+'</label><select data-e-category>'+
          ['massage','drainage','yoga'].map(function(c){
            var sel = (s.category||'massage')===c?' selected':'';
            return '<option value="'+c+'"'+sel+'>'+esc(t('rv.cat.'+c))+'</option>';
          }).join('')+
        '</select></div>'+
        '<div><label>'+esc(t('adm.sv.durations'))+'</label>'+
          '<div data-e-durations style="display:grid;gap:8px;margin-top:6px">'+
            S.serviceDurations(id).map(function(o){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input type="number" class="e-dur-min" placeholder="min" value="'+o.min+'" style="width:72px"> min'+
                '<input type="number" class="e-dur-price" placeholder="€" value="'+o.price+'" style="width:72px"> €'+
                '<button type="button" class="btn-mini danger e-dur-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addur style="margin-top:8px">+ '+esc(t('adm.sv.addDur'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.offers'))+'</label>'+
          '<div data-e-offers style="display:grid;gap:8px;margin-top:6px">'+
            S.serviceOffers(id).map(function(o){
              return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
                '<input class="e-off-label" placeholder="'+esc(t('adm.sv.offerLabel'))+'" value="'+esc(o.label)+'" style="flex:1;min-width:160px">'+
                '<input type="number" class="e-off-price" placeholder="€" value="'+o.price+'" style="width:72px"> €'+
                '<span style="font-size:.78rem;color:var(--ink-2)">'+esc(t('adm.sv.offerInsteadOf'))+'</span>'+
                '<input type="number" class="e-off-regular" placeholder="€" value="'+o.regularPrice+'" style="width:72px"> €'+
                '<button type="button" class="btn-mini danger e-off-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addoff style="margin-top:8px">+ '+esc(t('adm.sv.addOffer'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.options'))+'</label>'+
          '<div data-e-options style="display:grid;gap:6px;margin-top:6px">'+
            S.serviceOptions(id).map(function(o){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input class="e-opt-txt" value="'+esc(o)+'" style="flex:1">'+
                '<button type="button" class="btn-mini danger e-opt-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addopt style="margin-top:6px">+ '+esc(t('adm.sv.addOption'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.description'))+'</label>'+
          '<textarea data-e-desc style="min-height:100px">'+esc(s.description||'')+'</textarea></div>'+
        '<div><label>'+esc(t('adm.sv.benefits'))+'</label>'+
          '<div data-e-benefits style="display:grid;gap:6px;margin-top:6px">'+
            (s.benefits||[]).map(function(b){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input class="e-ben-txt" value="'+esc(b)+'" style="flex:1">'+
                '<button type="button" class="btn-mini danger e-ben-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addben style="margin-top:6px">+ '+esc(t('adm.sv.addBenefit'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.benefitsPhysical'))+'</label>'+
          '<div data-e-ben-phys style="display:grid;gap:6px;margin-top:6px">'+
            (s.benefitsPhysical||[]).map(function(b){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input class="e-ben-phys-txt" value="'+esc(b)+'" style="flex:1">'+
                '<button type="button" class="btn-mini danger e-ben-phys-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addbenphys style="margin-top:6px">+ '+esc(t('adm.sv.addBenefit'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.benefitsEmotional'))+'</label>'+
          '<div data-e-ben-emot style="display:grid;gap:6px;margin-top:6px">'+
            (s.benefitsEmotional||[]).map(function(b){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input class="e-ben-emot-txt" value="'+esc(b)+'" style="flex:1">'+
                '<button type="button" class="btn-mini danger e-ben-emot-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addbenemot style="margin-top:6px">+ '+esc(t('adm.sv.addBenefit'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.idealFor'))+'</label>'+
          '<div data-e-idealfor style="display:grid;gap:6px;margin-top:6px">'+
            (s.idealFor||[]).map(function(b){
              return '<div style="display:flex;gap:8px;align-items:center">'+
                '<input class="e-idealfor-txt" value="'+esc(b)+'" style="flex:1">'+
                '<button type="button" class="btn-mini danger e-idealfor-del">×</button></div>';
            }).join('')+
          '</div>'+
          '<button type="button" class="btn-mini" data-e-addidealfor style="margin-top:6px">+ '+esc(t('adm.sv.addBenefit'))+'</button>'+
        '</div>'+
        '<div><label>'+esc(t('adm.sv.note'))+'</label>'+
          '<textarea data-e-note style="min-height:80px">'+esc(s.note||'')+'</textarea></div>'+
        '<div style="border-top:1px solid var(--line);padding-top:16px">'+
          '<button type="button" class="btn-mini" data-e-translate>🌐 '+esc(t('adm.sv.translate'))+'</button> '+
          '<span data-e-translate-status style="font-size:.8rem;color:var(--ink-3)"></span>'+
        '</div>'+
        translateBlock('de', 'Allemand', s) +
        translateBlock('en', 'Anglais', s) +
        '<div><label>'+esc(t('adm.sv.img'))+'</label><select data-e-asset>'+
          ASSETS.map(function(a){ return '<option value="'+a+'"'+(a===s.img?' selected':'')+'>'+esc(a.replace('assets/','').replace('.png',''))+'</option>'; }).join('')+'</select></div>'+
        '<div><label>'+esc(t('adm.sv.url'))+'</label><input data-e-url placeholder="https://…" value="'+esc(customUrl)+'"></div>'+
        '<div class="adm-thumb adm-thumb--lg"><img src="'+esc(S.serviceImg(id))+'" alt=""></div>'+
      '</div>'+
      '<div class="adm-modal__actions"><button class="btn btn-primary btn-sm" data-e-save>'+esc(t('adm.sv.saveEdit'))+'</button>'+
        '<button class="btn-mini" data-close>'+esc(t('adm.h.close'))+'</button></div>';
    modal.classList.add('on');
    $('[data-e-addur]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input type="number" class="e-dur-min" placeholder="min" style="width:72px"> min'+
        '<input type="number" class="e-dur-price" placeholder="€" style="width:72px"> €'+
        '<button type="button" class="btn-mini danger e-dur-del">×</button>';
      row.querySelector('.e-dur-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-durations]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-dur-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addoff]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap';
      row.innerHTML='<input class="e-off-label" placeholder="'+esc(t('adm.sv.offerLabel'))+'" style="flex:1;min-width:160px">'+
        '<input type="number" class="e-off-price" placeholder="€" style="width:72px"> €'+
        '<span style="font-size:.78rem;color:var(--ink-2)">'+esc(t('adm.sv.offerInsteadOf'))+'</span>'+
        '<input type="number" class="e-off-regular" placeholder="€" style="width:72px"> €'+
        '<button type="button" class="btn-mini danger e-off-del">×</button>';
      row.querySelector('.e-off-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-offers]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-off-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addopt]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input class="e-opt-txt" style="flex:1">'+
        '<button type="button" class="btn-mini danger e-opt-del">×</button>';
      row.querySelector('.e-opt-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-options]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-opt-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addben]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input class="e-ben-txt" style="flex:1">'+
        '<button type="button" class="btn-mini danger e-ben-del">×</button>';
      row.querySelector('.e-ben-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-benefits]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-ben-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addbenphys]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input class="e-ben-phys-txt" style="flex:1">'+
        '<button type="button" class="btn-mini danger e-ben-phys-del">×</button>';
      row.querySelector('.e-ben-phys-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-ben-phys]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-ben-phys-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addbenemot]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input class="e-ben-emot-txt" style="flex:1">'+
        '<button type="button" class="btn-mini danger e-ben-emot-del">×</button>';
      row.querySelector('.e-ben-emot-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-ben-emot]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-ben-emot-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-addidealfor]',box).addEventListener('click', function(){
      var row = document.createElement('div'); row.style.cssText='display:flex;gap:8px;align-items:center';
      row.innerHTML='<input class="e-idealfor-txt" style="flex:1">'+
        '<button type="button" class="btn-mini danger e-idealfor-del">×</button>';
      row.querySelector('.e-idealfor-del').addEventListener('click',function(){ row.remove(); });
      $('[data-e-idealfor]',box).appendChild(row);
    });
    [].slice.call(box.querySelectorAll('.e-idealfor-del')).forEach(function(b){
      b.addEventListener('click',function(){ b.closest('div').remove(); });
    });
    $('[data-e-translate]',box).addEventListener('click', function(){
      var statusEl = $('[data-e-translate-status]',box);
      statusEl.textContent = t('adm.sv.translating');
      var name = $('[data-e-name]',box).value;
      var tag = $('[data-e-tag]',box).value;
      var desc = $('[data-e-desc]',box).value;
      var physItems = [].slice.call($('[data-e-ben-phys]',box).querySelectorAll('.e-ben-phys-txt')).map(function(i){ return i.value; });
      var emotItems = [].slice.call($('[data-e-ben-emot]',box).querySelectorAll('.e-ben-emot-txt')).map(function(i){ return i.value; });
      var idealItems = [].slice.call($('[data-e-idealfor]',box).querySelectorAll('.e-idealfor-txt')).map(function(i){ return i.value; });
      var offerItems = [].slice.call($('[data-e-offers]',box).querySelectorAll('.e-off-label')).map(function(i){ return i.value; });
      var note = $('[data-e-note]',box).value;
      var texts = [name, tag, desc].concat(physItems, emotItems, idealItems, offerItems, [note]);
      fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: texts })
      }).then(function(r){ return r.json(); }).then(function(data){
        if (!data || data.error) { statusEl.textContent = t('adm.sv.translateError') + (data && data.error ? ' (' + data.error + ')' : ''); return; }
        ['de','en'].forEach(function(lang){
          var arr = data[lang] || [];
          var i = 0;
          $('.e-'+lang+'-name',box).value = arr[i++] || '';
          $('.e-'+lang+'-tag',box).value = arr[i++] || '';
          $('.e-'+lang+'-desc',box).value = arr[i++] || '';
          $('.e-'+lang+'-physical',box).value = physItems.map(function(){ return arr[i++] || ''; }).join('\n');
          $('.e-'+lang+'-emotional',box).value = emotItems.map(function(){ return arr[i++] || ''; }).join('\n');
          $('.e-'+lang+'-idealfor',box).value = idealItems.map(function(){ return arr[i++] || ''; }).join('\n');
          var offersEl = $('.e-'+lang+'-offers',box);
          if (offersEl) offersEl.value = offerItems.map(function(){ return arr[i++] || ''; }).join('\n');
          else i += offerItems.length;
          $('.e-'+lang+'-note',box).value = arr[i++] || '';
        });
        statusEl.textContent = t('adm.sv.translateDone');
      }).catch(function(){ statusEl.textContent = t('adm.sv.translateError'); });
    });
    $('[data-e-save]',box).addEventListener('click', function(){
      var img = ($('[data-e-url]',box).value||'').trim() || $('[data-e-asset]',box).value;
      var rows = [].slice.call($('[data-e-durations]',box).querySelectorAll('div'));
      var durations = rows.map(function(row){
        return { min:+(row.querySelector('.e-dur-min').value)||60, price:+(row.querySelector('.e-dur-price').value)||0 };
      }).filter(function(o){ return o.min > 0; });
      var benInputs = [].slice.call($('[data-e-benefits]',box).querySelectorAll('.e-ben-txt'));
      var benefits = benInputs.map(function(i){ return i.value.trim(); }).filter(Boolean);
      var optInputs = [].slice.call($('[data-e-options]',box).querySelectorAll('.e-opt-txt'));
      var options = optInputs.map(function(i){ return i.value.trim(); }).filter(Boolean);
      var benPhysInputs = [].slice.call($('[data-e-ben-phys]',box).querySelectorAll('.e-ben-phys-txt'));
      var benefitsPhysical = benPhysInputs.map(function(i){ return i.value.trim(); }).filter(Boolean);
      var benEmotInputs = [].slice.call($('[data-e-ben-emot]',box).querySelectorAll('.e-ben-emot-txt'));
      var benefitsEmotional = benEmotInputs.map(function(i){ return i.value.trim(); }).filter(Boolean);
      var idealForInputs = [].slice.call($('[data-e-idealfor]',box).querySelectorAll('.e-idealfor-txt'));
      var idealFor = idealForInputs.map(function(i){ return i.value.trim(); }).filter(Boolean);
      var offRows = [].slice.call($('[data-e-offers]',box).querySelectorAll('div'));
      var offers = offRows.map(function(row, i){
        var label = (row.querySelector('.e-off-label').value||'').trim();
        return { id:'o'+i, label:label, price:+(row.querySelector('.e-off-price').value)||0,
          regularPrice:+(row.querySelector('.e-off-regular').value)||0 };
      }).filter(function(o){ return o.label; });
      var note = ($('[data-e-note]',box).value||'').trim();
      var catEl = box.querySelector('[data-e-category]');
      var splitLines = function(v){ return (v||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean); };
      var translations = {};
      ['de','en'].forEach(function(lang){
        var offersEl = $('.e-'+lang+'-offers',box);
        translations[lang] = {
          name: ($('.e-'+lang+'-name',box).value||'').trim(),
          tag: ($('.e-'+lang+'-tag',box).value||'').trim(),
          description: ($('.e-'+lang+'-desc',box).value||'').trim(),
          benefitsPhysical: splitLines($('.e-'+lang+'-physical',box).value),
          benefitsEmotional: splitLines($('.e-'+lang+'-emotional',box).value),
          idealFor: splitLines($('.e-'+lang+'-idealfor',box).value),
          offerLabels: offersEl ? splitLines(offersEl.value) : [],
          note: ($('.e-'+lang+'-note',box).value||'').trim()
        };
      });
      S.updateService(id, { name:$('[data-e-name]',box).value, tag:$('[data-e-tag]',box).value, category:catEl?catEl.value:'massage',
        durations: durations.length ? durations : S.serviceDurations(id),
        description: ($('[data-e-desc]',box).value||'').trim(),
        benefits: benefits, options: options, offers: offers, img:img,
        benefitsPhysical: benefitsPhysical, benefitsEmotional: benefitsEmotional, idealFor: idealFor, note: note,
        translations: translations });
      close();
    });
  }

  /* ====================== RENDEZ-VOUS TAB ====================== */
  function renderAppointments(){
    var panel = $('[data-panel="rdv"]'); if(!panel) return;
    var all = S.appointments ? S.appointments() : [];
    var todayStr = today();
    var upcoming = all.filter(function(a){ return a.dateISO >= todayStr; })
      .sort(function(a,b){ return a.dateISO < b.dateISO ? -1 : 1; });
    var past = all.filter(function(a){ return a.dateISO < todayStr; })
      .sort(function(a,b){ return a.dateISO < b.dateISO ? 1 : -1; });

    function apptRow(a){
      var bits = [];
      if(a.service) bits.push('<span class="svc">'+esc(svcName(a.service))+'</span>');
      if(a.duration) bits.push('<span>'+a.duration+' min</span>');
      if(a.time) bits.push('<span>'+esc(a.time)+'</span>');
      if(a.price) bits.push('<span style="font-weight:700;color:var(--accent)">'+a.price+' €</span>');
      if(a.offerLabel) bits.push('<span class="pill-tag warn">'+esc(a.offerLabel)+'</span>');
      if(a.promoCode) bits.push('<span class="pill-tag ok">'+esc(a.promoCode)+'</span>');
      return '<div class="adm-item" style="flex-direction:column;align-items:stretch;gap:8px">'+
        '<div style="display:flex;align-items:flex-start;gap:12px">'+
          '<div class="adm-item__main" style="flex:1">'+
            '<div class="adm-item__title" style="font-size:1.05rem">'+esc(a.name||'—')+
              ' <span style="color:var(--ink-2);font-family:var(--body);font-weight:400;font-size:.88rem">'+esc(a.email||'')+'</span></div>'+
            '<div class="adm-item__meta">'+
              '<span>'+esc(cityName(a.city))+'</span>'+
              '<span>'+esc(fmtDate(a.dateISO))+'</span>'+
              bits.join('')+
            '</div>'+
          '</div>'+
          '<div class="adm-item__actions" style="flex-shrink:0">'+
            (a.email?'<a class="btn-mini" href="mailto:'+esc(a.email)+'">'+esc(t('adm.rdv.reply'))+'</a>':'')+
            '<button class="btn-mini" data-editrdv="'+a.id+'">✏ Modifier</button>'+
            (a.confirmed
              ? '<span class="pill-tag ok" style="font-size:.72rem">'+esc(t('adm.rdv.confirmed'))+'</span>'
              : '<button class="btn-mini solid" data-confirmrdv="'+a.id+'" data-email="'+esc(a.email||'')+'" data-name="'+esc(a.name||'')+'" data-service="'+esc(svcName(a.service)||'')+'" data-location="'+esc(cityName(a.city)||'')+'" data-date="'+esc(a.dateISO||'')+'" data-time="'+esc(a.time||'')+'" data-duration="'+esc(a.duration||'')+'" data-price="'+esc(a.price||'')+'">'+esc(t('adm.rdv.confirm'))+'</button>')+
            (a.email
              ? (a.loyaltyDone
                  ? '<span class="pill-tag ok" style="font-size:.72rem">'+esc(t('adm.rdv.loyaltydone'))+'</span>'
                  : '<button class="btn-mini" data-loyaltyrdv="'+a.id+'" data-email="'+esc(a.email)+'" data-name="'+esc(a.name||'')+'">'+esc(t('adm.rdv.loyalty'))+'</button>')
              : '')+
            '<button class="btn-mini danger" data-cancelrdv="'+a.id+'">'+esc(t('adm.rdv.cancel'))+'</button>'+
          '</div>'+
        '</div>'+
        '<div class="adm-rdv-edit" data-editform="'+a.id+'" style="display:none;background:var(--cream-2);border-radius:10px;padding:12px 16px">'+
          '<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">'+
            '<div><label style="font-size:.76rem;font-weight:600;display:block;margin-bottom:4px">Date</label>'+
              '<input type="date" value="'+esc(a.dateISO||'')+'" style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:.9rem" data-rdv-date></div>'+
            '<div><label style="font-size:.76rem;font-weight:600;display:block;margin-bottom:4px">Heure</label>'+
              '<input type="time" value="'+esc(a.time||'')+'" style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:.9rem" data-rdv-time></div>'+
            '<div><label style="font-size:.76rem;font-weight:600;display:block;margin-bottom:4px">Soin</label>'+
              svcSelect('rdvsvc_'+a.id, a.service||'').replace('<select ', '<select data-rdv-svc style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:.9rem" ')+'</div>'+
            '<button class="btn btn-primary btn-sm" data-saverdv="'+a.id+'">Sauvegarder</button>'+
            '<button class="btn-mini" data-closeedit="'+a.id+'">Annuler</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }

    var stats = '<div class="adm-stats">'+
      '<div class="adm-stat"><div class="n">'+all.length+'</div><div class="l">'+esc(t('adm.rdv.total'))+'</div></div>'+
      '<div class="adm-stat"><div class="n">'+upcoming.length+'</div><div class="l">'+esc(t('adm.rdv.upcoming'))+'</div></div>'+
      '<div class="adm-stat"><div class="n">'+past.length+'</div><div class="l">'+esc(t('adm.rdv.past'))+'</div></div>'+
      '</div>';

    panel.innerHTML = stats +
      '<div class="adm-cols"><div class="adm-card">'+
        '<h3>'+esc(t('adm.rdv.add'))+'</h3>'+
        '<form class="adm-form" data-addrdv>'+
          '<div><label>'+esc(t('adm.rdv.client'))+'</label><input name="rname" required></div>'+
          '<div><label>E-mail</label><input name="remail" type="email"></div>'+
          '<div class="row2">'+
            '<div><label>'+esc(t('adm.d.city'))+'</label>'+citySelect('rcity','')+'</div>'+
            '<div><label>'+esc(t('adm.d.service'))+'</label>'+svcSelect('rservice','')+'</div>'+
          '</div>'+
          '<div class="row2">'+
            '<div><label>'+esc(t('adm.d.date'))+'</label><input type="date" name="rdate" required></div>'+
            '<div><label>'+esc(t('adm.d.start'))+'</label><input type="time" name="rtime" value="10:00"></div>'+
          '</div>'+
          '<div class="row2">'+
            '<div><label>Durée (min)</label><input type="number" name="rduration" value="60" min="15"></div>'+
            '<div><label>Prix (€)</label><input type="number" name="rprice" value="0" min="0"></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.rdv.save'))+'</button>'+
        '</form>'+
      '</div>'+
      '<div>'+
        '<div class="adm-sub">'+esc(t('adm.rdv.upcoming'))+' · '+upcoming.length+'</div>'+
        '<div class="adm-list">'+(upcoming.length ? upcoming.map(apptRow).join('') : '<div class="adm-empty">'+esc(t('adm.rdv.none'))+'</div>')+'</div>'+
        '<div class="adm-sub" style="margin-top:24px">'+esc(t('adm.rdv.past'))+' · '+past.length+'</div>'+
        '<div class="adm-list">'+(past.length ? past.map(apptRow).join('') : '<div class="adm-empty">'+esc(t('adm.rdv.none'))+'</div>')+'</div>'+
      '</div></div>';

    var addForm = $('[data-addrdv]', panel);
    addForm.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(addForm);
      if(!(fd.get('rname')||'').trim()) return;
      S.addAppointment({
        name: (fd.get('rname')||'').trim(),
        email: (fd.get('remail')||'').trim(),
        city: fd.get('rcity')||'',
        service: fd.get('rservice')||'',
        dateISO: fd.get('rdate')||'',
        time: fd.get('rtime')||'',
        duration: +(fd.get('rduration')||60),
        price: +(fd.get('rprice')||0)
      });
      addForm.reset();
    });

    [].slice.call(panel.querySelectorAll('[data-editrdv]')).forEach(function(b){
      b.addEventListener('click', function(){
        var form = panel.querySelector('[data-editform="'+b.dataset.editrdv+'"]');
        if(form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      });
    });
    [].slice.call(panel.querySelectorAll('[data-closeedit]')).forEach(function(b){
      b.addEventListener('click', function(){
        var form = panel.querySelector('[data-editform="'+b.dataset.closeedit+'"]');
        if(form) form.style.display = 'none';
      });
    });
    [].slice.call(panel.querySelectorAll('[data-saverdv]')).forEach(function(b){
      b.addEventListener('click', function(){
        var form = panel.querySelector('[data-editform="'+b.dataset.saverdv+'"]');
        if(!form) return;
        var dateVal = form.querySelector('[data-rdv-date]').value;
        var timeVal = form.querySelector('[data-rdv-time]').value;
        var svcEl = form.querySelector('[data-rdv-svc]');
        var patch = { dateISO: dateVal, time: timeVal };
        if (svcEl) patch.service = svcEl.value;
        S.updateAppointment(b.dataset.saverdv, patch);
        toast('Rendez-vous mis à jour');
      });
    });
    [].slice.call(panel.querySelectorAll('[data-cancelrdv]')).forEach(function(b){
      b.addEventListener('click', function(){
        if(confirm(t('adm.rdv.cancelconfirm'))) S.removeAppointment(b.dataset.cancelrdv);
      });
    });
    [].slice.call(panel.querySelectorAll('[data-loyaltyrdv]')).forEach(function(b){
      b.addEventListener('click', function(){
        if(!confirm(fill(t('adm.rdv.loyaltyconfirm'), { name: b.dataset.name || b.dataset.email }))) return;
        var res = S.addLoyaltySession(b.dataset.email, b.dataset.name);
        S.updateAppointment(b.dataset.loyaltyrdv, { loyaltyDone: true });
        if (res && res.earnedCoupon) {
          fetch('/api/contact', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              type:'coupon', name: b.dataset.name||'Cliente', email:b.dataset.email, clientEmail:b.dataset.email,
              code: res.earnedCoupon.code, percent: 100, reason:'fidelite', message:'Séance offerte fidélité'
            })
          }).catch(function(){});
          toast(t('adm.rdv.loyaltyfree'));
        } else {
          toast(t('adm.rdv.loyaltyok'));
        }
      });
    });
    [].slice.call(panel.querySelectorAll('[data-confirmrdv]')).forEach(function(b){
      b.addEventListener('click', function(){
        if(!confirm(t('adm.rdv.confirmconfirm'))) return;
        if(S.confirmAppointment) S.confirmAppointment(b.dataset.confirmrdv);
        if(b.dataset.email) {
          fetch('/api/contact', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              type: 'confirm',
              name: b.dataset.name,
              email: b.dataset.email,
              clientEmail: b.dataset.email,
              service: b.dataset.service,
              location: b.dataset.location,
              date: b.dataset.date,
              time: b.dataset.time,
              duration: b.dataset.duration,
              price: b.dataset.price,
              message: 'Confirmation'
            })
          }).catch(function(){});
        }
        toast(t('adm.rdv.confirmok'));
      });
    });
  }

  /* ====================== SÉCURITÉ TAB ====================== */
  function renderSecurity(){
    var panel = $('[data-panel="securite"]'); if(!panel) return;
    var sessions = S.getAdminSessions ? S.getAdminSessions() : [];

    var currentEmail = S.getAdminEmail ? S.getAdminEmail() : '';
    panel.innerHTML =
      '<div class="adm-cols"><div class="adm-card" style="display:flex;flex-direction:column;gap:28px">'+
        '<div>'+
          '<h3>'+esc(t('adm.sec.pw.title'))+'</h3>'+
          '<form class="adm-form" data-chpw autocomplete="off">'+
            '<div><label>'+esc(t('adm.sec.pw.current'))+'</label><input type="password" name="cur" autocomplete="off"></div>'+
            '<div><label>'+esc(t('adm.sec.pw.new'))+'</label><input type="password" name="nw" autocomplete="new-password"></div>'+
            '<div><label>'+esc(t('adm.sec.pw.confirm'))+'</label><input type="password" name="conf" autocomplete="new-password"></div>'+
            '<div class="err" data-pw-err></div>'+
            '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.sec.pw.save'))+'</button>'+
          '</form>'+
        '</div>'+
        '<div>'+
          '<h3>'+esc(t('adm.sec.email.title'))+'</h3>'+
          '<p style="color:var(--ink-3);font-size:.85rem;margin-bottom:12px">'+esc(t('adm.sec.email.hint'))+'</p>'+
          '<form class="adm-form" data-chemail autocomplete="off">'+
            '<div><label>'+esc(t('adm.sec.email.label'))+'</label><input type="email" name="email" value="'+esc(currentEmail)+'" placeholder="votre@email.com"></div>'+
            '<div class="err" data-email-err></div>'+
            '<button class="btn btn-primary btn-sm" type="submit">'+esc(t('adm.sec.pw.save'))+'</button>'+
          '</form>'+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="adm-sub">'+esc(t('adm.sec.sessions.title'))+'</div>'+
        (sessions.length
          ? '<div class="adm-list">'+sessions.map(function(s){
              var d = new Date(s.at);
              var dt = d.toLocaleDateString(locale(),{day:'numeric',month:'short',year:'numeric'})+' '+
                       d.toLocaleTimeString(locale(),{hour:'2-digit',minute:'2-digit'});
              return '<div class="adm-item"><div class="adm-item__main">'+
                '<div class="adm-item__title" style="font-size:.95rem">'+esc(parseUA(s.ua))+'</div>'+
                '<div class="adm-item__meta"><span>'+esc(dt)+'</span></div>'+
              '</div></div>';
            }).join('')+'</div>'
          : '<div class="adm-empty">'+esc(t('adm.sec.sessions.none'))+'</div>')+
        '<div style="margin-top:16px">'+
          '<button class="btn-mini danger" data-disconnectall>'+esc(t('adm.sec.disconnect'))+'</button>'+
        '</div>'+
      '</div></div>';

    $('[data-chpw]', panel).addEventListener('submit', function(e){
      e.preventDefault();
      var f = e.target;
      var errEl = $('[data-pw-err]', f);
      var cur = f.cur.value, nw = f.nw.value, conf = f.conf.value;
      errEl.textContent = '';
      if(cur !== getCode()){ errEl.textContent = t('adm.sec.pw.err.wrong'); return; }
      if(nw !== conf){ errEl.textContent = t('adm.sec.pw.err.match'); return; }
      if(!nw.trim()) return;
      if(S.setAdminCode) S.setAdminCode(nw.trim());
      toast(t('adm.sec.pw.ok'));
      f.reset();
    });

    var emailForm = $('[data-chemail]', panel);
    if(emailForm) emailForm.addEventListener('submit', function(e){
      e.preventDefault();
      var errEl = $('[data-email-err]', emailForm);
      var email = (emailForm.email.value||'').trim().toLowerCase();
      errEl.textContent = '';
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) { errEl.textContent = t('adm.reset.err.email') || 'Adresse e-mail invalide.'; return; }
      if (S.setAdminEmail) S.setAdminEmail(email);
      toast(t('adm.sec.email.ok') || 'E-mail de récupération enregistré !');
    });

    var disc = $('[data-disconnectall]', panel);
    if(disc) disc.addEventListener('click', function(){
      if(confirm(t('adm.sec.disconnectconfirm'))){
        if(S.clearAdminSessions) S.clearAdminSessions();
        sessionStorage.removeItem(AUTH_KEY);
        location.reload();
      }
    });
  }

  /* ====================== RENDER + BADGES ====================== */
  function updateBadges(){
    var pend = S.testimonials().filter(function(r){return r.status==='pending';}).length;
    var b = document.querySelector('.adm-tab[data-tab="reviews"] .badge');
    if(b){ b.textContent = pend; b.style.display = pend?'inline-flex':'none'; }
  }
  function safeRun(fn) { try { fn(); } catch(e) { console.error(fn.name, e); } }
  function render(){
    safeRun(renderAppointments); safeRun(renderDates); safeRun(renderSubs); safeRun(renderReviews);
    safeRun(renderPacks);
    safeRun(renderInsta); safeRun(renderPlaces); safeRun(renderServices); safeRun(renderSecurity);
    updateBadges();
    // NOTE: do not call ewApplyI18n() here — dynamic panels already use t().
    // Calling it would dispatch ew:langchange and recurse via the listener below.
  }

  /* ============================ INIT ============================ */
  function init(){
    if(!S){ return; }
    initGate();
    document.querySelector('.adm-logout').addEventListener('click', function(){
      sessionStorage.removeItem(AUTH_KEY); location.reload();
    });
    [].slice.call(document.querySelectorAll('.adm-tab')).forEach(function(b){
      b.addEventListener('click', function(){ setTab(b.dataset.tab); });
    });
    setTab('rdv');
    if(authed()) showApp();
    window.addEventListener('ew:datachange', function(){ if(authed()) render(); });
    window.addEventListener('ew:langchange', function(){ if(authed()) render(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
