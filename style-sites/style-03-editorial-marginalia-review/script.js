// The Slow Margin: show/hide margin notes. Without JavaScript the button stays hidden and notes are shown.
(function () {
  var btn = document.getElementById('notes-toggle');
  var body = document.getElementById('essay-body');
  if (!btn || !body) return;
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var on = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!on));
    btn.textContent = on ? 'Show margin notes' : 'Hide margin notes';
    body.classList.toggle('notes-off', on);
  });
})();
