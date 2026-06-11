// 1. SCROLL PROGRESS BAR (anime.js animatable)
    // ========================================
    var scrollProgressBar = document.getElementById('scrollProgress');
    var scrollProgressAnimatable = anime.createAnimatable(scrollProgressBar, {
      width: { unit: '%' },
      duration: 150
    });
    window.addEventListener('scroll', function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgressAnimatable.width(progress);
    });

    // NAV HIDE/SHOW ON SCROLL DIRECTION
    // ========================================
    var navEl = document.querySelector('.nav');
    var lastScrollY = 0;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var currentY = window.pageYOffset || document.documentElement.scrollTop;
          if (currentY > lastScrollY && currentY > 100) {
            navEl.classList.add('nav-hidden');
          } else {
            navEl.classList.remove('nav-hidden');
          }
          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    });
// 2. CURSOR FOLLOWER GLOW
    // ========================================
    var cursorGlow = document.getElementById('cursorGlow');
    var cursorAnimatable = anime.createAnimatable(cursorGlow, {
      x: 0,
      y: 0,
      duration: 400
    });
    var cursorVisible = false;

    document.addEventListener('mousemove', function(e) {
      if (!cursorVisible) {
        cursorVisible = true;
        anime.animate(cursorGlow, { opacity: 1, duration: 300 });
      }
      cursorAnimatable.x(e.clientX);
      cursorAnimatable.y(e.clientY);
    });

    document.addEventListener('mouseleave', function() {
      cursorVisible = false;
      anime.animate(cursorGlow, { opacity: 0, duration: 300 });
    });

    // ========================================
    // 3. MAGNETIC BUTTONS
    // ========================================
    document.querySelectorAll('.magnetic').forEach(function(el) {
      el.addEventListener('mousemove', function(e) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * 0.3;
        var dy = (e.clientY - cy) * 0.3;
        anime.animate(el, {
          translateX: dx,
          translateY: dy,
          duration: 200,
          ease: 'outQuad'
        });
      });
      el.addEventListener('mouseleave', function() {
        anime.animate(el, {
          translateX: 0,
          translateY: 0,
          duration: 400,
          ease: 'outElastic(1, 0.5)'
        });
      });
    });

    // ========================================
    // 4. LOADER WITH SCRAMBLE TEXT
    // ========================================
    var loaderEl = document.getElementById('loaderText');
    'STILL'.split('').forEach(function(ch) {
      var span = document.createElement('span');
      span.textContent = ch;
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(40px)';
      span.style.opacity = '0';
      loaderEl.appendChild(span);
    });

    var loaderSpans = loaderEl.querySelectorAll('span');
    var loaderTl = anime.createTimeline({
      onComplete: function() {
        anime.animate('#loader', {
          opacity: 0,
          duration: 500,
          ease: 'outQuad',
          onComplete: function() {
            document.getElementById('loader').style.display = 'none';
            initAnimations();
          }
        });
      }
    });

    loaderTl
      .add(loaderSpans, {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80),
        ease: 'outQuad'
      })
      .add('#loaderFill', {
        width: '100%',
        duration: 1200,
        ease: 'inOutQuad'
      }, '-=200')
      .add(loaderSpans, {
        translateY: -40,
        opacity: 0,
        duration: 400,
        delay: anime.stagger(50)
      }, '+=300');

    // ========================================
    // MARQUEE (anime.js driven)
    // ========================================
    (function() {
      var inner = document.getElementById('marqueeInner');
      var words = ['Photography', '-', 'Design', '-', 'Art Direction', '-', 'Visual Culture'];
      for (var c = 0; c < 4; c++) {
        var copy = document.createElement('div');
        copy.className = 'marquee-copy';
        for (var w = 0; w < words.length; w++) {
          var s = document.createElement('span');
          s.className = 'marquee-item';
          s.textContent = words[w];
          copy.appendChild(s);
        }
        inner.appendChild(copy);
      }
      requestAnimationFrame(function() {
        var oneCopy = inner.querySelector('.marquee-copy');
        var copyW = oneCopy.offsetWidth;
        anime.animate(inner, {
          translateX: [0, -copyW],
          duration: copyW * 16,
          ease: 'linear',
          loop: true
        });
      });
    })();
// 5. SCROLL REVEAL (IntersectionObserver)
    // ========================================
    function createScrollReveal(selector, opts) {
      var elements = document.querySelectorAll(selector);
      if (!elements.length) return;

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            anime.animate(entry.target, {
              opacity: [0, 1],
              translateY: [opts.y || 40, 0],
              duration: opts.duration || 800,
              delay: opts.delay ? opts.delay(entry.target) : 0,
              ease: 'outQuad'
            });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: opts.threshold || 0.15 });

      elements.forEach(function(el) {
        el.style.opacity = '0';
        observer.observe(el);
      });
    }

    // FLOATING 3D SHOWCASE ANIMATIONS — called after cards are created
    // ========================================
    window._float3dAnimInit = false;
    window.initFloat3DAnimations = function() {
      if (window._float3dAnimInit) return;
      var float3dSection = document.getElementById('float3d');
      var float3dCards = document.querySelectorAll('.float3d-card');
      var float3dStage = document.getElementById('float3dStage');
      if (!float3dCards.length || !float3dStage) return;
      window._float3dAnimInit = true;

      // Explosive entrance from center
      var entranceDone = false;
      var entranceObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !entranceDone) {
            entranceDone = true;
            entranceObs.unobserve(entry.target);

            // Set initial scattered state
            float3dCards.forEach(function(card) {
              card.style.opacity = '0';
              card.style.transform = 'translateZ(-400px) rotateX(25deg) rotateY(-25deg) scale(0.2)';
            });

            // Animate each card from center explosion to its resting position
            float3dCards.forEach(function(card, i) {
              var baseRY = card._baseRY || 0;
              var baseRX = card._baseRX || 0;
              var baseZ = card._baseZ || 0;

              anime.animate(card, {
                opacity: { from: 0, to: 1 },
                translateZ: { from: -400, to: baseZ },
                rotateX: { from: 25, to: baseRX },
                rotateY: { from: -25, to: baseRY },
                rotateZ: { from: 0, to: 0 },
                scale: { from: 0.2, to: 1 },
                duration: 1400,
                delay: 200 + i * 100,
                ease: 'outCubic',
                onComplete: function() {
                  if (i === float3dCards.length - 1) startFloatLoop();
                }
              });
            });
          }
        });
      }, { threshold: 0.15 });
      entranceObs.observe(float3dStage);

      // Mouse tracking (normalized -1 to 1)
      var f3dMX = 0, f3dMY = 0;
      var f3dTargetMX = 0, f3dTargetMY = 0;
      document.addEventListener('mousemove', function(e) {
        f3dTargetMX = (e.clientX / window.innerWidth - 0.5) * 2;
        f3dTargetMY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      // Hover lift + drag
      var dragCard = null, dragStartX = 0, dragStartY = 0, dragMoved = false;
      float3dCards.forEach(function(card) {
        card._dragX = 0;
        card._dragY = 0;
        card.addEventListener('mouseenter', function() {
          card._hovered = true;
          if (!dragCard) card.style.cursor = 'grab';
        });
        card.addEventListener('mouseleave', function() {
          card._hovered = false;
          if (!dragCard) card.style.cursor = 'pointer';
        });
        card.addEventListener('mousedown', function(e) {
          e.preventDefault();
          e.stopPropagation();
          dragCard = card;
          dragStartX = e.clientX - card._dragX;
          dragStartY = e.clientY - card._dragY;
          dragMoved = false;
          card.style.cursor = 'grabbing';
          card._hovered = true;
          card._dragging = true;
        });
      });
      document.addEventListener('mousemove', function(e) {
        if (!dragCard) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
        dragCard._dragX = dx;
        dragCard._dragY = dy;
      });
      document.addEventListener('mouseup', function() {
        if (!dragCard) return;
        dragCard._dragging = false;
        dragCard.style.cursor = 'grab';
        if (dragMoved) {
          var c = dragCard;
          c._justDragged = true;
          setTimeout(function() { c._justDragged = false; }, 100);
        }
        dragCard = null;
      });

      var floatLoopRaf = null;
      var floatLoopStart = 0;

      function startFloatLoop() {
        floatLoopStart = performance.now();
        floatLoopRaf = requestAnimationFrame(floatLoopTick);
      }

      function floatLoopTick(now) {
        var t = (now - floatLoopStart) / 1000;

        f3dMX += (f3dTargetMX - f3dMX) * 0.06;
        f3dMY += (f3dTargetMY - f3dMY) * 0.06;

        float3dStage.style.transform =
          'rotateY(' + (f3dMX * 12) + 'deg) ' +
          'rotateX(' + (f3dMY * -8) + 'deg)';

        float3dCards.forEach(function(card) {
          var phase = card._phase || 0;
          var baseRY = card._baseRY || 0;
          var baseRX = card._baseRX || 0;
          var baseZ = card._baseZ || 0;

          var floatY = Math.sin(t * 0.9 + phase) * 18;
          var floatX = Math.cos(t * 0.6 + phase * 0.7) * 5;
          var rz = Math.sin(t * 0.5 + phase) * 2;

          var depthFactor = baseZ / 200;
          var px = f3dMX * 30 * depthFactor;
          var py = f3dMY * 20 * depthFactor;

          var hoverScale = card._hovered ? 1.15 : 1;
          var hoverZ = card._hovered ? 120 : 0;

          var dx = card._dragX || 0;
          var dy = card._dragY || 0;

          card.style.transform =
            'translate3d(' + (floatX + px + dx) + 'px, ' + (floatY + py + dy) + 'px, ' + (baseZ + hoverZ + (card._dragging ? 80 : 0)) + 'px) ' +
            'rotateX(' + (baseRX + (card._dragging ? -dy * 0.05 : 0)) + 'deg) ' +
            'rotateY(' + (baseRY + (card._dragging ? dx * 0.05 : 0)) + 'deg) ' +
            'rotateZ(' + rz + 'deg) ' +
            'scale(' + (card._dragging ? 1.1 : hoverScale) + ')';

          var shine = card.querySelector('.float3d-shine');
          if (shine) {
            var sx = ((f3dTargetMX + 1) / 2) * 100;
            var sy = ((f3dTargetMY + 1) / 2) * 100;
            shine.style.setProperty('--shine-x', sx + '%');
            shine.style.setProperty('--shine-y', sy + '%');
          }
        });

        floatLoopRaf = requestAnimationFrame(floatLoopTick);
      }

      // Pause when out of view
      var perfObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            if (!floatLoopRaf && entranceDone) { floatLoopStart = performance.now(); floatLoopRaf = requestAnimationFrame(floatLoopTick); }
          } else {
            if (floatLoopRaf) { cancelAnimationFrame(floatLoopRaf); floatLoopRaf = null; }
          }
        });
      }, { threshold: 0 });
      perfObs.observe(float3dSection);
    };

// INIT ANIMATIONS
    // ========================================
    function initAnimations() {
      // Hero entrance - scramble title reveal (pre-built spans, no innerHTML)
      var heroTitle = document.getElementById('heroTitle');
      var line1 = 'Captured';
      var line2 = 'Moments';
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      var total = line1.length + line2.length;

      // Pre-build character spans
      heroTitle.innerHTML = '';
      var spans = [];
      for (var i = 0; i < line1.length; i++) {
        var s = document.createElement('span');
        s.textContent = chars[Math.random() * chars.length | 0];
        s.style.display = 'inline-block';
        s.style.willChange = 'transform';
        heroTitle.appendChild(s);
        spans.push(s);
      }
      var br = document.createElement('br');
      heroTitle.appendChild(br);
      var em = document.createElement('em');
      for (var j = 0; j < line2.length; j++) {
        var s2 = document.createElement('span');
        s2.textContent = chars[Math.random() * chars.length | 0];
        s2.style.display = 'inline-block';
        s2.style.willChange = 'transform';
        em.appendChild(s2);
        spans.push(s2);
      }
      heroTitle.appendChild(em);

      // Scramble animation - only updates textContent, no DOM rebuild
      var t = { v: 0 };
      var tick = 0;
      var revealed = {};

      anime.animate(t, {
        v: 1,
        duration: 3000,
        delay: 200,
        ease: 'outQuad',
        onUpdate: function() {
          tick++;
          var n = Math.floor(t.v * total);
          for (var k = 0; k < spans.length; k++) {
            if (k < n) {
              // Revealed - show real char
              var ch = k < line1.length ? line1[k] : line2[k - line1.length];
              if (!revealed[k]) {
                revealed[k] = true;
                spans[k].textContent = ch;
              }
            } else if (tick % 8 === 0) {
              // Scramble - change every 8 frames
              spans[k].textContent = chars[Math.random() * chars.length | 0];
            }
          }
        }
      });

      anime.animate('.hero-eyebrow', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        ease: 'outQuad'
      });
      anime.animate('.hero-sub', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: 800,
        ease: 'outQuad'
      });
      anime.animate('.hero-scroll', {
        opacity: [0, 1],
        duration: 600,
        delay: 800,
        ease: 'outQuad'
      });

      // Hero parallax on scroll (anime.js animatable for smooth interpolation)
      var heroEl = document.querySelector('.hero');
      var heroContentEl = document.querySelector('.hero-content');
      var heroAnimatable = anime.createAnimatable(heroContentEl, {
        translateY: { unit: 'px' },
        opacity: {},
        duration: 300
      });
      window.addEventListener('scroll', function() {
        var rect = heroEl.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, -rect.top / rect.height));
        heroAnimatable.translateY(-80 * progress);
        heroAnimatable.opacity(1 - progress);
      });

      // Cube rotation
      anime.animate('#cube', {
        rotate: 360,
        duration: 20000,
        loop: true,
        ease: 'linear'
      });

      // HERO CANVAS — orbital rings, radial lines, flowing curves
      // ========================================
      (function() {
        var hc = document.getElementById('heroCanvas');
        if (!hc) return;
        var hctx = hc.getContext('2d');
        var hw, hh;

        function hResize() {
          var hero = document.querySelector('.hero');
          hw = hc.width = hero.offsetWidth;
          hh = hc.height = hero.offsetHeight;
        }
        hResize();
        window.addEventListener('resize', hResize);

        var hMouseX = 0.5, hMouseY = 0.5;
        document.addEventListener('mousemove', function(e) {
          hMouseX = e.clientX / window.innerWidth;
          hMouseY = e.clientY / window.innerHeight;
        });

        // Orbital rings config
        var orbits = [
          { rx: 180, ry: 130, speed: 0.18, phase: 0, alpha: 0.05, dashes: 10 },
          { rx: 240, ry: 175, speed: -0.12, phase: 0.8, alpha: 0.045, dashes: 14 },
          { rx: 300, ry: 220, speed: 0.09, phase: 1.6, alpha: 0.035, dashes: 18 },
          { rx: 360, ry: 265, speed: -0.07, phase: 2.4, alpha: 0.025, dashes: 22 },
          { rx: 140, ry: 100, speed: -0.22, phase: 0.4, alpha: 0.055, dashes: 8 },
          { rx: 420, ry: 310, speed: 0.06, phase: 3.2, alpha: 0.02, dashes: 28 }
        ];

        // Radial lines config
        var radialCount = 36;
        var radialLines = [];
        for (var ri = 0; ri < radialCount; ri++) {
          radialLines.push({
            angle: (Math.PI * 2 / radialCount) * ri,
            innerR: 180 + Math.random() * 40,
            outerR: 350 + Math.random() * 150,
            alpha: 0.02 + Math.random() * 0.03,
            speed: 0.2 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2
          });
        }

        // Floating dots
        var heroDots = [];
        for (var hd = 0; hd < 40; hd++) {
          var dAngle = Math.random() * Math.PI * 2;
          var dDist = 200 + Math.random() * 300;
          heroDots.push({
            angle: dAngle,
            dist: dDist,
            baseDist: dDist,
            speed: 0.1 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
            r: 1 + Math.random() * 1.5,
            alpha: 0.15 + Math.random() * 0.2,
            bobAmp: 10 + Math.random() * 20,
            bobSpeed: 0.3 + Math.random() * 0.5
          });
        }

        // Flowing curves config
        var curves = [];
        for (var fc = 0; fc < 10; fc++) {
          curves.push({
            startAngle: (Math.PI * 2 / 6) * fc,
            radius: 250 + Math.random() * 100,
            sweep: 0.4 + Math.random() * 0.6,
            speed: 0.2 + Math.random() * 0.3,
            alpha: 0.04 + Math.random() * 0.03,
            phase: Math.random() * Math.PI * 2
          });
        }

        var hRaf = null;
        var hStart = performance.now();

        function heroDraw(now) {
          var t = (now - hStart) / 1000;
          hctx.clearRect(0, 0, hw, hh);
          var cx = hw / 2;
          var cy = hh / 2;

          // Mouse influence on center offset
          var mx = (hMouseX - 0.5) * 20;
          var my = (hMouseY - 0.5) * 15;

          // Orbital rings
          for (var oi = 0; oi < orbits.length; oi++) {
            var o = orbits[oi];
            var oAngle = t * o.speed + o.phase;
            hctx.save();
            hctx.translate(cx + mx, cy + my);
            hctx.rotate(0.15 * Math.sin(t * 0.3 + oi)); // subtle tilt
            hctx.beginPath();
            hctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
            hctx.strokeStyle = 'rgba(201,169,110,' + o.alpha + ')';
            hctx.lineWidth = 0.8;
            hctx.setLineDash([4, 8]);
            hctx.lineDashOffset = t * 30 * (oi % 2 ? 1 : -1);
            hctx.stroke();
            hctx.setLineDash([]);

            // Orbiting dot on each ring
            var dotX = Math.cos(oAngle) * o.rx;
            var dotY = Math.sin(oAngle) * o.ry;
            hctx.beginPath();
            hctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            hctx.fillStyle = 'rgba(201,169,110,' + (o.alpha * 3) + ')';
            hctx.fill();
            hctx.restore();
          }

          // Radial lines
          for (var rli = 0; rli < radialLines.length; rli++) {
            var rl = radialLines[rli];
            var rAngle = rl.angle + t * 0.05; // very slow rotation
            var pulse = 0.6 + 0.4 * Math.sin(t * rl.speed + rl.phase);
            var x1 = cx + mx + Math.cos(rAngle) * rl.innerR;
            var y1 = cy + my + Math.sin(rAngle) * rl.innerR;
            var x2 = cx + mx + Math.cos(rAngle) * rl.outerR;
            var y2 = cy + my + Math.sin(rAngle) * rl.outerR;

            hctx.beginPath();
            hctx.moveTo(x1, y1);
            hctx.lineTo(x2, y2);
            hctx.strokeStyle = 'rgba(201,169,110,' + (rl.alpha * pulse) + ')';
            hctx.lineWidth = 0.5;
            hctx.stroke();
          }

          // Flowing curves
          for (var fci = 0; fci < curves.length; fci++) {
            var fc2 = curves[fci];
            var cAngle = fc2.startAngle + t * 0.08;
            var cR = fc2.radius + Math.sin(t * 0.5 + fc2.phase) * 30;
            var sa = cAngle;
            var ea = cAngle + fc2.sweep;
            hctx.beginPath();
            hctx.arc(cx + mx, cy + my, cR, sa, ea);
            hctx.strokeStyle = 'rgba(201,169,110,' + fc2.alpha + ')';
            hctx.lineWidth = 1;
            hctx.stroke();
          }

          // Floating dots
          for (var hdi = 0; hdi < heroDots.length; hdi++) {
            var hd2 = heroDots[hdi];
            hd2.angle += hd2.speed * 0.008;
            hd2.dist = hd2.baseDist + Math.sin(t * hd2.bobSpeed + hd2.phase) * hd2.bobAmp;
            var dx = cx + mx + Math.cos(hd2.angle) * hd2.dist;
            var dy = cy + my + Math.sin(hd2.angle) * hd2.dist;
            var dAlpha = hd2.alpha * (0.6 + 0.4 * Math.sin(t * 1.5 + hd2.phase));

            hctx.beginPath();
            hctx.arc(dx, dy, hd2.r, 0, Math.PI * 2);
            hctx.fillStyle = 'rgba(201,169,110,' + dAlpha + ')';
            hctx.fill();
          }

          // Center clear zone — mask out text area with radial gradient
          var maskGrad = hctx.createRadialGradient(cx + mx, cy + my, 0, cx + mx, cy + my, 220);
          maskGrad.addColorStop(0, 'rgba(8,8,8,0.7)');
          maskGrad.addColorStop(0.6, 'rgba(8,8,8,0.3)');
          maskGrad.addColorStop(1, 'rgba(8,8,8,0)');
          hctx.fillStyle = maskGrad;
          hctx.fillRect(0, 0, hw, hh);

          hRaf = requestAnimationFrame(heroDraw);
        }

        // Start when loader finishes (initAnimations is called after loader)
        hRaf = requestAnimationFrame(heroDraw);
      })();

      // Featured scroll reveal
      createScrollReveal('.feat-item', {
        y: 50,
        duration: 1000,
        threshold: 0.15,
        delay: function(el) {
          var idx = Array.from(el.parentElement.children).indexOf(el);
          return idx * 200;
        }
      });

      // Horizontal track parallax (archive) — anime.js animatable
      var hSection = document.querySelector('#work');
      var hTrackEl = document.getElementById('hTrack');
      if (hSection && hTrackEl) {
        var hTrackAnim = anime.createAnimatable(hTrackEl, {
          translateX: { unit: 'px' },
          duration: 400
        });
        window.addEventListener('scroll', function() {
          var rect = hSection.getBoundingClientRect();
          var viewH = window.innerHeight;
          var progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));
          hTrackAnim.translateX(-150 * progress);
        });
      }

      // Writing track parallax — anime.js animatable
      var writingSection = document.querySelector('#writing');
      var writingTrack = document.getElementById('writingTrack');
      if (writingSection && writingTrack) {
        var writeTrackAnim = anime.createAnimatable(writingTrack, {
          translateX: { unit: 'px' },
          duration: 400
        });
        window.addEventListener('scroll', function() {
          var rect = writingSection.getBoundingClientRect();
          var viewH = window.innerHeight;
          var progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));
          writeTrackAnim.translateX(-100 * progress);
        });
      }

      // Masonry scroll reveal
      createScrollReveal('.m-item', {
        y: 40,
        duration: 800,
        threshold: 0.1,
        delay: function(el) {
          var idx = Array.from(el.parentElement.children).indexOf(el);
          return (idx % 3) * 100;
        }
      });

      // Masonry title reveal
      createScrollReveal('.masonry-title', {
        y: 30,
        duration: 800,
        threshold: 0.15
      });

      // Footer reveal
      createScrollReveal('footer', {
        y: 20,
        duration: 600,
        threshold: 0.3
      });

      // FLOATING 3D SHOWCASE — Immersive
      // ========================================
      var float3dSection = document.getElementById('float3d');
      if (float3dSection) {
        createScrollReveal('.float3d-header', { y: 40, duration: 1000, threshold: 0.1 });

        // Ambient particles canvas
        (function() {
          var cvs = document.getElementById('float3dParticles');
          if (!cvs) return;
          var ctx = cvs.getContext('2d');
          var pts = [];
          var PT_COUNT = 60;

          function resize() {
            var rect = float3dSection.getBoundingClientRect();
            cvs.width = rect.width;
            cvs.height = rect.height;
          }
          resize();
          window.addEventListener('resize', resize);

          for (var i = 0; i < PT_COUNT; i++) {
            pts.push({
              x: Math.random() * cvs.width,
              y: Math.random() * cvs.height,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -Math.random() * 0.4 - 0.1,
              size: Math.random() * 2 + 0.5,
              alpha: Math.random() * 0.4 + 0.1,
              phase: Math.random() * Math.PI * 2
            });
          }

          var ptRaf = null;
          var ptStart = performance.now();
          function drawPts(now) {
            var elapsed = (now - ptStart) / 1000;
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            pts.forEach(function(p) {
              p.x += p.vx + Math.sin(elapsed * 0.5 + p.phase) * 0.2;
              p.y += p.vy;
              if (p.y < -10) { p.y = cvs.height + 10; p.x = Math.random() * cvs.width; }
              if (p.x < -10) p.x = cvs.width + 10;
              if (p.x > cvs.width + 10) p.x = -10;
              var flicker = 0.7 + 0.3 * Math.sin(elapsed * 2 + p.phase);
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(201,169,110,' + (p.alpha * flicker) + ')';
              ctx.fill();
            });
            ptRaf = requestAnimationFrame(drawPts);
          }

          var ptVis = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                if (!ptRaf) { ptStart = performance.now(); ptRaf = requestAnimationFrame(drawPts); }
              } else {
                if (ptRaf) { cancelAnimationFrame(ptRaf); ptRaf = null; }
              }
            });
          }, { threshold: 0 });
          ptVis.observe(float3dSection);
        })();

        // 3D scene — will be initialized when cards are ready (see window.initFloat3DAnimations)
      }

      // FEATURED 3D TILT ON HOVER
      // ========================================
      document.querySelectorAll('.feat-item').forEach(function(item) {
        var img = item.querySelector('img');
        var info = item.querySelector('.feat-info');
        item.addEventListener('mousemove', function(e) {
          var rect = item.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          anime.animate(item, {
            rotateY: x * 8,
            rotateX: y * -8,
            duration: 400,
            ease: 'outQuad'
          });
          if (img) {
            anime.animate(img, {
              translateX: x * -20,
              translateY: y * -20,
              scale: 1.05,
              duration: 600,
              ease: 'outQuad'
            });
          }
        });
        item.addEventListener('mouseleave', function() {
          anime.animate(item, {
            rotateY: 0,
            rotateX: 0,
            duration: 600,
            ease: 'outElastic(1, 0.5)'
          });
          if (img) {
            anime.animate(img, {
              translateX: 0,
              translateY: 0,
              scale: 1,
              duration: 600,
              ease: 'outQuad'
            });
          }
        });
      });

      // MASONRY SCROLL-LINKED PARALLAX
      // ========================================
      var masonryItems = document.querySelectorAll('.m-item');
      if (masonryItems.length) {
        var masonryParallax = [];
        masonryItems.forEach(function(item, i) {
          var speed = (i % 3 === 0) ? 0.15 : (i % 3 === 1) ? -0.1 : 0.08;
          masonryParallax.push({ el: item, speed: speed, animatable: anime.createAnimatable(item, { translateY: { unit: 'px' }, duration: 300 }) });
        });
        window.addEventListener('scroll', function() {
          masonryParallax.forEach(function(p) {
            var rect = p.el.getBoundingClientRect();
            var viewH = window.innerHeight;
            if (rect.top < viewH && rect.bottom > 0) {
              var progress = (viewH - rect.top) / (viewH + rect.height);
              var offset = (progress - 0.5) * 60 * p.speed;
              p.animatable.translateY(offset);
            }
          });
        });
      }

      // SECTION HEADER TEXT SPLIT REVEAL
      // ========================================
      document.querySelectorAll('.h-header h2, .masonry-title').forEach(function(el) {
        var text = el.innerHTML;
        var parts = text.split(/(<em>.*?<\/em>)/g);
        el.innerHTML = '';
        var allSpans = [];
        parts.forEach(function(part) {
          if (part.startsWith('<em>')) {
            var em = document.createElement('em');
            var emText = part.replace(/<\/?em>/g, '');
            emText.split('').forEach(function(ch) {
              var s = document.createElement('span');
              s.textContent = ch;
              s.style.display = 'inline-block';
              s.style.clipPath = 'inset(0 100% 0 0)';
              em.appendChild(s);
              allSpans.push(s);
            });
            el.appendChild(em);
          } else {
            part.split('').forEach(function(ch) {
              var s = document.createElement('span');
              s.textContent = ch;
              s.style.display = 'inline-block';
              s.style.clipPath = 'inset(0 100% 0 0)';
              el.appendChild(s);
              allSpans.push(s);
            });
          }
        });

        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              anime.animate(allSpans, {
                clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
                duration: 600,
                delay: anime.stagger(30),
                ease: 'outCubic'
              });
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });
        observer.observe(el);
      });
    }
// MOUSE PARALLAX ON HERO
    // ========================================
    document.addEventListener('mousemove', function(e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;

      var heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        anime.animate(heroContent, {
          rotateY: x * 3,
          rotateX: y * -3,
          duration: 1000,
          ease: 'outQuad'
        });
      }

      var heroBg = document.querySelector('.hero-bg');
      if (heroBg) {
        anime.animate(heroBg, {
          translateX: x * -10,
          translateY: y * -10,
          duration: 1500,
          ease: 'outQuad'
        });
      }
    });

    // ========================================
    // HOVER EFFECTS
    // ========================================
    function bindHoverEffects() {
      document.querySelectorAll('.m-item').forEach(function(item) {
        item.addEventListener('mousemove', function(e) {
          var rect = item.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          anime.animate(item, {
            rotateY: x * 10,
            rotateX: y * -10,
            scale: 1.02,
            duration: 300,
            ease: 'outQuad'
          });
          anime.animate(item.querySelector('.m-overlay'), {
            opacity: 1,
            duration: 200,
            ease: 'outQuad'
          });
        });
        item.addEventListener('mouseleave', function() {
          anime.animate(item, {
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 500,
            ease: 'outQuad'
          });
          anime.animate(item.querySelector('.m-overlay'), {
            opacity: 0,
            duration: 300,
            ease: 'outQuad'
          });
        });
      });
      document.querySelectorAll('.h-card').forEach(function(card) {
        var img = card.querySelector('img');
        card.addEventListener('mouseenter', function() {
          if (img) anime.animate(img, { scale: 1.06, duration: 600, ease: 'outQuad' });
        });
        card.addEventListener('mouseleave', function() {
          if (img) anime.animate(img, { scale: 1, duration: 600, ease: 'outQuad' });
        });
      });
    }
