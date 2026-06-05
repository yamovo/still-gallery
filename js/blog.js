var posts = [];

// Loader
(function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var target = 'WRITING';
  var el = document.getElementById('loaderText');
  var fill = document.getElementById('loaderFill');
  var i = 0;
  var timer;
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
      timer = requestAnimationFrame(scramble);
    } else {
      fill.style.width = '100%';
      setTimeout(function() {
        document.getElementById('loader').style.opacity = '0';
        document.getElementById('loader').style.pointerEvents = 'none';
      }, 300);
    }
  }
  scramble();
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
    easing: 'easeOutCubic',
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

// Scroll progress on blog list
(function() {
  var bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0';
  });
})();
