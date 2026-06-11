// PARTICLE SYSTEM — Cosmos (Full Interactive, Amplified)
// ========================================
(function() {
  var canvas = document.getElementById('particles');
  var ctx = canvas.getContext('2d');
  var W, H;
  var mouseX = -9999, mouseY = -9999;
  var mouseDown = false;
  var running = true;
  var scrollY = 0, lastScrollY = 0, scrollSpeed = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', function() {
    mouseX = -9999;
    mouseY = -9999;
  });
  document.addEventListener('mousedown', function() {
    mouseDown = true;
  });
  document.addEventListener('mouseup', function() { mouseDown = false; });
  // Block context menu so long-press doesn't trigger browser menu
  document.addEventListener('contextmenu', function(e) {
    if (e.target === canvas || e.target.closest('#particles')) e.preventDefault();
  });
  document.addEventListener('visibilitychange', function() {
    running = !document.hidden;
    if (running) requestAnimationFrame(draw);
  });
  window.addEventListener('scroll', function() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  });

  // ========================================
  // STAR LAYERS
  // ========================================
  var layers = [
    { count: 150, rMin: 0.3, rMax: 0.7, speed: 0.02, alphaMin: 0.10, alphaMax: 0.25, twinkleAmp: 0.06 },
    { count: 60,  rMin: 0.6, rMax: 1.4, speed: 0.06, alphaMin: 0.20, alphaMax: 0.45, twinkleAmp: 0.15 },
    { count: 20,  rMin: 1.2, rMax: 2.5, speed: 0.12, alphaMin: 0.40, alphaMax: 0.70, twinkleAmp: 0.25 }
  ];

  var allStars = [];
  var linkableStars = [];
  var constellationStars = [];

  layers.forEach(function(layer, layerIdx) {
    for (var i = 0; i < layer.count; i++) {
      var star = {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * layer.speed,
        vy: (Math.random() - 0.5) * layer.speed * 0.6 - layer.speed * 0.1,
        r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
        baseAlpha: layer.alphaMin + Math.random() * (layer.alphaMax - layer.alphaMin),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinkleAmp: layer.twinkleAmp,
        layer: layerIdx
      };
      allStars.push(star);
      if (layerIdx >= 1) linkableStars.push(star);
      if (layerIdx === 2) constellationStars.push(star);
    }
  });

  // ========================================
  // CONSTELLATIONS
  // ========================================
  var constellations = [];
  function buildConstellations() {
    constellations = [];
    var cs = constellationStars;
    if (cs.length < 5) return;
    var used = {};
    for (var c = 0; c < 3; c++) {
      var group = [];
      var attempts = 0;
      while (group.length < 4 + Math.floor(Math.random() * 3) && attempts < 100) {
        var idx = Math.floor(Math.random() * cs.length);
        if (!used[idx]) {
          if (group.length === 0 || (function() {
            var last = group[group.length - 1];
            var d = Math.sqrt(Math.pow(cs[idx].x - last.x, 2) + Math.pow(cs[idx].y - last.y, 2));
            return d < 300;
          })()) {
            group.push(cs[idx]);
            used[idx] = true;
          }
        }
        attempts++;
      }
      if (group.length >= 3) constellations.push(group);
    }
  }
  buildConstellations();

  // ========================================
  // CURSOR TRAIL
  // ========================================
  var trailParticles = [];
  var TRAIL_MAX = 60;

  function spawnTrailParticle() {
    if (mouseX < 0) return;
    trailParticles.push({
      x: mouseX + (Math.random() - 0.5) * 8,
      y: mouseY + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.5,
      r: 0.8 + Math.random() * 1.5,
      alpha: 0.5 + Math.random() * 0.3,
      life: 0,
      maxLife: 25 + Math.random() * 20
    });
  }

  // ========================================
  // CLICK BURST + SHOCKWAVE
  // ========================================
  var burstParticles = [];
  var shockwaves = [];

  function spawnBurst(cx, cy) {
    // Particle burst
    var count = 30 + Math.floor(Math.random() * 15);
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
      var speed = 2 + Math.random() * 7;
      burstParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 0.8 + Math.random() * 2,
        alpha: 0.8,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        decay: 0.95
      });
    }
    // Shockwave ring
    shockwaves.push({
      x: cx, y: cy,
      r: 0,
      maxR: 180 + Math.random() * 80,
      alpha: 0.35,
      life: 0,
      maxLife: 25
    });
    // Push nearby stars outward
    for (var j = 0; j < allStars.length; j++) {
      var s = allStars[j];
      var ddx = s.x - cx, ddy = s.y - cy;
      var dd = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dd < 250 && dd > 0) {
        var pushForce = (250 - dd) / 250 * 6;
        s.vx += (ddx / dd) * pushForce;
        s.vy += (ddy / dd) * pushForce;
      }
    }
  }

  document.addEventListener('click', function(e) {
    spawnBurst(e.clientX, e.clientY);
  });

  // ========================================
  // AURORA
  // ========================================
  var auroraPoints = [];
  var AURORA_COUNT = 6;
  for (var ai = 0; ai < AURORA_COUNT; ai++) {
    auroraPoints.push({
      x: (W / (AURORA_COUNT - 1)) * ai,
      baseY: H * 0.15 + Math.random() * H * 0.2,
      phase: Math.random() * Math.PI * 2,
      amp: 20 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.4
    });
  }

  // ========================================
  // NEBULAE
  // ========================================
  var nebulae = [];
  for (var ni = 0; ni < 4; ni++) {
    nebulae.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 200 + Math.random() * 250,
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
      alpha: 0.012 + Math.random() * 0.018
    });
  }

  // ========================================
  // SHOOTING STARS
  // ========================================
  var shootingStars = [];
  var nextStarTime = 0;

  function spawnShootingStar(time) {
    var angle = (15 + Math.random() * 30) * Math.PI / 180;
    var speed = 10 + Math.random() * 8;
    shootingStars.push({
      x: Math.random() * W * 0.8,
      y: Math.random() * H * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 80 + Math.random() * 80,
      life: 0,
      maxLife: 30 + Math.random() * 20,
      brightness: 0.7 + Math.random() * 0.3
    });
  }

  // ========================================
  // CONFIG — amplified values
  // ========================================
  var repulseDist = 260;
  var linkDist = 150;
  var gravityDist = 320;

  // ========================================
  // DRAW
  // ========================================
  function draw(time) {
    var t = time / 1000;
    ctx.clearRect(0, 0, W, H);

    // Scroll warp
    var curScroll = scrollY;
    scrollSpeed = Math.abs(curScroll - lastScrollY);
    lastScrollY = curScroll;
    var warpFactor = Math.min(1, scrollSpeed / 25);

    // --- Aurora ---
    for (var api = 0; api < auroraPoints.length; api++) {
      auroraPoints[api].x = (W / (AURORA_COUNT - 1)) * api + Math.sin(t * 0.1 + api) * 30;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var ab = 0; ab < 3; ab++) {
      var bandOffset = ab * 25;
      var bandAlpha = 0.015 - ab * 0.004;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var api2 = 0; api2 < auroraPoints.length; api2++) {
        var ap2 = auroraPoints[api2];
        var ay = ap2.baseY + Math.sin(t * ap2.speed + ap2.phase) * ap2.amp + bandOffset;
        if (api2 === 0) {
          ctx.lineTo(0, ay);
        } else {
          var prev = auroraPoints[api2 - 1];
          var prevY = prev.baseY + Math.sin(t * prev.speed + prev.phase) * prev.amp + bandOffset;
          ctx.quadraticCurveTo(prev.x, prevY, (prev.x + ap2.x) / 2, (prevY + ay) / 2);
        }
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      var aGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      aGrad.addColorStop(0, 'rgba(201,169,110,' + bandAlpha + ')');
      aGrad.addColorStop(0.4, 'rgba(180,140,90,' + (bandAlpha * 0.5) + ')');
      aGrad.addColorStop(1, 'rgba(201,169,110,0)');
      ctx.fillStyle = aGrad;
      ctx.fill();
    }
    ctx.restore();

    // --- Nebulae ---
    for (var ni2 = 0; ni2 < nebulae.length; ni2++) {
      var nb = nebulae[ni2];
      nb.x += nb.vx; nb.y += nb.vy;
      if (nb.x < -nb.r) nb.x = W + nb.r;
      if (nb.x > W + nb.r) nb.x = -nb.r;
      if (nb.y < -nb.r) nb.y = H + nb.r;
      if (nb.y > H + nb.r) nb.y = -nb.r;
      var nGrad = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
      nGrad.addColorStop(0, 'rgba(201,169,110,' + nb.alpha + ')');
      nGrad.addColorStop(0.5, 'rgba(201,169,110,' + (nb.alpha * 0.4) + ')');
      nGrad.addColorStop(1, 'rgba(201,169,110,0)');
      ctx.fillStyle = nGrad;
      ctx.fillRect(nb.x - nb.r, nb.y - nb.r, nb.r * 2, nb.r * 2);
    }

    // --- Stars ---
    for (var i = 0; i < allStars.length; i++) {
      var s = allStars[i];

      // Mouse repulsion (amplified)
      if (s.layer >= 1) {
        var dx = s.x - mouseX;
        var dy = s.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < repulseDist && dist > 0) {
          var force = (repulseDist - dist) / repulseDist * 1.2;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }
      }

      // Gravity well (amplified)
      if (mouseDown && mouseX > 0) {
        var gdx = mouseX - s.x, gdy = mouseY - s.y;
        var gDist = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gDist < gravityDist && gDist > 10) {
          var gForce = (gravityDist - gDist) / gravityDist * 0.8;
          s.vx += (gdx / gDist) * gForce;
          s.vy += (gdy / gDist) * gForce;
        }
      }

      s.x += s.vx;
      s.y += s.vy;

      // Scroll warp
      var warpStretch = 0;
      if (warpFactor > 0.1 && s.layer >= 1) {
        warpStretch = warpFactor * (s.layer === 2 ? 50 : 25);
      }

      s.vx *= 0.985;
      s.vy *= 0.985;

      if (s.x < -5) s.x = W + 5;
      if (s.x > W + 5) s.x = -5;
      if (s.y < -5) s.y = H + 5;
      if (s.y > H + 5) s.y = -5;

      // Twinkle
      var twinkle = Math.sin(t * s.twinkleSpeed + s.phase) * s.twinkleAmp;
      var alpha = s.baseAlpha + twinkle;

      // Mouse proximity glow
      var mdx = s.x - mouseX, mdy = s.y - mouseY;
      var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      var radius = s.r;
      if (mDist < 160) {
        var proximity = 1 - mDist / 160;
        alpha = Math.min(1, alpha + proximity * 0.4);
        radius = s.r * (1 + proximity * 0.3);
      }

      alpha = Math.max(0, Math.min(1, alpha));

      // Warp streak
      if (Math.abs(warpStretch) > 2) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y - warpStretch);
        ctx.strokeStyle = 'rgba(201,169,110,' + (alpha * 0.5) + ')';
        ctx.lineWidth = radius;
        ctx.stroke();
      }

      // Star
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,169,110,' + alpha + ')';
      ctx.fill();

      // Near layer glow
      if (s.layer === 2) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,169,110,' + (alpha * 0.1) + ')';
        ctx.fill();
      }
    }

    // --- Connection lines ---
    ctx.lineWidth = 0.5;
    for (var ci = 0; ci < linkableStars.length; ci++) {
      for (var cj = ci + 1; cj < linkableStars.length; cj++) {
        var ca = linkableStars[ci], cb = linkableStars[cj];
        var cdx = ca.x - cb.x, cdy = ca.y - cb.y;
        var cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cDist < linkDist) {
          var lineAlpha = 0.15 * (1 - cDist / linkDist);
          var midX = (ca.x + cb.x) / 2, midY = (ca.y + cb.y) / 2;
          var cmDx = midX - mouseX, cmDy = midY - mouseY;
          var cmDist = Math.sqrt(cmDx * cmDx + cmDy * cmDy);
          if (cmDist < 200) lineAlpha += 0.2 * (1 - cmDist / 200);
          ctx.beginPath();
          ctx.moveTo(ca.x, ca.y);
          ctx.lineTo(cb.x, cb.y);
          ctx.strokeStyle = 'rgba(201,169,110,' + Math.min(0.4, lineAlpha) + ')';
          ctx.stroke();
        }
      }
    }

    // --- Constellation patterns ---
    for (var cni = 0; cni < constellations.length; cni++) {
      var cGroup = constellations[cni];
      var pulse = 0.1 + Math.sin(t * 1.5 + cni * 2) * 0.08;
      ctx.lineWidth = 1;
      for (var cgj = 0; cgj < cGroup.length - 1; cgj++) {
        ctx.beginPath();
        ctx.moveTo(cGroup[cgj].x, cGroup[cgj].y);
        ctx.lineTo(cGroup[cgj + 1].x, cGroup[cgj + 1].y);
        ctx.strokeStyle = 'rgba(201,169,110,' + pulse + ')';
        ctx.stroke();
      }
    }

    // --- Gravity well visual ---
    if (mouseDown && mouseX > 0) {
      for (var wr = 0; wr < 3; wr++) {
        var wrR = 20 + wr * 25 + Math.sin(t * 3 + wr) * 8;
        var wrAlpha = 0.04 * (1 - wr * 0.2) + Math.sin(t * 2.5 + wr) * 0.015;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, wrR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(201,169,110,' + Math.max(0, wrAlpha) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // --- Cursor trail (amplified) ---
    if (mouseX > 0) spawnTrailParticle();
    for (var ti = trailParticles.length - 1; ti >= 0; ti--) {
      var tp = trailParticles[ti];
      tp.x += tp.vx; tp.y += tp.vy;
      tp.vy -= 0.03;
      tp.life++;
      if (tp.life > tp.maxLife) { trailParticles.splice(ti, 1); continue; }
      var tpRatio = tp.life / tp.maxLife;
      var tpAlpha = tp.alpha * (1 - tpRatio);
      var tpR = tp.r * (1 - tpRatio * 0.4);
      // Core
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tpR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,169,110,' + tpAlpha + ')';
      ctx.fill();
    }
    if (trailParticles.length > TRAIL_MAX * 2) trailParticles.splice(0, trailParticles.length - TRAIL_MAX);

    // --- Shockwave rings ---
    for (var si2 = shockwaves.length - 1; si2 >= 0; si2--) {
      var sw = shockwaves[si2];
      sw.life++;
      sw.r = sw.maxR * (sw.life / sw.maxLife);
      sw.alpha = 0.5 * (1 - sw.life / sw.maxLife);
      if (sw.life > sw.maxLife) { shockwaves.splice(si2, 1); continue; }
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201,169,110,' + sw.alpha + ')';
      ctx.lineWidth = 2 * (1 - sw.life / sw.maxLife);
      ctx.stroke();
    }

    // --- Click burst ---
    for (var bi = burstParticles.length - 1; bi >= 0; bi--) {
      var bp = burstParticles[bi];
      bp.x += bp.vx; bp.y += bp.vy;
      bp.vx *= bp.decay; bp.vy *= bp.decay;
      bp.life++;
      if (bp.life > bp.maxLife) { burstParticles.splice(bi, 1); continue; }
      var bpRatio = bp.life / bp.maxLife;
      var bpAlpha = bp.alpha * (1 - bpRatio);
      var bpR = bp.r * (1 - bpRatio * 0.3);
      // Core
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bpR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,169,110,' + bpAlpha + ')';
      ctx.fill();
      // Trail
      ctx.beginPath();
      ctx.moveTo(bp.x, bp.y);
      ctx.lineTo(bp.x - bp.vx * 4, bp.y - bp.vy * 4);
      ctx.strokeStyle = 'rgba(201,169,110,' + (bpAlpha * 0.3) + ')';
      ctx.lineWidth = bpR * 0.6;
      ctx.stroke();
    }

    // --- Shooting Stars ---
    if (time > nextStarTime && shootingStars.length < 2) {
      spawnShootingStar(time);
      nextStarTime = time + 3000 + Math.random() * 5000;
    }
    for (var ssi = shootingStars.length - 1; ssi >= 0; ssi--) {
      var ss = shootingStars[ssi];
      ss.x += ss.vx; ss.y += ss.vy;
      ss.life++;
      if (ss.life > ss.maxLife || ss.x > W + 100 || ss.y > H + 100) {
        shootingStars.splice(ssi, 1); continue;
      }
      var lifeRatio = ss.life / ss.maxLife;
      var fadeAlpha = ss.brightness;
      if (lifeRatio < 0.15) fadeAlpha *= lifeRatio / 0.15;
      else if (lifeRatio > 0.7) fadeAlpha *= (1 - lifeRatio) / 0.3;
      var spd = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
      var tailX = ss.x - (ss.vx / spd) * ss.len;
      var tailY = ss.y - (ss.vy / spd) * ss.len;
      var sGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      sGrad.addColorStop(0, 'rgba(201,169,110,0)');
      sGrad.addColorStop(1, 'rgba(201,169,110,' + fadeAlpha + ')');
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = sGrad;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,240,' + fadeAlpha + ')';
      ctx.fill();
    }

    // --- Cursor ambient glow ---
    if (mouseX > 0 && mouseY > 0) {
      var cG = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 100);
      cG.addColorStop(0, 'rgba(201,169,110,0.05)');
      cG.addColorStop(0.5, 'rgba(201,169,110,0.02)');
      cG.addColorStop(1, 'rgba(201,169,110,0)');
      ctx.fillStyle = cG;
      ctx.fillRect(mouseX - 100, mouseY - 100, 200, 200);
    }

    if (running) requestAnimationFrame(draw);
  }

  draw(0);
})();
