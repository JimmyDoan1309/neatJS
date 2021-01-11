const MAX_GRAVITY = 12;
const JUMP_CONSTANT = -12;

class Bird extends NeatAgent {
  constructor(id, args) {
    super(id, args);

    this.x = 80;
    this.y = SCREEN.h / 2;
    this.isDeath = false;
    this.fitness = 0;
  }

  addSprite(sprite) {
    this.bird = createSprite(this.x, this.y);
    this.bird.addAnimation("flying", sprite);
    this.bird.setCollider("circle", 0, 0, 13);
    this.bird.velocity.y = 0;
    this.bird.rotation = 0;
  }

  jump() {
    this.bird.velocity.y = JUMP_CONSTANT;
    this.bird.rotation = -45;
  }

  checkDeath() {
    if (this.bird.overlap(ground.g1) || this.bird.overlap(ground.g2))
      this.isDeath = true;
    if (this.bird.position.y < 0) this.isDeath = true;
    for (let pipe of pipes.pipes) {
      if (this.bird.overlap(pipe.bottomPipe) || this.bird.overlap(pipe.topPipe))
        this.isDeath = true;
    }
  }

  updateScore() {
    this.fitness += 1;
  }

  observe() {
    // find the nearest front pipe
    let pipe;
    for (let tmp of pipes.pipes) {
      if (tmp.bottomPipe.position.x + 30 > this.bird.position.x) {
        pipe = tmp;
        break;
      }
    }

    const deltaX = pipe.bottomPipe.position.x + 36 - this.bird.position.x;
    const deltaY = pipe.getCenter() - this.bird.position.y;

    // Normalized observations
    return [deltaX / SCREEN.w, deltaY / SCREEN.h, this.bird.velocity.y / 12];
  }

  predict(inputs) {
    let result = NeatActivations.sigmoid(this.brain.predict(inputs)[0]);
    if (result > 0.5) {
      this.jump();
    }
  }

  reset() {
    this.fitness = 0;
    this.isDeath = false;
  }

  draw() {
    if (isStart) {
      if (this.bird.velocity.y < MAX_GRAVITY) this.bird.velocity.y += 1.5;
      if (this.bird.rotation < 70) this.bird.rotation += 4;
    }
    if (!this.isDeath) drawSprite(this.bird);
  }

  clean() {
    this.bird.remove();
  }
}
