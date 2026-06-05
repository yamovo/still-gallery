var posts = [];

// Loader (anime.js timeline with scramble)
// Loader (anime.js timeline with scramble)
(function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var target = 'WRITING';
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

// Fetch posts and render list
fetch('/api/posts')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    posts = data;
    renderList();
  })
  .catch(function() { renderList(); });

function renderList() {
  var container = document.getElementById('blogList');
  var inner = container.querySelector('.blog-list-inner');
  var emptyEl = document.getElementById('blogEmpty');

  inner.innerHTML = '';
  if (emptyEl) inner.appendChild(emptyEl);

  if (posts.length === 0) {
    if (emptyEl) emptyEl.style.display = '';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  posts.forEach(function(post, i) {
    var card = document.createElement('article');
    card.className = 'post-card';
    card.style.animationDelay = (i * 0.1) + 's';

    var readingTime = post.readingTime ? post.readingTime + ' min read' : '';
    var formattedDate = '';
    if (post.date) {
      var d = new Date(post.date);
      formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    var innerHTML = '<a href="/post?slug=' + post.slug + '" class="post-card-link" style="text-decoration:none;color:inherit;">';
    if (post.cover) {
      innerHTML += '<div class="post-card-cover"><img src="' + post.cover + '" alt="" loading="lazy"></div>';
    }
    innerHTML += '<div class="post-card-body">';
    innerHTML += '<div class="post-card-meta">';
    if (post.category) innerHTML += '<span class="post-card-cat">' + post.category + '</span>';
    innerHTML += '<time>' + formattedDate + '</time>';
    if (readingTime) innerHTML += '<span class="post-card-time">' + readingTime + '</span>';
    innerHTML += '</div>';
    innerHTML += '<h2 class="post-card-title">' + (post.title || post.slug) + '</h2>';
    if (post.excerpt) innerHTML += '<p class="post-card-excerpt">' + post.excerpt + '</p>';
    innerHTML += '<span class="post-card-read">Read &rarr;</span>';
    innerHTML += '</div></a>';

    card.innerHTML = innerHTML;
    inner.appendChild(card);
  });

  // Animate cards in
  anime.animate('.post-card', {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 600,
    ease: 'outCubic',
    delay: anime.stagger(100, { start: 800 })
  });
}

// Reveal animations on scroll
if (self.IntersectionObserver) {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.15 });
}

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
