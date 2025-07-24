const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const scoreDisplay = document.getElementById("score");

let width, height;
let bird, gravity, flapStrength, pipes, score, isRunning, gap;

const birdImg = new Image();
birdImg.src = "bird.png";

const bgImage = new Image();
bgImage.src = "background.jpg";

const scoreSound = new Audio("score.mp3");
const dieSound = new Audio("die.mp3");
const bgMusic = new Audio("bgmusic.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = canvas.width;
  height = canvas.height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resetGame() {
  bird = {
    x: width / 4,
    y: height / 2,
    width: 40,
    height: 40,
    velocity: 0,
  };
  gravity = 0.32;
  flapStrength = -4.2;
  pipes = [];
  score = 0;
  isRunning = true;
  gap = height * 0.25;
  spawnPipe();
}

function spawnPipe() {
  const topHeight = Math.random() * (height - gap - 150) + 50;
  pipes.push({
    x: width,
    width: 60,
    top: topHeight,
    bottom: height - (topHeight + gap),
    passed: false,
  });
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  for (const pipe of pipes) {
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, "#66bb6a");
    grd.addColorStop(1, "#2e7d32");

    ctx.fillStyle = grd;
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 4;

    // Top Pipe
    ctx.beginPath();
    ctx.roundRect(pipe.x, 0, pipe.width, pipe.top, 12);
    ctx.fill();
    ctx.stroke();

    // Bottom Pipe
    ctx.beginPath();
    ctx.roundRect(pipe.x, height - pipe.bottom, pipe.width, pipe.bottom, 12);
    ctx.fill();
    ctx.stroke();
  }
}

// Polyfill for roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}

function update() {
  if (!isRunning) return;

  ctx.drawImage(bgImage, 0, 0, width, height);

  // Bird physics
  bird.velocity += gravity;
  bird.y += bird.velocity;

  // Pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= 3;

    // Collision
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > height - pipe.bottom)
    ) {
      dieSound.play();
      isRunning = false;
      bgMusic.pause();
    }

    // Scoring
    if (pipe.x + pipe.width < bird.x && !pipe.passed) {
      pipe.passed = true;
      score++;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }

    // Remove old pipes
    if (pipe.x + pipe.width < 0) {
      pipes.splice(i, 1);
    }
  }

  // Add new pipes
  if (pipes.length === 0 || pipes[pipes.length - 1].x < width - 300) {
    spawnPipe();
  }

  // Ground or top hit
  if (bird.y + bird.height > height || bird.y < 0) {
    dieSound.play();
    isRunning = false;
    bgMusic.pause();
  }

  drawPipes();
  drawBird();

  scoreDisplay.textContent = `Score: ${score}`;

  if (isRunning) requestAnimationFrame(update);
  else startBtn.style.display = "inline-block";
}

function flap() {
  if (isRunning) {
    bird.velocity = flapStrength;
  }
}

startBtn.addEventListener("click", () => {
  resetGame();
  update();
  bgMusic.currentTime = 0;
  bgMusic.play().catch(e => console.warn("Music play blocked:", e));
  startBtn.style.display = "none";
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") flap();
});
canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", flap);
