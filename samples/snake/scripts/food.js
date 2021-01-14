class Food {
  constructor(x = null, y = null) {
    this.x = x != null ? x : Math.floor(Math.random() * (WIDTH / GRID)) * GRID;
    this.y = y != null ? y : Math.floor(Math.random() * (HEIGHT / GRID)) * GRID;
  }

  draw() {
    fill(255, 0, 0);
    rect(this.x, this.y, GRID);
  }

  overlap(snake) {
    for (let part of snake.body) {
      if (this.x == part[0] && this.y == part[1]) return true;
    }
    return false;
  }
}
