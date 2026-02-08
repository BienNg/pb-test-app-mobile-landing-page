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

  function goToSlide(index) {
    if (index < 0 || index >= total || index === current || transitioning) return;
    transitioning = true;
    var prev = slides[current];
    var next = slides[index];
    var goingForward = index > current;

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
      });
    });

    setTimeout(function() {
      prev.classList.remove('leaving');
      prev.style.transform = '';
      next.classList.remove('entering');
      next.style.transform = '';
      next.style.opacity = '';
      next.style.zIndex = '';
      current = index;
      updateProgress();
      transitioning = false;
    }, DURATION);
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

