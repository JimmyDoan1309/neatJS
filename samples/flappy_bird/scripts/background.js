const BACKGROUND_SPEED = -1.5;
const GROUND_SPEED = -3;

class Background {
  constructor(sprite) {
    this.bg1 = createSprite(SCREEN.w / 2, SCREEN.h / 2);
    this.bg1.addImage(sprite);
    this.bg2 = createSprite(SCREEN.w * 1.5, SCREEN.h / 2);
    this.bg2.addImage(sprite);
    this.bg1.velocity.x = BACKGROUND_SPEED;
    this.bg2.velocity.x = BACKGROUND_SPEED;
  }

  draw() {
    if (this.bg1.position.x <= -SCREEN.w / 2) this.bg1.position.x = SCREEN.w * 1.5;
    if (this.bg2.position.x <= -SCREEN.w / 2) this.bg2.position.x = SCREEN.w * 1.5;
    drawSprite(this.bg1);
    drawSprite(this.bg2);
  }
}

class Ground {
  constructor(sprite) {
    this.g1 = createSprite(SCREEN.w / 2, SCREEN.h - 112 / 2);
    this.g1.addImage(sprite);
    this.g2 = createSprite(SCREEN.w * 1.5, SCREEN.h - 112 / 2);
    this.g2.addImage(sprite);
    this.g1.velocity.x = GROUND_SPEED;
    this.g2.velocity.x = GROUND_SPEED;
  }

  draw() {
    if (this.g1.position.x <= -SCREEN.w / 2) this.g1.position.x = SCREEN.w * 1.5;
    if (this.g2.position.x <= -SCREEN.w / 2) this.g2.position.x = SCREEN.w * 1.5;
    drawSprite(this.g1);
    drawSprite(this.g2);
  }
}
