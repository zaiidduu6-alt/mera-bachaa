(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- intro (envelope) ---------- */
  window.addEventListener("load", function () { setTimeout(function () { document.body.classList.add("go"); }, 60); });
  setTimeout(function () { document.body.classList.add("go"); }, 1800); // safety

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal,.cal").forEach(function (el) { io.observe(el); });
  // collage frames start off-screen, so watch their container instead
  var stageIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { $$(".fly", e.target).forEach(function (f) { f.classList.add("in"); }); stageIO.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  $$(".stage").forEach(function (el) { stageIO.observe(el); });

  /* ---------- calendar: October 2026, 23 circled ---------- */
  (function buildCalendar() {
    var YEAR = 2026, MONTH = 9, HL = 23;                 // Oct 2026
    var first = new Date(YEAR, MONTH, 1).getDay();       // Thursday -> 4
    var days = new Date(YEAR, MONTH + 1, 0).getDate();   // 31
    var grid = $("#calGrid"), i = 0;
    function add(txt, cls) {
      var s = document.createElement("span");
      s.style.setProperty("--i", i++);
      if (cls) s.className = cls;
      s.textContent = txt;
      grid.appendChild(s);
      return s;
    }
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) { add(d, "dow"); });
    for (var b = 0; b < first; b++) { var e = add("", "blank"); e.setAttribute("aria-hidden", "true"); }
    for (var d = 1; d <= days; d++) {
      var c = add(String(d));
      if (d === HL) {
        c.className = "hl";
        c.insertAdjacentHTML("beforeend",
          '<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M20 33C6 24 3 15 6 9.500C9 4 16 4 20 11C24 4 31 4 34 9.500C37 15 34 24 20 33Z"/></svg>');
      }
    }
  })();

  /* ---------- pixel (brick) heart ---------- */
  (function pixelHeart() {
    var m = ["011000110", "111101111", "111111111", "111111111", "011111110", "001111100", "000111000", "000010000"];
    var svg = $("#pxHeart"), s = 10, out = "";
    m.forEach(function (row, y) {
      row.split("").forEach(function (v, x) {
        if (v === "1") {
          var shade = (x + y) % 2 ? "#d3121b" : "#dd1b24";
          out += '<rect x="' + (x * s) + '" y="' + (y * s) + '" width="' + s + '" height="' + s + '" fill="' + shade + '" stroke="#a80d14" stroke-width=".8"/>' +
                 '<circle cx="' + (x * s + s / 2) + '" cy="' + (y * s + s / 2) + '" r="2.800" fill="#ee3a40"/>';
        }
      });
    });
    svg.innerHTML = out;
  })();

  /* ---------- scalloped letter card ---------- */
  var card = $("#letterCard"), path = $("#cardPath");
  function zig() {
    var w = card.offsetWidth, h = card.offsetHeight, step = 8, d = 4, pts = [], i, n;
    n = Math.max(2, Math.round(w / step)); for (i = 0; i < n; i++) pts.push([i * w / n, i % 2 ? d : 0]);
    n = Math.max(2, Math.round(h / step)); for (i = 0; i < n; i++) pts.push([w - (i % 2 ? d : 0), i * h / n]);
    n = Math.max(2, Math.round(w / step)); for (i = 0; i < n; i++) pts.push([w - i * w / n, h - (i % 2 ? d : 0)]);
    n = Math.max(2, Math.round(h / step)); for (i = 0; i < n; i++) pts.push([(i % 2 ? d : 0), h - i * h / n]);
    path.setAttribute("d", "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") + "Z");
  }
  zig();
  if (window.ResizeObserver) new ResizeObserver(zig).observe(card);
  window.addEventListener("resize", zig);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(zig);

  /* ---------- typewriter reveal for the final letter ---------- */
  (function typewriter() {
    var box = $("#finalText"), chars = [], paras = [], started = false, done = false, idx = 0, pi = 0, timer;
    $$("p", box).forEach(function (p) {
      var text = p.textContent, from = chars.length; p.textContent = "";
      text.split(" ").forEach(function (word, wi, arr) {
        var w = document.createElement("span"); w.className = "w";
        (window.Array.from ? Array.from(word) : word.split("")).forEach(function (ch) {
          var c = document.createElement("span"); c.className = "c"; c.textContent = ch; w.appendChild(c); chars.push(c);
        });
        p.appendChild(w);
        if (wi < arr.length - 1) p.appendChild(document.createTextNode(" "));
      });
      paras.push({ el: p, start: from, end: chars.length - 1 });
    });
    function finish() { clearTimeout(timer); chars.forEach(function (c) { c.classList.add("on"); }); done = true; }
    // text the reader has already scrolled past appears instantly
    function catchUp() {
      while (!done && started && pi < paras.length) {
        var P = paras[pi];
        if (idx > P.end) { pi++; continue; }
        if (P.el.getBoundingClientRect().bottom < window.innerHeight * 0.45) {
          for (var k = idx; k <= P.end; k++) chars[k].classList.add("on");
          idx = P.end + 1; pi++;
        } else break;
      }
      if (idx >= chars.length) done = true;
    }
    function next() {
      if (done) return;
      catchUp(); if (done) return;
      var c = chars[idx]; c.classList.add("on");
      var t = c.textContent, delay = 22;
      if (idx === paras[pi].end) delay = 450;
      else if (t === "." || t === "!" || t === "\u2026") delay = 200;
      else if (t === ",") delay = 100;
      idx++; timer = setTimeout(next, delay);
    }
    function start() { if (started) return; started = true; if (reduce) finish(); else next(); }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { start(); o.disconnect(); } },
      { threshold: 0, rootMargin: "0px 0px -35% 0px" });
    o.observe(card);
    var t2 = false;
    window.addEventListener("scroll", function () {
      if (t2 || !started || done) return; t2 = true;
      requestAnimationFrame(function () { t2 = false; catchUp(); });
    }, { passive: true });
    card.addEventListener("click", function () { started = true; finish(); });
  })();

  /* ---------- video: starts by itself (muted) once it scrolls into view, only once ---------- */
  (function autoplayVideo() {
    var v = $("#memory");
    if (!v) return;
    v.controls = false; v.removeAttribute("controls");
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    var done = false, wanted = false, gestureOn = false;
    function finish() {
      done = true;
      ["touchend", "click", "keydown"].forEach(function (t) { document.removeEventListener(t, onGesture, true); });
    }
    function tryPlay() {
      if (done) return;
      var p;
      try { p = v.play(); } catch (e) { p = null; }
      if (p && p.then) {
        p.then(finish).catch(function () {
          // autoplay blocked (e.g. iPhone Low Power Mode): retry on the first touch, controls still work
          if (!gestureOn) {
            gestureOn = true;
            ["touchend", "click", "keydown"].forEach(function (t) { document.addEventListener(t, onGesture, true); });
          }
        });
      } else { finish(); }
    }
    function onGesture() { if (wanted && !done) tryPlay(); }
    v.addEventListener("play", finish);
    var o = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { wanted = true; o.disconnect(); tryPlay(); }
    }, { threshold: 0.4 });
    o.observe(v);
  })();

  /* ---------- background song: one <audio>, starts at 01:21 on load, loops back to 01:21 ----------
     Browsers may refuse sound before the visitor touches the page (iPhone Safari does most often).
     We always try to start on load; if it is refused, the very first tap/click/key anywhere starts it. */
  (function song() {
    var a = $("#bgm"), START = 81, playing = false, seeked = false;
    if (!a || window.__bgmInit) return;     // never create a second player
    window.__bgmInit = true;
    a.loop = false; a.volume = 1; a.preload = "auto";
    var EV = ["pointerdown", "pointerup", "touchend", "mousedown", "click", "keydown"];
    function seek() {                       // only possible once metadata is known
      if (seeked || a.readyState < 1) return;
      try { a.currentTime = START; seeked = true; } catch (e) {}
    }
    function off() { EV.forEach(function (t) { document.removeEventListener(t, onGesture, true); }); }
    function onGesture() { if (!playing) go(); }
    function go() {
      seek();
      var p; try { p = a.play(); } catch (e) { p = null; }
      if (p && p.catch) p.catch(function () {});   // blocked: wait for the first tap
    }
    a.addEventListener("loadedmetadata", function () { seek(); if (!playing) go(); });
    a.addEventListener("canplay", function () { seek(); if (!playing) go(); });
    a.addEventListener("playing", function () {
      seek();
      if (!seeked || a.currentTime < START - 1) { try { a.currentTime = START; seeked = true; } catch (e) {} }
      playing = true; off();
    });
    a.addEventListener("pause", function () { if (!a.ended) playing = false; });
    a.addEventListener("ended", function () { try { a.currentTime = START; } catch (e) {} go(); });
    a.addEventListener("error", function () {
      // one retry if the file failed to load (e.g. slow network)
      if (!a.__retried) { a.__retried = true; setTimeout(function () { try { a.load(); } catch (e) {} }, 800); }
    });
    // resume after a phone call / tab switch interrupted it (never restarts from the beginning)
    document.addEventListener("visibilitychange", function () { if (!document.hidden && a.paused && seeked && !a.ended) go(); });
    window.addEventListener("pageshow", function () { if (a.paused) go(); });
    EV.forEach(function (t) { document.addEventListener(t, onGesture, true); });
    try { a.load(); } catch (e) {}
    if (a.readyState >= 1) { seek(); go(); } else { go(); }
  })();

  /* ---------- envelope: tap to re-open the letter ---------- */
  (function () {
    var env = $("#env"), letter = $(".letter", env), busy = false;
    env.addEventListener("click", function () {
      if (busy || reduce) return; busy = true;
      letter.style.animation = "none"; letter.style.transition = "transform .45s ease";
      letter.style.transform = "translateY(58%) rotate(-3deg)";
      setTimeout(function () {
        letter.style.transition = "transform 1s cubic-bezier(.2,.8,.2,1)";
        letter.style.transform = "translateY(0) rotate(-3deg)";
        setTimeout(function () { busy = false; }, 1050);
      }, 520);
    });
  })();

  /* ---------- toy: tap to hop ---------- */
  var toy = $("#toy");
  toy.addEventListener("click", function () {
    toy.classList.remove("hop"); void toy.offsetWidth; toy.classList.add("hop");
    setTimeout(function () { toy.classList.remove("hop"); }, 800);
  });

  /* ---------- scroll-linked motion ---------- */
  var px = $$("[data-px]"), stage = $("#envStage"), hint = $(".hint"), cal = $("#cal"), ticking = false;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function frame() {
    ticking = false;
    var vh = window.innerHeight, y = window.pageYOffset;
    var p = clamp(y / (vh * 0.85), 0, 1);
    if (!reduce) {
      px.forEach(function (el) {
        var a = el.getAttribute("data-px").split(",");
        el.style.transform = "translate3d(" + (a[0] * p) + "vw," + (a[1] * p) + "vh,0) rotate(" + (a[2] * p) + "deg)";
      });
      stage.style.opacity = String(clamp(1 - p * 1.15, 0, 1));
      var r = cal.getBoundingClientRect();
      var off = (r.top + r.height / 2 - vh / 2) / vh;
      cal.style.setProperty("--rx", clamp(off * 42, -22, 34).toFixed(1) + "deg");
    } else {
      cal.style.setProperty("--rx", "0deg");
    }
    if (hint) hint.style.visibility = y > 40 ? "hidden" : "visible";
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();
})();
