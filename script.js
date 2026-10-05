/* =========================================================
   Date invitation — script
   =========================================================

   ✏️  CUSTOMIZE EVERYTHING IN THE CONFIG BLOCK BELOW.
   You shouldn't need to touch anything else.

   Placeholders you can use in the messages:
     {date} → chosen date, e.g. "October 5, 2026"
     {day}  → chosen weekday, e.g. "Monday"
     {time} → chosen time,  e.g. "5:00 PM"

   The site is intentionally generic: no names appear anywhere.
   ========================================================= */

const CONFIG = {
  // ----- Opening -----
  loaderText: "Getting something ready…",
  envelopeHint: "Tap the envelope to open it",

  // ----- The question -----
  kicker: "Hey you…",
  question: "Would you like to go on a date with me? ❤️",
  lede: "I’ve been wanting to ask you this for a while.",
  yesText: "❤️ Yes, I’d love to",
  noText: "🙈 No",

  // What the No button says as she keeps chasing it (cycles forever)
  noTexts: [
    "Are you sure? 🥺",
    "Think again 😭",
    "Nice try 😂",
    "Nope! 💕",
    "Just click Yes 😌",
    "Too slow 🏃‍♀️",
    "I’ll be sad 🥹",
  ],
  noTextStartsAfter: 1, // change the text after this many attempts
  yesGrowPerAttempt: 0.04, // the Yes button grows a little each time…
  yesMaxScale: 1.3, // …up to this size

  // ----- After Yes -----
  celebrateText: "Yay!",
  dateKicker: "Yay! ❤️",
  dateTitle: "Now let’s choose our date.",
  timeTitle: "What time works for you?",
  reviewTitle: "Our date 💕",
  confirmText: "Confirm our date ❤️",

  // ----- Success -----
  successTitle: "It’s a date! ❤️",
  successText: "Can’t wait to see you.",

  // ----- Dates she can pick -----
  dates: {
    minDate: "",            // "YYYY-MM-DD", or "" for today
    maxDate: "",            // "YYYY-MM-DD", or "" to use daysAhead
    daysAhead: 90,          // used when maxDate is ""
    disabledWeekdays: [],   // 0 = Sunday … 6 = Saturday, e.g. [1, 2] blocks Mon & Tue
    blockedDates: [],       // e.g. ["2026-10-31", "2026-11-01"]
    weekStartsOn: 0,        // 0 = Sunday, 1 = Monday
  },

  // ----- Times she can pick (24-hour "HH:MM") -----
  times: ["12:00", "13:00", "15:00", "17:00", "18:00", "19:00", "19:30", "20:00"],
  minHoursNotice: 2, // for today, hide times sooner than this

  // Language/format for dates and times ("en-US" → October 5, 2026 · 5:00 PM)
  locale: "en-US",

  // ----- How she tells you -----
  contact: {
    whatsappNumber: "49155510349968", // your WhatsApp: country code + number, digits only (no + or spaces)
    email: "",                        // optional: shows a "Send by email" button
  },
  whatsappButtonText: "Send me a message 💬",
  // The prepared message (WhatsApp, email, share sheet, clipboard).
  // {date} and {time} are replaced with what she actually picked.
  shareMessage: "It’s a date! ❤️\nI picked {date} at {time} 💕",

  // Google Calendar event details
  calendarEvent: {
    title: "Our date 💕",
    details: "It’s a date! ❤️",
    location: "",
    durationMinutes: 120,
  },

  // ----- Automatic notification via Formspree (see README) -----
  // Paste your Formspree endpoint here, e.g. "https://formspree.io/f/abcdwxyz".
  // A Formspree endpoint is public by design; it is NOT a secret or password.
  formspreeEndpoint: "https://formspree.io/f/xyekyvyg",
  formspreeSubject: "It’s a date! ❤️ New answer from your invitation",

  // Advanced: other services (see README). Leave as-is to use Formspree above.
  // method: "formspree" | "googleSheets" | "custom" | "none"
  // Only put PUBLIC endpoint URLs here — never API keys or bot tokens.
  backend: {
    method: "formspree",
    endpoint: "", // used for googleSheets/custom; Formspree uses formspreeEndpoint
  },
};

/* =========================================================
   Nothing below needs editing — but it's commented in case
   you're curious or want to tweak behaviour.
   ========================================================= */

(() => {
  "use strict";

  // ----- Helpers -----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => min + Math.random() * (max - min);

  const state = {
    date: null,       // Date object (local, midnight)
    time: null,       // "HH:MM"
    viewMonth: null,  // Date object for the first of the month on screen
    noAttempts: 0,
    current: "loader",
  };

  /* ---------- Text templating ---------- */
  function fill(text) {
    return String(text ?? "")
      .replaceAll("{date}", state.date ? fmtDate(state.date) : "")
      .replaceAll("{day}", state.date ? fmtWeekday(state.date) : "")
      .replaceAll("{time}", state.time ? fmtTime(state.time) : "");
  }
  const setText = (el, text) => { if (el) el.textContent = fill(text); };

  /* ---------- Date helpers (all local time, no time zone surprises) ---------- */
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const pad2 = (n) => String(n).padStart(2, "0");
  const isoDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  function parseDay(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  const fmtDate = (d) => new Intl.DateTimeFormat(CONFIG.locale, { month: "long", day: "numeric", year: "numeric" }).format(d);
  const fmtWeekday = (d) => new Intl.DateTimeFormat(CONFIG.locale, { weekday: "long" }).format(d);
  function fmtTime(t) {
    const [h, m] = t.split(":").map(Number);
    return new Intl.DateTimeFormat(CONFIG.locale, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, h, m));
  }
  function dateTimeOf(day, t) {
    const [h, m] = t.split(":").map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  }

  const today = startOfDay(new Date());
  const minDate = parseDay(CONFIG.dates.minDate) || today;
  const maxDate = parseDay(CONFIG.dates.maxDate) || addDays(today, CONFIG.dates.daysAhead || 90);
  const blocked = new Set(CONFIG.dates.blockedDates || []);

  // A time slot is available if it's far enough in the future
  function timeAvailable(day, t) {
    const notice = (CONFIG.minHoursNotice || 0) * 3600 * 1000;
    return dateTimeOf(day, t).getTime() - Date.now() >= notice;
  }
  function dayAvailable(d) {
    if (d < minDate || d > maxDate) return false;
    if (d < today) return false;
    if ((CONFIG.dates.disabledWeekdays || []).includes(d.getDay())) return false;
    if (blocked.has(isoDay(d))) return false;
    return CONFIG.times.some((t) => timeAvailable(d, t));
  }

  /* =========================================================
     Apply config text to the page
     ========================================================= */
  function applyText() {
    setText($("#loaderText"), CONFIG.loaderText);
    setText($("#envHint"), CONFIG.envelopeHint);
    setText($("#askKicker"), CONFIG.kicker);
    setText($("#askTitle"), CONFIG.question);
    setText($("#askLede"), CONFIG.lede);
    setText($("#yesBtn"), CONFIG.yesText);
    setText($("#noBtn"), CONFIG.noText);
    setText($("#celebrateText"), CONFIG.celebrateText);
    setText($("#dateKicker"), CONFIG.dateKicker);
    setText($("#dateTitle"), CONFIG.dateTitle);
    setText($("#timeTitle"), CONFIG.timeTitle);
    setText($("#reviewTitle"), CONFIG.reviewTitle);
    setText($("#confirmBtn"), CONFIG.confirmText);
    setText($("#successTitle"), CONFIG.successTitle);
    setText($("#successText"), CONFIG.successText);
    setText($("#waLabel"), CONFIG.whatsappButtonText);
  }

  /* =========================================================
     Screen navigation
     ========================================================= */
  const screens = $$(".screen");
  function showScreen(name) {
    const next = $(`.screen[data-screen="${name}"]`);
    const prev = $(".screen.is-active");
    if (!next || next === prev) return;

    if (prev) {
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      setTimeout(() => prev.classList.remove("is-leaving"), 750);
    }
    next.classList.add("is-active");
    next.scrollTop = 0;
    state.current = name;

    // Only the visible screen is reachable by keyboard / screen readers
    screens.forEach((s) => {
      const active = s === next;
      s.inert = !active;
      s.setAttribute("aria-hidden", String(!active));
    });

    // The escaped No button lives outside the screens, so hide it elsewhere
    NoButton.setVisible(name === "ask");

    // Move focus to the new heading for screen readers & keyboards
    const heading = next.querySelector(".title");
    if (heading) setTimeout(() => heading.focus({ preventScroll: true }), 450);
  }
  screens.forEach((s) => { if (!s.classList.contains("is-active")) { s.inert = true; s.setAttribute("aria-hidden", "true"); } });

  // Any element with data-go="screenName" navigates there
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    if (go.dataset.go === "time") renderTimes();
    if (go.dataset.go === "date") renderCalendar();
    showScreen(go.dataset.go);
  });

  /* =========================================================
     Background floating hearts
     ========================================================= */
  function spawnFloatingHearts() {
    if (reduceMotion) return;
    const layer = $("#heartsLayer");
    const count = window.innerWidth < 600 ? 14 : 22;
    const colors = ["#ff9eb8", "#ffb8ca", "#e8436f", "#c9b4ff", "#ffc9d6"];
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "float-heart";
      const size = rand(10, 28);
      h.style.setProperty("--x", `${rand(0, 100)}%`);
      h.style.setProperty("--size", `${size}px`);
      h.style.setProperty("--dur", `${rand(12, 24)}s`);
      h.style.setProperty("--delay", `${-rand(0, 24)}s`);
      h.style.setProperty("--drift", `${rand(-60, 60)}px`);
      h.style.setProperty("--o", (size / 28 * 0.5 + 0.2).toFixed(2));
      h.style.setProperty("--c", colors[i % colors.length]);
      layer.appendChild(h);
    }
  }

  /* =========================================================
     Celebrations: confetti (CDN) with a DOM fallback
     ========================================================= */
  const COLORS = ["#e8436f", "#ff9eb8", "#ffd1dc", "#b79cff", "#ffffff"];
  let heartShape = null;
  function getHeartShape() {
    if (heartShape || typeof confetti !== "function" || !confetti.shapeFromPath) return heartShape;
    try {
      heartShape = confetti.shapeFromPath({
        path: "M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6.1 4.5c2.3 0 3.9 1.4 5.9 3.6 2-2.2 3.6-3.6 5.9-3.6 3.9 0 5.7 4.1 4.1 7.2C19.5 16.4 12 21 12 21z",
      });
    } catch { heartShape = null; }
    return heartShape;
  }

  function fire(opts) {
    if (typeof confetti !== "function") return false;
    const heart = getHeartShape();
    confetti({
      colors: COLORS,
      shapes: heart ? [heart, heart, "circle"] : ["circle", "square"],
      scalar: heart ? 1.6 : 1,
      disableForReducedMotion: true,
      zIndex: 65,
      ...opts,
    });
    return true;
  }

  // Small burst of emoji hearts from a point (works without any library)
  function burstHearts(x, y, n = 12, chars = ["💖", "💕", "❤️", "✨", "💗"]) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "burst-heart";
      s.textContent = chars[i % chars.length];
      const angle = (Math.PI * 2 * i) / n + rand(-0.3, 0.3);
      const dist = rand(60, 140);
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist - 30}px`);
      s.style.setProperty("--r", `${rand(-40, 40)}deg`);
      s.style.setProperty("--s", `${rand(14, 26)}px`);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function yesCelebration(fromEl) {
    const { x, y } = centerOf(fromEl);
    const ox = x / window.innerWidth, oy = y / window.innerHeight;
    const fired = fire({ particleCount: 90, spread: 100, startVelocity: 42, origin: { x: ox, y: oy } });
    if (fired) {
      setTimeout(() => fire({ particleCount: 50, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } }), 250);
      setTimeout(() => fire({ particleCount: 50, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } }), 400);
    } else {
      burstHearts(x, y, 20);
    }
  }

  function finalCelebration() {
    if (typeof confetti !== "function") {
      burstHearts(window.innerWidth / 2, window.innerHeight / 2.5, 24);
      return;
    }
    const end = Date.now() + 2600;
    (function frame() {
      fire({ particleCount: 4, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.8 } });
      fire({ particleCount: 4, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.8 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(() => fire({ particleCount: 120, spread: 160, startVelocity: 35, origin: { x: 0.5, y: 0.35 } }), 600);
  }

  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  /* =========================================================
     The runaway No button 🙈
     ========================================================= */
  const NoButton = (() => {
    const btn = $("#noBtn");
    const slot = $("#noSlot");
    const yes = $("#yesBtn");
    const buddy = $("#buddy");
    let escaped = false;
    let lastMove = 0;
    let sadTimer = null;
    const EDGE = 14;       // keep this far from screen edges
    const AVOID_PAD = 16;  // keep this far from text and the Yes button
    const NEAR = 70;       // (mouse) start running when the cursor gets this close

    // Things the No button must never cover
    function avoidRects() {
      return ["#yesBtn", "#askTitle", "#askKicker", "#askLede", "#buddy"]
        .map((s) => $(s))
        .filter((el) => el && el.offsetParent !== null)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - AVOID_PAD, top: r.top - AVOID_PAD, right: r.right + AVOID_PAD, bottom: r.bottom + AVOID_PAD };
        });
    }
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    function viewport() {
      const vv = window.visualViewport;
      return {
        w: vv ? vv.width : document.documentElement.clientWidth,
        h: vv ? vv.height : window.innerHeight,
      };
    }

    // Pull the button out of the card so it can roam the whole screen.
    // (It's moved to <body> because a transformed parent would break position: fixed.)
    function detach() {
      const r = btn.getBoundingClientRect();
      // Freeze the slot at the button's size, then shrink it so the Yes button can settle in
      slot.style.width = `${r.width}px`;
      slot.style.height = `${r.height}px`;
      document.body.appendChild(btn);
      requestAnimationFrame(() => {
        slot.classList.add("is-empty");
        slot.style.width = "0px";
        slot.style.height = "0px";
      });
      btn.style.left = `${r.left}px`;
      btn.style.top = `${r.top}px`;
      btn.style.position = "fixed";
      void btn.offsetWidth; // commit the start position before turning on transitions
      btn.classList.add("is-escaped");
      escaped = true;
    }

    function updateText() {
      const n = state.noAttempts - CONFIG.noTextStartsAfter;
      if (n >= 0 && CONFIG.noTexts.length) {
        btn.textContent = CONFIG.noTexts[n % CONFIG.noTexts.length];
      }
    }

    function growYes() {
      const s = Math.min(1 + state.noAttempts * CONFIG.yesGrowPerAttempt, CONFIG.yesMaxScale);
      yes.style.setProperty("--yes-scale", s.toFixed(3));
    }

    function makeBuddySad() {
      buddy.classList.remove("is-happy", "is-sad");
      void buddy.offsetWidth;
      buddy.classList.add("is-sad");
      clearTimeout(sadTimer);
      sadTimer = setTimeout(() => buddy.classList.remove("is-sad"), 1400);
    }

    // Pick a new spot far from the finger/cursor that overlaps nothing important
    function pickSpot(px, py, w, h) {
      const { w: vw, h: vh } = viewport();
      const avoid = avoidRects();
      const cur = btn.getBoundingClientRect();
      const curX = cur.left + cur.width / 2, curY = cur.top + cur.height / 2;
      const maxX = Math.max(EDGE, vw - w - EDGE);
      const maxY = Math.max(EDGE, vh - h - EDGE);

      let best = null;
      let bestScore = -Infinity;
      for (let i = 0; i < 80; i++) {
        const x = rand(EDGE, maxX);
        const y = rand(EDGE, maxY);
        const box = { left: x, top: y, right: x + w, bottom: y + h };
        const hits = avoid.filter((a) => overlaps(box, a)).length;
        const cx = x + w / 2, cy = y + h / 2;
        const fromPointer = Math.hypot(cx - px, cy - py);
        const fromCurrent = Math.hypot(cx - curX, cy - curY);
        // Prefer: no overlaps ≫ far from pointer > actually moving somewhere new
        const score = -hits * 10000 + Math.min(fromPointer, 420) + Math.min(fromCurrent, 260) * 0.6 + rand(0, 40);
        if (score > bestScore) { bestScore = score; best = { x, y }; }
      }
      return best;
    }

    function clampIntoView() {
      if (!escaped) return;
      const { w: vw, h: vh } = viewport();
      const r = btn.getBoundingClientRect();
      const x = Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - r.width - EDGE));
      const y = Math.min(Math.max(EDGE, r.top), Math.max(EDGE, vh - r.height - EDGE));
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
    }

    function escape(px, py) {
      if (state.current !== "ask") return;
      const now = performance.now();
      if (now - lastMove < 140) return; // don't fire several times for one tap
      lastMove = now;

      const old = centerOf(btn);
      if (px == null) { px = old.x; py = old.y; }

      if (!escaped) detach();
      state.noAttempts++;
      updateText();
      growYes();
      makeBuddySad();
      vibrate(15);

      // Measure after the text change so the new label fits on screen
      const w = btn.offsetWidth, h = btn.offsetHeight;
      const spot = pickSpot(px, py, w, h);
      btn.style.left = `${spot.x}px`;
      btn.style.top = `${spot.y}px`;

      btn.classList.remove("is-squish");
      void btn.offsetWidth;
      btn.classList.add("is-squish");
      burstHearts(old.x, old.y, 6, ["💨", "✨", "💨"]);
    }

    // --- Events ---
    // Touch & pen & mouse press: run before a click can happen
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); escape(e.clientX, e.clientY); });
    // Extra safety for iOS: stop the tap from becoming a click
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; escape(t.clientX, t.clientY); }, { passive: false });
    // Mouse hovering over it
    btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") escape(e.clientX, e.clientY); });
    // Keyboard (Enter/Space) or any click that slipped through
    btn.addEventListener("click", (e) => { e.preventDefault(); escape(); });

    // Mouse getting close (desktop)
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || state.current !== "ask" || btn.classList.contains("is-gone")) return;
      const r = btn.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.hypot(dx, dy) < NEAR) escape(e.clientX, e.clientY);
    });

    window.addEventListener("resize", clampIntoView);
    window.visualViewport && window.visualViewport.addEventListener("resize", clampIntoView);

    return {
      setVisible(v) {
        if (escaped) btn.classList.toggle("is-gone", !v);
        btn.tabIndex = v ? 0 : -1;
      },
      hide() { btn.classList.add("is-gone"); btn.tabIndex = -1; },
    };
  })();

  /* =========================================================
     Yes!
     ========================================================= */
  const yesBtn = $("#yesBtn");
  const buddy = $("#buddy");
  // Buddy lights up when she hovers/focuses Yes
  ["pointerenter", "focus"].forEach((ev) => yesBtn.addEventListener(ev, () => { buddy.classList.remove("is-sad"); buddy.classList.add("is-happy"); }));
  ["pointerleave", "blur"].forEach((ev) => yesBtn.addEventListener(ev, () => buddy.classList.remove("is-happy")));

  yesBtn.addEventListener("click", async () => {
    yesBtn.disabled = true;
    NoButton.hide();
    buddy.classList.add("is-happy");
    vibrate([20, 40, 20]);
    yesCelebration(yesBtn);

    const overlay = $("#celebrate");
    overlay.classList.add("is-on");
    await wait(reduceMotion ? 600 : 1500);
    renderCalendar();
    showScreen("date");
    overlay.classList.remove("is-on");
  });

  /* =========================================================
     Calendar
     ========================================================= */
  const calGrid = $("#calGrid");
  const calMonth = $("#calMonth");
  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const dateNext = $("#dateNext");

  function renderWeekdays() {
    const wrap = $("#calWeekdays");
    const fmt = new Intl.DateTimeFormat(CONFIG.locale, { weekday: "narrow" });
    wrap.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const dayIndex = (CONFIG.dates.weekStartsOn + i) % 7;
      // Jan 4, 1970 was a Sunday
      const s = document.createElement("span");
      s.textContent = fmt.format(new Date(1970, 0, 4 + dayIndex));
      wrap.appendChild(s);
    }
  }

  // First month that has a selectable day
  function firstAvailableMonth() {
    for (let d = new Date(Math.max(minDate, today)); d <= maxDate; d = addDays(d, 1)) {
      if (dayAvailable(d)) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }

  function renderCalendar() {
    if (!state.viewMonth) state.viewMonth = state.date ? new Date(state.date.getFullYear(), state.date.getMonth(), 1) : firstAvailableMonth();
    const vm = state.viewMonth;
    const year = vm.getFullYear(), month = vm.getMonth();
    calMonth.textContent = new Intl.DateTimeFormat(CONFIG.locale, { month: "long", year: "numeric" }).format(vm);

    calGrid.innerHTML = "";
    const lead = (new Date(year, month, 1).getDay() - CONFIG.dates.weekStartsOn + 7) % 7;
    for (let i = 0; i < lead; i++) calGrid.appendChild(document.createElement("span"));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const labelFmt = new Intl.DateTimeFormat(CONFIG.locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.textContent = day;
      const ok = dayAvailable(d);
      b.disabled = !ok;
      if (sameDay(d, today)) b.classList.add("is-today");
      b.setAttribute("aria-pressed", String(sameDay(d, state.date)));
      b.setAttribute("aria-label", labelFmt.format(d) + (sameDay(d, today) ? ", today" : "") + (ok ? "" : ", not available"));
      b.addEventListener("click", () => selectDate(d));
      calGrid.appendChild(b);
    }

    calPrev.disabled = new Date(year, month, 0) < minDate || new Date(year, month, 0) < today;
    calNext.disabled = new Date(year, month + 1, 1) > maxDate;
    updateDateNext();
  }

  function selectDate(d) {
    state.date = d;
    // If her previously chosen time doesn't work on the new day, clear it
    if (state.time && !timeAvailable(d, state.time)) state.time = null;
    $$(".day", calGrid).forEach((b) => b.setAttribute("aria-pressed", "false"));
    const btn = $$(".day", calGrid).find((b) => b.textContent === String(d.getDate()));
    if (btn) btn.setAttribute("aria-pressed", "true");
    updateDateNext();
  }

  function updateDateNext() {
    dateNext.disabled = !state.date;
    dateNext.textContent = state.date ? "Choose a time" : "Pick a day first";
  }

  calPrev.addEventListener("click", () => { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1); renderCalendar(); });
  calNext.addEventListener("click", () => { state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1); renderCalendar(); });
  dateNext.addEventListener("click", () => { renderTimes(); showScreen("time"); });

  /* =========================================================
     Time slots
     ========================================================= */
  const timeGrid = $("#timeGrid");
  const timeNext = $("#timeNext");

  function renderTimes() {
    if (!state.date) return;
    $("#timeKicker").textContent = `${fmtWeekday(state.date)}, ${fmtDate(state.date)}`;
    timeGrid.innerHTML = "";
    let any = false;
    CONFIG.times.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "time";
      b.textContent = fmtTime(t);
      const ok = timeAvailable(state.date, t);
      any = any || ok;
      b.disabled = !ok;
      b.setAttribute("aria-pressed", String(state.time === t));
      if (!ok) b.setAttribute("aria-label", `${fmtTime(t)}, not available`);
      b.addEventListener("click", () => {
        state.time = t;
        $$(".time", timeGrid).forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        updateTimeNext();
      });
      timeGrid.appendChild(b);
    });
    if (!any) {
      const p = document.createElement("p");
      p.className = "times__empty";
      p.textContent = "No times left on this day. Pick another day.";
      timeGrid.appendChild(p);
    }
    updateTimeNext();
  }

  function updateTimeNext() {
    timeNext.disabled = !state.time;
    timeNext.textContent = state.time ? "Review our date" : "Pick a time first";
  }

  timeNext.addEventListener("click", () => {
    $("#reviewDate").textContent = `${fmtWeekday(state.date)}, ${fmtDate(state.date)}`;
    $("#reviewTime").textContent = fmtTime(state.time);
    showScreen("review");
  });

  /* =========================================================
     Confirm → success
     ========================================================= */
  const confirmBtn = $("#confirmBtn");
  const statusEl = $("#sendStatus");

  // What gets sent to you. The keys become the field names in your Formspree email.
  function buildPayload() {
    const now = new Date();
    return {
      "Accepted": "Yes ❤️",
      "Selected date": `${fmtWeekday(state.date)}, ${fmtDate(state.date)}`, // "Saturday, October 10, 2026"
      "Selected time": fmtTime(state.time),                                  // "5:00 PM"
      "Date (YYYY-MM-DD)": isoDay(state.date),                               // "2026-10-10"
      "Time (24h)": state.time,                                              // "17:00"
      "No-button attempts": state.noAttempts,                                // how many times she chased No 😄
      "Submitted at": new Intl.DateTimeFormat(CONFIG.locale, { dateStyle: "full", timeStyle: "long" }).format(now),
      "Submitted at (UTC)": now.toISOString(),
    };
  }

  // Which endpoint to use, or "" if nothing is configured yet
  function backendEndpoint() {
    const { method, endpoint } = CONFIG.backend || {};
    const url = method === "formspree" ? CONFIG.formspreeEndpoint : endpoint;
    if (!method || method === "none" || !url || url.includes("PASTE_") || !/^https:\/\//.test(url)) return "";
    return url;
  }

  // Send to the optional backend. Returns "skipped" | "sent" | "failed".
  async function submitResponse(payload) {
    const { method } = CONFIG.backend || {};
    const endpoint = backendEndpoint();
    if (!endpoint) return "skipped";
    if (method === "formspree") payload = { _subject: CONFIG.formspreeSubject, ...payload };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      if (method === "googleSheets") {
        // Apps Script doesn't send CORS headers, so use no-cors + text/plain.
        // The response can't be read, but the row is still written.
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        return "sent";
      }
      // Formspree and most form/serverless services accept JSON
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return res.ok ? "sent" : "failed";
    } catch (err) {
      console.warn("Could not send response:", err);
      return "failed";
    } finally {
      clearTimeout(timer);
    }
  }

  function prepareShareLinks() {
    const msg = fill(CONFIG.shareMessage);
    const digits = String(CONFIG.contact.whatsappNumber || "").replace(/\D/g, "");
    $("#waBtn").href = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;

    // Google Calendar (times are "floating", so they follow her calendar's time zone)
    const start = dateTimeOf(state.date, state.time);
    const end = new Date(start.getTime() + (CONFIG.calendarEvent.durationMinutes || 120) * 60000);
    const g = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: fill(CONFIG.calendarEvent.title),
      dates: `${g(start)}/${g(end)}`,
      details: fill(CONFIG.calendarEvent.details),
      location: CONFIG.calendarEvent.location || "",
    });
    $("#calBtn").href = `https://calendar.google.com/calendar/render?${params}`;

    const mailBtn = $("#mailBtn");
    if (CONFIG.contact.email) {
      mailBtn.hidden = false;
      mailBtn.href = `mailto:${CONFIG.contact.email}?subject=${encodeURIComponent(fill("It’s a date! 💕"))}&body=${encodeURIComponent(msg)}`;
    }
    $("#shareLabel").textContent = navigator.share ? "Share" : "Copy message";
  }

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    const payload = buildPayload();
    const dSpan = document.createElement("span"); dSpan.textContent = payload["Selected date"];
    const tSpan = document.createElement("span"); tSpan.textContent = payload["Selected time"];
    $("#successSummary").replaceChildren(dSpan, tSpan);
    prepareShareLinks();

    statusEl.textContent = backendEndpoint() ? "Sending your answer…" : "Tap below to send me a message 👇";

    const sending = submitResponse(payload);
    await wait(250);
    showScreen("success");
    finalCelebration();

    const result = await sending;
    if (result === "sent") statusEl.textContent = "Your answer was sent ❤️";
    if (result === "failed") statusEl.textContent = `Your answer didn’t send automatically. Tap “${CONFIG.whatsappButtonText}” below.`;
    confirmBtn.disabled = false;
  });

  /* ---------- Share / copy ---------- */
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  $("#shareBtn").addEventListener("click", async () => {
    const text = fill(CONFIG.shareMessage);
    if (navigator.share) {
      try { await navigator.share({ title: fill(CONFIG.successTitle), text }); return; }
      catch (e) { if (e.name === "AbortError") return; }
    }
    toast((await copy(text)) ? "Copied! Paste it in a message to me 💌" : "Couldn’t copy. Long-press to select the text.");
  });

  // A sweet little burst wherever she taps a share button
  $$(".share .btn").forEach((b) => b.addEventListener("click", (e) => burstHearts(e.clientX || centerOf(b).x, e.clientY || centerOf(b).y, 8)));

  // Leaving the success screen to change plans: allow confirming again
  $$('[data-screen="success"] [data-go]').forEach((b) => b.addEventListener("click", () => { statusEl.textContent = ""; }));

  /* =========================================================
     Envelope
     ========================================================= */
  const envelope = $("#envelopeBtn");
  envelope.addEventListener("click", async () => {
    if (envelope.classList.contains("is-open")) return;
    envelope.classList.add("is-open");
    envelope.setAttribute("aria-expanded", "true");
    const { x, y } = centerOf(envelope);
    burstHearts(x, y - 20, 10);
    vibrate(20);
    await wait(reduceMotion ? 300 : 1250);
    showScreen("ask");
  });

  /* =========================================================
     Start
     ========================================================= */
  applyText();
  renderWeekdays();
  spawnFloatingHearts();

  const minLoader = wait(reduceMotion ? 300 : 1300);
  const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  Promise.all([minLoader, Promise.race([fontsReady, wait(2500)])]).then(() => showScreen("envelope"));
})();
