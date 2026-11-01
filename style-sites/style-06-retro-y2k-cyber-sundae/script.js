// Cyber Sundae guestbook: entries are stored only in this browser (localStorage, wrapped in try/catch).
// Without JavaScript the sample entries are shown and the form does nothing.
(function () {
  var KEY = 'cyber-sundae-guestbook';
  var form = document.getElementById('gb-form');
  var list = document.getElementById('gb-entries');
  var err = document.getElementById('gb-error');
  if (!form || !list) return;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50))); return true; } catch (e) { return false; }
  }
  var fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  function render(item) {
    var li = document.createElement('li');
    li.className = 'entry';
    var head = document.createElement('p'); head.className = 'entry__head';
    var name = document.createElement('span'); name.className = 'entry__name'; name.textContent = item.name;
    var date = document.createElement('span'); date.className = 'entry__date'; date.textContent = 'You, ' + fmt.format(new Date(item.t));
    head.appendChild(name); head.appendChild(document.createTextNode(' ')); head.appendChild(date);
    var msg = document.createElement('p'); msg.textContent = item.msg; // textContent: no HTML injection
    li.appendChild(head); li.appendChild(msg);
    list.insertBefore(li, list.firstChild);
  }

  load().slice().reverse().forEach(render);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = form.elements.name, msgEl = form.elements.msg;
    var name = nameEl.value.trim(), msg = msgEl.value.trim();
    var bad = !name ? nameEl : !msg ? msgEl : null;
    if (bad) {
      err.textContent = bad === nameEl ? 'Add a name or handle, then sign.' : 'Write your one line, then sign.';
      err.hidden = false;
      bad.setAttribute('aria-invalid', 'true');
      bad.focus();
      return;
    }
    err.hidden = true;
    nameEl.removeAttribute('aria-invalid'); msgEl.removeAttribute('aria-invalid');
    var item = { name: name, msg: msg, t: Date.now() };
    var items = load(); items.unshift(item);
    var stored = save(items);
    render(item);
    msgEl.value = '';
    if (!stored) { err.textContent = 'Signed for this visit only: this browser is not letting the page save.'; err.hidden = false; }
  });
})();
