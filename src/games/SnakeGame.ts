import { BaseGame } from './base/BaseGame';

interface Position {
  x: number;
  y: number;
}

export class SnakeGame extends BaseGame {
  private snake: Position[] = [];
  private food: Position = { x: 0, y: 0 };
  private direction: Position = { x: 1, y: 0 };
  private nextDirection: Position = { x: 1, y: 0 };
  private gridSize = 20;
  private gameSpeed = 0.1;
  private gameTime = 0;
  private gameOver = false;

  init() {
    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    this.snake = [
      { x: Math.floor(cols / 2), y: Math.floor(rows / 2) }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.gameTime = 0;

    this.generateFood();
    document.addEventListener('keydown', this.handleInput.bind(this));
  }

  private generateFood() {
    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    this.food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  }

  handleInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
        event.preventDefault();
        break;
    }
  }

  update() {
    if (this.gameOver) return;

    this.gameTime += 1 / 60;

    if (this.gameTime >= this.gameSpeed) {
      this.gameTime = 0;
      this.direction = this.nextDirection;

      const head = { ...this.snake[0] };
      head.x += this.direction.x;
      head.y += this.direction.y;

      if (this.checkCollision(head)) {
        this.gameOver = true;
        this.stop();
        return;
      }

      this.snake.unshift(head);

      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += 10;
        this.generateFood();
      } else {
        this.snake.pop();
      }
    }
  }

  private checkCollision(head: Position): boolean {
    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      return true;
    }

    return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
  }

  render() {
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(
      this.food.x * this.gridSize + 2,
      this.food.y * this.gridSize + 2,
      this.gridSize - 4,
      this.gridSize - 4
    );

    this.snake.forEach((segment, index) => {
      this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#81C784';
      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
    });

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`分数: ${this.score}`, 10, 30);

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
