/* ===========================================================================
   db.js — Supabase sync layer
   Loaded BEFORE store.js. Exposes window.EWDB.
   =========================================================================== */
(function () {
  'use strict';
  var BASE = 'https://lybfafibujutlxjqinqz.supabase.co/rest/v1';
  var KEY  = 'sb_publishable_t21oYHUxySRGuB9YGhGZyQ_0jVmT3N8';
  var H    = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  function go(method, path, body) {
    var opts = { method: method, headers: Object.assign({}, H) };
    if (body !== undefined) opts.body = JSON.stringify(body);
    if (method === 'POST') opts.headers['Prefer'] = 'resolution=merge-duplicates,return=minimal';
    return fetch(BASE + path, opts);
  }

  window.EWDB = {
    load: function (table) {
      return go('GET', '/' + table + '?select=id,data')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) {
          return (rows || []).map(function (r) { return r.data || {}; }).filter(function (r) { return r.id; });
        });
    },
    save: function (table, record) {
      if (!record || !record.id) return Promise.resolve();
      return go('POST', '/' + table, { id: record.id, data: record }).catch(function () {});
    },
    del: function (table, id) {
      if (!id) return Promise.resolve();
      return go('DELETE', '/' + table + '?id=eq.' + encodeURIComponent(id)).catch(function () {});
    }
  };
})();
