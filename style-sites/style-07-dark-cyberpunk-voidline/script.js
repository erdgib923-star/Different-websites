// Voidline / Null Harbor motion layer (GSAP 3.12.5 + ScrollTrigger from cdnjs).
// Nothing is hidden by CSS, so if GSAP fails to load or JS is off, every element is already visible.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Roadmap progress line: added by JS so the static page has no stray element.
  var road = document.querySelector('.road');
  var progress = null;
  if (road) {
    progress = document.createElement('span');
    progress.className = 'road__progress';
    progress.setAttribute('aria-hidden', 'true');
    road.insertBefore(progress, road.firstChild);
    // Static position: up to the current milestone.
    var items = road.querySelectorAll('.road__item');
    var now = road.querySelector('.is-now');
    var idx = Array.prototype.indexOf.call(items, now);
    var share = idx >= 0 ? (idx + 0.5) / items.length : 0.5;
    progress.style.setProperty('--p', share.toFixed(3));
  }

  if (reduce || !window.gsap) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  // Hero: one orchestrated entrance.
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero__label', { opacity: 0, y: 12, duration: 0.5 })
    .from('.hero h1', { opacity: 0, y: 40, duration: 0.9 }, '-=0.2')
    .from('.hero__lede', { opacity: 0, y: 20, duration: 0.6 }, '-=0.5')
    .from('.hero__meta p', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, '-=0.35')
    .from('.hero__cta .btn', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, '-=0.3');

  if (!window.ScrollTrigger) return;

  // Section entrances: heading, then text, then children, once.
  gsap.utils.toArray('.world, .roadmap, .studio-sec, .wishlist, .trailer').forEach(function (sec) {
    var parts = sec.querySelectorAll('.h2, .section-lede, .pillar, .road__item, .studio__text, .stats div, .frame, .signup');
    gsap.from(parts, {
      opacity: 0, y: 26, duration: 0.6, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: sec, start: 'top 80%', once: true }
    });
  });

  // Roadmap line scrubs with scroll, from 0 to the current milestone.
  if (progress) {
    var target = parseFloat(progress.style.getPropertyValue('--p')) || 0.5;
    gsap.fromTo(progress, { scaleY: 0 }, {
      scaleY: target, ease: 'none',
      scrollTrigger: { trigger: road, start: 'top 75%', end: 'center 50%', scrub: 0.6 }
    });
  }
})();
