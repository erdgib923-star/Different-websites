// Wild Thread shop: filters (sidebar on desktop, drawer on mobile), product detail dialog,
// cart drawer persisted in localStorage (every access wrapped in try/catch).
// Products are plain HTML, so the catalogue is readable without JavaScript.
(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  /* ---------- catalogue (read from the HTML, plus detail copy) ---------- */
  var DETAILS = {
    'ridge-shell':     { sym: 'g-jacket', sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'A three-layer waterproof shell with taped seams, a hood that fits over a cap and pit zips for steep climbs.', facts: ['Waterproof to 20,000 mm (sample spec)', 'Weight 390 g', 'Repair kit in the pocket'] },
    'fieldwork-shirt': { sym: 'g-shirt',  sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'Heavy cotton twill that softens with every wash. Two chest pockets, one with a pencil slot.', facts: ['320 g/m² organic cotton twill', 'Triple-stitched seams', 'Machine washable'] },
    'basecamp-fleece': { sym: 'g-fleece', sizes: ['S', 'M', 'L', 'XL'], desc: 'A half-zip fleece from recycled bottles, cut long at the back to stay tucked under a pack.', facts: ['Recycled polyester fleece', 'Weight 340 g', 'Zip chest pocket'] },
    'trail-pants':     { sym: 'g-pants',  sizes: ['28', '30', '32', '34', '36'], desc: 'Stretch canvas with a gusseted crotch for high steps, and reinforced knees that can be patched.', facts: ['Stretch cotton canvas', 'Reinforced knees', 'Inside leg 32 in (sample)'] },
    'merino-base':     { sym: 'g-base',   sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'A 200 g merino long-sleeve that stays warm when damp and does not hold smells after a long day.', facts: ['100% merino wool, 200 g/m²', 'Flatlock seams', 'Wash cold'] },
    'canvas-cap':      { sym: 'g-cap',    sizes: ['One size'], desc: 'A six-panel cap in waxed cotton with a short brim that packs flat.', facts: ['Waxed cotton', 'Adjustable strap', 'Re-wax every season'] },
    'wool-socks':      { sym: 'g-socks',  sizes: ['S (4–6)', 'M (7–9)', 'L (10–12)'], desc: 'Three pairs of cushioned wool-blend hiking socks with a reinforced heel and toe.', facts: ['Wool and nylon blend', 'Cushioned sole', 'Three pairs'] },
    'packable-vest':   { sym: 'g-vest',   sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'A synthetic insulated vest that stuffs into its own pocket and stays warm in the rain.', facts: ['Synthetic insulation', 'Packs into its pocket', 'Weight 260 g'] }
  };
  var cards = $$('.card');
  var PRODUCTS = {};
  cards.forEach(function (c) {
    var id = c.dataset.id;
    PRODUCTS[id] = {
      id: id, name: $('.card__name', c).textContent, price: Number(c.dataset.price),
      color: $('.card__art', c).style.color, meta: $('.card__meta', c).textContent
    };
    Object.assign(PRODUCTS[id], DETAILS[id]);
  });

  /* ---------- cart storage ---------- */
  var KEY = 'wild-thread-cart';
  var storageOk = true;
  function loadCart() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v.filter(function (i) { return PRODUCTS[i.id] && i.qty > 0; }) : []; }
    catch (e) { storageOk = false; return []; }
  }
  function saveCart() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); }
    catch (e) { storageOk = false; }
  }
  var cart = loadCart();

  var countEl = $('#cart-count');
  function updateCount(bump) {
    var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    countEl.innerHTML = '<span class="sr-only">items in cart:</span> ' + n;
    if (bump) { countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump'); }
  }

  function addToCart(id, size) {
    var line = cart.find(function (i) { return i.id === id && i.size === size; });
    if (line) line.qty += 1; else cart.push({ id: id, size: size, qty: 1 });
    saveCart(); updateCount(true); renderCart();
  }

  /* ---------- cart drawer ---------- */
  var cartDlg = $('#cart'), cartList = $('#cart-list');
  function svgUse(sym) { return '<svg aria-hidden="true"><use href="#' + sym + '"/></svg>'; }
  function renderCart() {
    cartList.textContent = '';
    cart.forEach(function (line, idx) {
      var p = PRODUCTS[line.id];
      var li = document.createElement('li'); li.className = 'cart__item';
      li.innerHTML =
        '<div class="cart__thumb" style="color:' + p.color + '">' + svgUse(p.sym) + '</div>' +
        '<div><h3></h3><p class="cart__size"></p>' +
        '<div class="qty"><button type="button" data-act="dec" aria-label="Remove one">−</button><output aria-live="polite"></output><button type="button" data-act="inc" aria-label="Add one">+</button></div>' +
        '<button class="remove" type="button" data-act="remove">Remove</button></div>' +
        '<p class="cart__line"></p>';
      $('h3', li).textContent = p.name;
      $('.cart__size', li).textContent = 'Size ' + line.size;
      $('output', li).textContent = line.qty;
      $('[data-act="dec"]', li).setAttribute('aria-label', 'Remove one ' + p.name);
      $('[data-act="inc"]', li).setAttribute('aria-label', 'Add one more ' + p.name);
      $('[data-act="remove"]', li).setAttribute('aria-label', 'Remove ' + p.name + ', size ' + line.size + ' from cart');
      $('.cart__line', li).textContent = money.format(p.price * line.qty);
      li.dataset.idx = idx;
      cartList.appendChild(li);
    });
    var total = cart.reduce(function (s, i) { return s + PRODUCTS[i.id].price * i.qty; }, 0);
    $('#cart-total').textContent = money.format(total);
    $('#cart-empty').hidden = cart.length > 0;
    $('#cart-foot').hidden = cart.length === 0;
    $('#checkout-note').textContent = storageOk
      ? 'Demo shop: checkout is not connected. Your cart is saved in this browser only.'
      : 'Demo shop: checkout is not connected. This browser is blocking storage, so your cart will clear when you leave.';
  }
  cartList.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var idx = Number(b.closest('.cart__item').dataset.idx);
    var act = b.dataset.act;
    if (act === 'inc') cart[idx].qty += 1;
    if (act === 'dec') cart[idx].qty -= 1;
    var removed = act === 'remove' || cart[idx].qty <= 0;
    if (removed) cart.splice(idx, 1);
    saveCart(); updateCount(false); renderCart();
    // keep focus somewhere sensible
    var next = removed ? ($('.cart__item [data-act="inc"]', cartList) || $('#cart [data-close]')) : $('.cart__item[data-idx="' + idx + '"] [data-act="' + act + '"]', cartList);
    if (next) next.focus();
  });
  $('#checkout').addEventListener('click', function (e) {
    e.preventDefault();
    var note = $('#checkout-note');
    note.setAttribute('role', 'status');
    note.textContent = 'Checkout is not connected in this demo, so no order was placed. Your cart is still here.';
  });

  /* ---------- dialogs: open / close helpers ---------- */
  var lastFocus = null;
  function openDialog(d) { lastFocus = document.activeElement; if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); }); // backdrop click
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDialog(d); }); });
    d.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  });
  $('#cart-open').addEventListener('click', function () { renderCart(); openDialog(cartDlg); });

  /* ---------- product detail ---------- */
  var pdDlg = $('#product');
  var current = null;
  function showProduct(id, fromHash) {
    var p = PRODUCTS[id]; if (!p) return;
    current = p;
    $('#pd-name').textContent = p.name;
    $('#pd-price').textContent = money.format(p.price);
    $('#pd-desc').textContent = p.desc;
    $('#pd-art').style.color = p.color;
    $('#pd-use').setAttribute('href', '#' + p.sym);
    $('#pd-error').hidden = true;
    $('#pd-status').textContent = '';
    var sizes = $('#pd-sizes'); sizes.textContent = '';
    p.sizes.forEach(function (s, i) {
      var l = document.createElement('label'); l.className = 'size';
      l.innerHTML = '<input type="radio" name="size"><span></span>';
      $('input', l).value = s; $('span', l).textContent = s;
      if (p.sizes.length === 1) $('input', l).checked = true;
      sizes.appendChild(l);
    });
    var facts = $('#pd-facts'); facts.textContent = '';
    p.facts.forEach(function (f) { var li = document.createElement('li'); li.textContent = f; facts.appendChild(li); });
    if (!fromHash) { try { history.replaceState(null, '', '#p=' + id); } catch (e) { /* ignore */ } }
    if (!pdDlg.open) openDialog(pdDlg);
  }
  pdDlg.addEventListener('close', function () {
    if (location.hash.indexOf('#p=') === 0) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
  });
  $('#pd-add').addEventListener('click', function () {
    var chosen = $('input[name="size"]:checked', pdDlg);
    if (!chosen) { $('#pd-error').hidden = false; var first = $('input[name="size"]', pdDlg); if (first) first.focus(); return; }
    $('#pd-error').hidden = true;
    addToCart(current.id, chosen.value);
    $('#pd-status').textContent = 'Added to cart: ' + current.name + ', size ' + chosen.value + '.';
  });
  $$('.card__view').forEach(function (b) {
    b.hidden = false;
    b.setAttribute('aria-label', 'View details for ' + PRODUCTS[b.dataset.view].name);
    b.addEventListener('click', function () { showProduct(b.dataset.view); });
  });
  function fromHash() { var m = location.hash.match(/^#p=([\w-]+)/); if (m) showProduct(m[1], true); }
  window.addEventListener('hashchange', fromHash);

  /* ---------- filters ---------- */
  var form = $('#filter-form'), grid = $('#grid');
  var priceOut = $('#f-price-out');
  function applyFilters(updateUrl) {
    var fd = new FormData(form);
    var cats = fd.getAll('cat'), colors = fd.getAll('color');
    var max = Number(fd.get('price')), sort = fd.get('sort');
    priceOut.textContent = money.format(max);
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (!cats.length || cats.indexOf(c.dataset.cat) > -1) && (!colors.length || colors.indexOf(c.dataset.color) > -1) && Number(c.dataset.price) <= max;
      c.hidden = !ok; if (ok) shown++;
    });
    var sorted = cards.slice().sort(function (a, b) {
      if (sort === 'price-asc') return a.dataset.price - b.dataset.price;
      if (sort === 'price-desc') return b.dataset.price - a.dataset.price;
      return a.dataset.order - b.dataset.order;
    });
    sorted.forEach(function (c) { grid.appendChild(c); });
    $('#results-count').textContent = shown + (shown === 1 ? ' piece' : ' pieces');
    $('#empty').hidden = shown > 0;
    var active = cats.length + colors.length + (max < 200 ? 1 : 0);
    $('#filter-badge').textContent = active ? String(active) : '';
    if (updateUrl) {
      try {
        var q = new URLSearchParams();
        cats.forEach(function (v) { q.append('cat', v); });
        colors.forEach(function (v) { q.append('color', v); });
        if (max < 200) q.set('max', max);
        if (sort !== 'featured') q.set('sort', sort);
        var s = q.toString();
        history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
      } catch (e) { /* file:// or sandboxed */ }
    }
  }
  function restoreFilters() {
    try {
      var q = new URLSearchParams(location.search);
      q.getAll('cat').forEach(function (v) { var el = $('input[name="cat"][value="' + CSS.escape(v) + '"]', form); if (el) el.checked = true; });
      q.getAll('color').forEach(function (v) { var el = $('input[name="color"][value="' + CSS.escape(v) + '"]', form); if (el) el.checked = true; });
      if (q.get('max')) form.elements.price.value = q.get('max');
      if (q.get('sort')) form.elements.sort.value = q.get('sort');
    } catch (e) { /* ignore */ }
  }
  form.addEventListener('input', function () { applyFilters(true); });
  form.addEventListener('change', function () { applyFilters(true); });
  form.addEventListener('reset', function () { setTimeout(function () { applyFilters(true); }, 0); });
  $('#empty-clear').addEventListener('click', function () { form.reset(); });

  /* ---------- mobile filter drawer ---------- */
  root.classList.add('js-filters');
  var drawer = $('#filters'), openBtn = $('#filter-open'), backdrop = $('#filter-backdrop');
  var mobile = window.matchMedia('(max-width: 959px)');
  openBtn.hidden = false;
  var outside = [$('.top'), $('.intro'), $('#products'), $('.foot')];
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    outside.forEach(function (el) { if (el) el.inert = open; });
    openBtn.inert = open;
    if (open) { drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); $('input, select, button', drawer).focus(); }
    else { drawer.removeAttribute('role'); drawer.removeAttribute('aria-modal'); }
  }
  function closeDrawer(focusBack) { if (!drawer.classList.contains('is-open')) return; setDrawer(false); if (focusBack) openBtn.focus(); }
  openBtn.addEventListener('click', function () { setDrawer(true); });
  $('#filter-close').addEventListener('click', function () { closeDrawer(true); });
  $('#filter-done').addEventListener('click', function () { closeDrawer(false); $('#products').focus(); });
  backdrop.addEventListener('click', function () { closeDrawer(true); });
  drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(true); });
  mobile.addEventListener('change', function () { closeDrawer(false); });

  /* ---------- start ---------- */
  restoreFilters();
  applyFilters(false);
  updateCount(false);
  renderCart();
  fromHash();
})();
