// Brass & Vinyl: turntable play key + speed rocker, and a record crate you can flip through.
// Without JavaScript the turntable sits still and all four records are listed one under another.
(function () {
  /* turntable */
  var play = document.getElementById('play');
  var speed = document.getElementById('speed');
  var platter = document.getElementById('platter');
  var arm = document.getElementById('tonearm');
  var status = document.getElementById('deck-status');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateStatus() {
    var on = play.getAttribute('aria-pressed') === 'true';
    var rpm = speed.getAttribute('aria-checked') === 'true' ? '45' : '33⅓';
    status.textContent = on ? 'Playing at ' + rpm + ' rpm' + (reduce ? ' (animation paused: reduced motion)' : '') : 'Stopped';
  }
  if (play && platter) {
    play.addEventListener('click', function () {
      var on = play.getAttribute('aria-pressed') !== 'true';
      play.setAttribute('aria-pressed', String(on));
      play.textContent = on ? 'Stop' : 'Play';
      arm.classList.toggle('is-on', on);
      // let the arm swing over before the platter starts
      setTimeout(function () { platter.classList.toggle('is-spinning', on && play.getAttribute('aria-pressed') === 'true'); }, on && !reduce ? 700 : 0);
      updateStatus();
    });
    speed.addEventListener('click', function () {
      var fast = speed.getAttribute('aria-checked') !== 'true';
      speed.setAttribute('aria-checked', String(fast));
      platter.classList.toggle('is-fast', fast);
      updateStatus();
    });
  }

  /* crate */
  var sleeves = Array.prototype.slice.call(document.querySelectorAll('.sleeve'));
  var pos = document.getElementById('crate-pos');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  if (!sleeves.length || !prev || !next) return;
  document.documentElement.classList.add('js');
  var i = 0;
  function show(n) {
    i = (n + sleeves.length) % sleeves.length;
    sleeves.forEach(function (s, k) {
      var front = k === i;
      s.classList.toggle('is-front', front);
      s.setAttribute('aria-hidden', String(!front));
    });
    pos.textContent = i + 1;
  }
  prev.addEventListener('click', function () { show(i - 1); });
  next.addEventListener('click', function () { show(i + 1); });
  show(0);
})();
