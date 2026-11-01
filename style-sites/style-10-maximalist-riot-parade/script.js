// Riot Parade: star buttons (saved in localStorage, wrapped in try/catch), GSAP marquees,
// hero entrance and scroll-linked shapes, plus a visible "Pause motion" control (WCAG 2.2.2).
// Without JavaScript: the lineup is a plain list and the marquee bands sit still.
(function () {
  /* ---------- stars ---------- */
  var KEY = 'riot-parade-stars';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage blocked: keep in memory */ } }
  var starred = load();
  var mine = document.getElementById('mine');
  var svgStar = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';

  function updateMine() {
    var n = starred.length;
    mine.textContent = n === 0 ? 'You have starred 0 acts.' : 'You have starred ' + n + (n === 1 ? ' act: ' : ' acts: ') + starred.join(', ') + '.';
  }
  document.querySelectorAll('.act').forEach(function (li) {
    var name = li.textContent.trim();
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'star';
    b.setAttribute('aria-label', 'Star ' + name);
    b.setAttribute('aria-pressed', String(starred.indexOf(name) > -1));
    b.innerHTML = svgStar;
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      if (on) starred.push(name); else starred = starred.filter(function (x) { return x !== name; });
      save(starred); updateMine();
    });
    li.appendChild(b);
  });
  if (mine) updateMine();

  /* ---------- motion ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  var tweens = [];
  // marquees: each track holds two copies, moving one copy's width loops seamlessly
  document.querySelectorAll('.band__track').forEach(function (track) {
    var rev = track.classList.contains('band__track--rev');
    tweens.push(gsap.fromTo(track, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: 28, ease: 'none', repeat: -1 }));
  });

  // hero entrance: one orchestrated moment
  gsap.from('.hero__title .w', { yPercent: 60, opacity: 0, rotate: -4, duration: 0.9, stagger: 0.12, ease: 'back.out(1.6)' });
  gsap.from('.shape', { scale: 0, opacity: 0, duration: 0.8, stagger: 0.08, delay: 0.3, ease: 'back.out(2)' });

  // shapes spin / drift with scroll
  if (window.ScrollTrigger) {
    tweens.push(gsap.to('.shape--burst', { rotate: 180, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }));
    tweens.push(gsap.to('.shape--sun', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }));
  }

  // pause control for the looping marquees
  var toggle = document.getElementById('motion-toggle');
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var paused = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Play motion' : 'Pause motion';
      tweens.forEach(function (t) { paused ? t.pause() : t.resume(); });
    });
  }
})();
