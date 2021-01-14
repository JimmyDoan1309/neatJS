const GRID = 20;
const FULL_HEIGHT = 500;
const HEIGHT = 400;
const WIDTH = 400;
const SNAKEX = 80;
const SNAKEY = 200;
const SHOW_SENSORS = true;

const POP_SIZE = 100;

let start = false;

let focusSnake;
let focusFood;
let snakePop;
let foods;

let deathCount = 0;
let highScore = 0;

SPECIES_EXTINCT_AFTER = 15;
HIDDEN_ACTIVATION = "sigmoid";

frSlider = document.getElementById("framerate-slider");
frSlider.addEventListener("input", () => {
  frameRate(parseInt(frSlider.value));
});

function preload() {
  snakePop = new Population(
    Snake,
    { x: SNAKEX, y: SNAKEY, inputDim: 8, outputDim: 4 },
    POP_SIZE,
    0.3,
    true
  );
  focusSnake = snakePop.population[0];
  focusSnake.index = 0;
  foods = [];
  for (let i = 0; i < POP_SIZE; i++) {
    foods.push(new Food());
  }
  focusFood = foods[0];
}

function setup() {
  let canvas = createCanvas(WIDTH, FULL_HEIGHT);
  canvas.parent("sketch-div");
  frameRate(30);
  noLoop();
  noStroke();
}

function draw() {
  background(50);

  if (focusSnake.isDeath) {
    for (let i = 0; i < POP_SIZE; i++) {
      if (!snakePop.population[i].isDeath) {
        focusSnake = snakePop.population[i];
        focusSnake.index = i;
        focusFood = foods[i];
        break;
      }
    }
  }
  focusFood.draw();
  focusSnake.draw();

  for (let i = 0; i < POP_SIZE; i++) {
    if (snakePop.population[i].isDeath) continue;
    if (snakePop.population[i].checkDeath()) {
      deathCount++;
      snakePop.population[i].calculateFitness();
      if (snakePop.population[i].score > highScore) {
        highScore = snakePop.population[i].score;
      }
      continue;
    }

    if (snakePop.population[i].eat(foods[i])) {
      foods[i] = new Food();
      while (foods[i].overlap(snakePop.population[i])) {
        foods[i] = new Food();
      }
      if (i === focusSnake.index) {
        focusFood = foods[i];
      }
    }

    let inputs = snakePop.population[i].observe(foods[i]);
    snakePop.population[i].takeAction(inputs);
    snakePop.population[i].updatePosition(foods[i]);
  }

  if (deathCount >= POP_SIZE) {
    newGame();
  }

  fill(25);
  rect(0, HEIGHT, WIDTH, FULL_HEIGHT - HEIGHT);
  showInfo();
}

function newGame() {
  let ba = snakePop.getCurrentBestAgent();
  console.log(
    `Gen ${snakePop.generation} Avg: ${snakePop.getAverageFitness()}, Best : ${
      ba.fitness
    } - ${ba.score}`
  );
  snakePop.naturalSelection();
  snakePop.reset();
  focusSnake = snakePop.population[0];
  focusSnake.index = 0;
  foods = [];
  for (let i = 0; i < POP_SIZE; i++) {
    foods.push(new Food());
  }
  focusFood = foods[0];
  deathCount = 0;
}

function showInfo() {
  textSize(24);
  fill(255);
  text(`Score: ${focusSnake.score}`, 20, HEIGHT + 35);
  text(`High Score: ${highScore}`, 200, HEIGHT + 35);
  text(`Generation: ${snakePop.generation}`, 20, HEIGHT + 80);
  text(`Snake: ${focusSnake.index}`, 200, HEIGHT + 80);
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    start = !start;
    if (start) loop();
    else noLoop();
  }

  if (keyCode === LEFT_ARROW) {
    focusSnake.turn("left");
  }
  if (keyCode === RIGHT_ARROW) {
    focusSnake.turn("right");
  }
  if (keyCode === UP_ARROW) {
    focusSnake.turn("up");
  }
  if (keyCode === DOWN_ARROW) {
    focusSnake.turn("down");
  }
}
