const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
const heroCarousel = document.querySelector("[data-hero-carousel]");

if (heroCarousel) {
  const rail = heroCarousel.querySelector("[data-hero-rail]");
  const track = heroCarousel.querySelector("[data-hero-track]");
  const originalTiles = rail ? [...rail.children] : [];

  if (rail && track && originalTiles.length) {
    const cloneSets = 2;

    originalTiles.forEach((tile) => {
      tile.draggable = false;
      tile.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
      });
    });

    for (let set = 0; set < cloneSets; set += 1) {
      originalTiles.forEach((tile) => {
        const clone = tile.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        clone.draggable = false;
        clone.querySelectorAll("img").forEach((img) => {
          img.draggable = false;
        });
        rail.appendChild(clone);
      });
    }

    const state = {
      active: false,
      pressing: false,
      dragReady: false,
      dragMoved: false,
      pointerId: null,
      pressTimer: 0,
      startX: 0,
      lastX: 0,
      lastTime: 0,
      targetX: -260,
      currentX: -260,
      velocity: -58,
      loopWidth: 1,
      dragWarp: 0,
      currentWarp: 0,
      suppressClick: false,
      lastFrameTime: 0,
      frame: 0,
      visible: false
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function startCarousel() {
      if (state.frame || !state.visible || document.hidden || reduceMotion.matches) return;
      state.lastFrameTime = 0;
      state.frame = requestAnimationFrame(paintCarousel);
    }

    function stopCarousel() {
      if (!state.frame) return;
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.lastFrameTime = 0;
    }

    function measureRail() {
      const scale = Number.parseFloat(getComputedStyle(heroCarousel).getPropertyValue("--card-scale")) || 1;
      state.loopWidth = Math.max(1, rail.scrollWidth / (cloneSets + 1) * scale);
      state.targetX = clamp(state.targetX, -state.loopWidth, 0);
      state.currentX = clamp(state.currentX, -state.loopWidth, 0);
    }

    function wrapTrack() {
      if (state.targetX < -state.loopWidth) {
        state.targetX += state.loopWidth;
        state.currentX += state.loopWidth;
      } else if (state.targetX > 0) {
        state.targetX -= state.loopWidth;
        state.currentX -= state.loopWidth;
      }
    }

    function paintCarousel(time) {
      if (!state.lastFrameTime) state.lastFrameTime = time;
      const deltaTime = Math.min(40, time - state.lastFrameTime);
      state.lastFrameTime = time;

      if (!state.active) {
        state.targetX += state.velocity * (deltaTime / 1000);
        state.currentX = state.targetX;
      }

      wrapTrack();
      if (state.active) {
        state.currentX += (state.targetX - state.currentX) * 0.22;
      }
      const warpTarget = state.active ? state.dragWarp : 0;
      state.currentWarp += (warpTarget - state.currentWarp) * (state.active ? 0.28 : 0.12);
      const pull = Math.min(0.11, Math.abs(state.currentWarp));
      heroCarousel.style.setProperty("--drag-skew", `${(-state.currentWarp * 9).toFixed(2)}deg`);
      heroCarousel.style.setProperty("--drag-stretch", (1 + pull * 0.95).toFixed(3));
      heroCarousel.style.setProperty("--drag-squash", (1 - pull * 0.3).toFixed(3));
      heroCarousel.style.setProperty("--drag-lift", `${(-pull * 28).toFixed(2)}px`);
      rail.style.setProperty("--wall-x", `${state.currentX.toFixed(2)}px`);
      if (state.visible && !document.hidden && !reduceMotion.matches) {
        state.frame = requestAnimationFrame(paintCarousel);
      } else {
        state.frame = 0;
      }
    }

    heroCarousel.addEventListener("wheel", (event) => {
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15;
      if (!horizontalIntent) return;

      event.preventDefault();
      state.targetX -= event.deltaX * 0.82;
      wrapTrack();
    }, { passive: false });

    function activateCarouselDrag() {
      if (!state.pressing || state.dragReady) return;
      state.pressTimer = 0;
      state.dragReady = true;
      state.active = true;
      state.velocity = 0;
      state.lastTime = performance.now();
      if (state.pointerId !== null && !heroCarousel.hasPointerCapture(state.pointerId)) {
        heroCarousel.setPointerCapture(state.pointerId);
      }
      heroCarousel.classList.add("is-dragging");
      startCarousel();
    }

    function clearPressTimer() {
      if (!state.pressTimer) return;
      clearTimeout(state.pressTimer);
      state.pressTimer = 0;
    }

    heroCarousel.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      clearPressTimer();
      state.pressing = true;
      state.active = false;
      state.dragReady = false;
      state.dragMoved = false;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.lastX = event.clientX;
      state.lastTime = performance.now();
      state.dragWarp = 0;
      heroCarousel.classList.add("is-pressing");
      state.pressTimer = window.setTimeout(activateCarouselDrag, event.pointerType === "mouse" ? 130 : 180);
    });

    heroCarousel.addEventListener("pointermove", (event) => {
      if (!state.pressing || state.pointerId !== event.pointerId) return;
      const now = performance.now();
      const delta = event.clientX - state.lastX;
      const totalDelta = event.clientX - state.startX;
      if (!state.dragReady && Math.abs(totalDelta) > 8) {
        clearPressTimer();
        activateCarouselDrag();
      }
      if (!state.active) return;
      event.preventDefault();
      const elapsed = Math.max(16, now - state.lastTime);
      state.lastX = event.clientX;
      state.lastTime = now;
      state.targetX += delta * 1.12;
      state.dragMoved = state.dragMoved || Math.abs(totalDelta) > 6;
      state.dragWarp = clamp(delta / Math.max(48, elapsed * 0.9), -0.16, 0.16);
      wrapTrack();
    }, { passive: false });

    const releaseCarousel = (event) => {
      if (event && state.pointerId !== event.pointerId) return;
      clearPressTimer();
      if (event && heroCarousel.hasPointerCapture(event.pointerId)) {
        heroCarousel.releasePointerCapture(event.pointerId);
      }
      state.suppressClick = state.dragMoved;
      if (state.suppressClick) {
        window.setTimeout(() => {
          state.suppressClick = false;
        }, 0);
      }
      state.pressing = false;
      state.active = false;
      state.dragReady = false;
      state.dragMoved = false;
      state.pointerId = null;
      state.dragWarp = 0;
      state.velocity = -58;
      heroCarousel.classList.remove("is-pressing");
      heroCarousel.classList.remove("is-dragging");
    };

    heroCarousel.addEventListener("pointerup", releaseCarousel);
    heroCarousel.addEventListener("pointercancel", releaseCarousel);
    heroCarousel.addEventListener("pointerleave", () => {
      if (state.pressing || state.active) return;
      clearPressTimer();
    });

    rail.addEventListener("click", (event) => {
      if (!state.suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      state.suppressClick = false;
    }, true);

    window.addEventListener("resize", measureRail);
    window.addEventListener("load", measureRail, { once: true });
    measureRail();

    if ("IntersectionObserver" in window) {
      const carouselObserver = new IntersectionObserver((entries) => {
        state.visible = entries.some((entry) => entry.isIntersecting);
        if (state.visible) startCarousel();
        else stopCarousel();
      }, { threshold: 0 });
      carouselObserver.observe(heroCarousel);
    } else {
      state.visible = true;
      startCarousel();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopCarousel();
      else startCarousel();
    });
    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) stopCarousel();
      else startCarousel();
    });
    window.addEventListener("pagehide", stopCarousel, { once: true });
  }
}

const hero = document.querySelector(".hero-wall-scene");

if (hero && !reduceMotion.matches) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetScroll = 0;
  let currentScroll = 0;
  let heroFrame = 0;
  let heroVisible = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function startHeroMotion() {
    if (heroFrame || !heroVisible || document.hidden || reduceMotion.matches) return;
    heroFrame = requestAnimationFrame(paintHero);
  }

  function stopHeroMotion() {
    if (!heroFrame) return;
    cancelAnimationFrame(heroFrame);
    heroFrame = 0;
  }

  function measureHeroScroll() {
    const rect = hero.getBoundingClientRect();
    const height = Math.max(1, rect.height);
    targetScroll = clamp(-rect.top / (height * 0.74), 0, 1);
  }

  function paintHero() {
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;
    currentScroll += (targetScroll - currentScroll) * 0.09;

    hero.style.setProperty("--hero-x", currentX.toFixed(3));
    hero.style.setProperty("--hero-y", currentY.toFixed(3));
    hero.style.setProperty("--hero-scroll", currentScroll.toFixed(3));
    if (heroVisible && !document.hidden && !reduceMotion.matches) {
      heroFrame = requestAnimationFrame(paintHero);
    } else {
      heroFrame = 0;
    }
  }

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const rect = hero.getBoundingClientRect();
    targetX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    targetY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  });

  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  window.addEventListener("scroll", measureHeroScroll, { passive: true });
  window.addEventListener("resize", measureHeroScroll);
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      targetX = 0;
      targetY = 0;
      targetScroll = 0;
      stopHeroMotion();
    } else {
      startHeroMotion();
    }
  });

  measureHeroScroll();
  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      heroVisible = entries.some((entry) => entry.isIntersecting);
      if (heroVisible) startHeroMotion();
      else stopHeroMotion();
    }, { threshold: 0 });
    heroObserver.observe(hero);
  } else {
    heroVisible = true;
    startHeroMotion();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopHeroMotion();
    else startHeroMotion();
  });
  window.addEventListener("pagehide", stopHeroMotion, { once: true });
}

const collage = document.querySelector("[data-arc-collage]");
const collageCards = collage ? [...collage.querySelectorAll(".collage-card")] : [];

if (collage && collageCards.length) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const slotIds = [-3, -2, -1, 0, 1, 2, 5, 6, 7, 8, 9];
  const slotAngle = Math.PI * 2 / 14;
  const hoverProgress = new Array(collageCards.length).fill(0);
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentRotation = 0;
  let targetRotation = 0;
  let angularVelocity = 0;
  let hoveredIndex = -1;
  let hoverClearTimer = null;
  let isDragging = false;
  let activePointerId = null;
  let previousPointerX = 0;
  let previousPointerTime = 0;
  let isCollageVisible = false;
  let introStart = null;
  let introCount = 0;
  let frame = 0;
  let orbit = { x: 0, y: 0 };
  let isCompactCollage = false;

  function easeOutExpo(value) {
    return value >= 1 ? 1 : 1 - Math.pow(2, -10 * value);
  }

  function easeOutBack(value) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
  }

  function smoothStep(value) {
    const progress = clamp(value, 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function circularDistance(a, b, total) {
    const distance = Math.abs(a - b);
    return Math.min(distance, total - distance);
  }

  function orbitSize() {
    const width = collage.clientWidth;
    const height = collage.clientHeight;
    if (width <= 560) {
      return {
        x: Math.min(width * .44, 176),
        y: Math.min(height * .34, 278)
      };
    }
    if (width <= 900) {
      return {
        x: Math.min(width * .39, 325),
        y: Math.min(height * .35, 330)
      };
    }
    return {
      x: Math.min(width * .36, 600),
      y: Math.min(height * .35, 380)
    };
  }

  function measureCollageBounds() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    orbit = orbitSize();
    isCompactCollage = collage.clientWidth <= 560;
  }

  function setHoveredCard(index) {
    if (hoverClearTimer) {
      clearTimeout(hoverClearTimer);
      hoverClearTimer = null;
    }
    hoveredIndex = index;
    startCollage();
  }

  function clearHoveredCard(delay = 120) {
    if (hoverClearTimer) clearTimeout(hoverClearTimer);
    hoverClearTimer = window.setTimeout(() => {
      hoveredIndex = -1;
      hoverClearTimer = null;
    }, delay);
  }

  function replayCollage() {
    introCount += 1;
    introStart = performance.now();
    angularVelocity = 0;
    if (introCount > 1) targetRotation = clamp(targetRotation, -.34, .34);
    stopCollage();
    startCollage();
  }

  function startCollage() {
    if (frame || !isCollageVisible || document.hidden) return;
    frame = requestAnimationFrame(paintCollage);
  }

  function stopCollage() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function paintCollage(now) {
    frame = 0;
    if (!isDragging) {
      angularVelocity *= .935;
      if (Math.abs(angularVelocity) < .000004) angularVelocity = 0;
      targetRotation += angularVelocity * 16;
    }
    currentRotation += (targetRotation - currentRotation) * .085;

    pointerX += (pointerTargetX - pointerX) * .065;
    pointerY += (pointerTargetY - pointerY) * .065;

    const hasHoveredCard = hoveredIndex > -1;
    let titleProgress = 0;

    hoverProgress.forEach((value, index) => {
      let target = 0;
      if (hasHoveredCard) {
        const distance = circularDistance(index, hoveredIndex, collageCards.length);
        target = Math.exp(-(distance * distance) / (2 * 1.18 * 1.18));
        if (distance > 3.2) target = 0;
      }
      const speed = target > value ? .085 : .07;
      hoverProgress[index] += (target - value) * speed;
    });

    collageCards.forEach((card, index) => {
      const elapsed = introStart === null ? 0 : now - introStart - index * 43;
      const linearProgress = reduceMotion.matches
        ? 1
        : clamp(elapsed / 1180, 0, 1);
      const orbitProgress = easeOutExpo(linearProgress);
      const scaleProgress = clamp(easeOutBack(linearProgress), 0, 1.08);
      const introTwist = (1 - orbitProgress) * -Math.PI * 1.82;
      const baseAngle = slotIds[index % slotIds.length] * slotAngle + currentRotation + introTwist;
      const hoverEase = smoothStep(hoverProgress[index]);
      const isHovered = hoveredIndex === index;
      let hoverAngleOffset = 0;
      let radialBoost = 0;
      let localHoverInfluence = hoverEase;

      if (hasHoveredCard) {
        const rawDifference = index - hoveredIndex;
        const signedDifference = Math.abs(rawDifference) > collageCards.length / 2
          ? rawDifference - Math.sign(rawDifference) * collageCards.length
          : rawDifference;
        const direction = signedDifference === 0 ? 0 : signedDifference > 0 ? 1 : -1;
        const spread = Math.pow(hoverEase, 1.35);

        if (isHovered) {
          radialBoost = 10 * spread;
        } else {
          hoverAngleOffset = direction * spread * .028;
          radialBoost = spread * 5;
          localHoverInfluence = spread * .85;
        }
      }

      const angle = baseAngle + hoverAngleOffset;
      const x = Math.sin(angle) * (orbit.x * orbitProgress + radialBoost * orbitProgress)
        + pointerX * Math.cos(angle) * Math.min(30, viewportWidth * .02);
      const y = -Math.cos(angle) * (orbit.y * orbitProgress + radialBoost * orbitProgress)
        + pointerY * Math.sin(angle) * Math.min(20, viewportHeight * .02);
      const lean = Math.sin(angle) * (isCompactCollage ? 18 : 31)
        + localHoverInfluence * (isHovered ? 3.6 : .8) * (Math.sin(angle) >= 0 ? 1 : -1);
      const settledScale = .79 + Math.abs(Math.cos(angle)) * .23;
      const hoverScale = isHovered ? .072 * localHoverInfluence : .008 * localHoverInfluence;
      const scale = Math.max(.015, (settledScale + hoverScale) * scaleProgress);
      const introSpin = (1 - orbitProgress) * -150;
      const sideFade = .62 + Math.abs(Math.cos(angle)) * .38;
      const opacity = clamp((linearProgress - .02) / .5, 0, 1) * sideFade;
      const blur = (1 - orbitProgress) * 12 + (1 - sideFade) * .8;
      const depth = Math.round(100 + settledScale * 100 + Math.cos(angle) * 12
        + localHoverInfluence * 18 + (isHovered ? 18 : 0));

      card.style.zIndex = String(depth);
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `blur(${blur.toFixed(2)}px)`;
      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(lean + introSpin).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      titleProgress += linearProgress;
    });

    const titleValue = clamp((titleProgress / collageCards.length - .28) / .52, 0, 1);
    collage.style.setProperty("--title-opacity", titleValue.toFixed(3));
    collage.style.setProperty("--title-scale", (.88 + titleValue * .12).toFixed(3));
    collage.style.setProperty("--title-blur", `${((1 - titleValue) * 8).toFixed(2)}px`);
    if (isCollageVisible && !document.hidden) {
      frame = requestAnimationFrame(paintCollage);
    }
  }

  collageCards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setHoveredCard(index));
    card.addEventListener("pointerleave", () => {
      if (hoveredIndex === index) clearHoveredCard();
    });
  });

  window.addEventListener("resize", () => {
    measureCollageBounds();
    syncCollageVisibility();
  }, { passive: true });

  window.addEventListener("pointermove", (event) => {
    if (!isCollageVisible && !isDragging) return;
    if (!finePointer.matches && !isDragging) return;
    pointerTargetX = clamp((event.clientX / viewportWidth) * 2 - 1, -1, 1);
    pointerTargetY = clamp((event.clientY / viewportHeight) * 2 - 1, -1, 1);

    if (!isDragging || event.pointerId !== activePointerId) return;
    const now = performance.now();
    const deltaX = event.clientX - previousPointerX;
    const deltaTime = Math.max(now - previousPointerTime, 1);
    targetRotation += deltaX * .0042;
    angularVelocity = deltaX / deltaTime * .0042;
    previousPointerX = event.clientX;
    previousPointerTime = now;
  }, { passive: true });

  collage.addEventListener("pointerleave", () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    clearHoveredCard();
  });

  collage.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    isDragging = true;
    activePointerId = event.pointerId;
    previousPointerX = event.clientX;
    previousPointerTime = performance.now();
    angularVelocity = 0;
    collage.classList.add("is-dragging");
    collage.setPointerCapture?.(event.pointerId);
    startCollage();
  });

  function releaseCollageDrag(event) {
    if (!isDragging) return;
    if (event.pointerId !== undefined && activePointerId !== null && event.pointerId !== activePointerId) return;
    isDragging = false;
    activePointerId = null;
    collage.classList.remove("is-dragging");
  }

  collage.addEventListener("pointerup", releaseCollageDrag);
  collage.addEventListener("pointercancel", releaseCollageDrag);
  window.addEventListener("pointerup", releaseCollageDrag);

  function syncCollageVisibility() {
    const rect = collage.getBoundingClientRect();
    const isOnStage = rect.top < viewportHeight * .82 && rect.bottom > viewportHeight * .18;
    const isFullyOutside = rect.bottom < 0 || rect.top > viewportHeight;

    if (isOnStage && !isCollageVisible) {
      isCollageVisible = true;
      replayCollage();
    } else if (isOnStage) {
      startCollage();
    } else if (isFullyOutside && isCollageVisible) {
      isCollageVisible = false;
      introStart = null;
      stopCollage();
    }
  }

  window.addEventListener("scroll", syncCollageVisibility, { passive: true });
  window.addEventListener("hashchange", syncCollageVisibility);
  window.addEventListener("resize", syncCollageVisibility);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCollage();
    else syncCollageVisibility();
  });
  measureCollageBounds();
  requestAnimationFrame(syncCollageVisibility);
  window.setTimeout(syncCollageVisibility, 180);
  window.setTimeout(syncCollageVisibility, 650);
  window.setTimeout(syncCollageVisibility, 1400);
  window.addEventListener("pageshow", () => {
    stopCollage();
    measureCollageBounds();
    window.setTimeout(syncCollageVisibility, 60);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

const worksPage = document.querySelector(".works-page") || document.querySelector("#works-wall")?.closest("main") || document;

if (worksPage) {
  const filterButtons = [...worksPage.querySelectorAll("[data-filter]")];
  const workCards = [...worksPage.querySelectorAll("[data-category]")];
  const resultCount = worksPage.querySelector("[data-result-count]");
  const filterHelp = worksPage.querySelector("[data-filter-help]");
  const emptyState = worksPage.querySelector("[data-empty-state]");

  if (filterButtons.length && workCards.length) {
    const applyFilter = (filter) => {
      let visibleCount = 0;

      filterButtons.forEach((button) => {
        const active = button.dataset.filter === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      workCards.forEach((card) => {
        const hidden = filter !== "全部" && card.dataset.category !== filter;
        card.classList.toggle("is-hidden", hidden);
        card.setAttribute("aria-hidden", String(hidden));
        if (!hidden) visibleCount += 1;
      });

      if (resultCount) resultCount.textContent = String(visibleCount);
      if (filterHelp) {
        filterHelp.textContent = filter === "全部" ? "显示全部分类" : `当前仅显示「${filter}」项目。`;
      }
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => applyFilter(button.dataset.filter || "全部"));
    });

    applyFilter(filterButtons.find((button) => button.classList.contains("is-active"))?.dataset.filter || "全部");
  }
}

const tiltCards = [...document.querySelectorAll(".tilt-card")];
const worksWall = document.querySelector(".works-wall");
const curvedGallery = document.querySelector("[data-curved-gallery]");

if (curvedGallery) {
  const scene = curvedGallery.querySelector("[data-gallery-scene]");
  const wrapper = curvedGallery.querySelector("[data-gallery-wrapper]");
  const sourceCards = [...curvedGallery.querySelectorAll("[data-gallery-card]")];
  const galleryItems = [];
  const config = {
    rows: 3,
    cols: 17,
    gapX: 24,
    gapY: 48,
    radius: 1380,
    perspective: 1100,
  };
  const rowOffsets = [0, 0, 0];
  const rowSpeeds = [-0.18, 0.145, -0.205];
  const layoutState = {
    cardW: 280,
    cardH: 280,
    radius: config.radius,
    angleStep: 12,
    gapX: config.gapX,
    gapY: config.gapY,
  };

  if (wrapper && sourceCards.length) {
    const totalCards = config.rows * config.cols;
    for (let index = sourceCards.length; index < totalCards; index += 1) {
      const clone = sourceCards[index % sourceCards.length].cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      wrapper.appendChild(clone);
    }
  }

  const galleryCards = [...curvedGallery.querySelectorAll("[data-gallery-card]")];

  const updateGalleryLayout = () => {
    if (!scene || !wrapper || !galleryCards.length) return;

    const sceneWidth = scene.clientWidth || window.innerWidth;
    const desktopScale = sceneWidth / 2560;
    const isCompact = sceneWidth < 700;
    const cardW = isCompact
      ? Math.min(128, Math.max(108, sceneWidth * 0.3))
      : Math.min(420, Math.max(92, sceneWidth * 0.109375));
    const cardH = cardW;
    const radius = isCompact ? 480 : Math.max(520, sceneWidth * 0.5390625);
    const perspective = isCompact ? 620 : Math.max(440, sceneWidth * 0.4296875);
    const gapX = isCompact ? 12 : Math.max(10, config.gapX * desktopScale);
    const gapY = isCompact ? 32 : Math.max(20, config.gapY * desktopScale);
    const centerScale = perspective / (perspective + radius);
    const localGapX = gapX / centerScale;
    const angleStep = Math.asin(Math.min(0.92, (cardW + localGapX) / radius)) * 180 / Math.PI;
    layoutState.cardW = cardW;
    layoutState.cardH = cardH;
    layoutState.radius = radius;
    layoutState.angleStep = angleStep;
    layoutState.gapX = gapX;
    layoutState.gapY = gapY;
    scene.style.perspective = `${perspective}px`;

    galleryItems.length = 0;
    galleryCards.forEach((card, index) => {
      const row = Math.floor(index / config.cols);
      const col = index % config.cols;

      card.style.setProperty("--gallery-card-width", `${cardW}px`);
      card.style.setProperty("--gallery-card-height", `${cardH}px`);
      card.style.opacity = "0";
      card.dataset.row = String(row);
      card.dataset.col = String(col);

      const midRow = Math.floor(config.rows / 2);
      const midCol = Math.floor(config.cols / 2);
      const dist = Math.abs(col - midCol) + Math.abs(row - midRow);
      galleryItems.push({ el: card, dist });
    });

    window.setTimeout(() => {
      galleryItems.forEach(({ el, dist }) => {
        window.setTimeout(() => {
          el.style.transition = "opacity 0.8s ease-out, filter 0.4s ease, box-shadow 0.4s ease";
          el.style.opacity = "1";
        }, dist * 60);
      });
    }, 120);
  };

  updateGalleryLayout();
  window.addEventListener("resize", updateGalleryLayout);

  galleryCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.dataset.hovered = "true";
    });

    card.addEventListener("mouseleave", () => {
      card.dataset.hovered = "false";
    });
  });

  let mouseX = 0;
  let mouseY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let lastGalleryTime = performance.now();
  let galleryFrame = 0;
  let isGalleryVisible = false;
  const maxRotY = 18;
  const maxRotX = 5;

  curvedGallery.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;
  });

  const renderGallery = () => {
    galleryFrame = 0;
    const now = performance.now();
    const deltaSeconds = Math.min(0.05, (now - lastGalleryTime) / 1000);
    lastGalleryTime = now;

    rowOffsets.forEach((offset, index) => {
      const nextOffset = offset + rowSpeeds[index] * deltaSeconds;
      rowOffsets[index] = ((nextOffset % config.cols) + config.cols) % config.cols;
    });

    const targetRotY = -mouseX * maxRotY;
    const targetRotX = mouseY * maxRotX;
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    if (wrapper) {
      wrapper.style.transform = `rotateX(${-2 + currentRotX}deg) rotateY(${currentRotY}deg)`;
    }

    const midRow = Math.floor(config.rows / 2);
    const midCol = Math.floor(config.cols / 2);
    galleryCards.forEach((card) => {
      const row = Number(card.dataset.row || 0);
      const col = Number(card.dataset.col || 0);
      const wrappedCol = ((col + rowOffsets[row]) % config.cols + config.cols) % config.cols;
      const centeredCol = wrappedCol - midCol;
      const yOffset = (row - midRow) * (layoutState.cardH + layoutState.gapY);
      const theta = centeredCol * layoutState.angleStep;
      card.dataset.baseTransform = `translateX(-50%) translateY(-50%) translateY(${yOffset}px) rotateY(${theta}deg) translateZ(${-layoutState.radius}px)`;
      card.style.transform = card.dataset.baseTransform;
    });

    if (isGalleryVisible && !document.hidden && !reduceMotion.matches) {
      galleryFrame = requestAnimationFrame(renderGallery);
    }
  };

  const startGallery = () => {
    if (galleryFrame || !isGalleryVisible || document.hidden || reduceMotion.matches) return;
    lastGalleryTime = performance.now();
    galleryFrame = requestAnimationFrame(renderGallery);
  };

  const stopGallery = () => {
    if (!galleryFrame) return;
    cancelAnimationFrame(galleryFrame);
    galleryFrame = 0;
  };

  const galleryObserver = new IntersectionObserver((entries) => {
    const activeForHeader = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.55);
    isGalleryVisible = entries.some((entry) => entry.isIntersecting);
    document.body.classList.toggle("is-gallery-active", activeForHeader);
    if (isGalleryVisible) startGallery();
    else stopGallery();
  }, { threshold: [0, 0.12, 0.55, 1] });

  galleryObserver.observe(curvedGallery);
  if (reduceMotion.matches) renderGallery();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopGallery();
    else startGallery();
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) stopGallery();
    else startGallery();
  });
  window.addEventListener("pagehide", stopGallery, { once: true });
}

if (worksWall && !curvedGallery && !reduceMotion.matches) {
  const wallCards = [...worksWall.querySelectorAll(".work-tile")];
  let wallFrame = 0;

  const updateWallPerspective = () => {
    wallFrame = 0;
    const rect = worksWall.getBoundingClientRect();
    const viewport = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport * 0.68)));
    worksWall.style.setProperty("--wall-progress", progress.toFixed(3));

    wallCards.forEach((card, index) => {
      const column = index % 5;
      const depth = (column - 2) * (1 - progress) * 9;
      const rowPush = Math.floor(index / 5) * (1 - progress) * 7;
      card.style.setProperty("--depth-y", `${(depth + rowPush).toFixed(2)}px`);
    });
  };

  const requestWallPerspective = () => {
    if (!wallFrame) wallFrame = requestAnimationFrame(updateWallPerspective);
  };

  updateWallPerspective();
  window.addEventListener("scroll", requestWallPerspective, { passive: true });
  window.addEventListener("resize", requestWallPerspective);
}

if (tiltCards.length && finePointer.matches && !reduceMotion.matches) {
  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

const profileTilt = document.querySelector("[data-profile-tilt]");

if (profileTilt && finePointer.matches && !reduceMotion.matches) {
  profileTilt.addEventListener("pointermove", (event) => {
    const rect = profileTilt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    profileTilt.style.setProperty("--profile-rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
    profileTilt.style.setProperty("--profile-ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
    profileTilt.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
    profileTilt.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
    profileTilt.style.setProperty("--glare-opacity", ".9");
  });

  profileTilt.addEventListener("pointerleave", () => {
    profileTilt.style.setProperty("--profile-rx", "0deg");
    profileTilt.style.setProperty("--profile-ry", "0deg");
    profileTilt.style.setProperty("--glare-opacity", "0");
  });
}

const glowCards = [...document.querySelectorAll("[data-border-glow]")];

if (glowCards.length && finePointer.matches && !reduceMotion.matches) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getEdgeProximity = (rect, x, y) => {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
    const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
    return clamp(1 / Math.min(kx, ky), 0, 1);
  };

  const getCursorAngle = (rect, x, y) => {
    const dx = x - rect.width / 2;
    const dy = y - rect.height / 2;
    if (dx === 0 && dy === 0) return 45;
    const degrees = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    return degrees < 0 ? degrees + 360 : degrees;
  };

  glowCards.forEach((card, index) => {
    const sweepStart = 115 + index * 18;
    card.style.setProperty("--cursor-angle", `${sweepStart}deg`);
    card.style.setProperty("--edge-proximity", "78");
    card.classList.add("sweep-active");

    window.setTimeout(() => {
      card.style.setProperty("--edge-proximity", "0");
      card.classList.remove("sweep-active");
    }, 1200 + index * 130);

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = getEdgeProximity(rect, x, y);
      const angle = getCursorAngle(rect, x, y);

      card.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--edge-proximity", "0");
    });
  });
}

/* Superseded by the title-only scope requested after review.
const detailCurvedGallery = document.querySelector("[data-detail-curved-gallery]");

if (detailCurvedGallery) {
  const scene = detailCurvedGallery.querySelector(".detail-page-masonry");
  detailCurvedGallery.querySelectorAll('.detail-card[aria-hidden="true"]').forEach((card) => card.remove());
  const sourceCards = [...detailCurvedGallery.querySelectorAll(".detail-card")];
  const config = { rows: 3, cols: 17, gapX: 18, gapY: 30 };
  const totalCards = config.rows * config.cols;

  if (scene && sourceCards.length) {
    for (let index = sourceCards.length; index < totalCards; index += 1) {
      const clone = sourceCards[index % sourceCards.length].cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      scene.appendChild(clone);
    }
  }

  const cards = [...detailCurvedGallery.querySelectorAll(".detail-card")];
  const rowOffsets = [0, 0, 0];
  const rowSpeeds = [-0.145, 0.112, -0.162];
  const layout = {
    cardW: 210,
    cardH: 286,
    radius: 1380,
    angleStep: 10,
    gapY: 30,
  };

  let pointerX = 0;
  let pointerY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let frame = 0;
  let visible = false;
  let lastTime = performance.now();

  const updateDetailLayout = () => {
    if (!scene || !cards.length) return;

    const sceneWidth = scene.clientWidth || window.innerWidth;
    const desktopScale = sceneWidth / 2560;
    const compact = sceneWidth < 700;
    const cardW = compact
      ? Math.min(132, Math.max(108, sceneWidth * 0.3))
      : Math.min(292, Math.max(118, sceneWidth * 0.082));
    const cardH = cardW * 1.36;
    const radius = compact ? 500 : Math.max(560, sceneWidth * 0.5390625);
    const perspective = compact ? 650 : Math.max(520, sceneWidth * 0.4296875);
    const gapX = compact ? 10 : Math.max(8, config.gapX * desktopScale);
    const gapY = compact ? 22 : Math.max(15, config.gapY * desktopScale);
    const centerScale = perspective / (perspective + radius);
    const localGapX = gapX / centerScale;
    const angleStep = Math.asin(Math.min(.92, (cardW + localGapX) / radius)) * 180 / Math.PI;

    layout.cardW = cardW;
    layout.cardH = cardH;
    layout.radius = radius;
    layout.angleStep = angleStep;
    layout.gapY = gapY;
    scene.style.perspective = `${perspective}px`;

    const midRow = Math.floor(config.rows / 2);
    const midCol = Math.floor(config.cols / 2);
    cards.forEach((card, index) => {
      const row = Math.floor(index / config.cols);
      const col = index % config.cols;
      const distance = Math.abs(col - midCol) + Math.abs(row - midRow);
      card.dataset.row = String(row);
      card.dataset.col = String(col);
      card.style.setProperty("--detail-gallery-card-width", `${cardW}px`);
      card.style.setProperty("--detail-gallery-card-height", `${cardH}px`);
      card.style.opacity = "0";
      window.setTimeout(() => {
        card.style.opacity = "1";
      }, 100 + distance * 42);
    });
  };

  const renderDetailGallery = () => {
    frame = 0;
    const now = performance.now();
    const deltaSeconds = Math.min(.05, (now - lastTime) / 1000);
    lastTime = now;

    rowOffsets.forEach((offset, index) => {
      const next = offset + rowSpeeds[index] * deltaSeconds;
      rowOffsets[index] = ((next % config.cols) + config.cols) % config.cols;
    });

    currentRotY += (-pointerX * 11 - currentRotY) * .045;
    currentRotX += (pointerY * 3.5 - currentRotX) * .045;

    const midRow = Math.floor(config.rows / 2);
    const midCol = Math.floor(config.cols / 2);
    cards.forEach((card) => {
      const row = Number(card.dataset.row || 0);
      const col = Number(card.dataset.col || 0);
      const wrappedCol = ((col + rowOffsets[row]) % config.cols + config.cols) % config.cols;
      const centeredCol = wrappedCol - midCol;
      const yOffset = (row - midRow) * (layout.cardH + layout.gapY);
      const theta = centeredCol * layout.angleStep + currentRotY;
      card.style.transform = `translateX(-50%) translateY(-50%) translateY(${yOffset + currentRotX * 2}px) rotateY(${theta}deg) translateZ(${-layout.radius}px)`;
    });

    if (visible && !document.hidden && !reduceMotion.matches) {
      frame = requestAnimationFrame(renderDetailGallery);
    }
  };

  const startDetailGallery = () => {
    if (frame || !visible || document.hidden || reduceMotion.matches) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(renderDetailGallery);
  };

  const stopDetailGallery = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  detailCurvedGallery.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerY = (event.clientY / window.innerHeight) * 2 - 1;
  });

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) startDetailGallery();
    else stopDetailGallery();
  }, { threshold: [0, .12, .55, 1] });

  updateDetailLayout();
  renderDetailGallery();
  observer.observe(detailCurvedGallery);
  window.addEventListener("resize", () => {
    updateDetailLayout();
    renderDetailGallery();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopDetailGallery();
    else startDetailGallery();
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      stopDetailGallery();
      renderDetailGallery();
    } else {
      startDetailGallery();
    }
  });
  window.addEventListener("pagehide", stopDetailGallery, { once: true });
}
*/

const detailShowcase = document.querySelector("#detail-page-works");
const detailToggle = detailShowcase?.querySelector("[data-detail-toggle]");
const detailToggleLabel = detailShowcase?.querySelector("[data-detail-toggle-label]");

if (detailShowcase && detailToggle && detailToggleLabel) {
  detailToggle.addEventListener("click", () => {
    const isExpanded = detailShowcase.classList.toggle("is-expanded");
    detailToggle.setAttribute("aria-expanded", String(isExpanded));
    detailToggleLabel.textContent = isExpanded ? "收起详情页" : "展开详情页";
    requestAnimationFrame(() => requestAnimationFrame(updateDetailTrackMetrics));

    if (!isExpanded) {
      detailShowcase.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
    }
  });
}

// Keep each detail column seamless while preserving every long page's natural height.
const detailColumns = [...document.querySelectorAll(".detail-scroll-column")];
const detailScrollSpeeds = [40, 36, 43, 38, 41];

detailColumns.forEach((column) => {
  const track = column.querySelector(".detail-scroll-track");
  if (!track) return;

  const seed = [...track.querySelectorAll("[data-detail-source]")].map((card) => card.cloneNode(true));
  if (!seed.length) return;

  track.replaceChildren();
  column.dataset.detailSeedCount = String(seed.length);
  const playbackCycleCount = 6;
  column.dataset.detailPlaybackCount = String(playbackCycleCount);

  const playbackCycle = Array.from({ length: playbackCycleCount }, (_, index) => {
    const card = seed[index % seed.length].cloneNode(true);
    if (index >= seed.length) {
      card.setAttribute("aria-hidden", "true");
      card.tabIndex = -1;
    }
    return card;
  });

  [...playbackCycle, ...playbackCycle].forEach((card, index) => {
    const clone = card.cloneNode(true);
    if (index >= playbackCycleCount) {
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
    }
    track.appendChild(clone);
  });
});

const updateDetailTrackMetrics = () => {
  let tallestCycle = 0;

  detailColumns.forEach((column, index) => {
    const track = column.querySelector(".detail-scroll-track");
    if (!track) return;

    const seedCount = Number(column.dataset.detailSeedCount || 0);
    const playbackCount = Number(column.dataset.detailPlaybackCount || seedCount);
    const sourceCards = [...track.children].slice(0, seedCount);
    const playbackCycle = [...track.children].slice(0, playbackCount);
    const sourceHeight = sourceCards.reduce((total, card) => {
      const marginBottom = Number.parseFloat(getComputedStyle(card).marginBottom) || 0;
      return total + card.offsetHeight + marginBottom;
    }, 0);
    const cycleHeight = playbackCycle.reduce((total, card) => {
      const marginBottom = Number.parseFloat(getComputedStyle(card).marginBottom) || 0;
      return total + card.offsetHeight + marginBottom;
    }, 0);

    tallestCycle = Math.max(tallestCycle, sourceHeight);
    const loopDistance = cycleHeight;
    const duration = Math.max(75, loopDistance / detailScrollSpeeds[index % detailScrollSpeeds.length]);
    track.style.setProperty("--scroll-duration", `${duration.toFixed(2)}s`);
  });

  if (detailShowcase && tallestCycle > 0) {
    detailShowcase.style.setProperty("--detail-expanded-height", `${Math.ceil(tallestCycle)}px`);
  }
};

requestAnimationFrame(() => requestAnimationFrame(updateDetailTrackMetrics));
window.addEventListener("resize", updateDetailTrackMetrics);
detailColumns.forEach((column) => {
  const seedCount = Number(column.dataset.detailSeedCount || 0);
  const firstCycleImages = [...column.querySelectorAll(".detail-scroll-track > .detail-card img")]
    .slice(0, seedCount);
  firstCycleImages.forEach((image) => image.addEventListener("load", updateDetailTrackMetrics, { once: true }));
});

const artworkViewer = document.querySelector("[data-artwork-viewer]");

if (artworkViewer) {
  const artworkSelector = [
    "[data-hero-carousel] .hero-tile img",
    ".poster-gallery .poster-card img",
    ".detail-page-masonry .detail-card img",
    ".works-gallery-scene .works-gallery-item img",
    ".arc-collage .collage-card img"
  ].join(",");
  const artworkTriggerSelector = [
    "[data-hero-carousel] .hero-tile",
    ".poster-gallery .poster-card",
    ".detail-page-masonry .detail-card",
    ".works-gallery-scene .works-gallery-item",
    ".arc-collage .collage-card"
  ].join(",");
  const viewerImage = artworkViewer.querySelector("[data-artwork-image]");
  const viewerStage = artworkViewer.querySelector("[data-artwork-stage]");
  const viewerViewport = artworkViewer.querySelector("[data-artwork-viewport]");
  const viewerTitle = artworkViewer.querySelector("[data-artwork-title]");
  const viewerMeta = artworkViewer.querySelector("[data-artwork-meta]");
  const viewerOpen = artworkViewer.querySelector("[data-artwork-open]");
  const previousButton = artworkViewer.querySelector("[data-artwork-prev]");
  const nextButton = artworkViewer.querySelector("[data-artwork-next]");
  let artworkItems = [];
  let artworkIndex = 0;
  let artworkScale = 1;
  let fitScale = 1;
  let previousFocus = null;

  const getArtworkLabel = (image) => {
    const cardTitle = image.closest("a, article, .collage-card")?.querySelector(".card-label strong")?.textContent?.trim();
    return image.alt.trim() || cardTitle || "作品原图";
  };

  const collectArtworkItems = () => {
    const seen = new Set();
    return [...document.querySelectorAll(artworkSelector)].reduce((items, image) => {
      const source = image.currentSrc || image.src;
      if (!source || seen.has(source)) return items;
      seen.add(source);
      items.push({ source, label: getArtworkLabel(image) });
      return items;
    }, []);
  };

  const updateArtworkMeta = () => {
    if (!viewerImage.naturalWidth) return;
    const zoom = Math.round(artworkScale * 100);
    viewerMeta.textContent = `${artworkIndex + 1} / ${artworkItems.length} · ${viewerImage.naturalWidth} × ${viewerImage.naturalHeight} px · ${zoom}%`;
  };

  const applyArtworkScale = (scale) => {
    if (!viewerImage.naturalWidth) return;
    artworkScale = Math.min(4, Math.max(.08, scale));
    viewerImage.style.width = `${Math.round(viewerImage.naturalWidth * artworkScale)}px`;
    updateArtworkMeta();
  };

  const measureArtwork = () => {
    if (!viewerImage.naturalWidth || !viewerImage.naturalHeight) return;
    const longArtwork = viewerImage.naturalHeight / viewerImage.naturalWidth > 2.2;
    const availableWidth = Math.max(120, viewerViewport.clientWidth - (window.innerWidth <= 700 ? 36 : 176));
    const availableHeight = Math.max(120, viewerViewport.clientHeight - (window.innerWidth <= 700 ? 76 : 64));
    fitScale = longArtwork
      ? Math.min(1, availableWidth / viewerImage.naturalWidth)
      : Math.min(1, availableWidth / viewerImage.naturalWidth, availableHeight / viewerImage.naturalHeight);
    viewerStage.classList.toggle("is-long-artwork", longArtwork);
    applyArtworkScale(fitScale);
    viewerViewport.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const renderArtwork = () => {
    const item = artworkItems[artworkIndex];
    if (!item) return;
    viewerTitle.textContent = item.label;
    viewerMeta.textContent = `${artworkIndex + 1} / ${artworkItems.length} · 正在载入原图`;
    viewerOpen.href = item.source;
    viewerImage.alt = item.label;
    viewerImage.src = item.source;
    viewerImage.style.width = "auto";
    const hasMultipleItems = artworkItems.length > 1;
    previousButton.hidden = !hasMultipleItems;
    nextButton.hidden = !hasMultipleItems;
    if (viewerImage.complete && viewerImage.naturalWidth) requestAnimationFrame(measureArtwork);
  };

  const showRelativeArtwork = (direction) => {
    if (!artworkItems.length) return;
    artworkIndex = (artworkIndex + direction + artworkItems.length) % artworkItems.length;
    renderArtwork();
  };

  const openArtwork = (sourceImage) => {
    artworkItems = collectArtworkItems();
    if (!artworkItems.length) return;
    const source = sourceImage.currentSrc || sourceImage.src;
    artworkIndex = Math.max(0, artworkItems.findIndex((item) => item.source === source));
    previousFocus = document.activeElement;
    if (!artworkViewer.open) artworkViewer.showModal();
    document.body.classList.add("has-artwork-viewer-open");
    renderArtwork();
    viewerViewport.focus({ preventScroll: true });
  };

  const closeArtwork = () => {
    if (artworkViewer.open) artworkViewer.close();
  };

  viewerImage.addEventListener("load", measureArtwork);
  artworkViewer.querySelector("[data-artwork-close]").addEventListener("click", closeArtwork);
  previousButton.addEventListener("click", () => showRelativeArtwork(-1));
  nextButton.addEventListener("click", () => showRelativeArtwork(1));
  artworkViewer.querySelector("[data-artwork-zoom-out]").addEventListener("click", () => applyArtworkScale(artworkScale / 1.2));
  artworkViewer.querySelector("[data-artwork-zoom-in]").addEventListener("click", () => applyArtworkScale(artworkScale * 1.2));
  artworkViewer.querySelector("[data-artwork-actual]").addEventListener("click", () => {
    const nextScale = Math.abs(artworkScale - 1) < .01 ? fitScale : 1;
    applyArtworkScale(nextScale);
    viewerViewport.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });

  artworkViewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeArtwork();
  });

  artworkViewer.addEventListener("close", () => {
    document.body.classList.remove("has-artwork-viewer-open");
    viewerImage.removeAttribute("src");
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  });

  artworkViewer.addEventListener("keydown", (event) => {
    const handledKeys = new Set(["ArrowLeft", "ArrowRight", "+", "=", "-", "1", "0"]);
    if (!handledKeys.has(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") showRelativeArtwork(-1);
    else if (event.key === "ArrowRight") showRelativeArtwork(1);
    else if (event.key === "+" || event.key === "=") applyArtworkScale(artworkScale * 1.2);
    else if (event.key === "-") applyArtworkScale(artworkScale / 1.2);
    else if (event.key === "1") applyArtworkScale(1);
    else if (event.key === "0") applyArtworkScale(fitScale);
  });

  document.addEventListener("click", (event) => {
    const sourceImage = event.target.closest(artworkTriggerSelector)?.querySelector("img");
    if (!sourceImage) return;
    event.preventDefault();
    openArtwork(sourceImage);
  });

  document.querySelectorAll(".works-gallery-item").forEach((card) => {
    const image = card.querySelector("img");
    if (!image) return;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `查看原图：${getArtworkLabel(image)}`);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openArtwork(image);
    });
  });

  window.addEventListener("resize", () => {
    if (artworkViewer.open && Math.abs(artworkScale - fitScale) < .01) measureArtwork();
  });
}
