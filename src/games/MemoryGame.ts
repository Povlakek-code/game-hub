import { BaseGame } from './base/BaseGame';

const FACES = ['🍎', '🍋', '🍇', '⚡', '🌙', '⭐', '🔥', '💧'];

interface Card {
  face: string;
  matched: boolean;
  faceUp: boolean;
}

export class MemoryGame extends BaseGame {
  private cards: Card[] = [];
  private firstPick: number | null = null;
  private lockUntil = 0;
  private moves = 0;
  private matchedPairs = 0;
  private elapsed = 0;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundTouch: ((e: TouchEvent) => void) | null = null;

  private cols = 4;
  private rows = 4;

  init() {
    const faces = [...FACES, ...FACES];
    for (let i = faces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [faces[i], faces[j]] = [faces[j], faces[i]];
    }
    this.cards = faces.map((face) => ({ face, matched: false, faceUp: false }));
    this.firstPick = null;
    this.lockUntil = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.elapsed = 0;
    this.score = 0;

    this.boundClick = (e) => {
      const { x, y } = this.toCanvasCoords(e.clientX, e.clientY);
      this.pickAt(x, y);
    };
    this.boundTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const { x, y } = this.toCanvasCoords(t.clientX, t.clientY);
      this.pickAt(x, y);
      e.preventDefault();
    };
    this.canvas.addEventListener('click', this.boundClick);
    this.canvas.addEventListener('touchstart', this.boundTouch, { passive: false });
  }

  override destroy() {
    if (this.boundClick) this.canvas.removeEventListener('click', this.boundClick);
    if (this.boundTouch) this.canvas.removeEventListener('touchstart', this.boundTouch);
    this.boundClick = this.boundTouch = null;
    super.destroy();
  }

  handleInput(event: KeyboardEvent | TouchEvent | MouseEvent) {
    if (event instanceof MouseEvent) {
      const { x, y } = this.toCanvasCoords(event.clientX, event.clientY);
      this.pickAt(x, y);
    }
  }

  private cellRect(index: number): { x: number; y: number; w: number; h: number } {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const top = 56;
    const gap = 8;
    const w = (W - gap * (this.cols + 1)) / this.cols;
    const h = (H - top - gap * (this.rows + 1) - 8) / this.rows;
    const c = index % this.cols;
    const r = Math.floor(index / this.cols);
    return { x: gap + c * (w + gap), y: top + gap + r * (h + gap), w, h };
  }

  private pickAt(x: number, y: number) {
    if (!this.isRunning || this.isPaused) return;
    if (this.elapsed < this.lockUntil) return;
    for (let i = 0; i < this.cards.length; i++) {
      const rect = this.cellRect(i);
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        this.pick(i);
        return;
      }
    }
  }

  private pick(i: number) {
    const card = this.cards[i];
    if (card.matched || card.faceUp) return;
    card.faceUp = true;
    if (this.firstPick === null) {
      this.firstPick = i;
      return;
    }
    this.moves += 1;
    const first = this.cards[this.firstPick];
    if (first.face === card.face) {
      first.matched = true;
      card.matched = true;
      this.matchedPairs += 1;
      this.score += 20;
      this.firstPick = null;
      if (this.matchedPairs >= FACES.length) {
        // 步数越少奖励越高
        this.score += Math.max(0, 120 - this.moves * 2);
        this.stop();
      }
    } else {
      const a = this.firstPick;
      const b = i;
      this.firstPick = null;
      this.lockUntil = this.elapsed + 0.7;
      // 延迟盖回去：用游戏时间驱动，暂停时不会误触发
      const check = () => {
        if (!this.isRunning) return;
        if (this.elapsed >= this.lockUntil) {
          this.cards[a].faceUp = false;
          this.cards[b].faceUp = false;
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    }
  }

  update() {
    this.elapsed += 1 / 60;
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.ctx.fillStyle = '#1e1b4b';
    this.ctx.fillRect(0, 0, W, H);

    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText(`分数 ${this.score}`, 12, 26);
    this.ctx.fillText(`步数 ${this.moves}`, 12, 48);
    this.ctx.fillText(`已配对 ${this.matchedPairs}/8`, W - 110, 26);

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const rect = this.cellRect(i);
      if (card.faceUp || card.matched) {
        this.ctx.fillStyle = card.matched ? '#065f46' : '#f8fafc';
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.font = `${Math.floor(Math.min(rect.w, rect.h) * 0.5)}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(card.face, rect.x + rect.w / 2, rect.y + rect.h / 2 + 12);
        this.ctx.textAlign = 'left';
      } else {
        this.ctx.fillStyle = '#4f46e5';
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.fillStyle = '#6366f1';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('?', rect.x + rect.w / 2, rect.y + rect.h / 2 + 10);
        this.ctx.textAlign = 'left';
      }
    }

    if (!this.isRunning) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('全部配对成功！', W / 2, H / 2 - 20);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`分数 ${this.score} · 用了 ${this.moves} 步`, W / 2, H / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }
}
