var images = [];
var curIdx = 0;
var lbClickX = window.innerWidth / 2;
var lbClickY = window.innerHeight / 2;
var activeCategory = 'all';

// Auto-detect void mode from URL
var isVoidMode = window.location.pathname.indexOf('/void') === 0;
var apiPrefix = isVoidMode ? '/void-api' : '/api';
var postBase = isVoidMode ? '/void-post' : '/post';

// ===== MUSIC CONTROL (void mode only) =====
var lbAudio = document.getElementById('lbAudio');
var lbMuteBtn = document.getElementById('lbMute');
var lbMuteWaves = document.getElementById('lbMuteWaves');
var musicMuted = false;
var currentAudioCat = '';

var categoryAudioMap = {
  'man': 'See You Again.m4a',
  'grand F': '念张师.m4a'
};

function toggleMute() {
  musicMuted = !musicMuted;
  if (lbAudio) lbAudio.muted = musicMuted;
  if (lbMuteBtn) lbMuteBtn.classList.toggle('muted', musicMuted);
  if (lbMuteWaves) lbMuteWaves.style.display = musicMuted ? 'none' : '';
}

function playAudioForImage(idx) {
  if (!lbAudio) return;
  var img = images[idx];
  var cat = img ? img.category : '';
  var audioFile = '';

  if (img && img.audio) {
    audioFile = 'audio/' + encodeURIComponent(img.audio);
  } else if (cat && categoryAudioMap[cat]) {
    audioFile = 'audio/' + encodeURIComponent(categoryAudioMap[cat]);
  }

  if (audioFile) {
    if (currentAudioCat === cat && !lbAudio.paused) return;
    currentAudioCat = cat;
    lbAudio.src = audioFile;
    if (!musicMuted) { lbAudio.currentTime = 0; lbAudio.play().catch(function(){}); }
  } else {
    if (currentAudioCat !== cat) {
      lbAudio.pause();
      lbAudio.src = '';
      currentAudioCat = '';
    }
  }
}

// ===== LOAD IMAGES + POSTS =====
Promise.all([
  fetch(apiPrefix + '/images').then(function(r) {
    if (!r.ok) throw new Error('Images API returned ' + r.status);
    return r.json();
  }).catch(function(err) {
    console.warn('Failed to load images:', err);
    return null;
  }),
  fetch(apiPrefix + '/posts').then(function(r) {
    if (!r.ok) throw new Error('Posts API returned ' + r.status);
    return r.json();
  }).catch(function(err) {
    console.warn('Failed to load posts:', err);
    return null;
  })
]).then(function(results) {
  var imgData = results[0];
  var postData = results[1];

  if (imgData === null) {
    // API error — show error state
    var errHTML = '<div class="empty" style="grid-column:1/-1;width:100%"><div class="empty-icon">&#9888;</div><h3>Could not load gallery</h3><p>Please try refreshing the page</p></div>';
    document.getElementById('featured').innerHTML = errHTML;
    document.getElementById('hTrack').innerHTML = errHTML;
    document.getElementById('masonry').innerHTML = errHTML;
    document.getElementById('hCount').textContent = 'ERROR';
  } else {
    images = imgData;
    renderGallery();
  }

  renderWriting(postData || []);
  if (imgData) renderFilterBar();
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
      div.innerHTML = '<img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy" onerror="this.style.opacity=0.2"><div class="feat-info"><div class="num">' + String(i+1).padStart(2,'0') + '</div><h3>' + (img.title||'') + '</h3><p>' + (img.category||'') + '</p></div>';
      div.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
      featured.appendChild(div);
    });
    images.forEach(function(img, i) {
      var card = document.createElement('div');
      card.className = 'h-card';
      card.innerHTML = '<div class="h-card-img"><img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy" onerror="this.style.opacity=0.2;this.alt=\'Failed to load\'"></div><div class="h-card-meta"><h4>' + (img.title||'') + '</h4><span>' + (img.category||'') + '</span></div>';
      card.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
      hTrack.appendChild(card);

      var item = document.createElement('div');
      item.className = 'm-item';
      item.setAttribute('data-category', img.category || '');
      item.innerHTML = '<img src="' + img.src + '" alt="' + (img.title||'') + '" loading="lazy" onerror="this.style.opacity=0.2"><div class="m-overlay"><div><h4>' + (img.title||'') + '</h4><span>' + (img.category||'') + '</span></div></div>';
      item.onclick = function(e) { lbClickX = e.clientX; lbClickY = e.clientY; openLB(i); };
      masonry.appendChild(item);
    });
    bindHoverEffects();
    renderFloat3D();
  }
}

// ===== FLOATING 3D SHOWCASE =====
function renderFloat3D() {
  var section = document.getElementById('float3d');
  var floatImages = images.filter(function(img) { return img.category !== 'Meme'; });
  if (!section || floatImages.length === 0) return;

  section.innerHTML =
    '<canvas class="float3d-particles" id="float3dParticles"></canvas>' +
    '<div class="float3d-scene"><div class="float3d-header"><div class="float3d-title">Floating <em>Showcase</em></div><div class="float3d-subtitle">Move your cursor to explore</div></div><div class="float3d-stage" id="float3dStage"></div></div>';

  var stage = document.getElementById('float3dStage');

  var count = floatImages.length;
  var stageRect = stage.getBoundingClientRect();
  var stageW = stageRect.width || 1400;
  var stageH = stageRect.height || 600;
  var seed = 73;
  function sr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  var maxW = 260, maxH = 350, minW = 160, minH = 200;
  var cardSizes = [];
  for (var si = 0; si < count; si++) {
    cardSizes.push({ w: maxW, h: maxH });
  }

  var loaded = 0;
  floatImages.forEach(function(img, i) {
    var im = new Image();
    im.onload = function() {
      var ratio = im.naturalWidth / im.naturalHeight;
      var w, h;
      if (ratio >= 1) { w = maxW; h = Math.round(w / ratio); if (h < minH) { h = minH; w = Math.round(h * ratio); } }
      else { h = maxH; w = Math.round(h * ratio); if (w < minW) { w = minW; h = Math.round(w / ratio); } }
      cardSizes[i] = { w: w, h: h };
      loaded++;
      if (loaded === count) buildFloat3DLayout();
    };
    im.onerror = function() { loaded++; if (loaded === count) buildFloat3DLayout(); };
    im.src = img.src;
  });

  function buildFloat3DLayout() {
    var placed = [];
    for (var i = 0; i < count; i++) {
      var cw = cardSizes[i].w, ch = cardSizes[i].h;
      placed.push({
        x: sr() * (stageW - cw) + cw / 2,
        y: sr() * (stageH - ch) + ch / 2,
        w: cw, h: ch, vx: 0, vy: 0
      });
    }

    var pad = 20;
    for (var iter = 0; iter < 80; iter++) {
      for (var a = 0; a < count; a++) {
        for (var b = a + 1; b < count; b++) {
          var dx = placed[b].x - placed[a].x;
          var dy = placed[b].y - placed[a].y;
          var minDx = (placed[a].w + placed[b].w) / 2 + pad;
          var minDy = (placed[a].h + placed[b].h) / 2 + pad;
          var overlapX = minDx - Math.abs(dx);
          var overlapY = minDy - Math.abs(dy);
          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              var push = overlapX / 2 + 1;
              var dir = dx >= 0 ? 1 : -1;
              placed[a].x -= push * dir;
              placed[b].x += push * dir;
            } else {
              var push2 = overlapY / 2 + 1;
              var dir2 = dy >= 0 ? 1 : -1;
              placed[a].y -= push2 * dir2;
              placed[b].y += push2 * dir2;
            }
          }
        }
      }
      for (var c = 0; c < count; c++) {
        placed[c].x += (stageW / 2 - placed[c].x) * 0.015;
        placed[c].y += (stageH / 2 - placed[c].y) * 0.015;
        var hw = placed[c].w / 2, hh = placed[c].h / 2;
        placed[c].x = Math.max(hw + 30, Math.min(stageW - hw - 30, placed[c].x));
        placed[c].y = Math.max(hh + 30, Math.min(stageH - hh - 30, placed[c].y));
      }
    }

    var positions = [];
    for (var j = 0; j < count; j++) {
      positions.push({
        left: (placed[j].x / stageW) * 100,
        top: (placed[j].y / stageH) * 100,
        z: 60 + sr() * 80,
        ry: (sr() - 0.5) * 20,
        rx: (sr() - 0.5) * 10
      });
    }
    positions.sort(function(a, b) { return b.z - a.z; });

    floatImages.forEach(function(img, i) {
      var pos = positions[i];
      var w = cardSizes[i].w;
      var h = cardSizes[i].h;

      var card = document.createElement('div');
      card.className = 'float3d-card';
      card.setAttribute('data-title', img.title || '');
      card.setAttribute('data-depth', pos.z);
      card.style.left = 'calc(' + pos.left + '% - ' + (w / 2) + 'px)';
      card.style.top = 'calc(' + pos.top + '% - ' + (h / 2) + 'px)';
      card.style.width = w + 'px';
      card.style.height = h + 'px';

      card.innerHTML =
        '<div class="float3d-card-inner">' +
          '<div class="float3d-glow"></div>' +
          '<img src="' + img.src + '" alt="' + (img.title||'') + '" onerror="this.style.opacity=0.2">' +
          '<div class="float3d-shine"></div>' +
        '</div>' +
        '<div class="float3d-label">' + (img.title || '') + '</div>';

      card._baseRY = pos.ry;
      card._baseRX = pos.rx;
      card._baseZ = pos.z;
      card._phase = i * 0.9;

      var globalIdx = images.indexOf(img);
      card.onclick = function(e) { if (card._justDragged) return; lbClickX = e.clientX; lbClickY = e.clientY; openLB(globalIdx); };
      stage.appendChild(card);
    });
    if (window.initFloat3DAnimations) window.initFloat3DAnimations();
  }
}

// ===== RENDER WRITING TRACK =====
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
      var initials = (post.title || 'W').charAt(0).toUpperCase();
      imgHTML = '<div class="h-card-placeholder"><span class="h-card-initial">' + initials + '</span><span class="h-card-placeholder-cat">' + (post.category || 'Writing') + '</span></div>';
    }
    var dateStr = '';
    if (post.date) {
      var d = new Date(post.date);
      dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    var metaStr = post.category || '';
    if (dateStr) metaStr += (metaStr ? ' &middot; ' : '') + dateStr;
    if (post.readingTime) metaStr += ' &middot; ' + post.readingTime + ' min';

    card.innerHTML = '<a href="' + postBase + '?slug=' + post.slug + '" style="text-decoration:none;color:inherit;display:block;"><div class="h-card-img">' + imgHTML + '</div><div class="h-card-meta"><h4>' + (post.title||post.slug) + '</h4><span>' + metaStr + '</span></div></a>';
    track.appendChild(card);
  });

  initDragScroll(track);
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

// ===== CATEGORY FILTER BAR =====
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

var filterAnim = null;
function filterByCategory(cat) {
  activeCategory = cat;
  if (filterAnim) { filterAnim.pause(); filterAnim = null; }
  document.querySelectorAll('.filter-pill').forEach(function(p) {
    p.classList.toggle('active', p.getAttribute('data-cat') === cat);
  });
  document.querySelectorAll('.m-item').forEach(function(item) {
    item.style.opacity = '';
    item.style.transform = '';
    item.style.display = '';
  });
  var showItems = [];
  var hideItems = [];
  document.querySelectorAll('.m-item').forEach(function(item) {
    var itemCat = item.getAttribute('data-category') || 'Uncategorized';
    if (cat === 'all' || itemCat === cat) {
      showItems.push(item);
    } else {
      hideItems.push(item);
    }
  });
  hideItems.forEach(function(el) { el.style.display = 'none'; });
  if (showItems.length) {
    filterAnim = anime.animate(showItems, {
      opacity: [0, 1],
      scale: [0.95, 1],
      translateY: [10, 0],
      duration: 350,
      ease: 'outQuad',
      delay: anime.stagger(40)
    });
  }
}

// ===== DRAG SCROLL =====
function initDragScroll(el) {
  var isDown = false, isDragging = false, startX, scrollLeft, velX = 0, lastX = 0, lastTime = 0, rafId = null;
  var pendingScroll = null, moveRafId = null;

  function ptrDown(e) {
    isDown = true;
    isDragging = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    velX = 0; lastX = startX; lastTime = Date.now();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (moveRafId) { cancelAnimationFrame(moveRafId); moveRafId = null; }
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }
  function ptrMove(e) {
    if (!isDown) return;
    var x = e.pageX - el.offsetLeft;
    if (!isDragging && Math.abs(x - startX) > 5) {
      isDragging = true;
      el.style.pointerEvents = 'none';
    }
    if (!isDragging) return;
    e.preventDefault();
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
    if (isDragging) setTimeout(function() { el.style.pointerEvents = ''; }, 60);
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

initDragScroll(document.getElementById('hTrack'));

// ===== LIGHTBOX =====
function openLB(i) {
  curIdx = i; updateLB();
  var lb = document.getElementById('lightbox');
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (isVoidMode) playAudioForImage(curIdx);

  var lbImg = document.querySelector('.lb-img');
  lbImg.style.opacity = '1';
  lbImg.style.transform = '';
  var ox = (lbClickX / window.innerWidth * 100);
  var oy = (lbClickY / window.innerHeight * 100);
  lbImg.style.setProperty('--lb-x', ox + '%');
  lbImg.style.setProperty('--lb-y', oy + '%');
  lbImg.classList.remove('lb-reveal');

  requestAnimationFrame(function() {
    lbImg.classList.add('lb-reveal');
  });

  anime.animate('.lb-close, .lb-nav', {
    opacity: [0, 1],
    scale: [0.5, 1],
    duration: 400,
    delay: anime.stagger(80, { start: 300 }),
    ease: 'outBack'
  });
  anime.animate('.lb-info', {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 500,
    delay: 400,
    ease: 'outCubic'
  });
}

function closeLB() {
  if (isVoidMode && lbAudio) lbAudio.pause();

  var lbImg = document.querySelector('.lb-img');
  var ox = (lbClickX / window.innerWidth * 100);
  var oy = (lbClickY / window.innerHeight * 100);
  lbImg.style.setProperty('--lb-x', ox + '%');
  lbImg.style.setProperty('--lb-y', oy + '%');

  function cleanup() {
    lbImg.classList.remove('lb-reveal');
    lbImg.style.opacity = '';
    lbImg.style.transform = '';
    lbImg.style.scale = '';
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  }

  anime.animate(lbImg, {
    opacity: [1, 0],
    scale: [1, 1.05],
    duration: 300,
    ease: 'inCubic',
    onComplete: cleanup
  });
  anime.animate('.lb-close, .lb-nav, .lb-info', {
    opacity: [1, 0],
    duration: 200,
    ease: 'inQuad'
  });
}

function navLB(d, e) {
  var lbImg = document.querySelector('.lb-img');
  var dir = d > 0 ? -1 : 1;
  anime.animate(lbImg, {
    opacity: [1, 0],
    translateX: [0, dir * 60],
    scale: [1, 0.92],
    rotateY: dir * 5,
    duration: 250,
    ease: 'inCubic',
    onComplete: function() {
      curIdx = (curIdx + d + images.length) % images.length; updateLB();
      if (isVoidMode) playAudioForImage(curIdx);
      anime.animate(lbImg, {
        opacity: [0, 1],
        translateX: [dir * -60, 0],
        scale: [0.92, 1],
        rotateY: [dir * -5, 0],
        duration: 350,
        ease: 'outCubic'
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

// ===== LIGHTBOX EVENT LISTENERS =====
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

// Bind lightbox button events (replaces inline onclick)
var lbCloseBtn = document.querySelector('.lb-close');
if (lbCloseBtn) lbCloseBtn.addEventListener('click', function(e) { closeLB(); e.stopPropagation(); });
var lbPrevBtn = document.querySelector('.lb-prev');
if (lbPrevBtn) lbPrevBtn.addEventListener('click', function(e) { navLB(-1, e); });
var lbNextBtn = document.querySelector('.lb-next');
if (lbNextBtn) lbNextBtn.addEventListener('click', function(e) { navLB(1, e); });
var lbMuteBtnEl = document.getElementById('lbMute');
if (lbMuteBtnEl) lbMuteBtnEl.addEventListener('click', toggleMute);
