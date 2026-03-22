/* ============================================================
   MYWEBSITE — Main JavaScript
   EmailJS + Particle Canvas + Animations
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   EMAILJS CONFIGURATION
   ─────────────────────────────────────────────────────────────
   Anleitung:
   1. Gehe zu https://www.emailjs.com und erstelle ein Konto (kostenlos)
   2. Erstelle einen "Email Service" (z.B. Gmail) → kopiere die Service-ID
   3. Erstelle ein "Email Template" mit diesen Variablen:
        {{from_email}}   → E-Mail des Absenders
        {{budget}}       → gewähltes Budget
        {{message}}      → Nachricht
        To Email:        mywebsite.kontakt@gmail.com
   4. Kopiere die Template-ID
   5. Gehe zu Account → API Keys → kopiere den Public Key
   6. Trage alles unten ein
   ──────────────────────────────────────────────────────────── */
const EMAILJS_CONFIG = {
  publicKey:   '_q0LSg9XyPe_lZyMA',
  serviceId:   'service_ve8sqlh',
  templateId:  'template_5q4t422',
};


/* ────────────────────────────────────────────────────────────
   1. AMBIENT PARTICLE / MESH BACKGROUND
   ──────────────────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  const CONFIG = {
    count: 110,
    maxDist: 150,
    speed: 0.32,
    baseColorA: '181,132,255',   // cool purple
    baseColorB: '123,77,255',    // deep purple
    lineOpacity: 0.1,
    dotOpacity: 0.28,
    dotRadius: 1.3,
  };

  // Mini pulsing ring nodes (extra visual layer)
  let rings = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: CONFIG.count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      // alternate color between light and mid purple
      color: Math.random() > 0.5 ? CONFIG.baseColorA : CONFIG.baseColorB,
    }));

    // Create 5 slow-pulsing ring nodes
    rings = Array.from({ length: 5 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0,
      maxR: 60 + Math.random() * 60,
      speed: 0.4 + Math.random() * 0.3,
      opacity: 0.12 + Math.random() * 0.08,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* —— Draw rings —— */
    rings.forEach(ring => {
      ring.r += ring.speed;
      if (ring.r > ring.maxR) ring.r = 0;
      const fade = 1 - ring.r / ring.maxR;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(124,77,255,${ring.opacity * fade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* —— Draw particles + connections —— */
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, CONFIG.dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${CONFIG.dotOpacity})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const alpha = CONFIG.lineOpacity * (1 - dist / CONFIG.maxDist);
          // gradient line from light to mid purple
          const grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
          grad.addColorStop(0, `rgba(192,132,255,${alpha})`);
          grad.addColorStop(1, `rgba(124,77,255,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => { resize(); createParticles(); });
})();


/* ────────────────────────────────────────────────────────────
   1b. IFRAME SCALE + BLOCK DETECTION
   ──────────────────────────────────────────────────────────── */
(function initIframePreview() {
  const frame   = document.getElementById('previewFrame');
  const wrap    = document.getElementById('iframeScaleWrap');
  const blocked = document.getElementById('iframeBlocked');
  const body    = wrap && wrap.closest('.browser-body');
  if (!frame || !wrap || !body) return;

  /* — Scale the wrapper so it fits the container width — */
  const DESIGN_WIDTH = 1440; // px the iframe "thinks" it is

  function applyScale() {
    const scale = body.clientWidth / DESIGN_WIDTH;
    wrap.style.transform = `scale(${scale})`;
    // Adjust the container height so the visible area looks proportional
    body.style.height = Math.round(520 / scale * scale) + 'px'; // stays 520px
  }

  applyScale();
  window.addEventListener('resize', applyScale, { passive: true });

  /* — Detect if the iframe was blocked by X-Frame-Options — */
  frame.addEventListener('error', () => {
    if (blocked) blocked.classList.add('visible');
  });

  setTimeout(() => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc || doc.body.innerHTML === '') {
        if (blocked) blocked.classList.add('visible');
      }
    } catch (e) {
      // Cross-origin throw = content loaded fine, do nothing
    }
  }, 4500);
})();


/* ────────────────────────────────────────────────────────────
   1c. BROWSER CHROME CONTROLS (Fullscreen + Reload)
   ──────────────────────────────────────────────────────────── */
(function initBrowserControls() {
  const btnFullscreen = document.getElementById('browserFullscreen');
  const btnClose      = document.getElementById('browserClose');
  const btnReload     = document.getElementById('browserReload');
  const frame         = document.getElementById('previewFrame');
  const wrap          = document.getElementById('iframeScaleWrap');
  const body          = wrap ? wrap.closest('.browser-body') : null;

  /* — Reload button — */
  if (btnReload && frame) {
    btnReload.addEventListener('click', () => {
      // Safely reload the iframe
      const currentSrc = frame.src;
      frame.src = 'about:blank';
      setTimeout(() => { frame.src = currentSrc; }, 10);
    });
  }

  /* — Scaling helper — */
  function updateIframeScale() {
    if (!wrap || !body) return;
    const DESIGN_WIDTH = 1440;
    const scale = body.clientWidth / DESIGN_WIDTH;
    wrap.style.transform = `scale(${scale})`;
  }

  /* — Fullscreen toggle — */
  function openFullscreen() {
    document.body.classList.add('browser-fullscreen');
    // Allow CSS transition/layout to happen then scale
    setTimeout(updateIframeScale, 50);
    window.addEventListener('resize', updateIframeScale);
    document.addEventListener('keydown', onEsc);
  }

  function closeFullscreen() {
    document.body.classList.remove('browser-fullscreen');
    setTimeout(updateIframeScale, 50);
    window.removeEventListener('resize', updateIframeScale);
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(e) {
    if (e.key === 'Escape') closeFullscreen();
  }

  /* Click backdrop (body::before) to close */
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('browser-fullscreen')) return;
    // If clicked exactly the body (which shows the backdrop) or outside the window
    const bw = document.querySelector('.browser-window');
    if (e.target === document.body || (bw && !bw.contains(e.target))) {
      closeFullscreen();
    }
  });

  if (btnFullscreen) btnFullscreen.addEventListener('click', openFullscreen);
  if (btnClose)      btnClose.addEventListener('click', closeFullscreen);

  /* — Interaction Safety — */
  const overlay = document.getElementById('browserOverlay');
  if (overlay && body) {
    overlay.addEventListener('click', () => {
      body.classList.add('active');
    });

    // Reset interaction if the user scrolls the main page away
    window.addEventListener('scroll', () => {
      if (body.classList.contains('active')) {
        body.classList.remove('active');
      }
    }, { passive: true });
  }

  // Manage body level scrolling class for UI
  let isScrolling;
  window.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    document.body.classList.add('is-scrolling');
    isScrolling = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
    }, 150);
  }, { passive: true });
})();


/* ────────────────────────────────────────────────────────────
   2. STICKY NAVBAR
   ──────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ────────────────────────────────────────────────────────────
   3. MOBILE MENU
   ──────────────────────────────────────────────────────────── */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
      document.body.style.overflow = '';
    });
  });
})();


/* ────────────────────────────────────────────────────────────
   4. SCROLL REVEAL
   ──────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/* ────────────────────────────────────────────────────────────
   5. HERO PARALLAX
   ──────────────────────────────────────────────────────────── */
(function initParallax() {
  const glow = document.querySelector('.hero-glow');
  if (!glow) return;
  window.addEventListener('scroll', () => {
    glow.style.transform = `translate(-50%, calc(-50% + ${window.scrollY * 0.22}px))`;
  }, { passive: true });
})();


/* ────────────────────────────────────────────────────────────
   6. TOAST NOTIFICATION
   ──────────────────────────────────────────────────────────── */
function showToast(message, icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C084FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.style.borderColor = isError
    ? 'rgba(255,80,80,0.4)'
    : 'rgba(192,132,255,0.4)';

  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 5500);
}


/* ────────────────────────────────────────────────────────────
   7. EMAILJS CONTACT FORM
   ──────────────────────────────────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Initialize EmailJS once SDK is loaded
  function initEmailJS() {
    if (window.emailjs && EMAILJS_CONFIG.publicKey !== 'DEIN_PUBLIC_KEY') {
      emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
      return true;
    }
    return false;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const budget = document.getElementById('budget').value;
    const message = document.getElementById('message').value.trim();

    // Basic validation
    if (!email || !budget || !message) {
      showToast('Bitte alle Felder ausfüllen.',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FEBC2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
          true);
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Bitte eine gültige E-Mail-Adresse eingeben.',
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FEBC2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        true);
      return;
    }

    const btn = form.querySelector('.form-submit');
    const orig = btn.innerHTML;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="animation:spin 0.8s linear infinite">
        <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M9 2a7 7 0 0 1 7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Wird gesendet…`;
    btn.disabled = true;

    const templateParams = {
      from_email: email,
      budget: budget,
      message: message,
      to_email: 'mywebsite.kontakt@gmail.com',
    };

    // Try EmailJS first
    const ejsReady = initEmailJS();

    if (ejsReady) {
      try {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          templateParams
        );
        onSuccess();
      } catch (err) {
        console.error('EmailJS Fehler:', err);
        fallbackMailto(email, budget, message);
        onSuccess('Anfrage vorbereitet — Ihr Standard-Mail-Programm öffnet sich.');
      }
    } else {
      // Fallback if EmailJS not yet configured
      fallbackMailto(email, budget, message);
      onSuccess();
    }

      function onSuccess(msg = 'Anfrage gesendet! Wir melden uns bald.') {
        btn.innerHTML = orig;
        btn.disabled  = false;
        form.reset();
        showToast(msg, '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C084FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>');
      }
  });

  function fallbackMailto(email, budget, message) {
    const subject = encodeURIComponent(`Website-Anfrage von ${email} — Budget: ${budget}`);
    const body = encodeURIComponent(
      `Von: ${email}\nBudget: ${budget}\n\nNachricht:\n${message}`
    );
    window.location.href =
      `mailto:mywebsite.kontakt@gmail.com?subject=${subject}&body=${body}`;
  }
})();

/* CSS spin keyframe for loading spinner */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);


/* ────────────────────────────────────────────────────────────
   8. ACTIVE NAV LINK HIGHLIGHT
   ──────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────
   9. SLIDING NAV INDICATOR (Liquid Glass Slider)
   ───────────────────────────────────────────────────────────── */
(function initNavIndicator() {
  const navContainer = document.querySelector('.nav-links');
  const links = navContainer ? navContainer.querySelectorAll('a') : [];
  const indicator = document.getElementById('navIndicator');
  const sections = document.querySelectorAll('section[id]');
  
  if (!navContainer || !indicator) return;

  function move(el, immediate = false) {
    if (!el) {
      indicator.style.opacity = '0';
      return;
    }
    const rect = el.getBoundingClientRect();
    const parentRect = navContainer.getBoundingClientRect();
    
    if (immediate) indicator.style.transition = 'none';
    indicator.style.width = `${rect.width}px`;
    indicator.style.left = `${rect.left - parentRect.left}px`;
    indicator.style.top = `${rect.top - parentRect.top}px`;
    indicator.style.height = `${rect.height}px`;
    indicator.style.opacity = '1';
    
    if (immediate) {
      // Force reflow
      indicator.offsetHeight; 
      indicator.style.transition = '';
    }
  }

  // Find the currently "effective" active link (page or scroll)
  function getActiveLink() {
    // 1. Check if we are on About page
    if (window.location.pathname.includes('about.html')) {
       return Array.from(links).find(l => l.getAttribute('href').includes('about.html'));
    }
    // 2. Check scroll sections
    const scrollPos = window.scrollY + 200;
    let current = null;
    sections.forEach(s => {
      if (scrollPos >= s.offsetTop && scrollPos < s.offsetTop + s.offsetHeight) {
        current = s.id;
      }
    });
    if (current) {
      return Array.from(links).find(l => l.getAttribute('href').endsWith(`#${current}`));
    }
    return null;
  }

  function updateActive() {
    const activeLink = getActiveLink();
    links.forEach(l => l.classList.toggle('active', l === activeLink));
    // When not hovering, the indicator stays on the active link
    if (!navContainer.matches(':hover')) {
      move(activeLink);
    }
  }

  // Hover effects
  links.forEach(link => {
    link.addEventListener('mouseenter', () => move(link));
  });

  navContainer.addEventListener('mouseleave', () => {
    move(getActiveLink());
  });

  // Scroll & Resize events
  window.addEventListener('scroll', () => {
    const active = getActiveLink();
    links.forEach(l => l.classList.toggle('active', l === active));
    if (!navContainer.matches(':hover')) move(active);
  });
  
  window.addEventListener('resize', () => move(getActiveLink()));

  // Initial position
  setTimeout(() => move(getActiveLink(), true), 100);
})();


/* ────────────────────────────────────────────────────────────
   11. MOUSE GLOW SPOTLIGHT
   ───────────────────────────────────────────────────────────── */
(function initMouseGlow() {
  const glow = document.getElementById('mouseGlow');
  if (!glow) return;

  // Track if mouse is moving to show/hide
  window.addEventListener('mousemove', (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    if (getComputedStyle(glow).opacity === '0') {
      glow.style.opacity = '1';
    }
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
  
  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
  });
})();


/* ────────────────────────────────────────────────────────────
   9. SOLUTION TOGGLE LOGIC
   ──────────────────────────────────────────────────────────── */
(function initSolutionToggle() {
  const toggle = document.getElementById('solutionToggle');
  const manualSet = document.getElementById('manual-set');
  const autopilotSet = document.getElementById('autopilot-set');
  const labelManual = document.getElementById('label-manual');
  const labelAutopilot = document.getElementById('label-autopilot');

  if (!toggle || !manualSet || !autopilotSet) return;

  function updateDisplay(isManualTrigger = false) {
    const isAutopilot = toggle.checked;
    const section = document.getElementById('features');

    if (isAutopilot) {
      manualSet.classList.add('solution-set-hidden');
      autopilotSet.classList.remove('solution-set-hidden');
      labelAutopilot.classList.add('active');
      labelManual.classList.remove('active');
      if (section) {
        section.classList.remove('state-manual');
        section.classList.add('state-autopilot');
      }
      
      // Trigger minimalist full-page confetti
      if (isManualTrigger) {
        triggerConfetti();
      }
      
    } else {
      manualSet.classList.remove('solution-set-hidden');
      autopilotSet.classList.add('solution-set-hidden');
      labelAutopilot.classList.remove('active');
      labelManual.classList.add('active');
      if (section) {
        section.classList.add('state-manual');
        section.classList.remove('state-autopilot');
      }
    }
  }

  toggle.addEventListener('change', () => updateDisplay(true));
  updateDisplay(false); // Initial state (no confetti)
})();

/* ────────────────────────────────────────────────────────────
   10. MINIMALIST CONFETTI EFFECT
   ───────────────────────────────────────────────────────────── */
function triggerConfetti() {
  const count = 35; // Minimalist but spread out
  const colors = ['#C084FF', '#7C4DFF', '#E0E0E0'];
  
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece-full';
    
    // Random horizontal start, slight variation in top
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.top = (Math.random() * -20) + 'vh';
    
    // Physics & Appearance
    piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 300}px`);
    piece.style.setProperty('--dr', `${360 + Math.random() * 720}deg`);
    
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    // Randomize speed for natural feel
    const duration = 1.3 + Math.random() * 0.7;
    piece.style.animation = `confetti-fall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
    
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), duration * 1000 + 100);
  }
}

/* ────────────────────────────────────────────────────────────
   12. HERO MOCKUP TILT EFFECT
   ───────────────────────────────────────────────────────────── */
(function initMockupTilt() {
  const mockup = document.getElementById('heroMockup');
  if (!mockup) return;

  const wrapper = mockup.parentElement;
  const maxRotation = 26; // Increased rotation for visible impact

  function handleMove(e) {
    const rect = mockup.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage from center (-0.5 to 0.5)
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    
    // Calculate rotation: 
    const rotateY = px * maxRotation; 
    const rotateX = -py * maxRotation; // Invert X for natural tilt
    
    mockup.style.setProperty('--tilt-x', `${rotateX}deg`);
    mockup.style.setProperty('--tilt-y', `${rotateY}deg`);
  }

  function handleReset() {
    mockup.style.setProperty('--tilt-x', '0deg');
    mockup.style.setProperty('--tilt-y', '0deg');
  }

  // Use wrapper for wider hit area if needed, but mockup itself is fine
  wrapper.addEventListener('mousemove', handleMove);
  wrapper.addEventListener('mouseleave', handleReset);
})();
