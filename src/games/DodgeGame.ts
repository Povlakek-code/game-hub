import { BaseGame } from './base/BaseGame';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export class DodgeGame extends BaseGame {
  private player: GameObject;
  private obstacles: GameObject[] = [];
  private gameOver = false;
  private obstacleSpawnRate = 0.02;
  private gameTime = 0;
  private difficulty = 1;

  init() {
    this.player = {
      x: this.canvas.width / 2 - 15,
      y: this.canvas.height - 40,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
    };
    this.obstacles = [];
    this.score = 0;
    this.gameOver = false;
    this.gameTime = 0;
    this.difficulty = 1;

    document.addEventListener('keydown', this.handleInput.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.player.vx = 0;
    }
  }

  handleInput(event: KeyboardEvent) {
    const speed = 5;
    if (event.key === 'ArrowLeft') {
      this.player.vx = -speed;
    } else if (event.key === 'ArrowRight') {
      this.player.vx = speed;
    }
  }

  update() {
    if (this.gameOver) return;

    this.gameTime += 1 / 60;
    this.difficulty = 1 + Math.floor(this.gameTime / 10) * 0.1;
    this.obstacleSpawnRate = Math.min(0.02 + this.gameTime * 0.001, 0.05);

    this.player.x += this.player.vx;
    this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));

    if (Math.random() < this.obstacleSpawnRate) {
      this.obstacles.push({
        x: Math.random() * (this.canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        vx: 0,
        vy: 2 + this.difficulty,
      });
    }

    this.obstacles = this.obstacles.filter(obs => {
      obs.y += obs.vy;
      return obs.y < this.canvas.height;
    });

    for (const obs of this.obstacles) {
      if (this.checkCollision(this.player, obs)) {
        this.gameOver = true;
        this.stop();
        return;
      }
    }

    this.score = Math.floor(this.gameTime);
  }

  private checkCollision(rect1: GameObject, rect2: GameObject): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  render() {
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = '#ff6b6b';
    for (const obs of this.obstacles) {
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`分数: ${this.score}`, 10, 30);
    this.ctx.fillText(`难度: ${this.difficulty.toFixed(1)}`, 10, 60);

    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }
}
