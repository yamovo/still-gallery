var images = [];
    var curIdx = 0;
    var lbClickX = window.innerWidth / 2;
    var lbClickY = window.innerHeight / 2;
// LOAD IMAGES
    // ========================================
    fetch('/api/images')
      .then(function(r) { return r.json(); })
      .then(function(data) { images = data; renderGallery(); })
      .catch(function() { renderGallery(); });

    function renderGallery() {
      var featured = document.getElementById('featured');
      var hTrack = document.getElementById('hTrack');
      var masonry = document.getElementById('masonry');
      var hCount = document.getElementById('hCount');
      featured.innerHTML = '';
      hTrack.innerHTML = '';
      masonry.innerHTML = '';

      if (images.length === 0) {
        var emptyHTML = '<div class="empty" style="grid-column:1/-1;width:100%"><div class="empty-icon">&#128247;</div><h3>No images yet</h3><p>Put images in <code>images/</code> folder</p></div>';
        featured.innerHTML = emptyHTML;
        hTrack.innerHTML = emptyHTML;
        masonry.innerHTML = emptyHTML;
        hCount.textContent = '0 WORKS';
      } else {
        hCount.textContent = images.length + ' WORKS';
        images.slice(0, 2).forEach(function(img, i) {
          var div = document.createElement('div');
          div.className = 'feat-item';
          div.innerHTML = '<img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy"><div class="feat-info"><div class="num">' + String(i+1).padStart(2,'0') + '</div><h3>' + (img.title||'') + '</h3><p>' + (img.category||'') + '</p></div>';
          div.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
          featured.appendChild(div);
        });
        images.forEach(function(img, i) {
          var card = document.createElement('div');
          card.className = 'h-card';
          card.innerHTML = '<div class="h-card-img"><img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy"></div><div class="h-card-meta"><h4>' + (img.title||'') + '</h4><span>' + (img.category||'') + '</span></div>';
          card.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
          hTrack.appendChild(card);

          var item = document.createElement('div');
          item.className = 'm-item';
          item.innerHTML = '<img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy"><div class="m-overlay"><div><h4>' + (img.title||'') + '</h4><span>' + (img.category||'') + '</span></div></div>';
          item.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
          masonry.appendChild(item);
        });
        bindHoverEffects();
      }
    }
// DRAG SCROLL — Optimized (rAF batch + velocity smoothing)
    // ========================================
    var hTrackEl2 = document.getElementById('hTrack');
    var isDown = false, startX, scrollLeft, velX = 0, lastX = 0, lastTime = 0, rafId = null;
    var pendingScroll = null, moveRafId = null;

    function ptrDown(e) {
      isDown = true;
      startX = e.pageX - hTrackEl2.offsetLeft;
      scrollLeft = hTrackEl2.scrollLeft;
      velX = 0; lastX = startX; lastTime = Date.now();
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (moveRafId) { cancelAnimationFrame(moveRafId); moveRafId = null; }
      hTrackEl2.style.cursor = 'grabbing';
      hTrackEl2.style.userSelect = 'none';
      // Disable pointer events on children to prevent hover repaints during drag
      hTrackEl2.style.pointerEvents = 'none';
    }
    function ptrMove(e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - hTrackEl2.offsetLeft;
      var now = Date.now(), dt = now - lastTime;
      if (dt > 0) {
        // Exponential moving average for smoother velocity
        var instantVel = (x - lastX) / dt * 16;
        velX = velX * 0.6 + instantVel * 0.4;
      }
      lastX = x; lastTime = now;
      // Batch DOM writes into next animation frame
      pendingScroll = scrollLeft - (x - startX);
      if (!moveRafId) {
        moveRafId = requestAnimationFrame(function() {
          if (pendingScroll !== null) {
            hTrackEl2.scrollLeft = pendingScroll;
            pendingScroll = null;
          }
          moveRafId = null;
        });
      }
    }
    function ptrUp() {
      if (!isDown) return;
      isDown = false;
      hTrackEl2.style.cursor = 'grab';
      hTrackEl2.style.userSelect = '';
      // Re-enable pointer events after a short delay to avoid immediate hover triggers
      setTimeout(function() { hTrackEl2.style.pointerEvents = ''; }, 60);
      var friction = 0.95;
      function decel() {
        if (Math.abs(velX) < 0.5) return;
        hTrackEl2.scrollLeft -= velX;
        velX *= friction;
        rafId = requestAnimationFrame(decel);
      }
      rafId = requestAnimationFrame(decel);
    }
    hTrackEl2.addEventListener('mousedown', ptrDown);
    document.addEventListener('mousemove', ptrMove);
    document.addEventListener('mouseup', ptrUp);
    hTrackEl2.addEventListener('touchstart', function(e) { ptrDown({ pageX: e.touches[0].pageX }); }, { passive: true });
    hTrackEl2.addEventListener('touchmove', function(e) { ptrMove({ pageX: e.touches[0].pageX, preventDefault: function(){ e.preventDefault(); } }); }, { passive: false });
    hTrackEl2.addEventListener('touchend', ptrUp);
    hTrackEl2.addEventListener('touchcancel', ptrUp);
// 7. LIGHTBOX - SCALE FROM CLICK POSITION
    // ========================================
    function openLB(i) {
      curIdx = i; updateLB();
      var lb = document.getElementById('lightbox');
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';

      var lbImg = document.querySelector('.lb-img');
      // Set transform origin to click position
      var ox = (lbClickX / window.innerWidth * 100);
      var oy = (lbClickY / window.innerHeight * 100);
      lbImg.style.transformOrigin = ox + '% ' + oy + '%';

      anime.animate(lbImg, {
        opacity: [0, 1],
        scale: [0.3, 1],
        duration: 500,
        easing: 'easeOutCubic'
      });
      anime.animate('.lb-info', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        delay: 200,
        easing: 'easeOutQuad'
      });
    }
    function closeLB() {
      var lbImg = document.querySelector('.lb-img');
      var ox = (lbClickX / window.innerWidth * 100);
      var oy = (lbClickY / window.innerHeight * 100);
      lbImg.style.transformOrigin = ox + '% ' + oy + '%';

      anime.animate(lbImg, {
        opacity: [1, 0],
        scale: [1, 0.3],
        duration: 350,
        easing: 'easeInCubic',
        onComplete: function() {
          document.getElementById('lightbox').classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
    function navLB(d) {
      var lbImg = document.querySelector('.lb-img');
      lbImg.style.transformOrigin = '50% 50%';
      anime.animate(lbImg, {
        opacity: [1, 0],
        translateX: d > 0 ? [0, -40] : [0, 40],
        scale: [1, 0.95],
        duration: 200,
        easing: 'easeInQuad',
        onComplete: function() {
          curIdx = (curIdx + d + images.length) % images.length; updateLB();
          anime.animate(lbImg, {
            opacity: [0, 1],
            translateX: d > 0 ? [40, 0] : [-40, 0],
            scale: [0.95, 1],
            duration: 300,
            easing: 'easeOutQuad'
          });
        }
      });
      event.stopPropagation();
    }
    function updateLB() {
      document.getElementById('lbImg').src = images[curIdx].src;
      document.getElementById('lbTitle').textContent = images[curIdx].title || '';
      document.getElementById('lbCounter').textContent = (curIdx+1) + ' / ' + images.length;
    }
    document.addEventListener('keydown', function(e) {
      if (!document.getElementById('lightbox').classList.contains('active')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') navLB(-1);
      if (e.key === 'ArrowRight') navLB(1);
    });
    document.getElementById('lightbox').addEventListener('click', function(e) {
      if (e.target === e.currentTarget) {
        lbClickX = e.clientX;
        lbClickY = e.clientY;
        closeLB();
      }
    });
