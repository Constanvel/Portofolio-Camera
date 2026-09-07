const MODEL_URL = "./model/";
let model, webcam;
let modelLoaded = false;
let currentPrediction = null;

const CONFIDENCE_THRESHOLD = 0.7; // 70%

// Key HARUS sama persis dengan label di model/metadata.json:
// ["Stand", "Attack", "Deffend", "Dodge"]. "Stand" = pose netral/diam.
// "Deffend" memang typo di model — biarkan, kalau diperbaiki jadi tidak cocok.
const CHALLENGE_EMOJI = {
  Attack: "⚔️ ATTACK!",
  Deffend: "🛡️ DEFEND!",
  Dodge: "💨 DODGE!",
};
const CHALLENGE_POSES = Object.keys(CHALLENGE_EMOJI);
 
// Level configuration: waktu (detik) & berapa kali benar untuk naik level
const LEVELS = {
  1: { name: "1 - ROOKIE", time: 5, correctToLevelUp: 5 },
  2: { name: "2 - APPRENTICE", time: 3, correctToLevelUp: 5 },
  3: { name: "3 - MASTER NINJA", time: 2, correctToLevelUp: 5 },
};
 
// Game state
let score = 0;
let hp = 3;
let combo = 0;
let level = 1;
let correctInLevel = 0;
let currentChallenge = null;
let challengeActive = false;
let timeLeft = 0;
let timerInterval = null;
let checkInterval = null;
let bossMode = false;
let bossSequence = [];
let bossIndex = 0;
let gameEnded = false;

// ================================================================
//  FITUR TAMBAHAN (di luar fitur dasar)
//  1. Sound effect   2. Animasi   3. High score
//  4. Game history   5. Multiple characters
// ================================================================

// ---------- FITUR 5: MULTIPLE CHARACTERS ----------
const CHARACTERS = {
  swift:     { name: "💨 Swift",     hp: 3, timeBonus: 1, scoreMult: 1 },
  tank:      { name: "🛡️ Tank",      hp: 4, timeBonus: 0, scoreMult: 1 },
  berserker: { name: "🔥 Berserker", hp: 2, timeBonus: 0, scoreMult: 1.5 },
};
let selectedCharacter = "swift";
let maxHp = 3;

// ---------- FITUR 1: SOUND EFFECT (Web Audio API, tanpa file audio) ----------
let audioCtx = null;
let soundOn = true;

function tone(freq, dur = 0.15, type = "square", delay = 0) {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain).connect(audioCtx.destination);
  const t = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}

const SFX = {
  correct: () => { tone(880, 0.09); tone(1320, 0.12, "square", 0.08); },
  fail:    () => { tone(196, 0.28, "sawtooth"); tone(140, 0.3, "sawtooth", 0.05); },
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.09)),
  boss:    () => { tone(110, 0.5, "sawtooth"); tone(116, 0.5, "square", 0.04); },
  win:     () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.11)),
  lose:    () => [440, 349, 262, 196].forEach((f, i) => tone(f, 0.32, "sawtooth", i * 0.16)),
};

// ---------- FITUR 2: ANIMASI (putar ulang animasi CSS) ----------
function animate(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // paksa reflow supaya animasi bisa diputar lagi
  el.classList.add(cls);
}

// ---------- FITUR 3: HIGH SCORE (localStorage) ----------
const HS_KEY = "ninja_highscore";
let highScore = Number(localStorage.getItem(HS_KEY)) || 0;

function saveHighScore() {
  const isNew = score > highScore;
  if (isNew) {
    highScore = score;
    localStorage.setItem(HS_KEY, String(highScore));
  }
  const el = document.getElementById("best-value");
  if (el) el.innerText = highScore;
  return isNew;
}

// ---------- FITUR 4: GAME HISTORY (localStorage, 10 terakhir) ----------
const HIST_KEY = "ninja_history";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function addHistory(result) {
  const hist = loadHistory();
  hist.unshift({
    date: new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
    result: result,
    score: score,
    level: LEVELS[level].name,
    character: CHARACTERS[selectedCharacter].name,
  });
  localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(0, 10)));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("history-list");
  if (!list) return;
  const hist = loadHistory();
  if (!hist.length) {
    list.innerHTML = '<li class="empty">Belum ada pertandingan. Ayo main!</li>';
    return;
  }
  list.innerHTML = hist
    .map((h) => {
      const win = h.result === "VICTORY";
      return (
        '<li><span class="h-result ' + (win ? "win" : "loss") + '">' +
        (win ? "🏆" : "💀") + " " + h.result + "</span>" +
        '<span class="h-char">' + h.character + "</span>" +
        '<span class="h-lvl">' + h.level + "</span>" +
        '<span class="h-score">' + h.score + " pts</span>" +
        '<span class="h-date">' + h.date + "</span></li>"
      );
    })
    .join("");
}

// Hitung poin satu jawaban benar — dipakai juga oleh test_features.js
function calcPoints(lvl, boss, cmb, mult) {
  const base = lvl === 3 || boss ? 20 : 10;
  const bonus = cmb % 3 === 0 ? 10 : 0;
  return Math.round((base + bonus) * mult);
}

// ---------- 1 & 2. LOAD MODEL & WEBCAM ----------
async function initModel() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
 
  model = await tmPose.load(modelURL, metadataURL);

  webcam = new tmPose.Webcam(300, 300, true); // width, height, flip
  await webcam.setup();
  await webcam.play();
 
  document.getElementById("webcam-container").appendChild(webcam.canvas);
 
  modelLoaded = true;
  window.requestAnimationFrame(poseLoop);
}
 
// ---------- 3 & 4 & 5. BACA POSE & PREDICTION REALTIME ----------
async function poseLoop() {
  try {
    webcam.update();
    await predict();
  } catch (err) {
    // Kalau ada error di satu frame, jangan sampai loop berhenti total.
    // Buka Console (F12) untuk lihat detail error ini kalau webcam masih freeze.
    console.error("Pose loop error:", err);
  }
  window.requestAnimationFrame(poseLoop);
}
 
async function predict() {
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  const prediction = await model.predict(posenetOutput);
 
  // 6. Tentukan class dengan confidence tertinggi
  let best = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > best.probability) {
      best = prediction[i];
    }
  }
 
  currentPrediction = best;
 
  document.getElementById("prediction-text").innerText = best.className;
  document.getElementById("confidence-text").innerText =
    Math.round(best.probability * 100) + "%";
}
 
// ---------- COUNTDOWN 3-2-1 FIGHT ----------
function countdown() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("countdown-overlay");
    overlay.classList.remove("hidden");
    let count = 3;
    overlay.innerText = count;
 
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        overlay.innerText = count;
      } else if (count === 0) {
        overlay.innerText = "FIGHT!";
      } else {
        clearInterval(interval);
        overlay.classList.add("hidden");
        resolve();
      }
    }, 800);
  });
}
 
// ---------- 7. RANDOM CHALLENGE ----------
function getRandomChallenge() {
  return CHALLENGE_POSES[Math.floor(Math.random() * CHALLENGE_POSES.length)];
}
 
function shuffleBossSequence() {
  const seq = [];
  for (let i = 0; i < 5; i++) {
    seq.push(getRandomChallenge());
  }
  return seq;
}
 
// ---------- 8. TIMER PER CHALLENGE ----------
function nextChallenge() {
  if (gameEnded) return;
 
  if (hp <= 0) {
    return gameOver();
  }
 
  // Tentukan pose yang harus dilakukan pemain
  if (bossMode) {
    if (bossIndex >= bossSequence.length) {
      return victory();
    }
    currentChallenge = bossSequence[bossIndex];
    document.getElementById("challenge-text").innerText =
      "👹 " + CHALLENGE_EMOJI[currentChallenge];
  } else {
    currentChallenge = getRandomChallenge();
    document.getElementById("challenge-text").innerText =
      CHALLENGE_EMOJI[currentChallenge];
  }
 
  challengeActive = true;
  animate(document.getElementById("challenge-text"), "pop");
  if (bossMode) animate(document.querySelector(".challenge-panel"), "boss-pulse");
  timeLeft = LEVELS[level].time + CHARACTERS[selectedCharacter].timeBonus;
  document.getElementById("timer-value").innerText = timeLeft;
  document.getElementById("result-text").innerText = "";
 
  clearInterval(timerInterval);
  clearInterval(checkInterval);
 
  // 9. Timer mundur setiap detik
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-value").innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(checkInterval);
      if (challengeActive) {
        challengeActive = false;
        onFail("💥 TOO SLOW!");
      }
    }
  }, 1000);
 
  // Cek pose pemain beberapa kali per detik selama challenge aktif
  checkInterval = setInterval(checkAnswer, 200);
}
 
// ---------- 10. BANDINGKAN CHALLENGE DENGAN HASIL AI ----------
function checkAnswer() {
  if (!challengeActive || !currentPrediction) return;
 
  const matches = currentPrediction.className === currentChallenge;
  const confident = currentPrediction.probability >= CONFIDENCE_THRESHOLD;
 
  if (matches && confident) {
    challengeActive = false;
    clearInterval(timerInterval);
    clearInterval(checkInterval);
    onCorrect();
  } else if (!confident) {
    document.getElementById("result-text").innerText =
      "🤔 AI belum yakin, coba lagi!";
  }
}
 
// ---------- 11 & 12 & 13. SCORE, HP, COMBO ----------
function onCorrect() {
  combo++;
  correctInLevel++;
 
  const comboBonus = combo % 3 === 0 ? 10 : 0;
  const gained = calcPoints(level, bossMode, combo, CHARACTERS[selectedCharacter].scoreMult);
  score += gained;

  SFX.correct();
  animate(document.getElementById("score-value"), "bump");

  const icon = CHALLENGE_EMOJI[currentChallenge].split(" ")[0];
  let msg = icon + " PERFECT! +" + gained + " POINT";
  if (comboBonus > 0) {
    msg += "  🔥 COMBO x" + combo;
  }
  document.getElementById("result-text").innerText = msg;
 
  updateStatusBar();
 
  if (bossMode) {
    bossIndex++;
    return setTimeout(nextChallenge, 1200);
  }
 
  // 14. Cek kenaikan level
  if (correctInLevel >= LEVELS[level].correctToLevelUp) {
    if (level < 3) {
      level++;
      correctInLevel = 0;
      SFX.levelUp();
      animate(document.querySelector(".arena"), "flash");
      document.getElementById("result-text").innerText =
        "⬆️ LEVEL UP! " + LEVELS[level].name;
      updateStatusBar();
      return setTimeout(nextChallenge, 1600);
    } else {
      // Selesai level 3, masuk Final Boss
      bossMode = true;
      bossSequence = shuffleBossSequence();
      bossIndex = 0;
      SFX.boss();
      animate(document.querySelector(".challenge-panel"), "boss-pulse");
      document.getElementById("result-text").innerText =
        "👹 FINAL BOSS APPEARS!";
      return setTimeout(nextChallenge, 1600);
    }
  }
 
  setTimeout(nextChallenge, 1000);
}
 
function onFail(reason) {
  combo = 0;
  hp--;
  updateStatusBar();

  SFX.fail();
  animate(document.querySelector(".container"), "shake");
  animate(document.getElementById("hp-value"), "hp-hit");

  document.getElementById("result-text").innerText = reason + " -1 HP";
 
  if (hp <= 0) {
    return setTimeout(gameOver, 800);
  }
  setTimeout(nextChallenge, 1200);
}
 
function updateStatusBar() {
  document.getElementById("level-value").innerText = LEVELS[level].name;
  document.getElementById("score-value").innerText = score;
  document.getElementById("combo-value").innerText = "x" + combo;
  document.getElementById("hp-value").innerText =
    "❤️".repeat(Math.max(0, hp)) + "🖤".repeat(Math.max(0, maxHp - hp));
}
 
// ---------- 15 & 16. GAME OVER & VICTORY ----------
function gameOver() {
  gameEnded = true;
  clearInterval(timerInterval);
  clearInterval(checkInterval);
  SFX.lose();
  const isNew = saveHighScore();
  addHistory("GAME OVER");
  setCharLock(false);
  document.getElementById("challenge-text").innerText = "💀";
  document.getElementById("result-text").innerText =
    (isNew ? "🎉 NEW HIGH SCORE! " : "💀 GAME OVER — ") + "SCORE: " + score;
  document.getElementById("start-btn").innerText = "🔄 TRY AGAIN";
  document.getElementById("start-btn").disabled = false;
}
 
function victory() {
  gameEnded = true;
  clearInterval(timerInterval);
  clearInterval(checkInterval);
  SFX.win();
  const isNew = saveHighScore();
  addHistory("VICTORY");
  setCharLock(false);
  document.getElementById("challenge-text").innerText = "🏆";
  document.getElementById("result-text").innerText =
    (isNew ? "🎉 NEW HIGH SCORE! " : "🏆 NINJA MASTER! ") + "SCORE: " + score;
  document.getElementById("start-btn").innerText = "🔄 PLAY AGAIN";
  document.getElementById("start-btn").disabled = false;
}
 
function resetGame() {
  score = 0;
  maxHp = CHARACTERS[selectedCharacter].hp;
  hp = maxHp;
  combo = 0;
  level = 1;
  correctInLevel = 0;
  bossMode = false;
  bossSequence = [];
  bossIndex = 0;
  gameEnded = false;
  challengeActive = false;
  clearInterval(timerInterval);
  clearInterval(checkInterval);
  document.getElementById("challenge-text").innerText = "-";
  document.getElementById("timer-value").innerText = "-";
  document.getElementById("result-text").innerText = "";
  updateStatusBar();
}
 
// ---------- START BUTTON ----------
document.getElementById("start-btn").addEventListener("click", async () => {
  const btn = document.getElementById("start-btn");
  btn.disabled = true;

  // FITUR 1: AudioContext harus dibuat / di-resume setelah interaksi user
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

  if (!modelLoaded) {
    document.getElementById("result-text").innerText = "⏳ Menyiapkan AI & kamera...";
    try {
      await initModel();
    } catch (err) {
      console.error("Init error:", err);
      document.getElementById("result-text").innerText =
        "❌ Gagal memuat AI/kamera: " + (err && err.message ? err.message : err) +
        " — buka lewat web server (bukan file://) lalu izinkan akses kamera.";
      btn.disabled = false;
      return;
    }
  }

  resetGame();
  setCharLock(true);
  btn.innerText = "⚔️ IN BATTLE...";

  await countdown();
  nextChallenge();
});

// ---------- WIRING FITUR TAMBAHAN ----------
function setCharLock(locked) {
  document.querySelectorAll(".cs-btn").forEach((b) => { b.disabled = locked; });
  const cs = document.getElementById("character-select");
  if (cs) cs.classList.toggle("locked", locked);
}

document.querySelectorAll(".cs-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    selectedCharacter = btn.dataset.char;
    document.querySelectorAll(".cs-btn").forEach((b) =>
      b.classList.toggle("selected", b === btn)
    );
  });
});

document.getElementById("sound-btn").addEventListener("click", () => {
  soundOn = !soundOn;
  document.getElementById("sound-btn").innerText = soundOn ? "🔊" : "🔇";
});

document.getElementById("best-value").innerText = highScore;
renderHistory();
