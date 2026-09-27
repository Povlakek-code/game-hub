import { BaseGame } from './base/BaseGame';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export class BreakoutGame extends BaseGame {
  private paddleX = 0;
  private paddleW = 90;
  private paddleH = 12;
  private ballX = 0;
  private ballY = 0;
  private ballVX = 0;
  private ballVY = 0;
  private ballR = 8;
  private serving = true;
  private lives = 3;
  private level = 1;
  private bricks: Brick[] = [];
  private keysDown = new Set<string>();
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;

  init() {
    const W = this.canvas.width;
    this.paddleW = Math.max(60, W * 0.15);
    this.paddleX = W / 2 - this.paddleW / 2;
    this.lives = 3;
    this.level = 1;
    this.score = 0;
    this.keysDown.clear();
    this.buildLevel();
    this.resetBall();

    this.boundKeyDown = (e) => this.handleKeyDown(e);
    this.boundKeyUp = (e) => this.handleKeyUp(e);
    this.boundMouseMove = (e) => {
      const { x } = this.toCanvasCoords(e.clientX, e.clientY);
      this.paddleX = Math.max(0, Math.min(x - this.paddleW / 2, W - this.paddleW));
    };
    this.boundClick = () => this.launch();
    this.boundTouchMove = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const { x } = this.toCanvasCoords(t.clientX, t.clientY);
      this.paddleX = Math.max(0, Math.min(x - this.paddleW / 2, W - this.paddleW));
      e.preventDefault();
    };
    this.boundTouchStart = (e) => {
      this.launch();
      e.preventDefault();
    };
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);
    this.canvas.addEventListener('mousemove', this.boundMouseMove);
    this.canvas.addEventListener('click', this.boundClick);
    this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
  }

  override destroy() {
    if (this.boundKeyDown) document.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) document.removeEventListener('keyup', this.boundKeyUp);
    if (this.boundMouseMove) this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundClick) this.canvas.removeEventListener('click', this.boundClick);
    if (this.boundTouchMove) this.canvas.removeEventListener('touchmove', this.boundTouchMove);
    if (this.boundTouchStart) this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    this.boundKeyDown = this.boundKeyUp = this.boundMouseMove = null;
    this.boundClick = this.boundTouchMove = this.boundTouchStart = null;
    super.destroy();
  }

  private buildLevel() {
    const W = this.canvas.width;
    const cols = 8;
    const rows = 4 + Math.min(this.level, 3);
    const gap = 6;
    const top = 56;
    const bw = (W - gap * (cols + 1)) / cols;
    const bh = 22;
    this.bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = r === 0 && this.level > 1 ? 2 : 1;
        this.bricks.push({
          x: gap + c * (bw + gap),
          y: top + r * (bh + gap),
          w: bw,
          h: bh,
          hp,
          maxHp: hp,
          alive: true,
        });
      }
    }
  }

  private resetBall() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.ballX = this.paddleX + this.paddleW / 2;
    this.ballY = H - 30 - this.paddleH - this.ballR;
    this.ballVX = 0;
    this.ballVY = 0;
    this.serving = true;
    void W;
  }

  private launch() {
    if (!this.serving || !this.isRunning || this.isPaused) return;
    const speed = 4 + (this.level - 1) * 0.6;
    const angle = -Math.PI / 3 - Math.random() * (Math.PI / 6);
    this.ballVX = Math.cos(angle) * speed;
    this.ballVY = Math.sin(angle) * speed;
    this.serving = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keysDown.add(e.key);
    if (e.key === ' ') this.launch();
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keysDown.delete(e.key);
  }

  handleInput(event: KeyboardEvent | TouchEvent | MouseEvent) {
    if (event instanceof KeyboardEvent) this.handleKeyDown(event);
  }

  update() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const paddleY = H - 30 - this.paddleH;

    const speed = 7;
    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('a') || this.keysDown.has('A')) {
      this.paddleX = Math.max(0, this.paddleX - speed);
    }
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('d') || this.keysDown.has('D')) {
      this.paddleX = Math.min(W - this.paddleW, this.paddleX + speed);
    }

    if (this.serving) {
      this.ballX = this.paddleX + this.paddleW / 2;
      this.ballY = paddleY - this.ballR;
      return;
    }

    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    if (this.ballX - this.ballR < 0) {
      this.ballX = this.ballR;
      this.ballVX = Math.abs(this.ballVX);
    }
    if (this.ballX + this.ballR > W) {
      this.ballX = W - this.ballR;
      this.ballVX = -Math.abs(this.ballVX);
    }
    if (this.ballY - this.ballR < 0) {
      this.ballY = this.ballR;
      this.ballVY = Math.abs(this.ballVY);
    }

    // 挡板反弹：落点越偏，反弹角越大
    if (
      this.ballVY > 0 &&
      this.ballY + this.ballR >= paddleY &&
      this.ballY + this.ballR <= paddleY + this.paddleH + 12 &&
      this.ballX >= this.paddleX - this.ballR &&
      this.ballX <= this.paddleX + this.paddleW + this.ballR
    ) {
      const hit = (this.ballX - this.paddleX) / this.paddleW - 0.5; // -0.5..0.5
      const sp = Math.hypot(this.ballVX, this.ballVY);
      const angle = -Math.PI / 2 + hit * (Math.PI / 2.4);
      this.ballVX = Math.cos(angle) * sp;
      this.ballVY = Math.sin(angle) * sp;
      this.ballY = paddleY - this.ballR;
    }

    // 砖块碰撞
    for (const b of this.bricks) {
      if (!b.alive) continue;
      if (
        this.ballX + this.ballR > b.x &&
        this.ballX - this.ballR < b.x + b.w &&
        this.ballY + this.ballR > b.y &&
        this.ballY - this.ballR < b.y + b.h
      ) {
        b.hp -= 1;
        this.score += 10;
        if (b.hp <= 0) {
          b.alive = false;
          this.score += 10;
        }
        // 根据侵入最小的方向反弹
        const overlapX = Math.min(this.ballX + this.ballR - b.x, b.x + b.w - (this.ballX - this.ballR));
        const overlapY = Math.min(this.ballY + this.ballR - b.y, b.y + b.h - (this.ballY - this.ballR));
        if (overlapX < overlapY) {
          this.ballVX = this.ballX < b.x + b.w / 2 ? -Math.abs(this.ballVX) : Math.abs(this.ballVX);
        } else {
          this.ballVY = this.ballY < b.y + b.h / 2 ? -Math.abs(this.ballVY) : Math.abs(this.ballVY);
        }
        break;
      }
    }

    if (this.bricks.every((b) => !b.alive)) {
      this.level += 1;
      this.score += 100;
      this.buildLevel();
      this.resetBall();
      return;
    }

    if (this.ballY - this.ballR > H) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.stop();
        return;
      }
      this.resetBall();
    }
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const paddleY = H - 30 - this.paddleH;

    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, W, H);

    for (const b of this.bricks) {
      if (!b.alive) continue;
      const rowBand = Math.floor((b.y - 56) / 28);
      this.ctx.fillStyle = BRICK_COLORS[rowBand % BRICK_COLORS.length];
      if (b.hp < b.maxHp) this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillRect(b.x, b.y, b.w, b.h);
      if (b.hp > 1) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('×2', b.x + b.w / 2, b.y + 15);
        this.ctx.textAlign = 'left';
      }
    }

    this.ctx.fillStyle = '#22d3ee';
    this.ctx.fillRect(this.paddleX, paddleY, this.paddleW, this.paddleH);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText(`分数 ${this.score}`, 12, 26);
    this.ctx.fillText(`第 ${this.level} 关`, 12, 48);
    this.ctx.fillText(`❤ ${this.lives}`, W - 60, 26);

    if (this.serving && this.isRunning) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.ctx.font = '18px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('按空格 / 点击发射小球', W / 2, H - 90);
      this.ctx.textAlign = 'left';
    }

    if (!this.isRunning) {
      this.drawEndOverlay(W, H, '游戏结束');
    }
  }

  private drawEndOverlay(W: number, H: number, title: string) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 40px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, W / 2, H / 2 - 20);
    this.ctx.font = '24px sans-serif';
    this.ctx.fillText(`最终分数: ${this.score}`, W / 2, H / 2 + 20);
    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText(`到达第 ${this.level} 关`, W / 2, H / 2 + 48);
    this.ctx.textAlign = 'left';
  }
}
