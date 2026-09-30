(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────── */
  var toggle = document.getElementById('theme-toggle');
  function setIcon() {
    toggle.innerHTML = root.getAttribute('data-theme') === 'dark'
      ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  setIcon();
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('monopca-theme', next); } catch (e) {}
    setIcon();
  });

  /* ── Nav: scrolled state + scrollspy ───── */
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var spyTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > hero.offsetHeight - 140);
    var current = -1;
    spyTargets.forEach(function (sec, i) {
      if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.35) current = i;
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Count-up ──────────────────────────── */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = el.hasAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 2;
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Bars ──────────────────────────────── */
  function fillBars(container) {
    var min = parseFloat(container.getAttribute('data-min'));
    var max = parseFloat(container.getAttribute('data-max'));
    container.querySelectorAll('i[data-v]').forEach(function (i) {
      var v = parseFloat(i.getAttribute('data-v'));
      i.style.width = Math.max(4, (v - min) / (max - min) * 100) + '%';
    });
  }

  /* ── Reveal on scroll ──────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  function onReveal(el) {
    el.classList.add('is-in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    el.querySelectorAll('.bars').forEach(fillBars);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { onReveal(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(onReveal);
  }

  /* ── Tabs ──────────────────────────────── */
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var card = tabs.parentElement;
    tabs.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        card.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.id === btn.getAttribute('data-tab'));
        });
      });
    });
  });

  /* ── Lightbox ──────────────────────────── */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  function openLb(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 200);
  }
  document.querySelectorAll('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var img = a.querySelector('img');
      openLb(a.getAttribute('href'), img ? img.alt : '');
    });
  });
  lb.querySelector('.lb-backdrop').addEventListener('click', closeLb);
  document.getElementById('lb-close').addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ── Copy BibTeX ───────────────────────── */
  var copyBtn = document.getElementById('copy-bib');
  copyBtn.addEventListener('click', function () {
    var text = document.getElementById('bib-text').textContent;
    function done() {
      copyBtn.classList.add('is-done');
      copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied</span>';
      setTimeout(function () {
        copyBtn.classList.remove('is-done');
        copyBtn.innerHTML = '<i class="far fa-copy"></i><span>Copy</span>';
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });

  /* ── KaTeX ─────────────────────────────── */
  function renderMath() {
    if (!window.katex) return;
    document.querySelectorAll('.eq[data-tex]').forEach(function (el) {
      try {
        window.katex.render(el.getAttribute('data-tex'), el, { displayMode: true, throwOnError: false });
      } catch (e) {}
    });
  }
  if (window.katex) renderMath();
  else window.addEventListener('load', renderMath);

  /* ── Front-surface bias playground ─────── */
  var svg = document.getElementById('bev');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var S = 24;            // px per metre
  var CX = 260;          // x = 0
  var TOP = 22;          // y of z = Z + HALF
  var HALF = 7;          // metres shown on each side of the centre along depth
  var sl = {
    yaw: document.getElementById('s-yaw'),
    L: document.getElementById('s-L'),
    W: document.getElementById('s-W'),
    Z: document.getElementById('s-Z')
  };
  var out = {
    yaw: document.getElementById('o-yaw'),
    L: document.getElementById('o-L'),
    W: document.getElementById('o-W'),
    Z: document.getElementById('o-Z')
  };
  var presets = { ped: [0.8, 0.6], car: [3.9, 1.6], truck: [10, 2.5] };
  var presetBtns = document.querySelectorAll('.pg-presets button');

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  function yOf(dz) { return TOP + (HALF - dz) * S; }   // dz: depth relative to the centre
  function xOf(x) { return CX + x * S; }
  function fmt(v, d) { return v.toFixed(d === undefined ? 2 : d); }
  function fillSlider(s) {
    var p = (s.value - s.min) / (s.max - s.min) * 100;
    s.style.setProperty('--p', p + '%');
  }

  // Static layer: grid, optical axis, camera.
  var gGrid = el('g', { 'class': 'grid' });
  for (var gx = -10; gx <= 10; gx++) el('line', { x1: xOf(gx), y1: TOP, x2: xOf(gx), y2: yOf(-HALF), }, gGrid);
  for (var gz = -HALF; gz <= HALF; gz++) el('line', { x1: xOf(-10.5), y1: yOf(gz), x2: xOf(10.5), y2: yOf(gz) }, gGrid);
  el('line', { 'class': 'axis', x1: CX, y1: TOP - 8, x2: CX, y2: 400 });
  var axisLabel = el('text', { 'class': 'axis-label', x: CX + 8, y: TOP + 6 });
  axisLabel.textContent = 'optical axis (depth)';
  // Break marks + camera
  el('path', { 'class': 'break', d: 'M' + (CX - 12) + ' 384 l24 -6 M' + (CX - 12) + ' 391 l24 -6' });
  el('path', { 'class': 'cam', d: 'M' + (CX - 11) + ' 404 h22 v12 h-22 z M' + (CX - 5) + ' 404 l5 -7 l5 7 z' });
  var camLabel = el('text', { 'class': 'cam-label', x: CX + 20, y: 414 });

  // Dynamic layer
  var gDyn = el('g', {});
  var lineGeo = el('line', { 'class': 'line-geo' }, gDyn);
  var lineCenter = el('line', { 'class': 'line-center' }, gDyn);
  var tagGeo = el('text', { 'class': 'tag tag-geo' }, gDyn);
  var tagCenter = el('text', { 'class': 'tag tag-center' }, gDyn);
  var box = el('polygon', { 'class': 'box' }, gDyn);
  var heading = el('line', { 'class': 'heading' }, gDyn);
  var headTip = el('polygon', { 'class': 'heading-tip' }, gDyn);
  var corners = [0, 1, 2, 3].map(function () { return el('circle', { 'class': 'corner', r: 3.5 }, gDyn); });
  var center = el('circle', { 'class': 'center', r: 5.5 }, gDyn);
  var delta = el('path', { 'class': 'delta', fill: 'none' }, gDyn);
  var deltaLabel = el('text', { 'class': 'delta-label' }, gDyn);

  tagGeo.innerHTML = '<tspan font-style="italic">z</tspan><tspan baseline-shift="sub" font-size="9">geo</tspan> = <tspan font-style="italic">f·H</tspan> / <tspan font-style="italic">h</tspan><tspan baseline-shift="sub" font-size="9">2D</tspan>  (front surface)';
  tagCenter.innerHTML = '<tspan font-style="italic">z</tspan>  (object center)';

  function draw() {
    var yawDeg = parseFloat(sl.yaw.value);
    var g = yawDeg * Math.PI / 180;
    var L = parseFloat(sl.L.value);
    var W = parseFloat(sl.W.value);
    var Z = parseFloat(sl.Z.value);

    out.yaw.textContent = fmt(yawDeg, 0) + '°';
    out.L.textContent = fmt(L, 1) + ' m';
    out.W.textContent = fmt(W, 1) + ' m';
    out.Z.textContent = fmt(Z, 0) + ' m';
    Object.keys(sl).forEach(function (k) { fillSlider(sl[k]); });

    // Length axis u = (cos g, sin g), width axis v = (-sin g, cos g) in (x, depth).
    var ux = Math.cos(g), uz = Math.sin(g), vx = -Math.sin(g), vz = Math.cos(g);
    var pts = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(function (s) {
      return [s[0] * L / 2 * ux + s[1] * W / 2 * vx, s[0] * L / 2 * uz + s[1] * W / 2 * vz];
    });
    var nearIdx = 0;
    pts.forEach(function (p, i) { if (p[1] < pts[nearIdx][1] - 1e-9) nearIdx = i; });
    var aTerm = L / 2 * Math.abs(Math.sin(g));
    var bTerm = W / 2 * Math.abs(Math.cos(g));
    var D = aTerm + bTerm;              // equals -pts[nearIdx][1]

    box.setAttribute('points', pts.map(function (p) { return xOf(p[0]) + ',' + yOf(p[1]); }).join(' '));
    pts.forEach(function (p, i) {
      corners[i].setAttribute('cx', xOf(p[0]));
      corners[i].setAttribute('cy', yOf(p[1]));
      corners[i].setAttribute('class', 'corner' + (i === nearIdx ? ' near' : ''));
      corners[i].setAttribute('r', i === nearIdx ? 6 : 3.5);
    });
    // bring near corner to top
    gDyn.appendChild(corners[nearIdx]);
    center.setAttribute('cx', CX); center.setAttribute('cy', yOf(0));
    gDyn.appendChild(center);

    var hl = L / 2 + 0.9;
    var hx = xOf(hl * ux), hy = yOf(hl * uz);
    heading.setAttribute('x1', CX); heading.setAttribute('y1', yOf(0));
    heading.setAttribute('x2', hx); heading.setAttribute('y2', hy);
    var ax = Math.cos(-g), ay = Math.sin(-g);   // screen direction of u
    var tip = [hx + ax * 9, hy + ay * 9];
    var left = [hx - ay * 5, hy + ax * 5];
    var right = [hx + ay * 5, hy - ax * 5];
    headTip.setAttribute('points', [tip, left, right].map(function (p) { return p.join(','); }).join(' '));

    var yC = yOf(0), yG = yOf(-D);
    var xL = xOf(-10), xR = xOf(7.6);
    lineCenter.setAttribute('x1', xL); lineCenter.setAttribute('x2', xR);
    lineCenter.setAttribute('y1', yC); lineCenter.setAttribute('y2', yC);
    lineGeo.setAttribute('x1', xL); lineGeo.setAttribute('x2', xR);
    lineGeo.setAttribute('y1', yG); lineGeo.setAttribute('y2', yG);
    tagCenter.setAttribute('x', xL + 4); tagCenter.setAttribute('y', yC - 7);
    tagGeo.setAttribute('x', xL + 4); tagGeo.setAttribute('y', yG + 17);

    var bx = xOf(8.4);
    delta.setAttribute('d', 'M' + (bx - 6) + ' ' + yC + ' H' + (bx + 6) + ' M' + bx + ' ' + yC + ' V' + yG + ' M' + (bx - 6) + ' ' + yG + ' H' + (bx + 6));
    deltaLabel.setAttribute('x', bx - 4);
    deltaLabel.setAttribute('y', Math.min(yC, yG) - 8);
    deltaLabel.setAttribute('text-anchor', 'middle');
    deltaLabel.textContent = 'Δ = ' + fmt(D) + ' m';

    camLabel.textContent = 'camera · ' + fmt(Z, 0) + ' m below the center';

    document.getElementById('ro-eq').innerHTML =
      'Δ = <i>L</i>/2·|sin ' + fmt(yawDeg, 0) + '°| + <i>W</i>/2·|cos ' + fmt(yawDeg, 0) + '°| = ' +
      fmt(aTerm) + ' + ' + fmt(bTerm) + ' = <b>' + fmt(D) + ' m</b>';
    document.getElementById('ro-geo').textContent = fmt(Z - D) + ' m';
    document.getElementById('ro-z').textContent = fmt(Z) + ' m';
    document.getElementById('ro-err').textContent = fmt(D) + ' m';
    document.getElementById('ro-pct').textContent = fmt(D / Z * 100, 1) + '% of depth';
  }

  Object.keys(sl).forEach(function (k) {
    sl[k].addEventListener('input', function () {
      if (k === 'L' || k === 'W') presetBtns.forEach(function (b) { b.classList.remove('is-active'); });
      draw();
    });
  });
  presetBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var p = presets[b.getAttribute('data-preset')];
      sl.L.value = p[0]; sl.W.value = p[1];
      presetBtns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
      draw();
    });
  });

  var playBtn = document.getElementById('pg-play');
  var spinning = false, last = null;
  function spin(t) {
    if (!spinning) return;
    if (last !== null) {
      var v = parseFloat(sl.yaw.value) + (t - last) * 0.04;
      if (v > 180) v -= 180;
      sl.yaw.value = v;
      draw();
    }
    last = t;
    requestAnimationFrame(spin);
  }
  playBtn.addEventListener('click', function () {
    spinning = !spinning;
    playBtn.classList.toggle('is-on', spinning);
    playBtn.querySelector('span').textContent = spinning ? 'Stop' : 'Spin the object';
    last = null;
    if (spinning) requestAnimationFrame(spin);
  });
  sl.yaw.addEventListener('pointerdown', function () {
    if (spinning) playBtn.click();
  });

  draw();
})();
