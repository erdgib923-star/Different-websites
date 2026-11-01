// SLAB/OS stress test: set your word in Archivo at any width and weight.
// Without JavaScript the controls are inert and the sample word "SLAB" stays visible.
(function () {
  var text = document.getElementById('stress-text');
  var wdth = document.getElementById('stress-wdth');
  var wght = document.getElementById('stress-wght');
  var out = document.getElementById('stress-out');
  var outW = document.getElementById('out-wdth');
  var outG = document.getElementById('out-wght');
  if (!text || !wdth || !wght || !out) return;

  // Updating aria-live on every slider tick is noisy for screen readers; announce text changes only.
  function render(announce) {
    var word = text.value.trim() || 'SLAB';
    if (!announce) out.setAttribute('aria-live', 'off');
    out.textContent = word;
    out.style.fontVariationSettings = '"wdth" ' + wdth.value + ', "wght" ' + wght.value;
    out.style.fontStretch = wdth.value + '%';
    out.style.fontWeight = wght.value;
    outW.textContent = wdth.value;
    outG.textContent = wght.value;
    if (!announce) requestAnimationFrame(function () { out.setAttribute('aria-live', 'polite'); });
  }

  text.addEventListener('input', function () { render(true); });
  wdth.addEventListener('input', function () { render(false); });
  wght.addEventListener('input', function () { render(false); });
  render(false);
})();
