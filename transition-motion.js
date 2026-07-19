(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const protectedSelector = "#works-wall, .works-gallery-section, .works-gallery-scene, .works-gallery-wrapper, .works-gallery-item";

  if (reduceMotion.matches || !document.body) return;

  document.body.classList.add("motion-enhanced", "motion-start");

  const veil = document.createElement("div");
  veil.className = "motion-page-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.appendChild(veil);

  window.setTimeout(() => {
    document.body.classList.remove("motion-start");
  }, 1700);

  const sceneSelectors = [
    ".experience-section",
    ".case-system-showcase",
    ".poster-showcase",
    "#detail-page-works",
    "#recent-work",
    ".works-intro",
    "#creative-collage",
    "#case-study",
    ".case-grid",
    ".footer-cover",
    ".site-footer"
  ];

  const childSelectors = [
    ".experience-heading",
    ".experience-avatar",
    ".experience-info",
    ".career-block",
    ".selected-works-head",
    ".selected-work-card",
    ".poster-index",
    ".poster-gallery",
    ".poster-more",
    ".detail-page-head",
    ".detail-card",
    ".detail-more",
    "#recent-work .section-title-row",
    "#recent-work .strip-card",
    ".works-intro > *",
    "#creative-collage > .collage",
    "#creative-collage .statement",
    "#creative-collage .about-copy",
    "#case-study > *",
    ".case-grid > *",
    ".footer-cover > *",
    ".site-footer > div"
  ].join(",");

  const scenes = [...document.querySelectorAll(sceneSelectors.join(","))]
    .filter((scene) => !scene.closest(protectedSelector));

  scenes.forEach((scene) => {
    scene.classList.add("motion-scene");

    const children = [...scene.querySelectorAll(childSelectors)]
      .filter((node) => !node.closest(protectedSelector));

    [...new Set(children)].slice(0, 18).forEach((node, index) => {
      node.classList.add("motion-child");
      node.style.setProperty("--motion-index", String(Math.min(index, 9)));
      node.style.setProperty("--motion-delay", `${Math.min(index, 9) * 72}ms`);
    });
  });

  if ("IntersectionObserver" in window) {
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-motion-visible");
        motionObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -14% 0px", threshold: 0.18 });

    scenes.forEach((scene) => motionObserver.observe(scene));
  } else {
    scenes.forEach((scene) => scene.classList.add("is-motion-visible"));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || link.closest(protectedSelector)) return;

    const target = link.getAttribute("href");
    if (!target || target === "#" || target === "#works-wall") return;

    document.body.classList.remove("motion-jump");
    void veil.offsetWidth;
    document.body.classList.add("motion-jump");

    window.setTimeout(() => {
      document.body.classList.remove("motion-jump");
    }, 760);
  }, true);
})();
