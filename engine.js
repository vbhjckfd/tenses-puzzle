"use strict";

/*
 * Спільний рушій гри. Викликається з конкретної сторінки:
 *   startGame({ prompt: "ua", correct: "enCorrect", distract: "enDistract" });
 * де значення — назви полів у об'єктах DATA.
 */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function beep(freq, dur) {
  try {
    const ctx = beep._ctx || (beep._ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = "triangle";
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (_) {}
}

function successSound() {
  beep(523, 0.12);
  setTimeout(() => beep(659, 0.12), 110);
  setTimeout(() => beep(784, 0.2), 220);
}

const SVGNS = "http://www.w3.org/2000/svg";

// Підсвічуємо закінчення -ing (Continuous / герундій) курсивом-червоним.
// Слова відомі й безпечні (без HTML-символів), тому innerHTML тут ок.
function ingMarkup(text) {
  return text.replace(/([A-Za-z]{2,})(ing)\b/g, '$1<i class="ing">$2</i>');
}

function startGame(cfg) {
  const PROMPT = cfg.prompt;
  const CORRECT = cfg.correct;
  const DISTRACT = cfg.distract;
  const ARROWS = !!cfg.arrows; // показувати зв'язки "допоміжне → основне дієслово"

  // ---------- стан ----------
  let order = shuffle(DATA.map((_, i) => i)); // випадковий порядок речень
  let pos = 0;                                 // позиція в order
  let index = order[0];                        // індекс поточного речення в DATA
  let solved = new Array(DATA.length).fill(false);

  const promptEl = document.getElementById("promptSentence");
  const poolEl = document.getElementById("pool");
  const answerEl = document.getElementById("answer");
  const counterEl = document.getElementById("counter");
  const progressFill = document.getElementById("progressFill");
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("nextBtn");
  const hintBtn = document.getElementById("hintBtn");
  const resetBtn = document.getElementById("resetBtn");
  const winScreen = document.getElementById("winScreen");

  // ---------- утиліти ----------
  function makeTile(text) {
    const t = document.createElement("button");
    t.className = "tile";
    t.type = "button";
    t.textContent = text;
    t.dataset.word = text;
    t.addEventListener("pointerdown", onPointerDown);
    return t;
  }

  // ---------- речення-завдання ----------
  function renderPrompt(text) {
    if (!ARROWS) {
      promptEl.textContent = text;
      return;
    }
    // розбиваємо на слова-спани, щоб потім провести стрілки між ними
    promptEl.textContent = "";
    const tokens = text.split(/\s+/);
    tokens.forEach((tok, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.dataset.i = i;
      s.innerHTML = ingMarkup(tok);
      promptEl.appendChild(s);
      if (i < tokens.length - 1) promptEl.appendChild(document.createTextNode(" "));
    });
  }

  // дуга-стрілка від допоміжного слова до основного дієслова
  function drawVerbLinks(lvl) {
    const old = promptEl.querySelector("svg.verb-links");
    if (old) old.remove();
    const links = lvl.verbLinks || [];
    if (!links.length) return;

    const spans = promptEl.querySelectorAll(".w");
    const base = promptEl.getBoundingClientRect();

    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "verb-links");
    svg.setAttribute("width", base.width);
    svg.setAttribute("height", base.height);

    const marker = document.createElementNS(SVGNS, "marker");
    marker.setAttribute("id", "verbArrow");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto-start-reverse");
    const tip = document.createElementNS(SVGNS, "path");
    tip.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    tip.setAttribute("class", "verb-arrowhead");
    marker.appendChild(tip);
    const defs = document.createElementNS(SVGNS, "defs");
    defs.appendChild(marker);
    svg.appendChild(defs);

    for (const [from, to] of links) {
      const a = spans[from], b = spans[to];
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - base.left;
      const x2 = rb.left + rb.width / 2 - base.left;
      const y1 = ra.top - base.top;
      const y2 = rb.top - base.top;
      const apex = Math.min(y1, y2) - 14; // дуга над словами
      const mx = (x1 + x2) / 2;
      const path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", `M ${x1} ${y1} Q ${mx} ${apex} ${x2} ${y2}`);
      path.setAttribute("class", "verb-link");
      path.setAttribute("marker-end", "url(#verbArrow)");
      svg.appendChild(path);
    }
    promptEl.appendChild(svg);
  }

  // ---------- завантаження рівня ----------
  function loadLevel(i) {
    index = i;
    const lvl = DATA[i];
    renderPrompt(lvl[PROMPT]);
    counterEl.textContent = (pos + 1) + " / " + DATA.length;
    progressFill.style.width = (pos / DATA.length * 100) + "%";

    answerEl.innerHTML = "";
    poolEl.innerHTML = "";
    answerEl.classList.remove("correct", "wrong");
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    nextBtn.disabled = true;

    const tiles = shuffle(lvl[CORRECT].concat(lvl[DISTRACT]));
    for (const w of tiles) poolEl.appendChild(makeTile(w));

    if (ARROWS) requestAnimationFrame(() => drawVerbLinks(lvl));
  }

  if (ARROWS) {
    let resizeRAF;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => drawVerbLinks(DATA[index]));
    });
  }

  // ---------- перевірка ----------
  function currentAnswer() {
    return [...answerEl.querySelectorAll(".tile")].map(t => t.dataset.word);
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  function checkAnswer() {
    const ans = currentAnswer();
    const lvl = DATA[index];
    answerEl.classList.remove("correct", "wrong");

    if (ans.length === 0) {
      feedbackEl.textContent = "";
      feedbackEl.className = "feedback";
      nextBtn.disabled = true;
      return;
    }

    if (arraysEqual(ans, lvl[CORRECT])) {
      answerEl.classList.add("correct", "celebrate");
      feedbackEl.textContent = "🎉 Правильно! Молодець!";
      feedbackEl.className = "feedback good";
      nextBtn.disabled = false;
      setTimeout(() => answerEl.classList.remove("celebrate"), 450);
      if (!solved[index]) {
        solved[index] = true;
        successSound();
      }
    } else {
      feedbackEl.textContent = "";
      feedbackEl.className = "feedback";
      nextBtn.disabled = true;
    }
  }

  // ---------- drag & drop (миша + дотик) ----------
  let drag = null;

  function containerUnder(x, y) {
    for (const c of [answerEl, poolEl]) {
      const r = c.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c;
    }
    return null;
  }

  function getClosest(container, x, y) {
    const tiles = [...container.querySelectorAll(".tile")]
      .filter(t => !t.classList.contains("dragging") && !t.classList.contains("placeholder"));
    let best = null, bestDist = Infinity, before = true;
    for (const t of tiles) {
      const r = t.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bestDist) { bestDist = d; best = t; before = x < cx; }
    }
    if (!best) return null;
    return before ? best : best.nextElementSibling;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (drag) finishDrag(false); // не лишаємо зависле перетягування
    const tile = e.currentTarget;
    e.preventDefault();

    const r = tile.getBoundingClientRect();
    const ph = document.createElement("div");
    ph.className = "tile placeholder";
    ph.style.width = r.width + "px";
    ph.style.height = r.height + "px";
    tile.parentNode.insertBefore(ph, tile);

    drag = {
      tile, ph,
      pointerId: e.pointerId,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };

    tile.classList.add("dragging");
    tile.style.width = r.width + "px";
    tile.style.height = r.height + "px";
    tile.style.position = "fixed";
    tile.style.left = r.left + "px";
    tile.style.top = r.top + "px";
    tile.style.zIndex = "1000";
    try { tile.setPointerCapture(e.pointerId); } catch (_) {}

    // слухаємо на window: навіть якщо захоплення вказівника втрачено,
    // ми гарантовано впіймаємо завершення жесту й не залишимо плитку висіти
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function moveTo(x, y) {
    drag.tile.style.left = (x - drag.dx) + "px";
    drag.tile.style.top = (y - drag.dy) + "px";
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    e.preventDefault();
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (dist > 6) drag.moved = true;
    moveTo(e.clientX, e.clientY);

    const container = containerUnder(e.clientX, e.clientY);
    if (container) {
      const after = getClosest(container, e.clientX, e.clientY);
      if (after === drag.ph) return;
      if (after == null) container.appendChild(drag.ph);
      else container.insertBefore(drag.ph, after);
    }
  }

  function finishDrag(asTap) {
    if (!drag) return;
    const { tile, ph, pointerId } = drag;
    drag = null; // одразу, щоб повторні події (cancel/up) не спрацювали двічі

    tile.classList.remove("dragging");
    tile.style.position = "";
    tile.style.left = "";
    tile.style.top = "";
    tile.style.zIndex = "";
    tile.style.width = "";
    tile.style.height = "";

    if (asTap) {
      // короткий тап = перекинути плитку в інший контейнер
      const target = tile.closest(".answer") ? poolEl : answerEl;
      target.appendChild(tile);
      ph.remove();
    } else {
      ph.parentNode.insertBefore(tile, ph);
      ph.remove();
    }

    try { tile.releasePointerCapture(pointerId); } catch (_) {}
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    checkAnswer();
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    finishDrag(!drag.moved);
  }

  // ---------- кнопки ----------
  nextBtn.addEventListener("click", () => {
    if (pos + 1 < order.length) {
      pos++;
      loadLevel(order[pos]);
    } else {
      progressFill.style.width = "100%";
      winScreen.classList.remove("hidden");
    }
  });

  resetBtn.addEventListener("click", () => loadLevel(index));

  hintBtn.addEventListener("click", () => {
    const lvl = DATA[index];
    // скільки разів кожне правильне слово зустрічається у відповіді
    const need = {};
    for (const w of lvl[CORRECT]) need[w] = (need[w] || 0) + 1;

    // спершу прибираємо попередню підсвітку
    for (const t of document.querySelectorAll(".tile.hint")) {
      t.classList.remove("hint");
    }

    // підсвічуємо рівно стільки плиток кожного слова, скільки треба
    const seen = {};
    for (const t of [...poolEl.querySelectorAll(".tile"), ...answerEl.querySelectorAll(".tile")]) {
      const w = t.dataset.word;
      if (need[w] && (seen[w] || 0) < need[w]) {
        seen[w] = (seen[w] || 0) + 1;
        t.classList.add("hint");
        setTimeout(() => t.classList.remove("hint"), 1500);
      }
    }
  });

  document.getElementById("restartAllBtn").addEventListener("click", () => {
    solved = new Array(DATA.length).fill(false);
    order = shuffle(DATA.map((_, i) => i));
    pos = 0;
    winScreen.classList.add("hidden");
    loadLevel(order[0]);
  });

  // ---------- старт ----------
  loadLevel(order[0]);
}
