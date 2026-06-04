// PARTICLE SYSTEM
    // ========================================
    (function() {
      var canvas = document.getElementById('particles');
      var ctx = canvas.getContext('2d');
      var W, H;
      var particles = [];
      var count = 100;
      var linkDist = 160;
      var repulseDist = 180;
      var mouseX = -9999, mouseY = -9999;

      function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      // Create particles
      for (var i = 0; i < count; i++) {
        var isBright = Math.random() < 0.15;
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: isBright ? Math.random() * 3 + 2 : Math.random() * 2.5 + 0.8,
          alpha: isBright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.25
        });
      }

      document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });
      document.addEventListener('mouseleave', function() {
        mouseX = -9999;
        mouseY = -9999;
      });

      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(201,169,110,0.5)';

        // Update + draw particles
        for (var i = 0; i < count; i++) {
          var p = particles[i];

          // Mouse repulsion
          var dx = p.x - mouseX;
          var dy = p.y - mouseY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < repulseDist && dist > 0) {
            var force = (repulseDist - dist) / repulseDist * 0.6;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Update position
          p.x += p.vx;
          p.y += p.vy;

          // Damping
          p.vx *= 0.98;
          p.vy *= 0.98;

          // Wrap around edges
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
          if (p.y < -10) p.y = H + 10;
          if (p.y > H + 10) p.y = -10;

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(201,169,110,' + p.alpha + ')';
          ctx.fill();
        }

        // Draw connections
        ctx.shadowBlur = 0;
        ctx.lineWidth = 0.5;
        for (var i = 0; i < count; i++) {
          for (var j = i + 1; j < count; j++) {
            var a = particles[i], b = particles[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDist) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = 'rgba(201,169,110,' + (0.25 * (1 - dist / linkDist)) + ')';
              ctx.stroke();
            }
          }
        }

        requestAnimationFrame(draw);
      }
      draw();
    })();
