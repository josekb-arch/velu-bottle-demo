import { createWorld } from "./bottle.js";

const RANGES = {
  hero: [0, 0.09],
  uvc: [0.11, 0.195],
  sleek: [0.215, 0.29],
  steel: [0.305, 0.375],
  lasting: [0.39, 0.46],
  charge: [0.475, 0.55],
  battery: [0.57, 0.7],
  goodbye: [0.74, 0.83],
  rate: [0.86, 0.925],
  cta: [0.945, 1.02],
};

function band(t, a, b) {
  const fade = 0.022;
  if (t < a - fade || t > b + fade) return 0;
  if (t < a) return 1 - (a - t) / fade;
  if (t > b) return 1 - (t - b) / fade;
  return 1;
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

const copies = [...document.querySelectorAll(".copy")];
const cue = document.getElementById("scroll-cue");
const stage = document.getElementById("stage");
const fallback = document.getElementById("fallback");
const canvas = document.getElementById("gl");

function setActive(t) {
  for (const el of copies) {
    const key = el.dataset.key;
    const [a, b] = RANGES[key] || [0, 0];
    const v = band(t, a, b);
    el.classList.toggle("is-on", v > 0.04);
    el.style.opacity = String(v);
    el.style.visibility = v > 0.04 ? "visible" : "hidden";
  }
  if (cue) cue.classList.toggle("is-hidden", t > 0.08);
  document.body.style.background = t > 0.88 ? "#070513" : "#f3d6c5";
}

function bindUi() {
  const homeBtn = document.querySelector(".chevron");
  const menu = document.getElementById("home-menu");
  if (homeBtn && menu) {
    homeBtn.addEventListener("click", () => {
      const open = menu.hasAttribute("hidden") === false;
      menu.toggleAttribute("hidden", open);
      homeBtn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", (e) => {
      if (!homeBtn.closest(".has-menu")?.contains(e.target)) {
        menu.setAttribute("hidden", "");
        homeBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function bindPanel(btnId, panelId) {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    const close = () => {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", () => {
      const open = !panel.hidden;
      panel.hidden = open;
      btn.setAttribute("aria-expanded", String(!open));
      if (!open) {
        const input = panel.querySelector("input");
        if (input) input.focus();
      }
    });
    panel.addEventListener("click", (e) => {
      if (e.target === panel || e.target.dataset.close) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  }
  bindPanel("search-btn", "search-panel");
  bindPanel("cart-btn", "cart-panel");

  const form = document.getElementById("signup");
  const note = document.getElementById("form-note");
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.hidden = false;
      note.textContent = "Thanks — you're on the list. (Demo only, nothing was sent.)";
      form.reset();
    });
  }
}

function goToProgress(lenis, t) {
  const limit = document.getElementById("track").offsetHeight - window.innerHeight;
  lenis.scrollTo(Math.max(0, Math.min(1, t)) * Math.max(0, limit), { duration: 1.1 });
}

async function startMotion() {
  gsap.registerPlugin(ScrollTrigger);

  let world = null;
  if (webglOk()) {
    try {
      world = await createWorld(canvas);
    } catch (err) {
      console.warn("WebGL scene failed, using fallback", err);
    }
  }
  if (!world) {
    canvas.style.display = "none";
    fallback.hidden = false;
  }

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.1,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const state = { t: 0 };
  const st = ScrollTrigger.create({
    trigger: "#track",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.55,
    onUpdate: (self) => {
      state.t = self.progress;
      setActive(self.progress);
      if (world) world.apply(self.progress);
    },
  });

  const ro = new ResizeObserver(() => {
    if (world) world.resize();
    ScrollTrigger.refresh();
  });
  ro.observe(stage);

  function frame() {
    if (world) world.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.querySelectorAll("[data-scene]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const key = a.getAttribute("data-scene");
      const range = RANGES[key];
      if (!range) return;
      e.preventDefault();
      const mid = key === "cta" ? 0.97 : (range[0] + range[1]) / 2;
      goToProgress(lenis, mid);
      const menu = document.getElementById("home-menu");
      if (menu) menu.setAttribute("hidden", "");
    });
  });

  if (cue) {
    cue.addEventListener("click", () => goToProgress(lenis, 0.14));
  }

  setActive(0);
  if (world) world.apply(0);
  return { world, lenis, st };
}

function startStatic() {
  document.documentElement.classList.add("reduced");
  fallback.hidden = false;
  canvas.style.display = "none";
  copies.forEach((el) => {
    el.classList.add("is-on");
    el.style.opacity = "1";
    el.style.visibility = "visible";
  });
  bindUi();
}

bindUi();

if (prefersReduced()) {
  startStatic();
} else {
  startMotion().catch((err) => {
    console.warn(err);
    startStatic();
  });
}
