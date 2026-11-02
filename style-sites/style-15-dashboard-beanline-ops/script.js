// Beanwick Ops: theme toggle (data-theme), collapsible sidebar, Chart.js charts built from the
// on-page data tables, sortable + searchable stores table.
// Without JavaScript: KPIs, the stores table and both chart data tables are all readable.
(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var osDark = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------- theme ---------- */
  var THEME_KEY = 'beanwick-theme';
  function stored() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* storage blocked: theme lasts this visit */ } }
  var saved = stored();
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : osDark.matches; }
  var themeBtn = $('#theme-toggle');
  function syncThemeBtn() { themeBtn.setAttribute('aria-pressed', String(isDark())); }
  themeBtn.hidden = false;
  syncThemeBtn();
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store(next);
    syncThemeBtn(); themeCharts();
  });
  osDark.addEventListener('change', function () { if (!root.getAttribute('data-theme')) { syncThemeBtn(); themeCharts(); } });

  /* ---------- collapsible sidebar ---------- */
  root.classList.add('js-nav');
  var sidebar = $('#sidebar'), openBtn = $('#nav-open'), closeBtn = $('#nav-close'), scrim = $('#scrim');
  var narrow = window.matchMedia('(max-width: 899px)');
  openBtn.hidden = false;
  function setNav(open) {
    sidebar.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
    $('.shell').inert = open;
    if (open) { sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true'); $('a', sidebar).focus(); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
  }
  function closeNav(back) { if (!sidebar.classList.contains('is-open')) return; setNav(false); if (back) openBtn.focus(); }
  openBtn.addEventListener('click', function () { setNav(true); });
  closeBtn.addEventListener('click', function () { closeNav(true); });
  scrim.addEventListener('click', function () { closeNav(true); });
  sidebar.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(true); });
  $$('.nav a', sidebar).forEach(function (a) { a.addEventListener('click', function () { if (narrow.matches) closeNav(false); }); });
  narrow.addEventListener('change', function () { closeNav(false); });

  /* ---------- charts (Chart.js 4.4.1 from cdnjs) ---------- */
  var charts = [];
  function num(t) { return Number(String(t).replace(/[^0-9.\-−]/g, '').replace('−', '-')); }
  function tableData(id) {
    var rows = $$('#' + id + ' tbody tr');
    return {
      labels: rows.map(function (r) { return r.cells[0].textContent.trim(); }),
      cols: Array.prototype.slice.call(rows[0].cells, 1).map(function (_, i) { return rows.map(function (r) { return num(r.cells[i + 1].textContent); }); })
    };
  }
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var usdShort = function (v) { return '$' + Math.round(v / 1000) + 'k'; };

  function themeCharts() {
    if (!charts.length) return;
    var c = { s1: cssVar('--series-1'), s2: cssVar('--series-2'), grid: cssVar('--grid'), text2: cssVar('--text-2'), text: cssVar('--text'), surface: cssVar('--surface'), border: cssVar('--border') };
    charts.forEach(function (ch) {
      ch.data.datasets.forEach(function (d, i) {
        var col = i === 0 ? c.s1 : c.s2;
        d.borderColor = col; d.backgroundColor = col; d.pointBackgroundColor = col; d.pointBorderColor = c.surface;
      });
      Object.values(ch.options.scales).forEach(function (s) { s.grid.color = c.grid; s.ticks.color = c.text2; s.border = { color: c.border }; });
      var tt = ch.options.plugins.tooltip;
      tt.backgroundColor = c.surface; tt.titleColor = c.text; tt.bodyColor = c.text; tt.borderColor = c.border;
      ch.update('none');
    });
  }

  function buildCharts() {
    var Chart = window.Chart;
    if (!Chart) return; // CDN failed: the open data tables stand in for the charts
    Chart.defaults.font.family = '"Public Sans", system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    if (reduce) Chart.defaults.animation = false;
    var tooltip = { borderWidth: 1, padding: 10, displayColors: true, boxPadding: 4, usePointStyle: true,
      callbacks: { label: function (ctx) { return ' ' + usd.format(ctx.parsed.y != null && ctx.chart.config.type === 'line' ? ctx.parsed.y : ctx.parsed.x) + '  ' + ctx.dataset.label; } } };

    var line = tableData('line-data');
    charts.push(new Chart($('#line'), {
      type: 'line',
      data: { labels: line.labels, datasets: [
        { label: 'This week', data: line.cols[0], borderWidth: 2, pointRadius: 3, pointHoverRadius: 6, pointBorderWidth: 2, tension: 0.25 },
        { label: 'Last week', data: line.cols[1], borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 5, tension: 0.25 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false }, // crosshair-style: one tooltip lists both series
        plugins: { legend: { display: false }, tooltip: tooltip },
        scales: {
          x: { grid: { display: false }, ticks: {} },
          y: { grid: {}, ticks: { callback: usdShort, maxTicksLimit: 5 } }
        }
      }
    }));

    var bar = tableData('bar-data');
    charts.push(new Chart($('#bar'), {
      type: 'bar',
      data: { labels: bar.labels, datasets: [{ label: 'Revenue', data: bar.cols[0], borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22 }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltip },
        scales: {
          x: { beginAtZero: true, grid: {}, ticks: { callback: usdShort, maxTicksLimit: 5 } },
          y: { grid: { display: false }, ticks: {} }
        }
      }
    }));
    themeCharts();
    root.classList.add('has-charts');
    $$('details.data').forEach(function (d) { d.open = false; }); // tables stay one click away
  }
  if (document.readyState === 'complete') buildCharts(); else window.addEventListener('load', buildCharts);

  /* ---------- sortable, searchable table ---------- */
  var table = $('#stores'), tbody = table.tBodies[0];
  var rows = $$('tr', tbody);
  var meta = $('#table-meta');
  var keys = { store: 0, city: 1, orders: 2, revenue: 3, ticket: 4, change: 5 };
  var sortState = { key: 'revenue', dir: 'descending' };
  function cellVal(r, key, type) { var t = r.cells[keys[key]].textContent.trim(); return type === 'num' ? num(t) : t.toLowerCase(); }
  function sortBy(key, type, dir) {
    rows.sort(function (a, b) {
      var x = cellVal(a, key, type), y = cellVal(b, key, type);
      var r = type === 'num' ? x - y : x.localeCompare(y);
      return dir === 'ascending' ? r : -r;
    });
    rows.forEach(function (r) { tbody.appendChild(r); });
    $$('thead th', table).forEach(function (th) {
      var b = $('button', th);
      th.setAttribute('aria-sort', b.dataset.key === key ? dir : 'none');
    });
    sortState = { key: key, dir: dir };
  }
  $$('thead button', table).forEach(function (b) {
    b.addEventListener('click', function () {
      var dir = sortState.key === b.dataset.key && sortState.dir === 'descending' ? 'ascending'
              : sortState.key === b.dataset.key ? 'descending'
              : (b.dataset.type === 'num' ? 'descending' : 'ascending');
      sortBy(b.dataset.key, b.dataset.type, dir);
      updateMeta('Sorted by ' + b.textContent.trim() + ', ' + dir + '.');
    });
  });

  var q = $('#q');
  function updateMeta(extra) {
    var shown = rows.filter(function (r) { return !r.hidden; }).length;
    meta.textContent = (shown === rows.length ? rows.length + ' stores' : shown + ' of ' + rows.length + ' stores') + ' · sample data' + (extra ? ' · ' + extra : '');
    $('#table-empty').hidden = shown > 0;
    $('#empty-q').textContent = q.value.trim();
  }
  q.addEventListener('input', function () {
    var term = q.value.trim().toLowerCase();
    rows.forEach(function (r) { r.hidden = term && (r.cells[0].textContent + ' ' + r.cells[1].textContent).toLowerCase().indexOf(term) === -1; });
    updateMeta();
  });
})();
