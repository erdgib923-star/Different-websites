// Gemma Atelier — procedural Three.js gemstone.
// - Three.js (r128, cdnjs) is lazy-loaded only when the stage nears the viewport AND WebGL is available.
// - Geometry is procedural (LatheGeometry brilliant-cut profile): no model files, 256 triangles.
// - Rendering pauses when the stage is off screen or the tab is hidden.
// - Without WebGL or JS, the static CSS gem stays visible.
(function () {
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('gem-canvas');
  var nameEl = document.getElementById('stone-name');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STONES = {
    emerald:  { color: 0x0b6b4f, sheen: 0x7ff0c8, label: 'Emerald' },
    sapphire: { color: 0x163a9c, sheen: 0x8fb0ff, label: 'Sapphire' },
    ruby:     { color: 0x8e0f2a, sheen: 0xff8aa0, label: 'Ruby' }
  };
  var setStone = function (key) { stage.dataset.stone = key; nameEl.textContent = STONES[key].label; }; // replaced once 3D runs

  document.querySelectorAll('input[name="stone"]').forEach(function (r) {
    r.addEventListener('change', function () { setStone(r.value); });
  });

  function webglAvailable() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  if (!stage || !canvas || !webglAvailable() || !('IntersectionObserver' in window)) return;

  // lazy-load when the stage is within 200px of the viewport
  var loader = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    loader.disconnect();
    loadScript(THREE_URL).then(init).catch(function () { /* CDN failed: CSS gem stays */ });
  }, { rootMargin: '200px' });
  loader.observe(stage);

  function init() {
    var THREE = window.THREE; if (!THREE) return;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    // render-loop state, declared first so nothing reads it before it exists
    var running = false, visible = true, raf = 0;
    var scrollProgress = { v: 0 };
    var target = { x: 0.25, y: 0 }, spin = 0, dragging = false, lastX = 0, velocity = 0;
    var clock = new THREE.Clock();

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 2.9, 5.4);
    camera.lookAt(0, -0.15, 0);

    // brilliant-cut profile: table -> crown -> girdle -> pavilion -> culet
    var profile = [
      [0.0, 0.40], [0.56, 0.40], [0.80, 0.26], [0.98, 0.06], [1.0, 0.02],
      [1.0, -0.03], [0.70, -0.36], [0.34, -0.70], [0.0, -0.98]
    ].reverse() // culet -> table order gives outward-facing normals
     .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var geometry = new THREE.LatheGeometry(profile, 16); // 16 facets around
    var material = new THREE.MeshPhysicalMaterial({
      color: STONES.emerald.color, metalness: 0.25, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04,
      reflectivity: 1, flatShading: true
    });
    var gem = new THREE.Mesh(geometry, material);
    gem.scale.setScalar(1.25);
    scene.add(gem);

    // lights: warm key, cool rim, and two orbiting sparkle lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    var key = new THREE.DirectionalLight(0xfff1dc, 1.1); key.position.set(3, 4, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0x9fc7ff, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);
    var s1 = new THREE.PointLight(STONES.emerald.sheen, 2.2, 10); var s2 = new THREE.PointLight(0xffffff, 1.6, 10);
    scene.add(s1); scene.add(s2);

    // expose triangle count for checks
    window.__gem = { triangles: function () { return renderer.info.render.triangles; } };

    setStone = function (key) {
      stage.dataset.stone = key; nameEl.textContent = STONES[key].label;
      material.color.setHex(STONES[key].color).convertSRGBToLinear(); s1.color.setHex(STONES[key].sheen).convertSRGBToLinear();
      if (!running) renderOnce();
    };

    function resize() {
      var r = stage.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', function () { resize(); if (!running) renderOnce(); });

    // pointer: tilt toward the pointer; drag spins
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      target.x = 0.25 + ny * 0.6; target.y = nx * 0.8;
      if (dragging) { var dx = e.clientX - lastX; spin += dx * 0.01; velocity = dx * 0.01; lastX = e.clientX; }
      if (!running) renderOnce();
    });
    // keyboard alternative to dragging (web-design-guidelines: gestures need keyboard alternatives)
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'A brilliant-cut gemstone. Use the left and right arrow keys, or drag, to turn it.');
    canvas.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        spin += (e.key === 'ArrowRight' ? 1 : -1) * Math.PI / 16; // one facet per key press
        e.preventDefault();
        if (!running) renderOnce();
      }
    });
    canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', function () { dragging = false; });
    canvas.addEventListener('pointercancel', function () { dragging = false; });

    // scroll: gem shrinks and lifts slightly as the hero leaves (GSAP ScrollTrigger feeds a value)
    if (window.gsap && window.ScrollTrigger && !reduce) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.to(scrollProgress, { v: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    function frame() {
      var t = clock.getElapsedTime();
      if (!reduce) spin += (dragging ? 0 : 0.004 + velocity);
      velocity *= 0.94;
      gem.rotation.y = spin;
      gem.rotation.x += (target.x - gem.rotation.x) * 0.06;
      gem.rotation.z += (-target.y * 0.25 - gem.rotation.z) * 0.06;
      var sc = 1.25 * (1 - scrollProgress.v * 0.25);
      gem.scale.setScalar(sc);
      gem.position.y = scrollProgress.v * 0.6;
      s1.position.set(Math.cos(t * 0.9) * 3, 1.5, Math.sin(t * 0.9) * 3);
      s2.position.set(Math.cos(-t * 0.6 + 2) * 3, -0.5, Math.sin(-t * 0.6 + 2) * 3);
      renderer.render(scene, camera);
    }
    function loop() { if (!running) return; frame(); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduce || !visible || document.hidden) return; running = true; clock.start(); loop(); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function renderOnce() { frame(); }

    // pause when off screen or tab hidden
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(stage);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    window.__gem.isRunning = function () { return running; };

    var checked = document.querySelector('input[name="stone"]:checked');
    setStone(checked ? checked.value : 'emerald');
    renderOnce();
    stage.classList.add('is-3d');
    start();
  }

  // gsap-scroll: gentle section reveals (no content hidden without JS)
  if (window.gsap && window.ScrollTrigger && !reduce) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.utils.toArray('.feature').forEach(function (sec) {
      window.gsap.from(sec.children, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
    });
  }
})();
