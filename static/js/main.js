/* ============================================================
   SITE CONFIG — edit the links here; nothing else needs changing.
   Leave a demo value (containing "xxxx" / "VIDEO_ID") and the
   button is labelled "(coming soon)" and the player shows a placeholder.
   ============================================================ */
const SITE_CONFIG = {
  paper:    "https://arxiv.org/abs/xxxx.xxxxx",                  // arXiv abstract page
  github:   "https://github.com/RuiHuangNUS/AeroManip-VLA",      // code repository
  dataset:  "https://huggingface.co/datasets/xxxx/AeroManip-VLA",// dataset page
  submit:   "https://github.com/RuiHuangNUS/AeroManip-VLA/issues",// where people send leaderboard results
  youtube:  "https://youtu.be/1uljytfGFI4",                     // full YouTube URL (or youtu.be/…)
  bilibili: "https://www.bilibili.com/video/BVxxxxxxxxxx",       // full Bilibili URL (BV id)
};

const isDemo = (url) => !url || /xxxx|VIDEO_ID/i.test(url);

function youtubeId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function bilibiliId(url) {
  const m = url.match(/(BV[0-9A-Za-z]{10})/);
  return m ? m[1] : null;
}

/* ---------------- link buttons ---------------- */
document.querySelectorAll("[data-link]").forEach((a) => {
  const url = SITE_CONFIG[a.dataset.link];
  if (!isDemo(url)) { a.href = url; return; }
  // no real link yet: label it and keep it from navigating anywhere
  a.classList.add("placeholder");
  a.removeAttribute("href");
  a.setAttribute("aria-disabled", "true");
  a.insertAdjacentHTML("beforeend", '<span class="soon">(coming soon)</span>');
});

/* ---------------- YouTube / Bilibili player ---------------- */
const frame = document.getElementById("embed-frame");
function showPlayer(kind) {
  document.querySelectorAll(".ptab").forEach((t) => t.classList.toggle("active", t.dataset.player === kind));
  const url = SITE_CONFIG[kind];
  let src = null;
  if (!isDemo(url)) {
    if (kind === "youtube") {
      const id = youtubeId(url);
      if (id) src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    } else {
      const id = bilibiliId(url);
      if (id) src = `https://player.bilibili.com/player.html?bvid=${id}&page=1&high_quality=1&danmaku=0&autoplay=0`;
    }
  }
  if (src) {
    frame.innerHTML = `<iframe src="${src}" title="${kind} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  } else {
    const icon = kind === "youtube" ? "fa-youtube" : "fa-bilibili";
    const name = kind === "youtube" ? "YouTube" : "Bilibili";
    frame.innerHTML = `
      <div class="embed-placeholder">
        <img src="static/images/poster_hero.jpg" alt="">
        <i class="fa-brands ${icon}"></i>
        <p>${name} video (coming soon)</p>
      </div>`;
  }
}
document.querySelectorAll(".ptab").forEach((t) => t.addEventListener("click", () => showPlayer(t.dataset.player)));
showPlayer("youtube");

/* ---------------- lazy autoplay videos ---------------- */
// Videos load only when scrolled near, play while visible, pause when off-screen.
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
      if (v.dataset.userPaused !== "1") v.play().catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  });
}, { rootMargin: "200px 0px", threshold: 0.15 });
document.querySelectorAll("video.lazy-video").forEach((v) => videoObserver.observe(v));

/* ---------------- "click me" hints on tab groups (fade out after first click) ---------------- */
document.querySelectorAll(".switch-tabs").forEach((tabs) => {
  const hint = document.createElement("span");
  hint.className = "tab-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.innerHTML = 'click me!<svg viewBox="0 0 46 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6c10 1 22 6 34 17"/><path d="M29 23.5l8.5.2-1.6-8.3"/></svg>';
  tabs.prepend(hint);
  tabs.addEventListener("click", (e) => { if (e.target.closest(".stab")) hint.classList.add("done"); });
});

/* ---------------- tabbed video switchers ---------------- */
document.querySelectorAll("[data-switcher]").forEach((box) => {
  const video = box.querySelector("video");
  const cap = box.querySelector("[data-caption-target]");
  box.querySelectorAll(".stab").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll(".stab").forEach((b) => b.classList.toggle("active", b === btn));
      video.poster = btn.dataset.poster;
      video.dataset.src = btn.dataset.src;
      video.src = btn.dataset.src;
      video.dataset.userPaused = "0";
      video.play().catch(() => {});
      if (cap) cap.textContent = btn.dataset.caption;
    });
  });
});

/* ---------------- tabbed figures ---------------- */
document.querySelectorAll("[data-figtabs]").forEach((box) => {
  const panels = box.querySelectorAll(".fig-panel");
  box.querySelectorAll(".stab").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll(".stab").forEach((b) => b.classList.toggle("active", b === btn));
      panels.forEach((p, i) => p.classList.toggle("active", i === +btn.dataset.fig));
    });
  });
});

/* ---------------- results table shading + best per column ---------------- */
(() => {
  const table = document.getElementById("results-table");
  if (!table) return;
  const rows = [...table.tBodies[0].rows];
  // Rows alternate Pick / Place; the Pick row has two extra cells (method + mean) around the 8 values.
  const valueCells = (row) => [...row.cells].filter((c) => !c.classList.contains("m") && !c.classList.contains("mean")).slice(1);
  ["Pick", "Place"].forEach((skill) => {
    const group = rows.filter((r) => [...r.cells].some((c) => c.textContent.trim() === skill));
    const cols = valueCells(group[0]).length;
    for (let j = 0; j < cols; j++) {
      const cells = group.map((r) => valueCells(r)[j]);
      const max = Math.max(...cells.map((c) => parseFloat(c.textContent)));
      cells.forEach((c) => { if (parseFloat(c.textContent) === max && max > 0) c.classList.add("top"); });
    }
  });
  rows.forEach((r) => valueCells(r).forEach((c) => {
    const v = parseFloat(c.textContent);
    c.style.background = `rgba(47, 111, 222, ${(v / 100) * 0.32})`;
    if (v >= 75) c.style.color = "#0c2a66";
  }));
})();

/* ---------------- nav: show after hero, highlight section ---------------- */
const nav = document.getElementById("topnav");
const hero = document.querySelector(".hero");
new IntersectionObserver(([e]) => nav.classList.toggle("show", !e.isIntersecting), { threshold: 0.12 }).observe(hero);

const links = [...document.querySelectorAll(".navlinks a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const secObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => secObs.observe(s));

const toggle = document.getElementById("navtoggle");
const navlinks = document.getElementById("navlinks");
toggle.addEventListener("click", () => navlinks.classList.toggle("open"));
links.forEach((a) => a.addEventListener("click", () => navlinks.classList.remove("open")));

/* ---------------- reveal on scroll + bar chart ---------------- */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".section .container > *").forEach((el) => { el.classList.add("reveal"); revealObs.observe(el); });
document.querySelectorAll(".bars").forEach((el) => revealObs.observe(el));

/* ---------------- lightbox (figures + enlarged videos) ---------------- */
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector("img");
const lbVideo = lb.querySelector("video");
function openLightbox(mode) { lb.classList.remove("img-mode", "video-mode"); lb.classList.add("open", mode); }
function closeLightbox() { lb.classList.remove("open"); lbVideo.pause(); }
document.querySelectorAll(".zoomable img").forEach((img) => {
  img.addEventListener("click", () => { lbImg.src = img.src; openLightbox("img-mode"); });
});
lb.addEventListener("click", (e) => { if (e.target !== lbVideo) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

/* ---------------- video card controls: play/pause + enlarge ---------------- */
document.querySelectorAll(".video-card").forEach((card) => {
  const v = card.querySelector("video");
  if (!v) return;
  const play = document.createElement("button");
  play.className = "vc-btn vc-play";
  play.setAttribute("aria-label", "Play / pause");
  const expand = document.createElement("button");
  expand.className = "vc-btn vc-expand";
  expand.setAttribute("aria-label", "Enlarge video");
  expand.innerHTML = '<i class="fa-solid fa-expand"></i>';
  card.append(play, expand);

  const sync = () => {
    play.innerHTML = v.paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    card.classList.toggle("is-paused", v.paused && v.dataset.userPaused === "1");
  };
  const toggle = () => {
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    if (v.paused) { v.dataset.userPaused = "0"; v.play().catch(() => {}); }
    else { v.dataset.userPaused = "1"; v.pause(); }
  };
  v.addEventListener("play", sync);
  v.addEventListener("pause", sync);
  sync();

  play.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  v.addEventListener("click", toggle);
  expand.addEventListener("click", (e) => {
    e.stopPropagation();
    lbVideo.src = v.currentSrc || v.dataset.src;
    lbVideo.currentTime = v.currentTime || 0;
    openLightbox("video-mode");
    lbVideo.play().catch(() => {});
  });
});

/* ---------------- count-up numbers in the hero ---------------- */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  const t0 = performance.now(), dur = 1400;
  const fmt = (x) => x.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); countObs.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => countObs.observe(el));
}

/* ---------------- copy BibTeX ---------------- */
document.getElementById("copy-bib").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(document.getElementById("bib-text").textContent);
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
  } catch {
    btn.textContent = "Select & copy manually";
  }
  setTimeout(() => (btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'), 1800);
});
