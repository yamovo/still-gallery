var images = [];
    var curIdx = 0;
    var lbClickX = window.innerWidth / 2;
    var lbClickY = window.innerHeight / 2;
    var activeCategory = 'all';
// LOAD IMAGES + POSTS
    // ========================================
    Promise.all([
      fetch('/api/images').then(function(r) { return r.json(); }).catch(function() { return []; }),
      fetch('/api/posts').then(function(r) { return r.json(); }).catch(function() { return []; })
    ]).then(function(results) {
      images = results[0];
      renderGallery();
      renderWriting(results[1]);
      renderFilterBar();
    });

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
          item.setAttribute('data-category', img.category || '');
          item.innerHTML = '<img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy"><div class="m-overlay"><div><h4>' + (img.title||'') + '</h4><span>' + (img.category||'') + '</span></div></div>';
          item.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
          masonry.appendChild(item);
        });
        bindHoverEffects();
      }
    }

    // RENDER WRITING TRACK
    // ========================================
    function renderWriting(posts) {
      var track = document.getElementById('writingTrack');
      if (!track) return;
      track.innerHTML = '';
      if (!posts || posts.length === 0) return;

      posts.forEach(function(post) {
        var card = document.createElement('div');
        card.className = 'h-card h-card--post';
        var imgHTML = '';
        if (post.cover) {
          imgHTML = '<img src="' + post.cover + '" alt="' + (post.title||'') + '" loading="lazy">';
        } else {
          imgHTML = '<div class="h-card-placeholder">' + (post.category || 'Writing') + '</div>';
        }
        var dateStr = '';
        if (post.date) {
          var d = new Date(post.date);
          dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        var metaStr = post.category || '';
        if (dateStr) metaStr += (metaStr ? ' &middot; ' : '') + dateStr;
        if (post.readingTime) metaStr += ' &middot; ' + post.readingTime + ' min';

        card.innerHTML = '<a href="/post?slug=' + post.slug + '" style="text-decoration:none;color:inherit;display:block;"><div class="h-card-img">' + imgHTML + '</div><div class="h-card-meta"><h4>' + (post.title||post.slug) + '</h4><span>' + metaStr + '</span></div></a>';
        track.appendChild(card);
      });

      // Bind drag scroll for writing track
      initDragScroll(track);
      // Scroll reveal for writing cards
      createScrollReveal('#writingTrack .h-card', {
        y: 30,
        duration: 600,
        threshold: 0.1,
        delay: function(el) {
          var idx = Array.from(el.parentElement.children).indexOf(el);
          return idx * 100;
        }
      });
    }

    // RENDER CATEGORY FILTER BAR
    // ========================================
    function renderFilterBar() {
      var bar = document.getElementById('filterBar');
      if (!bar || images.length === 0) return;
      bar.innerHTML = '';

      var cats = {};
      images.forEach(function(img) {
        var c = img.category || 'Uncategorized';
        cats[c] = (cats[c] || 0) + 1;
      });

      var allPill = document.createElement('button');
      allPill.className = 'filter-pill active';
      allPill.textContent = 'All';
      allPill.setAttribute('data-cat', 'all');
      allPill.onclick = function() { filterByCategory('all'); };
      bar.appendChild(allPill);

      Object.keys(cats).sort().forEach(function(cat) {
        var pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.textContent = cat + ' (' + cats[cat] + ')';
        pill.setAttribute('data-cat', cat);
        pill.onclick = function() { filterByCategory(cat); };
        bar.appendChild(pill);
      });
    }

    function filterByCategory(cat) {
      activeCategory = cat;
      // Update pill active state
      document.querySelectorAll('.filter-pill').forEach(function(p) {
        p.classList.toggle('active', p.getAttribute('data-cat') === cat);
      });
      // Filter masonry items
      document.querySelectorAll('.m-item').forEach(function(item) {
        var itemCat = item.getAttribute('data-category') || 'Uncategorized';
        if (cat === 'all' || itemCat === cat) {
          item.style.display = '';
          anime.animate(item, { opacity: [0, 1], scale: [0.95, 1], duration: 400, easing: 'easeOutQuad' });
        } else {
          anime.animate(item, {
            opacity: [1, 0],
            scale: [1, 0.95],
            duration: 300,
            easing: 'easeInQuad',
            onComplete: function() { item.style.display = 'none'; }
          });
        }
      });
    }
// DRAG SCROLL — Reusable, optimized (rAF batch + velocity smoothing)
    // ========================================
    function initDragScroll(el) {
      var isDown = false, startX, scrollLeft, velX = 0, lastX = 0, lastTime = 0, rafId = null;
      var pendingScroll = null, moveRafId = null;

      function ptrDown(e) {
        isDown = true;
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        velX = 0; lastX = startX; lastTime = Date.now();
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (moveRafId) { cancelAnimationFrame(moveRafId); moveRafId = null; }
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
        el.style.pointerEvents = 'none';
      }
      function ptrMove(e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - el.offsetLeft;
        var now = Date.now(), dt = now - lastTime;
        if (dt > 0) {
          var instantVel = (x - lastX) / dt * 16;
          velX = velX * 0.6 + instantVel * 0.4;
        }
        lastX = x; lastTime = now;
        pendingScroll = scrollLeft - (x - startX);
        if (!moveRafId) {
          moveRafId = requestAnimationFrame(function() {
            if (pendingScroll !== null) {
              el.scrollLeft = pendingScroll;
              pendingScroll = null;
            }
            moveRafId = null;
          });
        }
      }
      function ptrUp() {
        if (!isDown) return;
        isDown = false;
        el.style.cursor = 'grab';
        el.style.userSelect = '';
        setTimeout(function() { el.style.pointerEvents = ''; }, 60);
        var friction = 0.95;
        function decel() {
          if (Math.abs(velX) < 0.5) return;
          el.scrollLeft -= velX;
          velX *= friction;
          rafId = requestAnimationFrame(decel);
        }
        rafId = requestAnimationFrame(decel);
      }
      el.addEventListener('mousedown', ptrDown);
      document.addEventListener('mousemove', ptrMove);
      document.addEventListener('mouseup', ptrUp);
      el.addEventListener('touchstart', function(e) { ptrDown({ pageX: e.touches[0].pageX }); }, { passive: true });
      el.addEventListener('touchmove', function(e) { ptrMove({ pageX: e.touches[0].pageX, preventDefault: function(){ e.preventDefault(); } }); }, { passive: false });
      el.addEventListener('touchend', ptrUp);
      el.addEventListener('touchcancel', ptrUp);
    }

    // Init drag scroll for archive track
    initDragScroll(document.getElementById('hTrack'));
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
    function navLB(d, e) {
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
      if (e) e.stopPropagation();
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
