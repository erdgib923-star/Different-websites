// Taskferry: interactive sample board + monthly/yearly pricing toggle.
// Without JavaScript the board shows a static list and prices show monthly amounts.
(function () {
  /* ---------- board ---------- */
  var lanesEl = document.getElementById('lanes');
  var live = document.getElementById('board-live');
  var LANES = ['Planned', 'Crossing', 'Shipped'];
  var cards = [
    { id: 1, title: 'Write release notes', lane: 0 },
    { id: 2, title: 'Book launch call', lane: 0 },
    { id: 3, title: 'Fix sign-up email', lane: 1 },
    { id: 4, title: 'Final QA pass', lane: 1 },
    { id: 5, title: 'New pricing page', lane: 2 }
  ];

  function icon(id) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use'); use.setAttribute('href', '#' + id);
    svg.appendChild(use); return svg;
  }

  function render(focusId, focusDir) {
    LANES.forEach(function (_, li) {
      var list = lanesEl.querySelector('[data-lane="' + li + '"] .lane__list');
      list.textContent = '';
      var inLane = cards.filter(function (c) { return c.lane === li; });
      lanesEl.querySelector('[data-count="' + li + '"]').textContent = inLane.length;
      inLane.forEach(function (c) {
        var item = document.createElement('li'); item.className = 'card';
        var back = document.createElement('button');
        back.type = 'button'; back.className = 'card__btn'; back.dataset.id = c.id; back.dataset.dir = '-1';
        back.setAttribute('aria-label', 'Move “' + c.title + '” back to ' + (LANES[c.lane - 1] || ''));
        back.appendChild(icon('i-back'));
        if (c.lane === 0) back.disabled = true;
        var t = document.createElement('span'); t.className = 'card__title'; t.textContent = c.title;
        var fwd = document.createElement('button');
        fwd.type = 'button'; fwd.className = 'card__btn'; fwd.dataset.id = c.id; fwd.dataset.dir = '1';
        fwd.setAttribute('aria-label', 'Move “' + c.title + '” to ' + (LANES[c.lane + 1] || ''));
        fwd.appendChild(icon(c.lane === 2 ? 'i-check' : 'i-arrow'));
        if (c.lane === 2) fwd.disabled = true;
        item.appendChild(back); item.appendChild(t); item.appendChild(fwd);
        list.appendChild(item);
      });
    });
    if (focusId) {
      // keep keyboard focus on the moved card: prefer the same direction, else the other button
      var btns = lanesEl.querySelectorAll('.card__btn[data-id="' + focusId + '"]');
      var pick = null;
      btns.forEach(function (b) { if (!b.disabled && b.dataset.dir === focusDir) pick = b; });
      if (!pick) btns.forEach(function (b) { if (!b.disabled) pick = b; });
      if (pick) pick.focus();
    }
  }

  if (lanesEl) {
    document.documentElement.classList.add('js');
    lanesEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.card__btn');
      if (!btn || btn.disabled) return;
      var c = cards.find(function (x) { return String(x.id) === btn.dataset.id; });
      c.lane = Math.max(0, Math.min(2, c.lane + Number(btn.dataset.dir)));
      render(c.id, btn.dataset.dir);
      live.textContent = '“' + c.title + '” moved to ' + LANES[c.lane] + '.';
    });
    render();
  }

  /* ---------- pricing toggle ---------- */
  var opts = document.querySelectorAll('.billing__opt');
  opts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var period = btn.dataset.period;
      opts.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      document.querySelectorAll('.amount').forEach(function (a) { a.textContent = '$' + a.dataset[period]; });
      document.querySelectorAll('.per[data-monthly]').forEach(function (p) { p.textContent = p.dataset[period]; });
    });
  });
})();
