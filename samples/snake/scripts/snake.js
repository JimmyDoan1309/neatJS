const START_LENGTH = 3;
const MAX_HUNGER = 1000;

function isOverlap(line1, line2) {
  let A1 = line1.y2 - line1.y1;
  let B1 = line1.x1 - line1.x2;
  let C1 = A1 * line1.x1 + B1 * line1.y1;

  let A2 = line2.y2 - line2.y1;
  let B2 = line2.x1 - line2.x2;
  let C2 = A2 * line2.x1 + B2 * line2.y1;

  let det = A1 * B2 - A2 * B1;
  if (det === 0) {
    return false;
  } else {
    let x = (B2 * C1 - B1 * C2) / det;
    let y = (A1 * C2 - A2 * C1) / det;
    if (
      Math.min(line1.x1, line1.x2) <= x &&
      x <= Math.max(line1.x1, line1.x2) &&
      Math.min(line1.y1, line1.y2) <= y &&
      y <= Math.max(line1.y1, line1.y2) &&
      Math.min(line2.x1, line2.x2) <= x &&
      x <= Math.max(line2.x1, line2.x2) &&
      Math.min(line2.y1, line2.y2) <= y &&
      y <= Math.max(line2.y1, line2.y2)
    ) {
      return { x, y };
    }
    return false;
  }
}

function euclidianDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

class Snake extends NeatAgent {
  constructor(id, args) {
    super(id, args);

    this.body = [];
    for (let i = 0; i < START_LENGTH; i++) {
      this.body.push({ x: args.x - i * GRID, y: args.y });
    }
    this.direction = "right";
    this.score = 0;
    this.hunger = 0;
    this.isDeath = false;
    this.alive = 0;
  }

  draw() {
    this.body.forEach((part, index) => {
      if (index === 0) fill(87, 201, 81);
      else fill(48, 145, 35);
      rect(part.x, part.y, GRID, GRID);
    });
  }

  updatePosition(food) {
    let beforeDistance = euclidianDistance(
      this.body[0].x,
      this.body[0].y,
      food.x,
      food.y
    );

    for (let i = this.body.length - 1; i > 0; i--) {
      this.body[i] = this.body[i - 1];
    }

    if (this.direction === "right") {
      this.body[0] = { x: this.body[0].x + GRID, y: this.body[0].y };
    }
    if (this.direction === "left") {
      this.body[0] = { x: this.body[0].x - GRID, y: this.body[0].y };
    }
    if (this.direction === "up") {
      this.body[0] = { x: this.body[0].x, y: this.body[0].y - GRID };
    }
    if (this.direction === "down") {
      this.body[0] = { x: this.body[0].x, y: this.body[0].y + GRID };
    }

    let afterDistance = euclidianDistance(
      this.body[0].x,
      this.body[0].y,
      food.x,
      food.y
    );

    // Better if move closer to food
    if (afterDistance < beforeDistance) {
      this.fitness += 1;
    } else {
      this.fitness -= 5;
    }
  }

  turn(direction) {
    // Invalid move
    if (
      (direction === "left" && this.direction === "right") ||
      (direction === "right" && this.direction === "left") ||
      (direction === "up" && this.direction === "down") ||
      (direction === "down" && this.direction === "up")
    )
      return;

    if (this.direction != direction) console.log(this.observation);

    this.direction = direction;
  }

  eat(food) {
    if (this.body[0].x === food.x && this.body[0].y === food.y) {
      let newPart = this.body[this.body.length - 1];
      this.body.push(newPart);
      this.score++;
      this.hunger -= MAX_HUNGER / 2;
      return true;
    }
    this.hunger++;
    this.alive++;
    return false;
  }

  observe(food) {
    push();
    stroke(255);

    let result = [];

    // Sensor + direction inputs
    let centerX = this.body[0].x + GRID / 2;
    let centerY = this.body[0].y + GRID / 2;
    let front, left, right;
    switch (this.direction) {
      case "right":
        front = { x1: centerX, y1: centerY, x2: WIDTH, y2: centerY };
        left = { x1: centerX, y1: centerY, x2: centerX, y2: 0 };
        right = { x1: centerX, y1: centerY, x2: centerX, y2: HEIGHT };
        //result.push(1, 0, 0, 0); // One hot encode direction
        break;
      case "left":
        front = { x1: centerX, y1: centerY, x2: 0, y2: centerY };
        left = { x1: centerX, y1: centerY, x2: centerX, y2: HEIGHT };
        right = { x1: centerX, y1: centerY, x2: centerX, y2: 0 };
        //result.push(0, 1, 0, 0); // One hot encode direction
        break;
      case "up":
        front = { x1: centerX, y1: centerY, x2: centerX, y2: 0 };
        left = { x1: centerX, y1: centerY, x2: 0, y2: centerY };
        right = { x1: centerX, y1: centerY, x2: WIDTH, y2: centerY };
        //result.push(0, 0, 1, 0); // One hot encode direction
        break;
      case "down":
        front = { x1: centerX, y1: centerY, x2: centerX, y2: HEIGHT };
        left = { x1: centerX, y1: centerY, x2: WIDTH, y2: centerY };
        right = { x1: centerX, y1: centerY, x2: 0, y2: centerY };
        //result.push(0, 0, 0, 1); // One hot encode direction
        break;
    }
    let obstacles = this.getObstacleList();
    let sensors = [front, left, right];
    sensors.forEach((sensor) => {
      let nearestDistance = Infinity;
      let nearestObs;
      for (let obs of obstacles) {
        let overlap = isOverlap(sensor, obs);
        if (overlap) {
          let distance = euclidianDistance(
            sensor.x1,
            sensor.y1,
            overlap.x,
            overlap.y
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestObs = overlap;
          }
        }
      }
      result.push(nearestDistance / Math.max(WIDTH, HEIGHT)); // Normalized sensor value;
      if (SHOW_SENSORS && this == focusSnake) {
        fill(255, 0, 0);
        circle(nearestObs.x, nearestObs.y, 10);
        line(sensor.x1, sensor.y1, nearestObs.x, nearestObs.y);
      }
    });

    pop();

    // Location inputs
    result.push(this.body[0].x / WIDTH);
    result.push(this.body[0].y / HEIGHT);
    result.push(food.x / WIDTH); // FoodX location in the map
    result.push(food.y / HEIGHT); // FoodY location in the map
    result.push(
      euclidianDistance(centerX, centerY, food.x, food.y) /
        Math.max(WIDTH, HEIGHT)
    ); // Distance from snake head to Food normalized

    this.observation = result;
    return result;
  }

  getObstacleList() {
    let obstacles = [
      { x1: 0, y1: 0, x2: 0, y2: HEIGHT }, //left wall
      { x1: WIDTH, y1: 0, x2: WIDTH, y2: HEIGHT }, // right wall
      { x1: 0, y1: 0, x2: WIDTH, y2: 0 }, // top wall
      { x1: 0, y1: HEIGHT, x2: WIDTH, y2: HEIGHT }, // bottom wall
    ];
    this.body.forEach((part, index) => {
      if (index === 0) return;
      let linesFromPart = [
        { x1: part.x, y1: part.y, x2: part.x, y2: part.y + GRID }, // left side
        { x1: part.x + GRID, y1: part.y, x2: part.x + GRID, y2: part.y + GRID }, //right side
        { x1: part.x, y1: part.y, x2: part.x + GRID, y2: part.y }, // top size,
        { x1: part.x, y1: part.y + GRID, x2: part.x + GRID, y2: part.y + GRID }, //bottom size
      ];
      obstacles.push(...linesFromPart);
    });
    return obstacles;
  }

  takeAction(inputs) {
    let result = NeatUtils.softmax(this.brain.predict(inputs));
    let action = NeatUtils.argMax(result);
    if (action === 0) this.turn("right");
    else if (action === 1) this.turn("left");
    else if (action === 2) this.turn("up");
    else this.turn("down");
    // if (action === 1) {
    //   switch (this.direction) {
    //     case "right":
    //       this.turn("up");
    //       break;
    //     case "left":
    //       this.turn("down");
    //       break;
    //     case "up":
    //       this.turn("left");
    //       break;
    //     case "down":
    //       this.turn("right");
    //   }
    // } else if (action === 2) {
    //   switch (this.direction) {
    //     case "right":
    //       this.turn("down");
    //       break;
    //     case "left":
    //       this.turn("up");
    //       break;
    //     case "up":
    //       this.turn("right");
    //       break;
    //     case "down":
    //       this.turn("left");
    //   }
    // }
  }

  checkDeath() {
    if (this.hunger >= MAX_HUNGER) {
      this.isDeath = true;
      return true;
    }

    // with wall
    let head = this.body[0];
    if (
      head.x + GRID > WIDTH ||
      head.x < 0 ||
      head.y + GRID > HEIGHT ||
      head.y < 0
    ) {
      this.isDeath = true;
      return true;
    }

    for (let i = 1; i < this.body.length; i++) {
      if (head.x === this.body[i].x && head.y === this.body[i].y) {
        this.isDeath = true;
        return true;
      }
    }

    return false;
  }

  calculateFitness() {
    this.fitness += this.alive + 100 * this.score;
    if ((this.score === 0) & (this.hunger >= MAX_HUNGER)) {
      this.fitness -= 100;
    }
  }

  reset() {
    this.body = [];
    for (let i = 0; i < START_LENGTH; i++) {
      this.body.push({ x: this.args.x - i * GRID, y: this.args.y });
    }
    this.direction = "right";
    this.score = 0;
    this.hunger = 0;
    this.alive = 0;
    this.fitness = 0;
    this.isDeath = false;
  }
}
