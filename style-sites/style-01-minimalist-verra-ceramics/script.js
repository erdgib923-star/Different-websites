// Verra Ceramics: replaces the static "first Saturday of each month" text with the actual next date.
// If this script fails, the static text stays and the page is complete.
(function () {
  var el = document.getElementById('next-firing');
  if (!el) return;

  function firstSaturday(year, month) {
    var d = new Date(year, month, 1);
    d.setDate(1 + ((6 - d.getDay() + 7) % 7));
    return d;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var next = firstSaturday(today.getFullYear(), today.getMonth());
  // The sale runs Saturday and Sunday, so the opening counts until Sunday ends.
  var sunday = new Date(next); sunday.setDate(next.getDate() + 1);
  if (sunday < today) next = firstSaturday(today.getFullYear(), today.getMonth() + 1);

  var fmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  var days = Math.round((next - today) / 86400000);
  var when = days <= 0 ? 'this weekend' : days === 1 ? 'tomorrow' : 'in ' + days + ' days';
  el.textContent = fmt.format(next) + ' (' + when + ')';
})();
