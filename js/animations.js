// 1. SCROLL PROGRESS BAR
    // ========================================
    window.addEventListener('scroll', function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      document.getElementById('scrollProgress').style.width = progress + '%';
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
          easing: 'easeOutQuad'
        });
      });
      el.addEventListener('mouseleave', function() {
        anime.animate(el, {
          translateX: 0,
          translateY: 0,
          duration: 400,
          easing: 'easeOutElastic(1, 0.5)'
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
          easing: 'easeOutQuad',
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
        easing: 'easeOutQuad'
      })
      .add('#loaderFill', {
        width: '100%',
        duration: 1200,
        easing: 'easeInOutQuad'
      }, '-=200')
      .add(loaderSpans, {
        translateY: -40,
        opacity: 0,
        duration: 400,
        delay: anime.stagger(50)
      }, '+=300');

    // ========================================
    // MARQUEE
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
        var speed = 60;
        var pos = 0;
        var last = null;
        function tick(now) {
          if (last !== null) {
            var dt = (now - last) / 1000;
            pos -= speed * dt;
            if (pos <= -copyW) pos += copyW;
            inner.style.transform = 'translateX(' + pos + 'px)';
          }
          last = now;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
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
              easing: 'easeOutQuad'
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
        easing: 'easeOutQuad',
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
        easing: 'easeOutQuad'
      });
      anime.animate('.hero-sub', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: 800,
        easing: 'easeOutQuad'
      });
      anime.animate('.hero-scroll', {
        opacity: [0, 1],
        duration: 600,
        delay: 800,
        easing: 'easeOutQuad'
      });

      // Hero parallax on scroll
      var heroEl = document.querySelector('.hero');
      var heroContentEl = document.querySelector('.hero-content');
      window.addEventListener('scroll', function() {
        var rect = heroEl.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, -rect.top / rect.height));
        heroContentEl.style.transform = 'translateY(' + (-80 * progress) + 'px)';
        heroContentEl.style.opacity = 1 - progress;
      });

      // Cube rotation
      anime.animate('#cube', {
        rotate: 360,
        duration: 20000,
        loop: true,
        easing: 'linear'
      });

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

      // Horizontal track parallax (archive)
      var hSection = document.querySelector('#work');
      var hTrackEl = document.getElementById('hTrack');
      if (hSection && hTrackEl) {
        window.addEventListener('scroll', function() {
          var rect = hSection.getBoundingClientRect();
          var viewH = window.innerHeight;
          var progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));
          hTrackEl.style.transform = 'translateX(' + (-150 * progress) + 'px)';
        });
      }

      // Writing track parallax
      var writingSection = document.querySelector('#writing');
      var writingTrack = document.getElementById('writingTrack');
      if (writingSection && writingTrack) {
        window.addEventListener('scroll', function() {
          var rect = writingSection.getBoundingClientRect();
          var viewH = window.innerHeight;
          var progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)));
          writingTrack.style.transform = 'translateX(' + (-100 * progress) + 'px)';
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
          easing: 'easeOutQuad'
        });
      }

      var heroBg = document.querySelector('.hero-bg');
      if (heroBg) {
        anime.animate(heroBg, {
          translateX: x * -10,
          translateY: y * -10,
          duration: 1500,
          easing: 'easeOutQuad'
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
            easing: 'easeOutQuad'
          });
          anime.animate(item.querySelector('.m-overlay'), {
            opacity: 1,
            duration: 200,
            easing: 'easeOutQuad'
          });
        });
        item.addEventListener('mouseleave', function() {
          anime.animate(item, {
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 500,
            easing: 'easeOutQuad'
          });
          anime.animate(item.querySelector('.m-overlay'), {
            opacity: 0,
            duration: 300,
            easing: 'easeOutQuad'
          });
        });
      });
      document.querySelectorAll('.h-card').forEach(function(card) {
        var img = card.querySelector('img');
        card.addEventListener('mouseenter', function() {
          if (img) anime.animate(img, { scale: 1.06, duration: 600, easing: 'easeOutQuad' });
        });
        card.addEventListener('mouseleave', function() {
          if (img) anime.animate(img, { scale: 1, duration: 600, easing: 'easeOutQuad' });
        });
      });
    }
