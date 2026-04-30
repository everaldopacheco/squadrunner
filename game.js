// ─── Squad Parrots Runner — game.js ───────────────────────────────────────────
// Modular game engine with squish/bounce, wobble enemies, day/night cycle,
// particles, progressive difficulty, duck, double-jump, and HUD improvements.

(function () {
  'use strict';

  // ─── Canvas setup ────────────────────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 300;

  // ─── Asset loading ───────────────────────────────────────────────────────
  const characters = [
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() },
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() },
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() },
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() },
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() },
    { run: [new Image(), new Image(), new Image()], jump: new Image(), duck: new Image() }
  ];
  // Character 1
  characters[0].run[0].src = 'characters/p1-pose1.png';
  characters[0].run[1].src = 'characters/p1-pose2.png';
  characters[0].run[2].src = 'characters/p1-pose3.png';
  characters[0].jump.src = 'characters/p1-pose4.png';
  characters[0].duck.src = 'characters/p1-pose5.png';
  // Character 2 (The Royal Owl)
  characters[1].run[0].src = 'characters/p5-pose1.png';
  characters[1].run[1].src = 'characters/p5-pose2.png';
  characters[1].run[2].src = 'characters/p5-pose3.png';
  characters[1].jump.src = 'characters/p5-pose5.png'; 
  characters[1].duck.src = 'characters/p5-pose4.png'; 

  // Character 3
  characters[2].run[0].src = 'characters/p3-pose1.png';
  characters[2].run[1].src = 'characters/p3-pose2.png';
  characters[2].run[2].src = 'characters/p3-pose3.png';
  characters[2].jump.src = 'characters/p3-pose5.png';
  characters[2].duck.src = 'characters/p3-pose4.png';

  // Character 4
  characters[3].run[0].src = 'characters/p4-pose1.png';
  characters[3].run[1].src = 'characters/p4-pose2.png';
  characters[3].run[2].src = 'characters/p4-pose3.png';
  characters[3].jump.src = 'characters/p4-pose5.png';
  characters[3].duck.src = 'characters/p4-pose4.png';

  // Character 5 (The Return of the OG)
  characters[4].run[0].src = 'characters/p2-pose01.png';
  characters[4].run[1].src = 'characters/p2-pose02.png';
  characters[4].run[2].src = 'characters/p2-pose03.png';
  characters[4].jump.src = 'characters/p2-pose05.png';
  characters[4].duck.src = 'characters/p2-pose04.png';
  
  // Character 6 (Neon)
  characters[5].run[0].src = 'characters/p6-pose1.png';
  characters[5].run[1].src = 'characters/p6-pose2.png';
  characters[5].run[2].src = 'characters/p6-pose3.png';
  characters[5].jump.src = 'characters/p6-pose5.png';
  characters[5].duck.src = 'characters/p6-pose4.png';

  let currentCharIdx = 0;
  
  const enemyGroundImg = new Image();
  enemyGroundImg.src = 'characters/v1-pose2.png';

  const enemyAirImg = new Image();
  enemyAirImg.src = 'characters/v1-pose4.png';

  // Second Enemy (Elite Runner)
  const enemy2Run = [new Image(), new Image(), new Image(), new Image(), new Image()];
  enemy2Run[0].src = 'characters/v2-pose1.png';
  enemy2Run[1].src = 'characters/v2-pose2.png';
  enemy2Run[2].src = 'characters/v2-pose3.png';
  enemy2Run[3].src = 'characters/v2-pose4.png';
  enemy2Run[4].src = 'characters/v2-pose5.png';

  // Fire Projectile
  const fireAnim = [new Image(), new Image(), new Image()];
  fireAnim[0].src = 'characters/fogo-pose1.png';
  fireAnim[1].src = 'characters/fogo-pose2.png';
  fireAnim[2].src = 'characters/fogo-pose3.png';

  // Enemy 3 (Flying Sentry)
  const enemy3Anim = [new Image(), new Image()];
  enemy3Anim[0].src = 'characters/v3_pose1.png';
  enemy3Anim[1].src = 'characters/v3-pose2.png';

  // ─── Game state ──────────────────────────────────────────────────────────
  let state = 'title';        // title | playing | gameover
  let frame = 0;
  let score = 0;
  let hiScore = parseInt(localStorage.getItem('squadHigh') || '0', 10);
  let highScoreBeaten = false; // flag to trigger sound only once per game

  // ─── Speed / Difficulty ──────────────────────────────────────────────────
  const BASE_SPEED = 3.5;
  const MAX_SPEED = 18; // Keep high for late game challenge
  let speed = BASE_SPEED;
  let nextSpawn = 120;
  const MIN_SPAWN = 45; // More breathing room

  // ─── Collection / Boosts ─────────────────────────────────────────────────
  let coins = [];
  let coinsCollectedTotal = 0; // Total in current game
  let boostActive = false;
  let boostTimer = 0;
  const BOOST_DURATION = 180; // 3 seconds at 60fps

  // ─── Parallax Background ──────────────────────────────────────────────
  const PARALLAX_W = 1200;
  const parallax = {
    mountains: { speed: 0.08, offset: 0, points: [] },
    buildings: { speed: 0.25, offset: 0, shapes: [] },
    bushes:    { speed: 0.50, offset: 0, shapes: [] },
  };

  // ─── Death Slow-Mo State ──────────────────────────────────────────────
  const DYING_DURATION = 80;  // frames of slow-mo (~1.3s real-time)
  let dyingTimer = 0;
  let shakeX = 0, shakeY = 0;
  let shakeIntensity = 0;
  let deathZoom = 1;

  // ─── Ground ──────────────────────────────────────────────────────────────
  const GROUND_OFFSET = 40;              // pixels from bottom for ground line

  // Expose state for Web3 module
  window.getSquadData = () => ({
    score: Math.floor(score),
    charId: currentCharIdx,
    hiScore: hiScore
  });

  const groundY = canvas.height - GROUND_OFFSET;

  // ─── Player ──────────────────────────────────────────────────────────────
  const PLAYER_W = 75;
  const PLAYER_H = 85; 
  const DUCK_H = 60; // More realistic height reduction
  const JUMP_FORCE = -15;
  const GRAVITY = 0.55;
  const MAX_JUMPS = 2;
  const CHAR_NAMES = [
    "PARROT TRADOOOOR", 
    "PARROT ROYAL", 
    "PARROT CHAD", 
    "PARROT JETPACK", 
    "PARROT WHALE",
    "PARROT NEON"
  ];

  const player = {
    x: 80,
    y: groundY,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    jumping: false,
    ducking: false,
    dead: false,
    jumpCount: 0,
    animFrame: 0,
    // squish/bounce animation
    squishX: 1,
    squishY: 1,
    squishVX: 0,
    squishVY: 0,
  };

  function resetPlayer() {
    player.y = groundY;
    player.vy = 0;
    player.jumping = false;
    player.ducking = false;
    player.dead = false;
    player.jumpCount = 0;
    player.animFrame = 0;
    player.squishX = 1;
    player.squishY = 1;
    player.squishVX = 0;
    player.squishVY = 0;
    player.h = PLAYER_H;
  }

  let isMuted = false;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const sfx = {
    coin: new Audio('assets/sounds/applepay.mp3'),
    death: new Audio('assets/sounds/perfect-fart.mp3'),
    yay: new Audio('assets/sounds/kids-saying-yay-sound-effect_3.mp3'),
    yippee: new Audio('assets/sounds/yippeeeeeeeeeeeeee.mp3'),
    lose: new Audio('assets/sounds/wcgertcz074.mp3'),
    bgMusic: new Audio('assets/sounds/soundtrack.mp3')
  };
  sfx.bgMusic.loop = true;
  sfx.bgMusic.volume = 0.3; // Slightly lower default volume
  sfx.bgMusic.preload = 'auto';
  sfx.bgMusic.load(); 

  function playSound(type) {
    if (isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // External MP3 assets
    if (type === 'coin') { 
      sfx.coin.currentTime = 0; sfx.coin.play().catch(()=>{}); return; 
    }
    if (type === 'death') { 
      sfx.death.currentTime = 0; sfx.death.play().catch(()=>{}); return; 
    }
    if (type === 'yippee') { 
      sfx.yippee.currentTime = 0; sfx.yippee.play().catch(()=>{}); return; 
    }
    if (type === 'hiScore') { 
      sfx.yay.currentTime = 0; sfx.yay.play().catch(()=>{}); return; 
    }
    if (type === 'lose') { 
      sfx.lose.currentTime = 0; sfx.lose.play().catch(()=>{}); return; 
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'jump') {
      // Chicken "cluck" sound: two quick pulses
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    }
  }

  function playHiScoreSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  }

  // ─── Enemies & Obstacles ─────────────────────────────────────────────────
  let enemies = [];

  function spawnEnemy() {
    const isElite = score > 800 && Math.random() < 0.35;
    const isV3 = !isElite && score > 1200 && Math.random() < 0.25; // Sentry after 1200
    const isFlying = !isElite && !isV3 && Math.random() < 0.25;
    const isStatic = !isElite && !isFlying && !isV3 && Math.random() < 0.35;
    
    const h = (isFlying || isV3) ? 65 : (isStatic ? 40 : 75);
    const w = (isFlying || isV3) ? 70 : (isStatic ? 40 : 80);
    
    const baseY = (isFlying || isV3) ? groundY - 65 - Math.random() * 50 : groundY;
    
    enemies.push({
      x: canvas.width + 50,
      y: baseY,
      w,
      h,
      flying: isFlying || isV3,
      isV3: isV3,
      static: isStatic,
      elite: isElite,
      hasFired: false,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleAmp: isV3 ? 8 : 5, // Sentry wobbles more
      wobbleSpeed: isV3 ? 0.08 : 0.06,
      animFrame: 0
    });
  }

  // ─── Music ───────────────────────────────────────────────────────────────
  function stopMusic() {
    sfx.bgMusic.pause();
    sfx.bgMusic.currentTime = 0;
  }

  function startMusic() {
    if (isMuted) return;
    
    // Ensure AudioContext is active
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const playPromise = sfx.bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Autoplay blocked. Waiting for interaction.", e);
        // Robust interaction listener
        const resumeAudio = () => {
          sfx.bgMusic.play().then(() => {
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
          });
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
      });
    }
  }

  // ─── Input ───────────────────────────────────────────────────────────────
  function spawnCoin() {
    // Coins spawn at various heights
    const coinY = groundY - 40 - Math.random() * 80;
    coins.push({
      x: canvas.width + 50,
      y: coinY,
      size: 10,
      collected: false,
    });
  }

  // ─── Particles ───────────────────────────────────────────────────────────
  let particles = [];

  function spawnParticles(x, y, count, colors, vxRange, vyRange) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: vxRange[0] + Math.random() * (vxRange[1] - vxRange[0]),
        vy: vyRange[0] + Math.random() * (vyRange[1] - vyRange[0]),
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        isDust: false
      });
    }
  }

  function spawnDust() {
    if (player.dead || state !== 'playing') return;
    // Only spawn dust when touching ground
    if (player.y >= groundY - 5) {
      const count = 2 + Math.floor(Math.random() * 3); // More dust!
      for (let i = 0; i < count; i++) {
        const colors = ['#ffffff', '#cccccc', '#999999', '#eeeeee'];
        const size = 3 + Math.random() * 4;
        particles.push({
          x: player.x - 15 + Math.random() * 10,
          y: groundY - 2,
          vx: -2 - Math.random() * 4, // Faster backwards
          vy: -1 - Math.random() * 3, // More upward pop
          life: 1.0,
          decay: 0.04 + Math.random() * 0.06,
          size: size, // Larger, crunchier particles
          color: colors[Math.floor(Math.random() * colors.length)],
          isDust: true,
          initialSize: size
        });
      }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      // Dust floats more, others fall faster
      p.vy += p.isDust ? 0.01 : 0.15;
      p.life -= p.decay;
      
      // Arcade style: dust particles shrink as they fade
      if (p.isDust) {
        p.size = p.initialSize * p.life;
      }
      
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      // Shorter, sharper fade-out for arcade look
      ctx.globalAlpha = p.life > 0.5 ? 1 : p.life * 2;
      ctx.fillStyle = p.color;
      // Fixed pixel-perfect squares
      const s = Math.max(1, Math.floor(p.size));
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }

  // ─── Day / Night Cycle ───────────────────────────────────────────────────
  const DAY_CYCLE_FRAMES = 1800; // ~30 sec full cycle at 60fps
  let cycleFrame = 0;

  function getDaySkyColors() {
    const t = (cycleFrame % DAY_CYCLE_FRAMES) / DAY_CYCLE_FRAMES;
    // 0..0.25 dawn | 0.25..0.5 day | 0.5..0.75 dusk | 0.75..1 night
    if (t < 0.25) {
      // dawn
      const f = t / 0.25;
      return {
        top: lerpColor([15, 10, 35], [60, 120, 200], f),
        bot: lerpColor([40, 15, 50], [180, 140, 80], f),
        stars: 1 - f,
      };
    } else if (t < 0.5) {
      // day
      const f = (t - 0.25) / 0.25;
      return {
        top: lerpColor([60, 120, 200], [130, 180, 230], f),
        bot: lerpColor([180, 140, 80], [200, 190, 160], f),
        stars: 0,
      };
    } else if (t < 0.75) {
      // dusk
      const f = (t - 0.5) / 0.25;
      return {
        top: lerpColor([130, 180, 230], [50, 20, 60], f),
        bot: lerpColor([200, 190, 160], [120, 50, 30], f),
        stars: f * 0.5,
      };
    } else {
      // night
      const f = (t - 0.75) / 0.25;
      return {
        top: lerpColor([50, 20, 60], [15, 10, 35], f),
        bot: lerpColor([120, 50, 30], [40, 15, 50], f),
        stars: 0.5 + f * 0.5,
      };
    }
  }

  function lerpColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  function rgbStr(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

  function drawSky() {
    const sky = getDaySkyColors();
    const grd = ctx.createLinearGradient(0, 0, 0, groundY);
    grd.addColorStop(0, rgbStr(sky.top));
    grd.addColorStop(1, rgbStr(sky.bot));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, groundY + PLAYER_H);

    // Stars
    if (sky.stars > 0) {
      ctx.fillStyle = `rgba(255,255,200,${sky.stars * 0.7})`;
      for (let i = 0; i < 50; i++) {
        const sx = ((i * 137 + frame * 0.1) % canvas.width);
        const sy = ((i * 97 + i * 31) % (groundY - 20));
        const sz = (i % 3 === 0) ? 2 : 1;
        ctx.fillRect(sx, sy, sz, sz);
      }
    }
  }

  // ─── Parallax Generation ─────────────────────────────────────────────
  function generateParallax() {
    // Mountains: continuous heightmap
    parallax.mountains.points = [];
    parallax.mountains.offset = 0;
    let mh = 30;
    for (let x = 0; x <= PARALLAX_W; x += 6) {
      mh += (Math.random() - 0.48) * 5;
      mh = Math.max(12, Math.min(65, mh));
      parallax.mountains.points.push({ x, h: mh });
    }
    // Buildings: rectangles
    parallax.buildings.shapes = [];
    parallax.buildings.offset = 0;
    let bx = 0;
    while (bx < PARALLAX_W) {
      const w = 12 + Math.random() * 20;
      const h = 16 + Math.random() * 42;
      const gap = 3 + Math.random() * 8;
      const nWin = Math.floor(h / 12);
      const winLit = [];
      for (let i = 0; i < nWin; i++) winLit.push(Math.random() > 0.4);
      parallax.buildings.shapes.push({ x: bx, w, h, nWin, winLit });
      bx += w + gap;
    }
    // Bushes: semi-circles
    parallax.bushes.shapes = [];
    parallax.bushes.offset = 0;
    let sx = 0;
    while (sx < PARALLAX_W) {
      const r = 5 + Math.random() * 10;
      sx += r * 2 + 4 + Math.random() * 14;
      parallax.bushes.shapes.push({ x: sx, r });
    }
  }
  generateParallax();

  // ─── Draw Parallax ──────────────────────────────────────────────────
  function drawParallax() {
    const sky = getDaySkyColors();
    const isNight = sky.stars > 0.3;
    const sb = sky.bot;

    // Layer 1: Mountains
    const mOff = parallax.mountains.offset;
    const mr = Math.max(0, sb[0] - 55);
    const mg = Math.max(0, sb[1] - 35);
    const mb = Math.min(255, sb[2] + 15);
    ctx.fillStyle = isNight ? 'rgba(18,8,35,0.75)' : `rgba(${mr},${mg},${mb},0.45)`;
    for (let copy = -1; copy <= 1; copy++) {
      ctx.beginPath();
      const dx = copy * PARALLAX_W - (mOff % PARALLAX_W);
      ctx.moveTo(dx, groundY);
      for (const p of parallax.mountains.points) ctx.lineTo(p.x + dx, groundY - p.h);
      ctx.lineTo(PARALLAX_W + dx, groundY);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 2: Buildings
    const bOff = parallax.buildings.offset;
    const bBaseCol = isNight ? [10, 5, 22] : [Math.max(0, sb[0] - 80), Math.max(0, sb[1] - 60), Math.max(0, sb[2] - 20)];
    ctx.fillStyle = `rgba(${bBaseCol[0]},${bBaseCol[1]},${bBaseCol[2]},${isNight ? 0.85 : 0.35})`;
    for (let copy = -1; copy <= 1; copy++) {
      const dx = copy * PARALLAX_W - (bOff % PARALLAX_W);
      for (const s of parallax.buildings.shapes) {
        const bx = s.x + dx;
        if (bx > canvas.width + 40 || bx + s.w < -40) continue;
        ctx.fillRect(bx, groundY - s.h, s.w, s.h);
      }
      // Windows at night
      if (isNight) {
        for (const s of parallax.buildings.shapes) {
          const bx = s.x + dx;
          if (bx > canvas.width + 40 || bx + s.w < -40) continue;
          for (let wi = 0; wi < s.nWin; wi++) {
            if (!s.winLit[wi]) continue;
            ctx.fillStyle = 'rgba(255,210,60,0.55)';
            ctx.fillRect(bx + 3, groundY - s.h + 3 + wi * 12, 3, 5);
            if (s.w > 16) ctx.fillRect(bx + s.w - 6, groundY - s.h + 3 + wi * 12, 3, 5);
          }
          ctx.fillStyle = `rgba(${bBaseCol[0]},${bBaseCol[1]},${bBaseCol[2]},0.85)`;
        }
      }
    }

    // Layer 3: Bushes
    const sOff = parallax.bushes.offset;
    ctx.fillStyle = isNight ? 'rgba(6,2,14,0.85)' : `rgba(25,45,18,0.4)`;
    for (let copy = -1; copy <= 1; copy++) {
      const dx = copy * PARALLAX_W - (sOff % PARALLAX_W);
      for (const s of parallax.bushes.shapes) {
        const bx = s.x + dx;
        if (bx > canvas.width + 30 || bx + s.r * 2 < -30) continue;
        ctx.beginPath();
        ctx.arc(bx + s.r, groundY - s.r * 0.3, s.r, Math.PI, 0);
        ctx.lineTo(bx + s.r * 2, groundY);
        ctx.lineTo(bx, groundY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ─── Collision ───────────────────────────────────────────────────────────
  function collides(a, b) {
    const ax = a.x - a.w / 2;
    const ay = a.y - a.h;
    const bx = b.x;
    const by = b.y - b.h;
    // shrink hitboxes slightly for fairness
    const shrink = 6;
    return (
      ax + shrink < bx + b.w - shrink &&
      ax + a.w - shrink > bx + shrink &&
      ay + shrink < by + b.h - shrink &&
      ay + a.h - shrink > by + shrink
    );
  }

  // ─── Controls ────────────────────────────────────────────────────────────
  function doJump() {
    if (state === 'title') {
      startGame();
      return;
    }
    if (state === 'dying') return;
    if (state === 'gameover') {
      resetGame();
      return;
    }
    if (player.jumpCount < MAX_JUMPS) {
      playSound('jump');
      if (player.jumpCount === 0) {
        // first jump particles
        spawnParticles(player.x, player.y, 12,
          ['#ff69b4', '#ff88cc', '#ffaadd', '#cc3377'],
          [-3, 3], [-2, 0]);
      }
      player.vy = JUMP_FORCE;
      player.jumping = true;
      player.jumpCount++;
      player.ducking = false;
      player.h = PLAYER_H;
      // very subtle squish on jump
      player.squishX = 0.95;
      player.squishY = 1.05;
      player.squishVX = 0.02;
      player.squishVY = -0.02;
    }
  }

  function startDuck() {
    if (state !== 'playing') return;
    if (!player.jumping) {
      player.ducking = true;
      player.h = DUCK_H;
    }
  }

  function stopDuck() {
    player.ducking = false;
    player.h = PLAYER_H;
  }

  function showLeaderboard() {
    const lb = document.getElementById('leaderboard-overlay');
    if (lb) {
      lb.classList.remove('hidden');
      fetchLeaderboard();
    }
  }

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    
    // Close leaderboard with ESC
    const lb = document.getElementById('leaderboard-overlay');
    if (lb && !lb.classList.contains('hidden')) {
      if (e.code === 'Escape') lb.classList.add('hidden');
      return;
    }

    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === 'dying') return;
      // Hide Modal if restarting
      if (state === 'gameover') {
        const modal = document.getElementById('save-score-modal');
        if (modal) modal.classList.add('hidden');
      }
      doJump();
    }
    if (e.code === 'KeyC' && state === 'title' || e.code === 'ArrowRight' && state === 'title') {
      currentCharIdx = (currentCharIdx + 1) % characters.length;
      playSound('yippee');
    }
    if (e.code === 'ArrowLeft' && state === 'title') {
      currentCharIdx = (currentCharIdx - 1 + characters.length) % characters.length;
      playSound('yippee');
    }
    if (e.code === 'KeyL' && state === 'title') {
      showLeaderboard();
    }
    if (e.code === 'Escape' && state === 'gameover') {
      state = 'title';
      playSound('coin');
      const modal = document.getElementById('save-score-modal');
      if (modal) modal.classList.add('hidden');
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      startDuck();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') stopDuck();
  });

  // Touch / Mobile Controls
  let touchStartX = 0;
  let touchStartTime = 0;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    touchStartX = x;
    touchStartTime = Date.now();

    if (state === 'title') {
      // Left side click
      if (x < canvas.width / 3) {
        currentCharIdx = (currentCharIdx - 1 + characters.length) % characters.length;
        playSound('yippee');
      } 
      // Right side click
      else if (x > (canvas.width / 3) * 2) {
        currentCharIdx = (currentCharIdx + 1) % characters.length;
        playSound('yippee');
      }
      // Center click starts game
      else {
        startGame();
      }
    } else if (state === 'playing') {
      if (y < canvas.height / 2) {
        doJump();
      } else {
        startDuck();
      }
    } else if (state === 'dying') {
      // Block input during death slow-mo
    } else if (state === 'gameover') {
      const modal = document.getElementById('save-score-modal');
      if (!modal || modal.classList.contains('hidden')) {
        startGame();
      }
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (state === 'playing') {
      stopDuck();
    }
    
    // Swipe Detection for Title
    if (state === 'title') {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const swipeDist = x - touchStartX;
      const timeDist = Date.now() - touchStartTime;

      if (timeDist < 300 && Math.abs(swipeDist) > 30) {
        if (swipeDist > 0) { // Swipe Right -> Prev
           currentCharIdx = (currentCharIdx - 1 + characters.length) % characters.length;
        } else { // Swipe Left -> Next
           currentCharIdx = (currentCharIdx + 1) % characters.length;
        }
        playSound('yippee');
      }
    }
  });

  // ─── Game lifecycle ──────────────────────────────────────────────────────
  function startGame() {
    state = 'playing';
    resetPlayer();
    enemies = [];
    coins = [];
    particles = [];
    score = 0;
    coinsCollectedTotal = 0;
    boostActive = false;
    boostTimer = 0;
    highScoreBeaten = false;
    speed = BASE_SPEED;
    frame = 0;
    nextSpawn = 120;
    cycleFrame = 0;
    // Reset death slow-mo
    dyingTimer = 0;
    shakeX = 0; shakeY = 0;
    shakeIntensity = 0;
    deathZoom = 1;
    // Regenerate parallax for visual variety
    generateParallax();
    startMusic();
    // resume audio context if suspended (browser requirement)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function resetGame() {
    startGame();
  }

  // ─── Update ──────────────────────────────────────────────────────────────
  let coinSpawnTimer = 60;

  function update() {
    if (state !== 'playing') return;

    frame++;
    cycleFrame++;
    score++;
    
    // Animation cycle for player (Ping-pong 4-frame sequence: 0, 1, 2, 1)
    const animSpeed = boostActive ? 3 : 10; 
    const runFrames = [0, 1, 2, 1];
    player.animFrame = runFrames[Math.floor(score / animSpeed) % 4];

    // Spawn dust particles while running on ground
    if (!player.jumping && !player.ducking && frame % 4 === 0) {
      spawnDust();
    }
    
    // Check for high score beaten signal
    if (!highScoreBeaten && hiScore > 0 && score > hiScore) {
      highScoreBeaten = true;
      playHiScoreSound();
    }

    // Boost logic
    if (boostActive) {
      boostTimer--;
      if (boostTimer <= 0) {
        boostActive = false;
      }
    }

    // Progressive difficulty: stronger aggressive increase
    const speedInc = (score / 400) * 1.2; // Significant speed gain every 400 pts
    speed = Math.min(MAX_SPEED, BASE_SPEED + speedInc);
    
    // Boost effect: ultra speed + invincibility
    const currentSpeed = boostActive ? speed * 3.0 : speed;

    // Update parallax offsets
    parallax.mountains.offset += currentSpeed * parallax.mountains.speed;
    parallax.buildings.offset += currentSpeed * parallax.buildings.speed;
    parallax.bushes.offset    += currentSpeed * parallax.bushes.speed;

    // Gravity
    player.vy += GRAVITY;
    player.y += player.vy;

    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.jumping = false;
      player.jumpCount = 0;
      player.squishX = 1;
      player.squishY = 1;
      player.squishVX = 0;
      player.squishVY = 0;
    }

    // Squish spring animation
    player.squishX += player.squishVX;
    player.squishY += player.squishVY;
    player.squishVX *= 0.85;
    player.squishVY *= 0.85;
    if (Math.abs(player.squishX - 1) < 0.01) player.squishX = 1;
    if (Math.abs(player.squishY - 1) < 0.01) player.squishY = 1;

    // Spawn enemies
    nextSpawn--;
    if (nextSpawn <= 0) {
      spawnEnemy();
      // Relaxed spawn interval decrease for better pacing
      const spawnFactor = (score / 600) * 10;
      const interval = Math.max(MIN_SPAWN, 130 - spawnFactor);
      nextSpawn = interval + Math.floor(Math.random() * 30);
    }
    
    // Spawn coins
    coinSpawnTimer--;
    if (coinSpawnTimer <= 0) {
      spawnCoin();
      coinSpawnTimer = 40 + Math.random() * 60;
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x -= currentSpeed;
      // Move enemies
      if (e.elite) {
        e.animFrame = Math.floor(frame / 18) % 5;
        // Fire logic restoration
        if (!e.hasFired && e.x < canvas.width - 20) {
          e.hasFired = true;
          enemies.push({
            x: e.x + 10,
            y: e.y - e.h * 0.7,
            w: 45,
            h: 30,
            isFire: true,
            speed: currentSpeed * 0.5,
            animFrame: 0
          });
        }
      } else if (e.isV3) {
        e.animFrame = Math.floor(frame / 8) % 2;
      }

      // Fireball movement & animation
      if (e.isFire) {
        e.x -= e.speed;
        e.animFrame = Math.floor(frame / 6) % 3;
      }
      // apply wobble for flying enemies
      if (e.flying) {
        e.y += Math.sin(frame * e.wobbleSpeed + e.wobbleOffset) * e.wobbleAmp * 0.15;
      }
      if (e.x + e.w < -60) {
        enemies.splice(i, 1);
        continue;
      }
      if (!boostActive && collides(player, e)) { // Invincibility during boost
        // ─── Enter slow-mo dying state ─────────────────────────
        state = 'dying';
        dyingTimer = 0;
        shakeIntensity = 14;
        deathZoom = 1;
        player.dead = true;

        // Sound
        if (score > hiScore) {
          hiScore = score;
          localStorage.setItem('squadHigh', String(hiScore));
          playSound('hiScore');
        } else {
          playSound('death');
          setTimeout(() => playSound('lose'), 150);
        }

        // Update high score
        if (score > hiScore) {
          hiScore = Math.floor(score);
          localStorage.setItem('squadRunner_hiScore', hiScore);
        }

        // Large death explosion
        spawnParticles(player.x, player.y - player.h / 2, 35,
          ['#ff3399', '#ff69b4', '#ffaadd', '#ff1493', '#ffffff', '#ff0000'],
          [-6, 6], [-8, 3]);
      }
    }
    
    // Move and collect coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.x -= currentSpeed;
      
      // Simple circle collision
      const dx = player.x - c.x;
      const dy = (player.y - player.h / 2) - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        score += 10;
        coinsCollectedTotal++;
        coins.splice(i, 1);
        playSound('coin');
        spawnParticles(c.x, c.y, 8, ['#ffd700', '#ffffff'], [-2, 2], [-2, 2]);
        
        // Boost every 10 moedas
        if (coinsCollectedTotal % 10 === 0 && coinsCollectedTotal > 0) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          spawnParticles(player.x, player.y, 25, ['#ff00ff', '#ffffff'], [-5, 5], [-5, 5]); // Pink particles
        }
        continue;
      }
      
      if (c.x < -20) {
        coins.splice(i, 1);
      }
    }

    // Update particles
    updateParticles();
  }

  // ─── Draw helpers ────────────────────────────────────────────────────────
  function drawCoins() {
    const pulse = 1 + Math.sin(frame * 0.15) * 0.15;
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (const c of coins) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  // ─── Draw helpers ────────────────────────────────────────────────────────
  const spriteCache = new Map();

  function drawImageNoWhite(img, x, y, w, h) {
    // Round dimensions to avoid over-caching slightly different sub-pixel scales
    const rw = Math.round(w);
    const rh = Math.round(h);
    const cacheKey = `${img.src}-${rw}-${rh}`;
    
    if (spriteCache.has(cacheKey)) {
      ctx.drawImage(spriteCache.get(cacheKey), x, y);
      return;
    }

    const tmp = document.createElement('canvas');
    tmp.width = rw;
    tmp.height = rh;
    const tc = tmp.getContext('2d');
    tc.drawImage(img, 0, 0, rw, rh);
    const id = tc.getImageData(0, 0, rw, rh);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const brightness = (r + g + b) / 3;
      if (brightness > 245 && r > 240 && g > 240 && b > 240) {
        d[i+3] = 0;
      }
    }
    tc.putImageData(id, 0, 0);
    spriteCache.set(cacheKey, tmp);
    ctx.drawImage(tmp, x, y, rw, rh);
  }

  function drawGround() {
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(0, groundY, canvas.width, 3); // Align with groundY precisely
    ctx.fillStyle = '#cc3377';
    const dashW = 40, gap = 20;
    const offset = (frame * speed) % (dashW + gap);
    for (let x = -offset; x < canvas.width; x += dashW + gap) {
      ctx.fillRect(x, groundY + PLAYER_H * 0.1 + 6, dashW, 2);
    }
    // fill ground below
    ctx.fillStyle = 'rgba(10,5,20,0.6)';
    ctx.fillRect(0, groundY + PLAYER_H * 0.1 + 10, canvas.width, canvas.height);
  }

  function drawScoreHUD() {
    // Semi-transparent bar
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const barH = 34;
    ctx.fillRect(0, 0, canvas.width, barH);

    // High Score (Left)
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px "Courier New"'; // Larger font
    ctx.fillStyle = '#ff88cc';
    ctx.strokeStyle = '#220011';
    ctx.lineWidth = 4;
    const hiText = hiScore.toString().padStart(5, '0');
    ctx.strokeText(hiText, 15, 25);
    ctx.fillText(hiText, 15, 25);
    
    // Coin Section (Fixed Position)
    const coinX = 110; 
    const isJackpot = coinsCollectedTotal > 0 && coinsCollectedTotal % 20 === 0;
    const isBlinking = isJackpot && Math.floor(frame / 6) % 2 === 0;

    // Draw Larger Coin Icon
    ctx.beginPath();
    ctx.fillStyle = '#ffd700';
    ctx.arc(coinX + 15, 18, 10, 0, Math.PI * 2); // Larger circle
    ctx.fill();
    ctx.fillStyle = '#fffabc';
    ctx.arc(coinX + 11, 14, 4, 0, Math.PI * 2); 
    ctx.fill();

    if (isBlinking) {
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ffff';
    } else {
      ctx.fillStyle = '#ffd700';
    }

    const coinText = coinsCollectedTotal.toString().padStart(3, '0');
    ctx.font = 'bold 22px "Courier New"'; // Even larger for coins
    ctx.strokeText(coinText, coinX + 35, 26);
    ctx.fillText(coinText, coinX + 35, 26);
    ctx.shadowBlur = 0;

    // Current Score (Right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#ffffff';
    const scoreText = Math.floor(score).toString().padStart(5, '0');
    ctx.strokeText(scoreText, canvas.width - 15, 25);
    ctx.fillText(scoreText, canvas.width - 15, 25);
    ctx.lineWidth = 1;

    // Boost Indicator
    if (boostActive) {
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(canvas.width / 2 - 40, 10, (boostTimer / BOOST_DURATION) * 80, 5);
      ctx.font = 'bold 10px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('BOOST!', canvas.width / 2, 25);
    }
  }

  // ─── Draw Title Screen ───────────────────────────────────────────────────
  function drawTitle() {
    // Night sky + parallax on title too
    drawSky();
    drawParallax();
    drawGround();
    // Slowly scroll parallax on title screen
    parallax.mountains.offset += 0.3;
    parallax.buildings.offset += 0.6;
    parallax.bushes.offset    += 1.0;
    
    // Animate title screen character (selected)
    const char = characters[currentCharIdx];
    const tFrame = Math.floor(frame / 12) % 3;
    if (char.run[tFrame].complete) {
      drawImageNoWhite(char.run[tFrame], canvas.width / 2 - 45, groundY - 90, 90, 90);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Courier New"';
    ctx.fillStyle = '#ff69b4';
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 15;
    ctx.fillText('SQUAD RUNNER', canvas.width / 2, 35);
    ctx.shadowBlur = 0;

    // Mobile Arrows & Selection Hints
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillStyle = '#00ffff';
    const arrowY = groundY - 50;
    const arrowPulse = Math.sin(frame * 0.1) * 5;
    
    // Left Arrow
    ctx.fillText('<', 50 - arrowPulse, arrowY);
    // Right Arrow
    ctx.fillText('>', canvas.width - 50 + arrowPulse, arrowY);

    if (Math.floor(frame / 30) % 2 === 0) {
      ctx.font = '10px "Courier New"';
      ctx.fillStyle = '#ccaaff';
      ctx.fillText('[ SWIPE OR TAP SIDES TO CHANGE ]', canvas.width / 2, 115);
      ctx.font = 'bold 12px "Courier New"';
      ctx.fillStyle = '#00ff00';
      ctx.fillText('[ TAP CENTER TO START ]', canvas.width / 2, 60);
      ctx.fillStyle = '#ff1493';
      ctx.fillText('[ PRESS L FOR LEADERBOARDS ]', canvas.width / 2, 135);
    }

    ctx.font = '12px "Courier New"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('HIGHSCORE: ' + String(hiScore).padStart(5, '0'), canvas.width / 2, 80);

    // Controls hint
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('SPACE/UP = Jump | DOWN = Duck | 2x = Double Jump', canvas.width / 2, 100);
    
    // Increment frame for title animation
    frame++;
  }

  // ─── Draw Game ───────────────────────────────────────────────────────────
  function drawGame() {
    // Day/night sky + parallax layers
    drawSky();
    drawParallax();
    drawGround();

    // Coins
    drawCoins();

    // Player
    const char = characters[currentCharIdx];
    // Select correct image based on state
    let pImg = char.run[player.animFrame];
    let pWidth = player.w;
    if (player.jumping) {
      pImg = char.jump;
      pWidth = player.w * 1.2; // Wings make it wider
    } else if (player.ducking) {
      pImg = char.duck;
    }

    if (pImg.complete) {
      ctx.save();
      // Boost effect glow & shield
      if (boostActive) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        
        // Neon Pink Shield
        ctx.beginPath();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        const shieldPulse = 1 + Math.sin(frame * 0.2) * 0.1;
        ctx.arc(player.x, player.y - player.h / 2, player.h * 0.7 * shieldPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;

        // Trail
        for (let i = 1; i < 5; i++) {
          ctx.globalAlpha = 1 - (i * 0.2);
          drawImageNoWhite(pImg, player.x - player.w/2 - i * 15, player.y - player.h, pWidth, player.h);
        }
        ctx.globalAlpha = 1;
      }
      
      if (player.dead) ctx.globalAlpha = 0.5;
      
      const drawW = pWidth * player.squishX;
      const drawH = player.h * player.squishY;
      const drawX = player.x - drawW / 2;
      let drawY = player.y - drawH;
      
      // Offset ducking to touch ground properly
      if (player.ducking) drawY += 5;

      drawImageNoWhite(pImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // Enemies & Obstacles (Crates and Poses)
    for (const e of enemies) {
      if (e.static) {
        // Draw a crate
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(e.x, e.y - e.h, e.w, e.h);
        ctx.strokeStyle = '#5d2e0a';
        ctx.lineWidth = 2;
        ctx.strokeRect(e.x + 2, e.y - e.h + 2, e.w - 4, e.h - 4);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.w, e.y - e.h);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else {
        let eImg = e.flying ? enemyAirImg : enemyGroundImg;
        if (e.elite) {
          eImg = enemy2Run[e.animFrame];
        } else if (e.isV3) {
          eImg = enemy3Anim[e.animFrame];
        } else if (e.isFire) {
          eImg = fireAnim[e.animFrame];
        }

        if (eImg && eImg.complete) {
          if (e.isV3) {
            ctx.save();
            ctx.translate(e.x + e.w / 2, e.y - e.h / 2);
            ctx.scale(-1, 1);
            drawImageNoWhite(eImg, -e.w / 2, -e.h / 2, e.w, e.h);
            ctx.restore();
          } else {
            drawImageNoWhite(eImg, e.x, e.y - e.h, e.w, e.h);
          }
        }
      }
    }

    // Particles
    drawParticles();

    // Score HUD
    drawScoreHUD();
  }

  // ─── Draw Game Over ──────────────────────────────────────────────────────
  function drawGameOver() {
    drawGame();

    ctx.fillStyle = 'rgba(10,5,20,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Courier New"';
    ctx.fillStyle = '#ffffff'; // White for consistency
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 45);
    ctx.shadowBlur = 0;

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SCORE: ' + score, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#ffffff'; // White
    ctx.fillText('HIGH SCORE: ' + hiScore, canvas.width / 2, canvas.height / 2 + 28);

    if (Math.floor(frame / 25) % 2 === 0) {
      ctx.font = '14px "Courier New"';
      ctx.fillStyle = '#ffffff'; // White
      ctx.fillText('[ PRESS SPACE TO RESTART ]', canvas.width / 2, canvas.height / 2 + 65);
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillStyle = '#ffffff'; // White
      ctx.fillText('[ PRESS ESC FOR MENU ]', canvas.width / 2, canvas.height / 2 + 90);
    }
  }

  // ─── Main render loop ────────────────────────────────────────────────────
  function loop() {
    // ─── Dying slow-mo logic ──────────────────────────────────────────
    if (state === 'dying') {
      dyingTimer++;
      frame++;

      // Screen shake (decays over time)
      shakeIntensity *= 0.93;
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;



      // Slow-mo: update world every 6 real frames
      if (dyingTimer % 6 === 0) {
        updateParticles();
        cycleFrame++;
        const smSpeed = speed * 0.12;
        for (const e of enemies) {
          e.x -= smSpeed;
          if (e.isFire) e.x -= smSpeed * 0.4;
        }
        for (const c of coins) c.x -= smSpeed;
        parallax.mountains.offset += smSpeed * parallax.mountains.speed;
        parallax.buildings.offset += smSpeed * parallax.buildings.speed;
        parallax.bushes.offset    += smSpeed * parallax.bushes.speed;
        // Gravity continues in slow-mo
        player.vy += GRAVITY * 0.15;
        player.y += player.vy * 0.15;
        if (player.y >= groundY) { player.y = groundY; player.vy = 0; }
      }

      // Spawn extra lingering particles during slow-mo
      if (dyingTimer % 10 === 0) {
        spawnParticles(player.x, player.y - player.h / 2, 5,
          ['#ff1493', '#ff69b4', '#ff3399', '#cc0066'],
          [-3, 3], [-4, 1]);
      }

      // Transition to gameover after duration
      if (dyingTimer >= DYING_DURATION) {
        state = 'gameover';
        stopMusic();
        shakeX = 0; shakeY = 0;
        shakeIntensity = 0;
        deathZoom = 1;

        // Show Save Score Modal
        const modal = document.getElementById('save-score-modal');
        const qDiv  = document.getElementById('modal-question');
        const sDiv  = document.getElementById('modal-success');
        if (modal) {
          if (qDiv) qDiv.classList.remove('hidden');
          if (sDiv) sDiv.classList.add('hidden');
          modal.classList.remove('hidden');
        }
      }
    } else {
      frame++;
      update();
    }

    // ─── Render ───────────────────────────────────────────────────────
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply shake during dying
    if (state === 'dying') {
      ctx.translate(shakeX, shakeY);
    }

    if (state === 'title') drawTitle();
    else if (state === 'playing') drawGame();
    else if (state === 'dying') {
      drawGame();
      // Red vignette overlay that intensifies
      const vigAlpha = Math.min(0.6, (dyingTimer / DYING_DURATION) * 0.65);
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.15,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.6
      );
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, `rgba(180,0,30,${vigAlpha})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    else if (state === 'gameover') drawGameOver();

    ctx.restore();

    requestAnimationFrame(loop);
  }

  // ─── Start ───────────────────────────────────────────────────────────────
  // Wire up Web3 Buttons
  const connBtn = document.getElementById('connect-wallet-btn');
  const saveBtn = document.getElementById('save-score-btn');
  
  if (connBtn) connBtn.addEventListener('click', connectWallet);
  if (saveBtn) saveBtn.addEventListener('click', submitScoreToChain);

  // Initialize Web3
  initWeb3();

  // Start loop immediately
  requestAnimationFrame(loop);

  // Start music on first interaction
  const tryStartMusic = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (state === 'title' && sfx.bgMusic.paused && !isMuted) startMusic();
  };
  window.addEventListener('mousedown', tryStartMusic, { once: true });
  window.addEventListener('keydown', tryStartMusic, { once: true });

  // ─── Intro Screen Button ────────────────────────────────────────────
  const introOverlay = document.getElementById('intro-overlay');
  const introBtn = document.getElementById('intro-start-btn');
  if (introBtn && introOverlay) {
    introBtn.addEventListener('click', () => {
      introOverlay.classList.add('fade-out');
      // Resume audio on this user gesture
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (sfx.bgMusic.paused && !isMuted) startMusic();
    });
  }

})();
