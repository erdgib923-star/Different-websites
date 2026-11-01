// Pebble Home demo panel: switches, room tabs, scenes and a thermostat dial (pointer + keyboard).
// Without JavaScript the panel renders in its default state; nothing is hidden.
(function () {
  var announce = document.getElementById('announce');
  function say(msg) { if (announce) { announce.textContent = ''; setTimeout(function () { announce.textContent = msg; }, 30); } }

  /* ---------- switches ---------- */
  function setSwitch(btn, on) {
    btn.setAttribute('aria-checked', String(on));
    var state = document.getElementById(btn.getAttribute('aria-describedby'));
    if (state) state.textContent = on ? btn.dataset.on : btn.dataset.off;
  }
  document.querySelectorAll('.switch').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSwitch(btn, btn.getAttribute('aria-checked') !== 'true');
    });
  });

  /* ---------- thermostat dial ---------- */
  var MIN = 10, MAX = 30, START = 135, SWEEP = 270; // degrees, clockwise from 12 o'clock is 0
  var CX = 100, CY = 100, R = 86;
  var dial = document.getElementById('dial');
  var svg = document.querySelector('.dial__svg');
  var track = document.querySelector('.dial__track');
  var fill = document.querySelector('.dial__fill');
  var knob = document.querySelector('.dial__knob');
  var num = document.getElementById('dial-num');
  var mode = document.getElementById('dial-mode');
  var roomTemp = document.getElementById('room-temp');
  var value = 21;

  // angle measured clockwise from the positive x-axis in SVG coords
  function pt(angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  }
  // dial angles: 0 = top, clockwise. Track runs from 225° (bottom-left) through 0° to 135° (bottom-right).
  function arc(from, to) {
    var p1 = pt(from), p2 = pt(to);
    var sweep = ((to - from) % 360 + 360) % 360;
    var large = sweep > 180 ? 1 : 0;
    return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
  }
  var A0 = 225; // start angle (degrees, 0 = top, clockwise)
  function angleFor(v) { return A0 + (v - MIN) / (MAX - MIN) * SWEEP; }

  function render() {
    var a = angleFor(value);
    track.setAttribute('d', arc(A0, A0 + SWEEP - 0.01));
    fill.setAttribute('d', value > MIN ? arc(A0, a) : '');
    var k = pt(a);
    knob.setAttribute('cx', k[0].toFixed(2));
    knob.setAttribute('cy', k[1].toFixed(2));
    var text = value.toFixed(1);
    num.textContent = text;
    var room = parseFloat(roomTemp.textContent);
    var m = value > room + 0.2 ? 'Heating' : value < room - 0.2 ? 'Cooling' : 'Holding';
    mode.textContent = m;
    dial.setAttribute('aria-valuenow', String(value));
    dial.setAttribute('aria-valuetext', text + ' degrees Celsius, ' + m.toLowerCase());
  }
  function set(v) {
    value = Math.min(MAX, Math.max(MIN, Math.round(v * 2) / 2));
    render();
  }

  if (dial && svg) {
    dial.addEventListener('keydown', function (e) {
      var step = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5, PageUp: 2, PageDown: -2 }[e.key];
      if (step) { set(value + step); e.preventDefault(); }
      else if (e.key === 'Home') { set(MIN); e.preventDefault(); }
      else if (e.key === 'End') { set(MAX); e.preventDefault(); }
    });
    document.getElementById('dial-up').addEventListener('click', function () { set(value + 0.5); });
    document.getElementById('dial-down').addEventListener('click', function () { set(value - 0.5); });

    function fromPointer(e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * 200 - CX;
      var y = (e.clientY - r.top) / r.height * 200 - CY;
      var deg = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360; // 0 = top, clockwise
      var rel = (deg - A0 + 360) % 360;                             // 0..360 from start
      if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP; // snap the dead zone to the nearest end
      set(MIN + rel / SWEEP * (MAX - MIN));
    }
    var dragging = false;
    svg.addEventListener('pointerdown', function (e) { dragging = true; svg.setPointerCapture(e.pointerId); fromPointer(e); });
    svg.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    svg.addEventListener('pointerup', function () { dragging = false; });
    svg.addEventListener('pointercancel', function () { dragging = false; });
    render();
  }

  /* ---------- room tabs (sample data per room) ---------- */
  var rooms = {
    living:  { temp: 21, room: '20.4', sw: [true, false, false, true] },
    kitchen: { temp: 19.5, room: '19.8', sw: [true, true, false, false] },
    bedroom: { temp: 18, room: '18.9', sw: [false, false, true, false] }
  };
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panel = document.getElementById('room-panel');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    var d = rooms[tab.dataset.room];
    roomTemp.textContent = d.room;
    document.querySelectorAll('.switch').forEach(function (s, i) { setSwitch(s, d.sw[i]); });
    set(d.temp);
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (j === null) return;
      e.preventDefault();
      selectTab(tabs[(j + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- scenes ---------- */
  var scenes = {
    morning: { sw: [true, true, false, true], temp: 21 },
    evening: { sw: [true, false, false, true], temp: 21 },
    away:    { sw: [false, false, false, false], temp: 16 },
    night:   { sw: [false, false, true, false], temp: 18 }
  };
  document.querySelectorAll('input[name="scene"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var s = scenes[r.value];
      document.querySelectorAll('.switch').forEach(function (b, i) { setSwitch(b, s.sw[i]); });
      set(s.temp);
      say(r.parentNode.textContent.trim() + ' scene on. Thermostat set to ' + s.temp + ' degrees.');
    });
  });
})();
