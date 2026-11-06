(() => {
  "use strict";

  // Reveal-on-scroll and section state
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

  const links = [...document.querySelectorAll("[data-section-link]")];
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle("active", link.dataset.sectionLink === visible.target.id));
    navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${visible.target.id}`));
  }, { threshold: [0.15, 0.35, 0.65], rootMargin: "-15% 0px -65% 0px" });
  document.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));

  // Scroll progress and back-to-top
  const progress = document.querySelector(".scroll-progress span");
  const backTop = document.querySelector(".back-to-top");
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max ? window.scrollY / max : 0})`;
    backTop.classList.toggle("visible", window.scrollY > window.innerHeight * 1.4);
  };
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Mobile menu
  const header = document.querySelector(".site-header");
  const menu = document.querySelector(".menu-toggle");
  menu.addEventListener("click", () => {
    const open = !header.classList.contains("menu-open");
    header.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close section navigation" : "Open section navigation");
  });
  header.querySelector(".site-nav").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    header.classList.remove("menu-open");
    menu.setAttribute("aria-expanded", "false");
  });

  // Motion replay controls
  document.querySelectorAll("[data-replay]").forEach((button) => {
    button.addEventListener("click", () => {
      const stage = document.querySelector(`[data-motion="${button.dataset.replay}"]`);
      stage.classList.remove("replay");
      void stage.offsetWidth;
      stage.classList.add("replay");
    });
  });
  document.querySelectorAll(".motion-stage[data-motion]").forEach((stage) => stage.classList.add("replay"));
  document.querySelector("[data-theme-motion]").addEventListener("click", () => document.querySelector(".theme-motion").classList.toggle("dark"));
  document.querySelector(".theme-motion > button").addEventListener("click", () => document.querySelector(".theme-motion").classList.toggle("dark"));

  // Component demos
  const toast = document.querySelector(".demo-toast");
  let toastTimer;
  const showToast = (message = "Preference saved in this demo.") => {
    toast.querySelector("p").textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
  };
  document.querySelector("[data-demo-toast]").addEventListener("click", () => showToast());
  toast.querySelector("button").addEventListener("click", () => toast.classList.remove("visible"));
  document.querySelector(".demo-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.toggle("active");
    button.setAttribute("aria-checked", String(button.classList.contains("active")));
    showToast(button.classList.contains("active") ? "Appointment reminders enabled." : "Appointment reminders disabled.");
  });
  document.querySelector("[data-demo-loading]").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Loading…";
    setTimeout(() => { button.textContent = "✓ Complete"; showToast("Loading state completed."); }, 850);
    setTimeout(() => { button.disabled = false; button.textContent = original; }, 1900);
  });
  document.querySelector("[data-validation-demo]").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const label = event.currentTarget.closest(".demo-input");
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.currentTarget.value);
    label.classList.toggle("success", valid);
    label.classList.toggle("error", !valid);
    label.querySelector("small").textContent = valid ? "✓ Email format looks valid." : "Enter a complete email address.";
  });

  const modal = document.querySelector(".demo-modal");
  const sheet = document.querySelector(".demo-sheet");
  let previousFocus;
  const openDemo = (element) => {
    previousFocus = document.activeElement;
    element.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => element.querySelector("button").focus());
  };
  const closeDemo = (element) => {
    element.hidden = true;
    document.body.style.overflow = "";
    previousFocus?.focus();
  };
  document.querySelector("[data-demo-modal]").addEventListener("click", () => openDemo(modal));
  document.querySelector("[data-demo-sheet]").addEventListener("click", () => openDemo(sheet));
  document.querySelector("[data-demo-close]").addEventListener("click", () => closeDemo(modal));
  document.querySelector("[data-sheet-close]").addEventListener("click", () => closeDemo(sheet));
  modal.querySelector(".demo-backdrop").addEventListener("click", () => closeDemo(modal));
  sheet.querySelector(".demo-backdrop").addEventListener("click", () => closeDemo(sheet));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!modal.hidden) closeDemo(modal);
    if (!sheet.hidden) closeDemo(sheet);
  });
})();
