// Halcyon One — cinematic scroll layer (GSAP 3.12.5 + ScrollTrigger via cdnjs).
// Techniques: split-text converge (hero), 6-layer parallax, pinned scrubbed story,
// horizontal pinned gallery, scroll-triggered counters.
// Without JS (or with reduced motion) every step, number and panel is already in the HTML,
// and the gallery is a native horizontal scroller.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  // Split the hero headline into characters (h1 keeps an aria-label with the full text).
  var h1 = document.querySelector('.split');
  if (h1) {
    var words = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = '';
    words.forEach(function (w, wi) {
      var word = document.createElement('span'); word.className = 'word'; word.setAttribute('aria-hidden', 'true');
      w.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.appendChild(s); });
      h1.appendChild(word);
      if (wi < words.length - 1) h1.appendChild(document.createTextNode(' '));
    });
  }

  var mm = gsap.matchMedia();

  // Everything animated lives behind "motion allowed".
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    // hero: split text converges from both sides
    var chars = gsap.utils.toArray('.split .ch');
    var mid = chars.length / 2;
    gsap.from(chars, {
      x: function (i) { return (i < mid ? -1 : 1) * (40 + Math.abs(i - mid) * 6); },
      opacity: 0, duration: 1.1, ease: 'expo.out', stagger: { each: 0.025, from: 'center' }
    });
    gsap.from('.hero__lede, .hero__cta', { opacity: 0, y: 24, duration: 0.8, delay: 0.5, stagger: 0.12, ease: 'power3.out' });

    // hero parallax: deeper layers move less
    var speeds = { 0: 10, 1: 25, 2: 50, 3: 80, 5: 120 };
    Object.keys(speeds).forEach(function (d) {
      gsap.to('.hero .depth-' + d, { yPercent: speeds[d] * 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hp--hero', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // counters count up once, from 0 to the value already in the HTML
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = Number(el.dataset.count);
      gsap.fromTo(el, { textContent: 0 }, {
        textContent: target, duration: 1.8, ease: 'power1.out', snap: { textContent: 1 },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  });

  // Wide screens only: pinned story + horizontal gallery (no long pins on phones).
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', function () {
    var story = document.querySelector('.story');
    var steps = gsap.utils.toArray('.step');
    var visual = document.querySelector('.hp--story');
    story.classList.add('is-pinned');
    gsap.set(steps.slice(1), { opacity: 0, y: 40 });
    visual.setAttribute('data-step', '1');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: story, start: 'top top', end: '+=250%', pin: true, scrub: 1,
        onUpdate: function (self) {
          var n = self.progress < 0.36 ? 1 : self.progress < 0.7 ? 2 : 3;
          visual.setAttribute('data-step', String(n));
        }
      }
    });
    tl.to(steps[0], { opacity: 0, y: -40 }, '+=0.3')
      .to(steps[1], { opacity: 1, y: 0 }, '<0.15')
      .to(steps[1], { opacity: 0, y: -40 }, '+=0.5')
      .to(steps[2], { opacity: 1, y: 0 }, '<0.15')
      .to({}, { duration: 0.3 });

    // horizontal gallery: pin the section and slide the track
    var gallery = document.querySelector('.gallery');
    var track = document.querySelector('.gallery__track');
    var viewport = document.querySelector('.gallery__viewport');
    gallery.classList.add('is-horizontal');
    viewport.removeAttribute('tabindex'); // no inner scroller while pinned
    var h = gsap.to(track, {
      x: function () { return -(track.scrollWidth - document.documentElement.clientWidth + 48); },
      ease: 'none',
      scrollTrigger: { trigger: gallery, start: 'top top', end: function () { return '+=' + track.scrollWidth; }, pin: true, scrub: 1, invalidateOnRefresh: true }
    });

    return function () { // cleanup when leaving this media query
      story.classList.remove('is-pinned'); gallery.classList.remove('is-horizontal');
      viewport.setAttribute('tabindex', '0');
      gsap.set(steps, { clearProps: 'all' }); gsap.set(track, { clearProps: 'all' });
      visual.setAttribute('data-step', '0');
      h.kill(); tl.kill();
    };
  });

  window.addEventListener('load', function () { ST.refresh(); });
})();
