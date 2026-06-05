// Loader (anime.js timeline with scramble)
(function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var target = 'READING';
  var el = document.getElementById('loaderText');
  var spans = [];
  for (var i = 0; i < target.length; i++) {
    var s = document.createElement('span');
    s.textContent = chars[Math.random() * chars.length | 0];
    s.style.display = 'inline-block';
    s.style.opacity = '0';
    s.style.transform = 'translateY(20px)';
    el.appendChild(s);
    spans.push(s);
  }

  var t = { v: 0 };
  var tick = 0;
  var revealed = {};

  var loaderTl = anime.createTimeline({
    onComplete: function() {
      anime.animate('#loader', {
        opacity: 0,
        duration: 400,
        ease: 'outQuad',
        onComplete: function() {
          document.getElementById('loader').style.display = 'none';
        }
      });
    }
  });

  loaderTl
    .add(spans, {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 400,
      delay: anime.stagger(60),
      ease: 'outQuad'
    })
    .add(t, {
      v: 1,
      duration: 1500,
      ease: 'outQuad',
      onUpdate: function() {
        tick++;
        var n = Math.floor(t.v * target.length);
        for (var k = 0; k < spans.length; k++) {
          if (k < n) {
            if (!revealed[k]) {
              revealed[k] = true;
              spans[k].textContent = target[k];
            }
          } else if (tick % 6 === 0) {
            spans[k].textContent = chars[Math.random() * chars.length | 0];
          }
        }
      }
    }, '-=200')
    .add('#loaderFill', {
      width: '100%',
      duration: 1200,
      ease: 'inOutQuad'
    }, '-=1500')
    .add(spans, {
      translateY: -20,
      opacity: 0,
      duration: 300,
      delay: anime.stagger(40)
    }, '+=200');
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
  // Update meta tags for SEO
  var desc = post.excerpt || '';
  var metaDesc = document.getElementById('metaDesc');
  if (metaDesc) metaDesc.setAttribute('content', desc);
  var ogTitle = document.getElementById('ogTitle');
  if (ogTitle) ogTitle.setAttribute('content', post.title + ' - STILL');
  var ogDesc = document.getElementById('ogDesc');
  if (ogDesc) ogDesc.setAttribute('content', desc);

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
          ease: 'outCubic'
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

  // Fade in content with staggered elements
  anime.animate('#postArticle', {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    delay: 800,
    ease: 'outCubic'
  });

  // Title text split reveal
  var titleEl = document.querySelector('.post-title');
  if (titleEl) {
    var titleText = titleEl.textContent;
    titleEl.innerHTML = '';
    var titleSpans = [];
    titleText.split('').forEach(function(ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.display = 'inline-block';
      s.style.opacity = '0';
      s.style.transform = 'translateY(30px) rotateX(40deg)';
      titleEl.appendChild(s);
      titleSpans.push(s);
    });
    anime.animate(titleSpans, {
      opacity: [0, 1],
      translateY: [30, 0],
      rotateX: [40, 0],
      duration: 700,
      delay: anime.stagger(25, { start: 900 }),
      ease: 'outCubic'
    });
  }

  // Cover image reveal
  var coverWrap = document.getElementById('postCoverWrap');
  if (coverWrap && coverWrap.style.display !== 'none') {
    anime.animate(coverWrap, {
      opacity: [0, 1],
      scale: [1.05, 1],
      duration: 800,
      delay: 1200,
      ease: 'outCubic'
    });
  }

  // Post nav stagger reveal
  setTimeout(function() {
    anime.animate('.post-nav-link', {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      delay: anime.stagger(150),
      ease: 'outQuad'
    });
  }, 1500);
}

// Scroll progress (anime.js animatable)
(function() {
  var bar = document.getElementById('scrollProgress');
  var barAnim = anime.createAnimatable(bar, {
    width: { unit: '%' },
    duration: 150
  });
  window.addEventListener('scroll', function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    barAnim.width(h > 0 ? (window.scrollY / h * 100) : 0);
  });
})();

// Lightbox close (anime.js animated)
(function() {
  var lb = document.getElementById('postLightbox');
  function closeLB() {
    var lbImg = document.getElementById('postLbImg');
    anime.animate(lbImg, {
      opacity: [1, 0],
      scale: [1, 0.95],
      duration: 250,
      ease: 'inCubic',
      onComplete: function() {
        lb.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  document.getElementById('postLbClose').addEventListener('click', closeLB);
  lb.addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeLB();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lb.classList.contains('active')) closeLB();
  });
})();

// Magnetic hover (anime.js)
document.querySelectorAll('.magnetic').forEach(function(el) {
  el.addEventListener('mousemove', function(e) {
    var rect = el.getBoundingClientRect();
    var dx = (e.clientX - rect.left - rect.width / 2) * 0.3;
    var dy = (e.clientY - rect.top - rect.height / 2) * 0.3;
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
