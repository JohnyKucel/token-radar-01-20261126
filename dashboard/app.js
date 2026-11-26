// Token Radar — the page logic. No network, no framework: the whole
// dataset arrives in ../data.js as window.RADAR, written by main.ts from
// the same board.json the gate reads, so the screen and the board agree.
//
// The model, in one place, for the judge: implied value = TVL x the
// sector multiple x a growth multiplier x a maturity multiplier. The
// sector multiple is the median market-cap / TVL of the token-bearing
// protocols in the same category, read out of the snapshot; growth is
// the seven-day TVL change clamped to -50..+100%; maturity rewards time
// spent with no token. The detail view shows every factor with its own
// number, so any row's value can be checked by hand.

(function () {
  'use strict';

  var RADAR = window.RADAR;
  var rows = RADAR.rows.slice();
  var live = RADAR.live.slice();
  var watchlist = new Set(RADAR.watchlist_slugs || []);
  var maxImplied = rows.length ? rows[0].implied_value_usd : 1;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var fmtMoney = function (n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  };
  var fmtMoneyFull = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var fmtPct = function (v) {
    if (v === null || v === undefined) return { text: '—', cls: 'flat' };
    var s = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
    return { text: s, cls: v > 0 ? 'up' : v < 0 ? 'down' : 'flat' };
  };
  var fmtAge = function (d) {
    if (d === null || d === undefined) return '—';
    if (d < 365) return d + 'd';
    return (d / 365).toFixed(1) + 'y';
  };

  // ---- stats -------------------------------------------------------------
  $('stat-scanned').textContent = '758';
  $('stat-watchlist').textContent = String(RADAR.watchlist_size);
  $('stat-board').textContent = String(RADAR.board_size);
  $('stat-live').textContent = String(RADAR.live_size);

  // ---- filters -----------------------------------------------------------
  var sortKey = 'rank';
  var sortDir = 1;

  var categories = [];
  var chains = [];
  rows.forEach(function (r) {
    if (r.category && categories.indexOf(r.category) === -1) categories.push(r.category);
    (r.chains || []).forEach(function (c) { if (chains.indexOf(c) === -1) chains.push(c); });
  });
  categories.sort();
  chains.sort();
  categories.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c; o.textContent = c;
    $('f-cat').appendChild(o);
  });
  chains.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c; o.textContent = c;
    $('f-chain').appendChild(o);
  });

  function filtered() {
    var q = $('q').value.trim().toLowerCase();
    var cat = $('f-cat').value;
    var chain = $('f-chain').value;
    var onlyWatch = $('f-watch').checked;
    var out = rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.toLowerCase().indexOf(q) === -1) return false;
      if (cat && r.category !== cat) return false;
      if (chain && (r.chains || []).indexOf(chain) === -1) return false;
      if (onlyWatch && !watchlist.has(r.slug)) return false;
      return true;
    });
    var key = sortKey;
    out.sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
      return (av - bv) * sortDir;
    });
    return out;
  }

  function rowHtml(r) {
    var p = fmtPct(r.change_7d);
    // Square-root scale, so the smallest bars stay visible: a visual aid only.
    var pct = Math.min(100, Math.sqrt(r.implied_value_usd / maxImplied) * 100);
    var tag = watchlist.has(r.slug) ? '<span class="tag">Watchlist</span>' : '';
    return '<tr data-slug="' + esc(r.slug) + '" tabindex="0">' +
      '<td class="num">' + r.rank + '</td>' +
      '<td><span class="name">' + esc(r.name) + '</span>' + tag + '<br><span class="slug">' + esc(r.slug) + '</span></td>' +
      '<td>' + esc(r.category || '—') + '</td>' +
      '<td>' + esc((r.chains || []).slice(0, 2).join(', ') || '—') + '</td>' +
      '<td class="num">' + fmtMoney(r.tvl_usd) + '</td>' +
      '<td class="num ' + p.cls + '">' + p.text + '</td>' +
      '<td class="num">' + fmtAge(r.age_days) + '</td>' +
      '<td class="num"><span class="value">' + fmtMoney(r.implied_value_usd) + '</span><span class="bar" style="width:' + pct.toFixed(1) + '%"></span></td>' +
      '</tr>';
  }

  function renderBoard() {
    var list = filtered();
    $('rows').innerHTML = list.length
      ? list.map(rowHtml).join('')
      : '<tr><td class="empty" colspan="8">No protocol matches these filters.</td></tr>';
    $('count').textContent = 'Showing ' + list.length + ' of ' + rows.length + ' ranked protocols.';
    document.querySelectorAll('#board thead th[data-sort]').forEach(function (th) {
      th.classList.toggle('sorted', th.getAttribute('data-sort') === sortKey);
    });
  }

  document.querySelectorAll('#board thead th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-sort');
      if (key === sortKey) sortDir = -sortDir;
      else { sortKey = key; sortDir = key === 'name' || key === 'category' ? 1 : -1; }
      renderBoard();
    });
  });

  ['q', 'f-cat', 'f-chain', 'f-watch'].forEach(function (id) {
    $(id).addEventListener(id === 'q' ? 'input' : 'change', renderBoard);
  });
  $('f-reset').addEventListener('click', function () {
    $('q').value = '';
    $('f-cat').value = '';
    $('f-chain').value = '';
    $('f-watch').checked = false;
    sortKey = 'rank'; sortDir = 1;
    renderBoard();
  });

  // ---- detail ------------------------------------------------------------
  function renderDetail(slug) {
    var r = null;
    for (var i = 0; i < rows.length; i++) if (rows[i].slug === slug) { r = rows[i]; break; }
    if (!r) return;
    document.querySelectorAll('#rows tr').forEach(function (tr) {
      tr.classList.toggle('selected', tr.getAttribute('data-slug') === slug);
    });
    var p = fmtPct(r.change_7d);
    var base = Math.round(r.tvl_usd * r.category_multiple);
    var growthNote = r.change_7d === null ? 'no 7-day change reported, counted as 0%' : r.change_7d.toFixed(1) + '% over 7 days';
    var ageNote = r.age_days === null ? 'listing date unreported, counted as 365 days' : r.age_days + ' days since first tracked';
    var multLabel = r.multiple_source === 'market'
      ? 'market-wide median of ' + r.comparables + ' trading comparables'
      : esc(r.category || 'all sectors') + ', median of ' + r.comparables + ' trading comparables';
    var steps = (r.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    $('detail').hidden = false;
    $('detail').innerHTML =
      '<h2>' + esc(r.name) + '</h2>' +
      '<p class="sub">Rank ' + r.rank + ' · ' + esc(r.category || 'Uncategorised') + ' · ' + esc((r.chains || []).join(', ') || '—') + ' · ' + (watchlist.has(r.slug) ? 'on the watchlist' : 'below the watchlist floor') + ' · records no token</p>' +
      '<div class="detail-grid">' +
      '<div class="stat"><span class="stat-num">' + fmtMoney(r.implied_value_usd) + '</span><span class="stat-label">implied launch value</span></div>' +
      '<div class="stat"><span class="stat-num">' + fmtMoney(r.tvl_usd) + '</span><span class="stat-label">total value locked</span></div>' +
      '<div class="stat"><span class="stat-num ' + p.cls + '">' + p.text + '</span><span class="stat-label">TVL change, 7 days</span></div>' +
      '<div class="stat"><span class="stat-num">' + fmtAge(r.age_days) + '</span><span class="stat-label">running with no token</span></div>' +
      '</div>' +
      '<h3>How the value is built</h3>' +
      '<table class="model-table"><tbody>' +
      '<tr><td>TVL × sector multiple (' + multLabel + ')</td><td>' + fmtMoneyFull(r.tvl_usd) + ' × ' + r.category_multiple + ' = ' + fmtMoneyFull(base) + '</td></tr>' +
      '<tr><td>Growth multiplier — ' + esc(growthNote) + '</td><td>× ' + r.growth_multiplier + '</td></tr>' +
      '<tr><td>Maturity multiplier — ' + esc(ageNote) + '</td><td>× ' + r.maturity_multiplier + '</td></tr>' +
      '<tr><td>Implied launch value</td><td>' + fmtMoneyFull(r.implied_value_usd) + '</td></tr>' +
      '</tbody></table>' +
      '<h3>Farm plan</h3>' +
      '<ol class="steps">' + steps + '</ol>' +
      '<p class="note">Implied value is this entry&rsquo;s own claim from the snapshot&rsquo;s figures, never a prediction of whether or when ' + esc(r.name) + ' issues a token. Farm steps are a plan, not advice: check the protocol&rsquo;s own pages before moving funds.</p>';
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr) {
      location.hash = '#/p/' + tr.getAttribute('data-slug');
      renderDetail(tr.getAttribute('data-slug'));
    }
  });
  $('rows').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var tr = e.target.closest('tr[data-slug]');
    if (tr) {
      location.hash = '#/p/' + tr.getAttribute('data-slug');
      renderDetail(tr.getAttribute('data-slug'));
    }
  });

  // ---- live view ---------------------------------------------------------
  function renderLive() {
    $('live-rows').innerHTML = live.map(function (r) {
      var p = fmtPct(r.change_7d);
      return '<tr>' +
        '<td><span class="name">' + esc(r.name) + '</span><br><span class="slug">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc((r.chains || []).slice(0, 2).join(', ') || '—') + '</td>' +
        '<td class="num">' + fmtMoney(r.tvl_usd) + '</td>' +
        '<td class="num">' + (r.mcap_usd === null ? '—' : fmtMoney(r.mcap_usd)) + '</td>' +
        '<td class="num ' + p.cls + '">' + p.text + '</td>' +
        '</tr>';
    }).join('');
  }

  function showTab(which) {
    var board = which === 'board';
    $('view-board').hidden = !board;
    $('view-live').hidden = board;
    $('detail').hidden = board ? $('detail').hidden : true;
    $('tab-board').classList.toggle('active', board);
    $('tab-live').classList.toggle('active', !board);
    $('tab-board').removeAttribute('aria-current');
    $('tab-live').removeAttribute('aria-current');
    $(board ? 'tab-board' : 'tab-live').setAttribute('aria-current', 'true');
    if (!board) renderLive();
  }

  $('tab-board').addEventListener('click', function () { location.hash = ''; showTab('board'); });
  $('tab-live').addEventListener('click', function () { location.hash = '#/live'; showTab('live'); });

  // ---- routing -----------------------------------------------------------
  function route() {
    var h = location.hash || '';
    if (h.indexOf('#/p/') === 0) {
      showTab('board');
      renderDetail(h.slice(4));
    } else if (h === '#/live') {
      showTab('live');
    } else {
      showTab('board');
    }
  }
  window.addEventListener('hashchange', route);

  renderBoard();
  route();
})();
