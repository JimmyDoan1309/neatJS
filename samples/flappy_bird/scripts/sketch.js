const SCREEN = { w: 288, h: 512 };
const POPSIZE = 200;

let isStart = false;
let isPause = false;
let highScore = 0;
let deathCount = 0;

let birdPop;
let bg;
let ground;
let pipes;

let birdAnimation;
let bgImage;
let pipeImage;
let font;

function preload() {
  birdAnimation = loadAnimation(
    "assets/sprites/bluebird-downflap.png",
    "assets/sprites/bluebird-midflap.png",
    "assets/sprites/bluebird-upflap.png"
  );
  bgImage = loadImage("assets/sprites/background-day.png");
  groundImage = loadImage("assets/sprites/base.png");
  pipeImage = loadImage("assets/sprites/pipe.png");
  font = loadFont("assets/flap_font.ttf");

  birdAnimation.frameDelay = 5;
  birdPop = new Population(Bird, { inputDim: 3, outputDim: 1 }, POPSIZE, 0.5, true);
  birdPop.population.forEach((bird) => {
    bird.addSprite(birdAnimation);
  });

  bg = new Background(bgImage);
  ground = new Ground(groundImage);
  pipes = new Pipes(pipeImage);
}

function setup() {
  let canvas = createCanvas(288, 512);
  canvas.parent("sketch-div");

  frameRate(60);
  updateSprites(false);
}

function keyPressed() {
  switch (keyCode) {
    case 32:
      // bird.jump();
      if (!isStart) {
        isStart = true;
        pipes.run();
      }
      break;
    case ESCAPE:
      if (!isPause) noLoop();
      else loop();
      isPause = !isPause;
      break;
  }
}

function draw() {
  bg.draw();
  pipes.draw();
  ground.draw();
  displayScore();
  for (let bird of birdPop.population) {
    bird.draw();
  }

  // Game Logic
  if (isStart) {
    for (let bird of birdPop.population) {
      if (bird.isDeath) continue;

      bird.predict(bird.observe());
      bird.updateScore();
      if (bird.fitness > highScore) {
        highScore = bird.fitness;
      }

      bird.checkDeath();
      if (bird.isDeath) deathCount += 1;
    }

    if (deathCount >= POPSIZE) {
      newGame();
    }
  }
}

function newGame() {
  birdPop.population.forEach((bird) => {
    bird.bird.remove();
  });

  birdPop.naturalSelection();
  birdPop.reset();
  pipes.clear();

  birdPop.population.forEach((bird) => {
    bird.addSprite(birdAnimation);
  });
  deathCount = 0;
}

function displayScore() {
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(40);
  textFont(font);
  fill(255);
  // text(bird.score, SCREEN.w / 2, SCREEN.h - 45);
  // textSize(20);
  text(`HS: ${highScore}`, SCREEN.w / 2, SCREEN.h - 10);
}
