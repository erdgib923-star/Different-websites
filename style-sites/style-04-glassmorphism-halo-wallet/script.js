// Nimbra Wallet: hero entrance + round-up savings calculator.
// Without JavaScript all content is visible and the calculator shows its default result.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero entrance, staggered. The .js class is what hides the cards, so they stay visible if this never runs.
  if (!reduce) {
    document.documentElement.classList.add('js');
    var cards = document.querySelectorAll('.hero-in');
    requestAnimationFrame(function () {
      cards.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('is-in'); }, 120 + i * 90);
      });
    });
  }

  // Round-up calculator
  var count = document.getElementById('c-count');
  var outCount = document.getElementById('o-count');
  var out = document.getElementById('calc-out');
  var form = document.getElementById('calc');
  if (!count || !out || !form) return;
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var AVG_ROUNDUP = 0.5; // dollars per payment, a stated assumption

  function update() {
    var mult = Number((form.querySelector('input[name="mult"]:checked') || { value: 1 }).value);
    var perWeek = Number(count.value);
    outCount.textContent = perWeek;
    out.textContent = money.format(perWeek * 52 * AVG_ROUNDUP * mult);
  }
  form.addEventListener('input', update);
  update();
})();
