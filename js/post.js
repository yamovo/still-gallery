// Loader scramble animation
(function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var target = 'READING';
  var el = document.getElementById('loaderText');
  var fill = document.getElementById('loaderFill');
  var i = 0;
  function scramble() {
    var out = '';
    for (var j = 0; j < target.length; j++) {
      if (j < i) out += target[j];
      else out += chars[Math.floor(Math.random() * chars.length)];
    }
    el.textContent = out;
    if (i < target.length) {
      i += 0.25;
      fill.style.width = (i / target.length * 100) + '%';
      requestAnimationFrame(scramble);
    } else {
      fill.style.width = '100%';
      setTimeout(function() {
        var loader = document.getElementById('loader');
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
      }, 300);
    }
  }
  scramble();
})();

// Get slug from URL
var params = new URLSearchParams(window.location.search);
var slug = params.get('slug') || '';

if (!slug) {
  document.getElementById('postArticle').innerHTML = '<div class="empty"><div class="empty-icon">&#9998;</div><h3>No post specified</h3><p>Go to <a href="/blog">Writing</a></p></div>';
} else {
  fetch('/api/posts/' + slug)
    .then(function(r) { return r.json(); })
    .then(renderPost)
    .catch(function() {
      document.getElementById('postArticle').innerHTML = '<div class="empty"><div class="empty-icon">&#9998;</div><h3>Post not found</h3><p>Go to <a href="/blog">Writing</a></p></div>';
    });
}

function renderPost(post) {
  document.title = post.title + ' - STILL';
  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postExcerpt').textContent = post.excerpt || '';
  document.getElementById('postBody').innerHTML = post.content;

  // Image click → lightbox
  (function() {
    var bodyImgs = document.querySelectorAll('.post-body img');
    bodyImgs.forEach(function(img) {
      img.addEventListener('click', function() {
        var lb = document.getElementById('postLightbox');
        var lbImg = document.getElementById('postLbImg');
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        anime.animate(lbImg, {
          opacity: [0, 1],
          scale: [0.95, 1],
          duration: 300,
          easing: 'easeOutCubic'
        });
      });
    });
  })();

  if (post.category) {
    document.getElementById('postCategory').textContent = post.category;
  }
  if (post.date) {
    var d = new Date(post.date);
    var dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    if (post.readingTime) dateStr += ' · ' + post.readingTime + ' min read';
    document.getElementById('postDate').textContent = dateStr;
  }
  if (post.cover) {
    var wrap = document.getElementById('postCoverWrap');
    wrap.style.display = '';
    document.getElementById('postCover').src = post.cover;
  }

  // Fetch all posts for prev/next navigation
  fetch('/api/posts')
    .then(function(r) { return r.json(); })
    .then(function(allPosts) {
      var idx = -1;
      for (var i = 0; i < allPosts.length; i++) {
        if (allPosts[i].slug === slug) { idx = i; break; }
      }
      var nav = document.getElementById('postNav');
      if (idx === -1) return;
      var html = '';
      if (idx < allPosts.length - 1) {
        var next = allPosts[idx + 1];
        html += '<a href="/post?slug=' + next.slug + '" class="post-nav-link post-nav-next">';
        html += '<span class="post-nav-label">Newer</span>';
        html += '<span class="post-nav-title">' + next.title + '</span>';
        html += '</a>';
      }
      if (idx > 0) {
        var prev = allPosts[idx - 1];
        html += '<a href="/post?slug=' + prev.slug + '" class="post-nav-link post-nav-prev">';
        html += '<span class="post-nav-label">Older</span>';
        html += '<span class="post-nav-title">' + prev.title + '</span>';
        html += '</a>';
      }
      nav.innerHTML = html;
    });

  // Fade in content
  anime.animate('#postArticle', {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    delay: 800,
    easing: 'easeOutCubic'
  });
}

// Scroll progress
(function() {
  var bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0';
  });
})();

// Lightbox close
(function() {
  var lb = document.getElementById('postLightbox');
  document.getElementById('postLbClose').addEventListener('click', function() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  });
  lb.addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
      lb.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lb.classList.contains('active')) {
      lb.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
})();

// Magnetic hover
(function() {
  document.querySelectorAll('.magnetic').forEach(function(el) {
    el.addEventListener('mousemove', function(e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)';
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.5s ease';
      setTimeout(function() { el.style.transition = ''; }, 500);
    });
  });
})();
