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
    lose: new Audio('assets/sounds/wcgertcz074.mp3')
  };

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
    const isElite = score > 800 && Math.random() < 0.4; // 40% chance of elite enemy after 800 score
    const isFlying = !isElite && Math.random() < 0.30;
    const isStatic = !isElite && !isFlying && Math.random() < 0.40;
    
    // Larger enemies
    const h = isFlying ? 65 : (isStatic ? 40 : 75);
    const w = isFlying ? 70 : (isStatic ? 40 : 80);
    
    const baseY = isFlying ? groundY - 60 - Math.random() * 40 : groundY;
    
    enemies.push({
      x: canvas.width + 50,
      y: baseY,
      w,
      h,
      flying: isFlying,
      static: isStatic,
      elite: isElite,
      hasFired: false, // Elite enemies shoot once
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleAmp: 4 + Math.random() * 6,
      wobbleSpeed: 0.06 + Math.random() * 0.04,
      animFrame: 0
    });
  }

  // ─── Music ───────────────────────────────────────────────────────────────
  let musicInterval = null;
  const zeldaMelody = [
    {n: 466.16, d: 0.2}, {n: 466.16, d: 0.2}, {n: 466.16, d: 0.2}, {n: 466.16, d: 0.6},
    {n: 349.23, d: 0.6}, {n: 466.16, d: 0.3}, {n: 466.16, d: 0.1}, {n: 523.25, d: 0.1}, {n: 587.33, d: 0.1}, {n: 622.25, d: 0.1},
    {n: 698.46, d: 0.8}, {n: 0, d: 0.2}
  ];
  let noteIdx = 0;

  function stopMusic() {
    if (musicInterval) clearTimeout(musicInterval);
    musicInterval = null;
  }

  function startMusic() {
    stopMusic();
    noteIdx = 0;
    playNextNote();
  }

  function playNextNote() {
    if (isMuted) {
      musicInterval = setTimeout(playNextNote, 500); // Wait and try again
      return;
    }
    const note = zeldaMelody[noteIdx];
    if (note.n > 0) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.n * 0.4, audioCtx.currentTime); // chiptune bass
      g.gain.setValueAtTime(0.02, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + note.d);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + note.d);
    }
    musicInterval = setTimeout(() => {
      noteIdx = (noteIdx + 1) % zeldaMelody.length;
      playNextNote();
    }, note.d * 1000);
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
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
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
      // Hide Modal if restarting
      if (state === 'gameover') {
        const modal = document.getElementById('save-score-modal');
        if (modal) modal.classList.add('hidden');
      }
      doJump();
    }
    if (e.code === 'KeyC' && state === 'title') {
      currentCharIdx = (currentCharIdx + 1) % characters.length;
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

  // Touch / Click
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    doJump();
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
    
    // Animation cycle for player (synchronized with score/speed for fluidity)
    const animSpeed = boostActive ? 4 : 12; 
    player.animFrame = Math.floor(score / animSpeed) % 3;
    
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
      // animate elite enemy
      if (e.elite) {
        e.animFrame = Math.floor(frame / 18) % 5; // Much slower (was /10)
        
        // Fireball logic: Shoot when elite is on screen
        if (!e.hasFired && e.x < canvas.width - 20) {
          e.hasFired = true;
          enemies.push({
            x: e.x + 10,
            y: e.y - e.h * 0.7, // Mouth height
            w: 45,
            h: 30,
            isFire: true,
            speed: currentSpeed * 0.5, // Much slower (was 1.15)
            animFrame: 0
          });
        }
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
        state = 'gameover';
        stopMusic();
        
        if (score > hiScore) {
          hiScore = score;
          localStorage.setItem('squadHigh', String(hiScore));
          playSound('hiScore'); // Yay!
        } else {
          playSound('death'); // Fart
          setTimeout(() => playSound('lose'), 150); // Faster Fail sound
        }
        player.dead = true;
        
        // Update high score & show modal
        if (score > hiScore) {
          hiScore = Math.floor(score);
          localStorage.setItem('squadRunner_hiScore', hiScore);
        }
        
        // Show Modern Save Score Modal & Reset to Question State
        const modal = document.getElementById('save-score-modal');
        const qDiv = document.getElementById('modal-question');
        const sDiv = document.getElementById('modal-success');
        if (modal) {
          if (qDiv) qDiv.classList.remove('hidden');
          if (sDiv) sDiv.classList.add('hidden');
          modal.classList.remove('hidden');
        }

        // death explosion particles
        spawnParticles(player.x, player.y - player.h / 2, 25,
          ['#ff3399', '#ff69b4', '#ffaadd', '#ff1493', '#ffffff'],
          [-5, 5], [-6, 2]);
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

    ctx.font = 'bold 13px "Courier New"';
    ctx.textAlign = 'left';
    // HI score
    ctx.fillStyle = '#ff88cc';
    ctx.strokeStyle = '#220011';
    ctx.lineWidth = 3;
    const hiText = 'HIGH SCORE: ' + String(hiScore).padStart(5, '0');
    ctx.strokeText(hiText, 10, 22);
    ctx.fillText(hiText, 10, 22);
    
    // Coins count
    ctx.fillStyle = '#ffd700';
    const coinText = 'COINS ' + String(coinsCollectedTotal).padStart(3, '0');
    ctx.strokeText(coinText, 100, 22);
    ctx.fillText(coinText, 100, 22);

    // Current score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    const scoreText = String(score).padStart(5, '0');
    ctx.strokeText(scoreText, canvas.width - 10, 22);
    ctx.fillText(scoreText, canvas.width - 10, 22);
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
    ctx.fillStyle = '#0d0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGround();
    
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

    if (Math.floor(frame / 30) % 2 === 0) {
      ctx.font = '12px "Courier New"';
      ctx.fillStyle = '#ccaaff';
      ctx.fillText('[ PRESS SPACE OR TAP TO START ]', canvas.width / 2, 60);
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillStyle = '#ffff00';
      ctx.fillText('[ PRESS C TO CHANGE CHARACTER ]', canvas.width / 2, 115);
      ctx.fillStyle = '#00ff00';
      ctx.fillText('[ PRESS L FOR LEADERBOARDS ]', canvas.width / 2, 135);
    }

    ctx.font = '12px "Courier New"';
    ctx.fillStyle = '#ff88cc';
    ctx.fillText('HIGH SCORE: ' + String(hiScore).padStart(5, '0'), canvas.width / 2, 80);

    // Controls hint
    ctx.font = '9px "Courier New"';
    ctx.fillStyle = 'rgba(200,150,255,0.7)';
    ctx.fillText('SPACE/UP = Jump | DOWN = Duck | 2x = Double Jump', canvas.width / 2, 100);
    
    // Increment frame for title animation
    frame++;
  }

  // ─── Draw Game ───────────────────────────────────────────────────────────
  function drawGame() {
    // Day/night sky
    drawSky();
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
        } else if (e.isFire) {
          eImg = fireAnim[e.animFrame];
        }

        if (eImg && eImg.complete) {
          drawImageNoWhite(eImg, e.x, e.y - e.h, e.w, e.h);
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
    ctx.fillStyle = '#ff3399';
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 45);
    ctx.shadowBlur = 0;

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SCORE: ' + score, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#cc99ff';
    ctx.fillText('HIGH SCORE: ' + hiScore, canvas.width / 2, canvas.height / 2 + 28);

    if (Math.floor(frame / 25) % 2 === 0) {
      ctx.font = '14px "Courier New"';
      ctx.fillStyle = '#ff88cc';
      ctx.fillText('[ PRESS SPACE TO RESTART ]', canvas.width / 2, canvas.height / 2 + 65);
      ctx.font = 'bold 11px "Courier New"';
      ctx.fillStyle = '#ccaaff';
      ctx.fillText('[ PRESS ESC FOR MENU ]', canvas.width / 2, canvas.height / 2 + 90);
    }
  }

  // ─── Main render loop ────────────────────────────────────────────────────
  function loop() {
    frame++;
    update();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === 'title') drawTitle();
    else if (state === 'playing') drawGame();
    else if (state === 'gameover') drawGameOver();

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
    if (state === 'title' && !musicInterval && !isMuted) startMusic();
  };
  window.addEventListener('mousedown', tryStartMusic, { once: true });
  window.addEventListener('keydown', tryStartMusic, { once: true });

})();
