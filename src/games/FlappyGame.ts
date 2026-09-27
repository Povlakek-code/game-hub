import { BaseGame } from './base/BaseGame';

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export class FlappyGame extends BaseGame {
  private birdY = 0;
  private birdVY = 0;
  private started = false;
  private pipes: Pipe[] = [];
  private time = 0;
  private boundKey: ((e: KeyboardEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundTouch: ((e: TouchEvent) => void) | null = null;

  private get birdX(): number {
    return Math.floor(this.canvas.width * 0.28);
  }

  init() {
    this.birdY = this.canvas.height / 2;
    this.birdVY = 0;
    this.started = false;
    this.pipes = [];
    this.score = 0;
    this.time = 0;

    this.boundKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.flap();
      }
    };
    this.boundClick = () => this.flap();
    this.boundTouch = (e) => {
      e.preventDefault();
      this.flap();
    };
    document.addEventListener('keydown', this.boundKey);
    this.canvas.addEventListener('click', this.boundClick);
    this.canvas.addEventListener('touchstart', this.boundTouch, { passive: false });
  }

  override destroy() {
    if (this.boundKey) document.removeEventListener('keydown', this.boundKey);
    if (this.boundClick) this.canvas.removeEventListener('click', this.boundClick);
    if (this.boundTouch) this.canvas.removeEventListener('touchstart', this.boundTouch);
    this.boundKey = this.boundClick = this.boundTouch = null;
    super.destroy();
  }

  private flap() {
    if (!this.isRunning || this.isPaused) return;
    if (!this.started) this.started = true;
    this.birdVY = -7.2;
  }

  handleInput(event: KeyboardEvent | TouchEvent | MouseEvent) {
    if (event instanceof KeyboardEvent && this.boundKey) this.boundKey(event);
    else if (event instanceof MouseEvent) this.flap();
  }

  update() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.time += 1 / 60;

    if (!this.started) {
      // 待机：小鸟上下浮动
      this.birdY = H / 2 + Math.sin(this.time * 4) * 10;
      return;
    }

    const speed = 2.4 + Math.min(this.score * 0.03, 1.6);
    const pipeW = 64;
    const gap = Math.max(120, 150 - this.score * 0.8);
    const spacing = 230;

    this.birdVY = Math.min(this.birdVY + 0.45, 11);
    this.birdY += this.birdVY;

    if (this.birdY + 14 >= H || this.birdY - 14 <= 0) {
      this.stop();
      return;
    }

    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < W - spacing) {
      const margin = 70;
      this.pipes.push({
        x: W + 10,
        gapY: margin + Math.random() * (H - margin * 2 - gap),
        passed: false,
      });
    }

    const birdR = 13;
    for (const p of this.pipes) {
      p.x -= speed;
      if (!p.passed && p.x + pipeW < this.birdX - birdR) {
        p.passed = true;
        this.score += 1;
      }
      const inX = this.birdX + birdR > p.x && this.birdX - birdR < p.x + pipeW;
      if (inX && (this.birdY - birdR < p.gapY || this.birdY + birdR > p.gapY + gap)) {
        this.stop();
        return;
      }
    }
    this.pipes = this.pipes.filter((p) => p.x + pipeW > -20);
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 天空
    const grad = this.ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#7dd3fc');
    grad.addColorStop(1, '#e0f2fe');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);

    const pipeW = 64;
    const gap = Math.max(120, 150 - this.score * 0.8);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.strokeStyle = '#15803d';
    this.ctx.lineWidth = 3;
    for (const p of this.pipes) {
      this.ctx.fillRect(p.x, 0, pipeW, p.gapY);
      this.ctx.strokeRect(p.x, 0, pipeW, p.gapY);
      this.ctx.fillRect(p.x, p.gapY + gap, pipeW, H - p.gapY - gap);
      this.ctx.strokeRect(p.x, p.gapY + gap, pipeW, H - p.gapY - gap);
    }

    // 地面
    this.ctx.fillStyle = '#a16207';
    this.ctx.fillRect(0, H - 24, W, 24);
    this.ctx.fillStyle = '#65a30d';
    this.ctx.fillRect(0, H - 24, W, 8);

    // 小鸟（带倾角）
    const angle = Math.max(-0.4, Math.min(0.9, this.birdVY * 0.08));
    this.ctx.save();
    this.ctx.translate(this.birdX, this.birdY);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = '#facc15';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(5, -4, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(6.5, -4, 2.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#f97316';
    this.ctx.fillRect(8, 0, 8, 5);
    this.ctx.restore();

    this.ctx.fillStyle = '#0c4a6e';
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.score}`, W / 2, 48);
    this.ctx.textAlign = 'left';

    if (!this.started && this.isRunning) {
      this.ctx.fillStyle = 'rgba(12,74,110,0.9)';
      this.ctx.font = '20px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('点击 / 空格开始飞行', W / 2, H / 2 - 60);
      this.ctx.textAlign = 'left';
    }

    if (!this.isRunning) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('游戏结束', W / 2, H / 2 - 20);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`最终分数: ${this.score}`, W / 2, H / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }
}
