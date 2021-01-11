const PIPE_SPEED = -3;
const PIPE_GAP = 120;
const PIPE_DISTANCE = 140;

const MIN = SCREEN.h / 1;
const MAX = SCREEN.h / 1.6;

// 26 & 160 are 1/2 SCREEN.w and SCREEN.h of the pipe sprite
// because sprite's cordination is measured from centered,
// not from corner like pure p5js
class Pipe {
  constructor(sprite) {
    const pipeHeight = Math.random() * (MAX - MIN) + MIN;
    this.bottomPipe = createSprite(SCREEN.w + 26, pipeHeight);
    this.bottomPipe.addImage(sprite);
    this.bottomPipe.velocity.x = isStart ? PIPE_SPEED : 0;

    this.topPipe = createSprite(SCREEN.w + 26, pipeHeight - PIPE_GAP - 2 * 160);
    this.topPipe.addImage(sprite);
    this.topPipe.mirrorY(-1);
    this.topPipe.velocity.x = isStart ? PIPE_SPEED : 0;

    this.isPassed = false;
  }

  run() {
    this.bottomPipe.velocity.x = PIPE_SPEED;
    this.topPipe.velocity.x = PIPE_SPEED;
  }

  getCenter() {
    return this.bottomPipe.position.y - 160 - PIPE_GAP / 2;
  }

  draw() {
    drawSprite(this.topPipe);
    drawSprite(this.bottomPipe);
  }
}

class Pipes {
  constructor(sprite) {
    this.sprite = sprite;
    this.pipes = [new Pipe(this.sprite)];
  }

  run() {
    for (let pipe of this.pipes) pipe.run();
  }

  clear() {
    for (let pipe of this.pipes) {
      pipe.bottomPipe.remove();
      pipe.topPipe.remove();
    }
    this.pipes = [new Pipe(this.sprite)];
  }

  draw() {
    // if the first pipe is go out of the frame, remove it
    if (this.pipes[0].bottomPipe.position.x + 26 < 0) {
      let tmp = this.pipes.shift();
      tmp.bottomPipe.remove();
      tmp.topPipe.remove();
    }

    // if the last pipe is PIPE_DISTANCE away from the right edge, generate a new Pipe
    if (this.pipes[this.pipes.length - 1].bottomPipe.position.x < SCREEN.w - PIPE_DISTANCE) {
      this.pipes.push(new Pipe(this.sprite));
    }

    this.pipes.forEach((pipe) => {
      pipe.draw();
    });
  }
}
