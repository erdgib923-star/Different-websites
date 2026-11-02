// Trattoria Fioraliso: booking form (validates, then opens an email; there is no booking backend)
// and hiding the mobile sticky button when the booking section is on screen.
// Without JavaScript: the sticky button is a plain link to #reserve, and the form does nothing
// (the help text explains there is no booking system; the phone number is on the page).
(function () {
  /* hide the sticky button while the booking form is visible, so it never covers a field */
  var sticky = document.getElementById('sticky-reserve');
  var reserve = document.getElementById('reserve');
  if (sticky && reserve && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      sticky.classList.toggle('is-hidden', on);
      if (on) sticky.setAttribute('tabindex', '-1'); else sticky.removeAttribute('tabindex');
    }, { threshold: 0.05 }).observe(reserve);
  }

  /* earliest date is today */
  var date = document.getElementById('r-date');
  if (date) {
    var t = new Date();
    var iso = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    date.min = iso;
  }

  var form = document.getElementById('reserve-form');
  var err = document.getElementById('form-error');
  if (!form) return;
  var messages = {
    date: 'Choose a date for your booking.',
    time: 'Choose a time for your booking.',
    name: 'Add the name the table should be under.',
    phone: 'Add a phone number so we can confirm.'
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null, msg = '';
    ['date', 'time', 'name', 'phone'].forEach(function (n) {
      var el = form.elements[n];
      var bad = !el.value.trim() || (n === 'date' && el.min && el.value < el.min);
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !first) { first = el; msg = n === 'date' && el.value ? 'Choose today or a later date.' : messages[n]; }
    });
    if (first) {
      err.textContent = msg; err.hidden = false; first.focus();
      return;
    }
    err.hidden = true;
    var f = form.elements;
    var body = 'Booking request\n\nDate: ' + f.date.value + '\nTime: ' + f.time.value + '\nGuests: ' + f.size.value +
      '\nName: ' + f.name.value + '\nPhone: ' + f.phone.value + (f.notes.value ? '\nNotes: ' + f.notes.value : '');
    window.location.href = 'mailto:tavola@example.com?subject=' + encodeURIComponent('Table for ' + f.size.value + ' on ' + f.date.value) + '&body=' + encodeURIComponent(body);
  });
})();
