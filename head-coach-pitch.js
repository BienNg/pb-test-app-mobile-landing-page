(function() {
  'use strict';

  var DURATION = 450;
  var deck = document.getElementById('pitch-deck');
  if (!deck) return;

  var slides = deck.querySelectorAll('.deck-slide');
  var total = slides.length;
  var current = 0;
  var progressEl = document.getElementById('deck-progress');
  var hintEl = document.getElementById('deck-hint');
  var indicatorEl = document.getElementById('deck-indicator');
  var indicatorBtns = [];
  var indicatorTooltipEl = null;
  var prevBtn = document.getElementById('deck-prev');
  var nextBtn = document.getElementById('deck-next');
  var footer = document.getElementById('site-footer');
  var approachTitleEl = document.getElementById('approach-sticky-title');
  var transitioning = false;

  document.body.classList.add('pitch-deck-active');
  if (footer) footer.style.display = 'none';

  function showHint() {
    if (!hintEl) return;
    if (current === 0) hintEl.textContent = 'Scroll, click, or press → to continue';
    else if (current === total - 1) hintEl.textContent = '';
    else hintEl.textContent = 'Scroll, click, or press → for next  ← for previous';
  }

  var arrowsEl = document.querySelector('.deck-arrows');
  function getSlideLabel(slide, index) {
    var label = slide && slide.getAttribute && slide.getAttribute('data-nav-label');
    if (label) return label;
    if (slide && slide.id) return slide.id;
    return 'Slide ' + (index + 1);
  }

  function buildIndicator() {
    if (!indicatorEl) return;
    // NOTE: Tooltip must live in <body>.
    // If it lives inside `.deck-indicator` (which is transformed), `position: fixed`
    // becomes relative to that transformed element and positioning is way off.
    indicatorTooltipEl = document.getElementById('deck-indicator-tooltip');
    if (!indicatorTooltipEl) {
      indicatorTooltipEl = document.createElement('div');
      indicatorTooltipEl.id = 'deck-indicator-tooltip';
      indicatorTooltipEl.className = 'deck-indicator-tooltip';
      indicatorTooltipEl.setAttribute('role', 'tooltip');
      indicatorTooltipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(indicatorTooltipEl);
    }

    var list = document.createElement('div');
    list.className = 'deck-indicator-list';

    for (var i = 0; i < slides.length; i++) {
      var label = getSlideLabel(slides[i], i);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'deck-indicator-item';
      btn.setAttribute('data-index', String(i));
      btn.setAttribute('data-label', label);
      btn.setAttribute('aria-label', 'Go to: ' + label);
      btn.innerHTML = '<span class="deck-indicator-dot" aria-hidden="true"></span>';
      list.appendChild(btn);
      indicatorBtns.push(btn);
    }

    indicatorEl.appendChild(list);

    var activeTipBtn = null;

    function positionTooltip() {
      if (!activeTipBtn) return;
      if (!indicatorTooltipEl) return;
      var dot = activeTipBtn.querySelector('.deck-indicator-dot');
      var rect = (dot && dot.getBoundingClientRect) ? dot.getBoundingClientRect() : activeTipBtn.getBoundingClientRect();
      indicatorTooltipEl.style.left = (rect.left + rect.width / 2) + 'px';
      indicatorTooltipEl.style.top = (rect.bottom + 14) + 'px';

      // Clamp within viewport after layout.
      requestAnimationFrame(function() {
        if (!activeTipBtn) return;
        if (!indicatorTooltipEl) return;
        var tipRect = indicatorTooltipEl.getBoundingClientRect();
        var padding = 8;
        var left = rect.left + rect.width / 2;
        if (tipRect.left < padding) left += (padding - tipRect.left);
        else if (tipRect.right > window.innerWidth - padding) left -= (tipRect.right - (window.innerWidth - padding));
        indicatorTooltipEl.style.left = left + 'px';
      });
    }

    function showTooltip(btn) {
      activeTipBtn = btn;
      if (!indicatorTooltipEl) return;
      indicatorTooltipEl.textContent = btn.getAttribute('data-label') || '';
      indicatorTooltipEl.classList.add('is-visible');
      indicatorTooltipEl.setAttribute('aria-hidden', 'false');
      indicatorTooltipEl.classList.toggle('on-dark-slide', indicatorEl.classList.contains('on-dark-slide'));
      positionTooltip();
    }

    function hideTooltip() {
      activeTipBtn = null;
      if (!indicatorTooltipEl) return;
      indicatorTooltipEl.classList.remove('is-visible');
      indicatorTooltipEl.setAttribute('aria-hidden', 'true');
    }

    indicatorBtns.forEach(function(btn) {
      btn.addEventListener('mouseenter', function() { showTooltip(btn); });
      btn.addEventListener('mouseleave', hideTooltip);
      btn.addEventListener('mousemove', function() { if (activeTipBtn === btn) positionTooltip(); });
      btn.addEventListener('focus', function() { showTooltip(btn); });
      btn.addEventListener('blur', hideTooltip);
    });

    list.addEventListener('scroll', function() {
      if (activeTipBtn) positionTooltip();
    }, { passive: true });
    window.addEventListener('resize', function() {
      if (activeTipBtn) positionTooltip();
    }, { passive: true });

    indicatorEl.addEventListener('click', function(e) {
      var btn = e.target.closest('button[data-index]');
      if (!btn) return;
      if (transitioning) return;
      e.preventDefault();
      e.stopPropagation();
      hideTooltip();
      var idx = parseInt(btn.getAttribute('data-index') || '0', 10);
      goToSlide(idx);
    });
  }

  function updateProgress() {
    if (progressEl) progressEl.textContent = (current + 1) + ' / ' + total;
    showHint();
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
    if (arrowsEl) {
      var activeSlide = slides[current];
      arrowsEl.classList.toggle('on-dark-slide', activeSlide && (activeSlide.classList.contains('section-dark') || activeSlide.classList.contains('cta-section')));
    }
    if (approachTitleEl) {
      var a = slides[current];
      var isApproach = !!(a && a.id && a.id.indexOf('approach') === 0);
      approachTitleEl.classList.toggle('is-visible', isApproach);
    }
    if (indicatorEl && indicatorBtns.length) {
      var active = slides[current];
      indicatorEl.classList.toggle('on-dark-slide', active && (active.classList.contains('section-dark') || active.classList.contains('cta-section')));
      if (indicatorTooltipEl) indicatorTooltipEl.classList.toggle('on-dark-slide', indicatorEl.classList.contains('on-dark-slide'));
      for (var i = 0; i < indicatorBtns.length; i++) {
        var isActive = i === current;
        indicatorBtns[i].classList.toggle('is-active', isActive);
        if (isActive) indicatorBtns[i].setAttribute('aria-current', 'step');
        else indicatorBtns[i].removeAttribute('aria-current');
      }
    }
  }

  function isApproachSlide(slide) {
    return !!(slide && slide.id && slide.id.indexOf('approach') === 0);
  }

  function getApproachPanel(slide) {
    if (!slide || !slide.querySelector) return null;
    return slide.querySelector('.approach-panel');
  }

  function clearPanelStyles(panel) {
    if (!panel || !panel.style) return;
    panel.style.transition = '';
    panel.style.transform = '';
    panel.style.opacity = '';
    panel.style.willChange = '';
  }

  // Custom exit animation: Approach framework image curves down (no fade).
  // Implemented as a "ghost" image appended to <body> so it's not affected by
  // the outgoing slide's opacity/transform stacking context.
  function computeApproachFrameworkArc(rect, viewportH) {
    var centerY = rect.top + rect.height / 2;
    var margin = rect.height / 2 + 160; // ensure fully off-screen
    var remainingDown = (viewportH - centerY);
    var remainingUp = centerY;

    // Radius large enough to go fully off top (enter) and bottom (exit),
    // with a slight preference for a wider arc.
    var base = Math.max(remainingDown + margin, remainingUp + margin, rect.width * 0.9);
    var radius = base * 1.45; // "increase radius" multiplier

    // Circle center is to the right of the image center, at the same height as the image center.
    // Expressed as transform-origin in element space.
    var originX = (rect.width / 2) + radius;
    var originY = rect.height / 2;

    return { radius: radius, originX: originX, originY: originY };
  }

  function spawnApproachFrameworkExitGhost(slide) {
    if (!slide || !slide.querySelector) return;
    if (!isApproachSlide(slide)) return;

    var img = slide.querySelector('.approach-step-visual img');
    if (!img || !img.getBoundingClientRect) return;

    var rect = img.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    // Longer than the slide transition on purpose (ghost continues briefly).
    var EXIT_DURATION = 1850;

    var prefersReduced = false;
    try {
      prefersReduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {}

    var ghost = img.cloneNode(true);
    ghost.setAttribute('aria-hidden', 'true');
    ghost.className = (ghost.className ? (ghost.className + ' ') : '') + 'approach-framework-exit-ghost';

    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.maxWidth = 'none';
    ghost.style.margin = '0';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '1';
    ghost.style.transform = 'translate3d(0,0,0)';
    ghost.style.transformOrigin = '50% 50%';
    ghost.style.willChange = 'transform, filter';
    ghost.style.backfaceVisibility = 'hidden';

    var baseFilter = '';
    try {
      baseFilter = window.getComputedStyle(img).filter || '';
      if (baseFilter === 'none') baseFilter = '';
    } catch (e2) {}
    ghost.style.filter = baseFilter || 'none';

    document.body.appendChild(ghost);

    // Hide the original so it doesn't fade/move with the slide.
    img.style.visibility = 'hidden';
    img.setAttribute('data-exit-hidden', '1');

    function cleanupGhost() {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }

    if (prefersReduced || !ghost.animate) {
      setTimeout(cleanupGhost, EXIT_DURATION + 30);
      return;
    }

    var viewportH = window.innerHeight || document.documentElement.clientHeight || 800;

    // True circular path:
    // - Circle center is at the image's current height (same Y as its center).
    // - Circle center is to the right of the image.
    // - We start at the "middle" of the arc (same Y as center), then rotate CCW to go down.
    var arc = computeApproachFrameworkArc(rect, viewportH);
    ghost.style.transformOrigin = arc.originX + 'px ' + arc.originY + 'px';

    function withBlur(px) {
      if (!px) return baseFilter || 'none';
      var blur = 'blur(' + px + 'px)';
      return baseFilter ? (baseFilter + ' ' + blur) : blur;
    }

    ghost.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg)', filter: withBlur(0) },
      { transform: 'translate3d(0,0,0) rotate(-35deg)', filter: withBlur(8) },
      { transform: 'translate3d(0,0,0) rotate(-68deg)', filter: withBlur(14) },
      { transform: 'translate3d(0,0,0) rotate(-90deg)', filter: withBlur(0) }
    ], {
      duration: EXIT_DURATION,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    setTimeout(cleanupGhost, EXIT_DURATION + 60);

    // Let caller know how long to delay the next slide entrance.
    return EXIT_DURATION;
  }

  // Custom enter animation: Approach framework image arcs in from top to center.
  function measureApproachStepVisualFinalRect(slide) {
    if (!slide || !slide.querySelector) return null;
    if (!isApproachSlide(slide)) return null;
    var panel = getApproachPanel(slide);
    var img = slide.querySelector('.approach-step-visual img');
    if (!img || !img.getBoundingClientRect) return null;

    if (!panel || !panel.style) return img.getBoundingClientRect();

    var prevTransition = panel.style.transition;
    var prevTransform = panel.style.transform;
    var prevOpacity = panel.style.opacity;

    // Temporarily put the panel in its final state (no transition) to measure
    // where the image should land, then restore.
    panel.style.transition = 'none';
    panel.style.transform = 'translateX(0px)';
    panel.style.opacity = '1';

    var rect = img.getBoundingClientRect();

    panel.style.transition = prevTransition;
    panel.style.transform = prevTransform;
    panel.style.opacity = prevOpacity;

    return rect;
  }

  function spawnApproachFrameworkEnterGhost(slide, rectOverride) {
    if (!slide || !slide.querySelector) return;
    if (!isApproachSlide(slide)) return;

    var img = slide.querySelector('.approach-step-visual img');
    if (!img || !img.getBoundingClientRect) return;

    var rect = rectOverride || img.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    var ENTER_DURATION = 1150;

    var prefersReduced = false;
    try {
      prefersReduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {}

    // If the image is already hidden by an exit effect, don't fight it.
    if (img.getAttribute('data-exit-hidden') === '1') return;

    var ghost = img.cloneNode(true);
    ghost.setAttribute('aria-hidden', 'true');
    ghost.className = (ghost.className ? (ghost.className + ' ') : '') + 'approach-framework-enter-ghost';

    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.maxWidth = 'none';
    ghost.style.margin = '0';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '1';
    ghost.style.transform = 'translate3d(0,0,0)';
    ghost.style.willChange = 'transform, filter';
    ghost.style.backfaceVisibility = 'hidden';

    var baseFilter = '';
    try {
      baseFilter = window.getComputedStyle(img).filter || '';
      if (baseFilter === 'none') baseFilter = '';
    } catch (e2) {}
    ghost.style.filter = baseFilter || 'none';

    var viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
    var arc = computeApproachFrameworkArc(rect, viewportH);
    ghost.style.transformOrigin = arc.originX + 'px ' + arc.originY + 'px';

    function withBlur(px) {
      if (!px) return baseFilter || 'none';
      var blur = 'blur(' + px + 'px)';
      return baseFilter ? (baseFilter + ' ' + blur) : blur;
    }

    document.body.appendChild(ghost);

    // Hide original until ghost lands, so we don't see a static duplicate.
    img.style.visibility = 'hidden';
    img.setAttribute('data-enter-hidden', '1');

    function cleanup() {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (img && img.getAttribute && img.getAttribute('data-enter-hidden') === '1') {
        img.style.visibility = '';
        img.removeAttribute('data-enter-hidden');
      }
    }

    if (prefersReduced || !ghost.animate) {
      cleanup();
      return;
    }

    // Start above (clockwise rotation), finish at center (0deg).
    ghost.animate([
      { transform: 'translate3d(0,0,0) rotate(90deg)', filter: withBlur(0) },
      { transform: 'translate3d(0,0,0) rotate(55deg)', filter: withBlur(14) },
      { transform: 'translate3d(0,0,0) rotate(20deg)', filter: withBlur(8) },
      { transform: 'translate3d(0,0,0) rotate(0deg)', filter: withBlur(0) }
    ], {
      duration: ENTER_DURATION,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    setTimeout(cleanup, ENTER_DURATION + 60);
  }

  function goToSlide(index) {
    if (index < 0 || index >= total || index === current || transitioning) return;
    transitioning = true;
    var prev = slides[current];
    var next = slides[index];
    var goingForward = index > current;

    function withExitDelay(run) {
      var delay = 0;
      try {
        delay = spawnApproachFrameworkExitGhost(prev) || 0;
      } catch (e) {
        delay = 0;
      }
      // Start the next slide slightly before the arc fully completes
      // to avoid a long "pause" where the slide feels empty.
      // Keep only a short beat so the exit motion reads, but the next slide appears fast.
      var wait = delay > 0 ? Math.min(250, delay) : 0;
      if (wait > 0) setTimeout(run, wait);
      else run();
    }

    // Special transition for the Approach sequence:
    // Keep the big "OUR APPROACH" title sticky, and only slide the pillar panel.
    if (isApproachSlide(prev) && isApproachSlide(next)) {
      withExitDelay(function() {
        var prevPanel = getApproachPanel(prev);
        var nextPanel = getApproachPanel(next);
        var dir = goingForward ? 1 : -1;
        var DIST = 56;

        // Ensure both slides are visible during the panel animation.
        prev.classList.add('active');
        next.classList.add('active');
        prev.style.zIndex = '1';
        next.style.zIndex = '2';

        // Make sure reveal elements are visible on the incoming slide.
        next.querySelectorAll('.reveal').forEach(function(r) { r.classList.add('revealed'); });

        if (nextPanel) {
          nextPanel.style.willChange = 'transform, opacity';
          nextPanel.style.transform = 'translateX(' + (dir * DIST) + 'px)';
          nextPanel.style.opacity = '0';
        }
        if (prevPanel) {
          prevPanel.style.willChange = 'transform, opacity';
          prevPanel.style.transform = 'translateX(0px)';
          prevPanel.style.opacity = '1';
        }

        // Enter arc should land at the panel's final position.
        var finalRect = measureApproachStepVisualFinalRect(next);
        spawnApproachFrameworkEnterGhost(next, finalRect);

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            if (nextPanel) nextPanel.style.transition = 'transform ' + DURATION + 'ms var(--ease-out), opacity ' + DURATION + 'ms var(--ease-out)';
            if (prevPanel) prevPanel.style.transition = 'transform ' + DURATION + 'ms var(--ease-out), opacity ' + DURATION + 'ms var(--ease-out)';
            if (nextPanel) {
              nextPanel.style.transform = 'translateX(0px)';
              nextPanel.style.opacity = '1';
            }
            if (prevPanel) {
              prevPanel.style.transform = 'translateX(' + (-dir * DIST) + 'px)';
              prevPanel.style.opacity = '0';
            }
          });
        });

        setTimeout(function() {
          // Hide the previous slide after the panel finishes animating.
          prev.classList.remove('active');
          prev.style.zIndex = '';
          next.style.zIndex = '';
          clearPanelStyles(prevPanel);
          clearPanelStyles(nextPanel);
          // Restore any elements we hid for exit effects (so back-navigation works).
          if (prev && prev.querySelectorAll) {
            prev.querySelectorAll('[data-exit-hidden="1"]').forEach(function(el) {
              el.style.visibility = '';
              el.removeAttribute('data-exit-hidden');
            });
          }
          current = index;
          updateProgress();
          transitioning = false;
        }, DURATION);
      });

      return;
    }

    withExitDelay(function() {
      prev.classList.add('leaving');
      prev.classList.remove('active');
      if (goingForward) {
        prev.style.transform = 'translateX(-12%)';
      } else {
        prev.style.transform = 'translateX(12%)';
      }

      next.classList.add('entering');
      next.style.transform = goingForward ? 'translateX(12%)' : 'translateX(-12%)';
      next.style.opacity = '0';
      next.style.zIndex = '2';

      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          next.classList.add('active');
          next.style.transform = 'translateX(0)';
          next.style.opacity = '1';
          next.querySelectorAll('.reveal').forEach(function(r) { r.classList.add('revealed'); });
          // Skip the arc-in when coming directly from the slide before Approach.
          // (Feels better to introduce the section without the special motion.)
          if (!(prev && prev.id === 'problem' && isApproachSlide(next))) {
            spawnApproachFrameworkEnterGhost(next);
          }
        });
      });

      setTimeout(function() {
        prev.classList.remove('leaving');
        prev.style.transform = '';
        // Restore any elements we hid for exit effects (so back-navigation works).
        if (prev && prev.querySelectorAll) {
          prev.querySelectorAll('[data-exit-hidden="1"]').forEach(function(el) {
            el.style.visibility = '';
            el.removeAttribute('data-exit-hidden');
          });
        }
        next.classList.remove('entering');
        next.style.transform = '';
        next.style.opacity = '';
        next.style.zIndex = '';
        current = index;
        updateProgress();
        transitioning = false;
      }, DURATION);
    });
  }

  function next() {
    if (current < total - 1) goToSlide(current + 1);
  }

  function prev() {
    if (current > 0) goToSlide(current - 1);
  }

  function goToById(id) {
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].id === id) {
        goToSlide(i);
        return;
      }
    }
  }

  deck.addEventListener('click', function(e) {
    if (transitioning) return;
    var goto = e.target.closest('.deck-goto');
    if (goto && goto.getAttribute('data-goto')) {
      e.preventDefault();
      goToById(goto.getAttribute('data-goto'));
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var id = (a.getAttribute('href') || '').slice(1);
      if (!id) return;
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].id === id) {
          e.preventDefault();
          goToById(id);
          break;
        }
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', function() { if (!transitioning) prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function() { if (!transitioning) next(); });

  var touchStartX = 0;
  deck.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });
  deck.addEventListener('touchend', function(e) {
    if (transitioning || !e.changedTouches || e.changedTouches.length !== 1) return;
    var delta = e.changedTouches[0].clientX - touchStartX;
    var minSwipe = 60;
    if (delta > minSwipe) prev();
    else if (delta < -minSwipe) next();
  }, { passive: true });

  // Mouse wheel / trackpad: advance slides when at top/bottom.
  // Allows normal scroll inside longer slides (e.g. Features) until you hit an edge.
  var wheelAccum = 0;
  var wheelLastTs = 0;
  function onDeckWheel(e) {
    if (transitioning) {
      e.preventDefault();
      return;
    }

    // Don't hijack scroll gestures over UI chrome (indicator/header).
    var t = e.target;
    if (t && t.closest) {
      if (t.closest('.deck-indicator') || t.closest('.site-header')) return;
    }

    var activeSlide = slides[current];
    if (!activeSlide) return;

    var deltaY = e.deltaY;
    // Normalize non-pixel wheel deltas (line/page modes).
    if (e.deltaMode === 1) deltaY *= 16;
    else if (e.deltaMode === 2) deltaY *= window.innerHeight;

    var canScroll = (activeSlide.scrollHeight - activeSlide.clientHeight) > 8;
    var atTop = activeSlide.scrollTop <= 2;
    var atBottom = (activeSlide.scrollTop + activeSlide.clientHeight) >= (activeSlide.scrollHeight - 2);

    // If the slide can scroll and we're not at an edge in the scroll direction, let it scroll normally.
    if (canScroll) {
      if (deltaY > 0 && !atBottom) return;
      if (deltaY < 0 && !atTop) return;
    }

    // Accumulate small deltas so touchpads don't accidentally advance slides.
    var now = Date.now();
    if (now - wheelLastTs > 260) wheelAccum = 0;
    wheelLastTs = now;
    wheelAccum += deltaY;

    // Prevent "dead" scroll (body is overflow-hidden in deck mode).
    e.preventDefault();

    var threshold = 80;
    if (Math.abs(wheelAccum) < threshold) return;

    if (wheelAccum > 0) next();
    else prev();
    wheelAccum = 0;
  }
  deck.addEventListener('wheel', onDeckWheel, { passive: false });

  document.addEventListener('keydown', function(e) {
    if (!deck.contains(document.activeElement) && document.body.classList.contains('pitch-deck-active')) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    }
  });

  // Initial state
  if (slides[0]) slides[0].classList.add('active');
  buildIndicator();
  updateProgress();

  // Apply form → mailto
  var form = document.getElementById('apply-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = new FormData(form);
      window.location.href = 'mailto:headcoach@academy.vn?subject=Head%20Coach%20Application&body=' +
        encodeURIComponent(
          'Name: ' + (data.get('name') || '') + '\n' +
          'Background: ' + (data.get('background') || '') + '\n' +
          'Profile: ' + (data.get('profile') || '')
        );
    });
  }
})();

