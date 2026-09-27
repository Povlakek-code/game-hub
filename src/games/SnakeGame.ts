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
  private boundKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private boundTouchStart: ((event: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((event: TouchEvent) => void) | null = null;
  private touchStart: { x: number; y: number } | null = null;

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
    // 使用稳定的绑定引用，以便 destroy() 时能正确 removeEventListener
    // （之前用 .bind(this) 每次创建新函数，导致监听器永远泄漏）
    this.boundKeyHandler = (event: KeyboardEvent) => this.handleInput(event);
    document.addEventListener('keydown', this.boundKeyHandler);
    // 手机滑动改变方向
    this.boundTouchStart = (event: TouchEvent) => {
      const t = event.touches[0];
      if (t) this.touchStart = { x: t.clientX, y: t.clientY };
    };
    this.boundTouchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0];
      if (t && this.touchStart) {
        const dx = t.clientX - this.touchStart.x;
        const dy = t.clientY - this.touchStart.y;
        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
          // 只允许转向（不允许直接反向，避免瞬间撞到自己）
          if (Math.abs(dx) > Math.abs(dy)) {
            if (this.direction.x === 0) this.nextDirection = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
          } else if (this.direction.y === 0) {
            this.nextDirection = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
          }
        }
      }
      this.touchStart = null;
    };
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.boundTouchEnd);
  }

  override destroy() {
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.boundTouchStart) this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    if (this.boundTouchEnd) this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    this.boundTouchStart = this.boundTouchEnd = null;
    super.destroy();
  }

  private generateFood() {
    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    // 避免食物刷在蛇身上（之前可能导致“吃不到食物”的假象）
    for (let i = 0; i < 100; i++) {
      const candidate = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
      const onSnake = this.snake.some(
        (segment) => segment.x === candidate.x && segment.y === candidate.y
      );
      if (!onSnake) {
        this.food = candidate;
        return;
      }
    }
    this.food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  }

  handleInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
        event.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
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
