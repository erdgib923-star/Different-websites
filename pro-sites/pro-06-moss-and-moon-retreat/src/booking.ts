import { gsap, EASE, reduced } from './motion';

/**
 * Custom range date picker (WAI-ARIA grid pattern): roving tabindex, arrow keys move by day,
 * Up/Down by week, Home/End to week edges, PageUp/PageDown by month, Enter/Space selects.
 * Availability and rates are deterministic SAMPLE data.
 */
const RATE = 240; // sample nightly rate, USD
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const label = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const short = (d: Date) => `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
/** sample availability: a fixed pattern of booked-out nights */
const isBooked = (d: Date) => (d.getDate() * 7 + (d.getMonth() + 1) * 3) % 11 === 0 || (d.getDay() === 6 && d.getDate() % 3 === 0);

export function initBooking() {
  const maybeBody = document.querySelector<HTMLTableSectionElement>('#cal-body');
  if (!maybeBody) return;
  const body: HTMLTableSectionElement = maybeBody;
  const title = document.querySelector<HTMLElement>('#cal-title')!;
  const prev = document.querySelector<HTMLButtonElement>('#cal-prev')!;
  const next = document.querySelector<HTMLButtonElement>('#cal-next')!;
  const sIn = document.querySelector('#s-in')!, sOut = document.querySelector('#s-out')!, sN = document.querySelector('#s-nights')!, sT = document.querySelector('#s-total')!;
  const msg = document.querySelector<HTMLElement>('#msg')!;
  const guestsOut = document.querySelector<HTMLOutputElement>('#guests')!;
  const D = reduced() ? 0 : 1;

  const today = startOfDay(new Date());
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 11, 1);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let focusDate = today;
  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  let guests = 2;

  const disabled = (d: Date) => d < today || isBooked(d);

  function render(moveFocus = false) {
    title.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    prev.disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
    next.disabled = view >= maxMonth;
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const daysIn = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = '<tr>';
    for (let i = 0; i < lead; i++) html += '<td></td>';
    for (let day = 1; day <= daysIn; day++) {
      const d = new Date(view.getFullYear(), view.getMonth(), day);
      const col = (lead + day - 1) % 7;
      if (col === 0 && day !== 1) html += '</tr><tr>';
      const sel = same(d, checkIn) || same(d, checkOut);
      const inRange = checkIn && checkOut && d > checkIn && d < checkOut;
      const booked = isBooked(d) && d >= today;
      const state = d < today ? ', past' : booked ? ', booked (sample)' : sel ? ', selected' : ', available';
      // unavailable days use aria-disabled (still focusable, so arrow keys can travel across them)
      html += `<td role="gridcell" aria-selected="${sel}"><button type="button" class="day${inRange ? ' in-range' : ''}${sel ? ' is-selected' : ''}" data-date="${key(d)}" tabindex="${same(d, focusDate) ? 0 : -1}" aria-label="${label(d)}${state}"${disabled(d) ? ' aria-disabled="true"' : ''}${booked ? ' data-booked' : ''}${same(d, today) ? ' data-today aria-current="date"' : ''}>${day}</button></td>`;
    }
    const tail = (7 - ((lead + daysIn) % 7)) % 7;
    for (let i = 0; i < tail; i++) html += '<td></td>';
    body.innerHTML = html + '</tr>';
    // the focused date may sit in another month: keep one day of this month in the tab order
    if (!body.querySelector('button[tabindex="0"]')) {
      const firstOk = body.querySelector<HTMLButtonElement>('button:not([aria-disabled])') ?? body.querySelector<HTMLButtonElement>('button');
      if (firstOk) {
        firstOk.tabIndex = 0;
        const [y, m, dd] = firstOk.dataset.date!.split('-').map(Number);
        focusDate = new Date(y, m - 1, dd);
      }
    }
    if (moveFocus) body.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    summary();
  }

  function summary() {
    sIn.textContent = checkIn ? short(checkIn) : 'Choose a date';
    sOut.textContent = checkOut ? short(checkOut) : checkIn ? 'Choose a date' : '—';
    if (checkIn && checkOut) {
      const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 864e5);
      sN.textContent = String(nights);
      sT.textContent = `$${(nights * RATE + (guests > 2 ? (guests - 2) * 40 * nights : 0)).toLocaleString('en-US')} (sample)`;
    } else {
      sN.textContent = '—';
      sT.textContent = '—';
    }
  }

  function select(d: Date) {
    msg.textContent = '';
    if (!checkIn || checkOut || d <= checkIn) {
      checkIn = d;
      checkOut = null;
    } else {
      // a stay may not span a booked-out night: start a new arrival from this date instead
      let blocked: Date | null = null;
      for (let x = addDays(checkIn, 1); x < d && !blocked; x = addDays(x, 1)) if (isBooked(x)) blocked = x;
      if (blocked) {
        checkIn = d;
        checkOut = null;
        focusDate = d;
        render(true);
        msg.textContent = `${short(blocked)} is booked in this sample calendar, so ${short(d)} is now your arrival. Pick a departure.`;
        return;
      }
      checkOut = d;
    }
    focusDate = d;
    render(true);
    const btn = body.querySelector<HTMLElement>(`[data-date="${key(d)}"]`);
    if (btn && D) gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: EASE.pop });
  }

  function moveTo(d: Date) {
    if (d < today) d = today;
    const lastAllowed = new Date(maxMonth.getFullYear(), maxMonth.getMonth() + 1, 0);
    if (d > lastAllowed) d = lastAllowed;
    focusDate = d;
    const monthChanged = d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear();
    if (monthChanged) view = new Date(d.getFullYear(), d.getMonth(), 1);
    render(true);
    if (monthChanged && D) gsap.fromTo(body, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.35, ease: EASE.soft });
  }

  body.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button.day');
    if (!b) return;
    const [y, m, d] = b.dataset.date!.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (b.getAttribute('aria-disabled') === 'true') {
      msg.textContent = `${short(date)} is ${date < today ? 'in the past' : 'booked in this sample calendar'}.`;
      return;
    }
    select(date);
  });
  body.addEventListener('keydown', (e) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      Home: () => addDays(focusDate, -((focusDate.getDay() + 6) % 7)),
      End: () => addDays(focusDate, 6 - ((focusDate.getDay() + 6) % 7)),
      PageUp: () => new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, focusDate.getDate()),
      PageDown: () => new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, focusDate.getDate()),
    };
    if (map[e.key]) {
      e.preventDefault();
      moveTo(map[e.key]());
    }
  });
  const shift = (n: number) => {
    view = new Date(view.getFullYear(), view.getMonth() + n, 1);
    focusDate = view < today ? today : view;
    render();
    if (D) gsap.fromTo(body, { opacity: 0, x: 14 * n }, { opacity: 1, x: 0, duration: 0.35, ease: EASE.soft });
  };
  prev.addEventListener('click', () => shift(-1));
  next.addEventListener('click', () => shift(1));

  const setGuests = (n: number) => {
    guests = Math.max(1, Math.min(4, n));
    guestsOut.textContent = String(guests);
    if (D) gsap.fromTo(guestsOut, { scale: 0.7 }, { scale: 1, duration: 0.4, ease: EASE.pop });
    summary();
  };
  document.querySelector('#g-minus')!.addEventListener('click', () => setGuests(guests - 1));
  document.querySelector('#g-plus')!.addEventListener('click', () => setGuests(guests + 1));

  document.querySelector<HTMLFormElement>('#booking')!.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      msg.textContent = 'Choose an arrival and a departure date first.';
      return;
    }
    msg.textContent = `Held: ${short(checkIn)} to ${short(checkOut)} for ${guests}. This is a demo, so nothing was sent.`;
    if (D) gsap.fromTo(msg, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASE.pop });
  });

  render();
}
