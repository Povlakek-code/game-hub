import { BaseGame } from './base/BaseGame';

const COLS = 10;
const ROWS = 20;

type Matrix = number[][];

const SHAPES: Record<string, Matrix> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};

const COLORS: Record<string, string> = {
  I: '#22d3ee',
  O: '#facc15',
  T: '#a78bfa',
  S: '#4ade80',
  Z: '#f87171',
  J: '#60a5fa',
  L: '#fb923c',
};

interface Piece {
  type: string;
  matrix: Matrix;
  x: number;
  y: number;
}

function rotateCW(m: Matrix): Matrix {
  const n = m.length;
  const out: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[x][n - 1 - y] = m[y][x];
  return out;
}

export class TetrisGame extends BaseGame {
  private board: (string | null)[][] = [];
  private current: Piece | null = null;
  private bag: string[] = [];
  private nextType: string = 'T';
  private fallTimer = 0;
  private lockTimer = 0;
  private lines = 0;
  private level = 1;
  private keysDown = new Set<string>();
  private dasTimer = 0;
  private dasDir = 0;
  private softDropTimer = 0;
  private touchStart: { x: number; y: number; t: number } | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null;

  init() {
    this.board = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
    this.bag = [];
    this.lines = 0;
    this.level = 1;
    this.score = 0;
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.keysDown.clear();
    this.dasTimer = 0;
    this.dasDir = 0;
    this.nextType = this.drawFromBag();
    this.spawn();

    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => {
      this.keysDown.delete(e.key);
      if (
        (e.key === 'ArrowLeft' && this.dasDir === -1) ||
        (e.key === 'ArrowRight' && this.dasDir === 1)
      ) {
        this.dasDir = 0;
        this.dasTimer = 0;
      }
    };
    this.boundTouchStart = (e) => {
      const t = e.touches[0];
      if (t) this.touchStart = { x: t.clientX, y: t.clientY, t: performance.now() };
      e.preventDefault();
    };
    this.boundTouchEnd = (e) => {
      const t = e.changedTouches[0];
      if (t && this.touchStart) this.handleTouch(t.clientX, t.clientY);
      this.touchStart = null;
      e.preventDefault();
    };
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
  }

  override destroy() {
    if (this.boundKeyDown) document.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) document.removeEventListener('keyup', this.boundKeyUp);
    if (this.boundTouchStart) this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    if (this.boundTouchEnd) this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    this.boundKeyDown = this.boundKeyUp = this.boundTouchStart = this.boundTouchEnd = null;
    super.destroy();
  }

  private drawFromBag(): string {
    if (this.bag.length === 0) {
      this.bag = Object.keys(SHAPES);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }

  private spawn() {
    const type = this.nextType;
    this.nextType = this.drawFromBag();
    const matrix = SHAPES[type].map((row) => [...row]);
    this.current = { type, matrix, x: Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2), y: 0 };
    this.fallTimer = 0;
    this.lockTimer = 0;
    if (this.collides(this.current.matrix, this.current.x, this.current.y)) {
      this.current = null;
      this.stop();
    }
  }

  private collides(matrix: Matrix, px: number, py: number): boolean {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (!matrix[y][x]) continue;
        const bx = px + x;
        const by = py + y;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    }
    return false;
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.current) return false;
    if (!this.collides(this.current.matrix, this.current.x + dx, this.current.y + dy)) {
      this.current.x += dx;
      this.current.y += dy;
      if (dx !== 0 || dy !== 0) this.lockTimer = 0;
      return true;
    }
    return false;
  }

  private tryRotate(ccw: boolean) {
    if (!this.current) return;
    let m = rotateCW(this.current.matrix);
    if (ccw) m = rotateCW(rotateCW(m));
    // 简单踢墙：依次尝试 x 偏移
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!this.collides(m, this.current.x + dx, this.current.y)) {
        this.current.matrix = m;
        this.current.x += dx;
        this.lockTimer = 0;
        return;
      }
    }
  }

  private hardDrop() {
    if (!this.current) return;
    while (!this.collides(this.current.matrix, this.current.x, this.current.y + 1)) {
      this.current.y += 1;
    }
    this.lockPiece();
  }

  private lockPiece() {
    if (!this.current) return;
    for (let y = 0; y < this.current.matrix.length; y++) {
      for (let x = 0; x < this.current.matrix[y].length; x++) {
        if (!this.current.matrix[y][x]) continue;
        const by = this.current.y + y;
        const bx = this.current.x + x;
        if (by < 0) {
          this.current = null;
          this.stop();
          return;
        }
        this.board[by][bx] = this.current.type;
      }
    }
    this.clearLines();
    this.spawn();
  }

  private clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every((c) => c !== null)) {
        this.board.splice(y, 1);
        this.board.unshift(Array<string | null>(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] ?? 800;
      this.score += points * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'x', 'X', 'z', 'Z'].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.repeat) return;
    this.keysDown.add(e.key);
    switch (e.key) {
      case 'ArrowLeft':
        this.tryMove(-1, 0);
        this.dasDir = -1;
        this.dasTimer = 0;
        break;
      case 'ArrowRight':
        this.tryMove(1, 0);
        this.dasDir = 1;
        this.dasTimer = 0;
        break;
      case 'ArrowDown':
        this.tryMove(0, 1);
        this.softDropTimer = 0;
        break;
      case 'ArrowUp':
      case 'x':
      case 'X':
        this.tryRotate(false);
        break;
      case 'z':
      case 'Z':
        this.tryRotate(true);
        break;
      case ' ':
        this.hardDrop();
        break;
    }
  }

  private handleTouch(clientX: number, clientY: number) {
    if (!this.touchStart) return;
    const dx = clientX - this.touchStart.x;
    const dy = clientY - this.touchStart.y;
    if (dy > 50 && Math.abs(dy) > Math.abs(dx)) {
      this.hardDrop();
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      // 轻点：左1/3左移，右1/3右移，中间旋转
      const { x } = this.toCanvasCoords(clientX, clientY);
      const W = this.canvas.width;
      if (x < W * 0.4) this.tryMove(-1, 0);
      else if (x > W * 0.6) this.tryMove(1, 0);
      else this.tryRotate(false);
    } else if (Math.abs(dx) > 30) {
      this.tryMove(dx > 0 ? 1 : -1, 0);
    }
  }

  handleInput(event: KeyboardEvent | TouchEvent | MouseEvent) {
    if (event instanceof KeyboardEvent) this.onKeyDown(event);
  }

  update() {
    if (!this.current) return;
    const dt = 1 / 60;

    // 左右长按连发（DAS）
    if (this.dasDir !== 0) {
      this.dasTimer += dt;
      if (this.dasTimer > 0.16) {
        this.dasTimer = 0.11; // 保持连发间隔
        this.tryMove(this.dasDir, 0);
      }
    }
    // 下键软降
    if (this.keysDown.has('ArrowDown')) {
      this.softDropTimer += dt;
      if (this.softDropTimer > 0.03) {
        this.softDropTimer = 0;
        if (!this.tryMove(0, 1)) {
          // 到底了交给锁定逻辑
        } else {
          this.score += 1;
        }
      }
    }

    const interval = Math.max(0.05, 0.8 * Math.pow(0.85, this.level - 1));
    if (this.collides(this.current.matrix, this.current.x, this.current.y + 1)) {
      this.lockTimer += dt;
      if (this.lockTimer > 0.5) this.lockPiece();
    } else {
      this.lockTimer = 0;
      this.fallTimer += dt;
      if (this.fallTimer >= interval) {
        this.fallTimer = 0;
        this.tryMove(0, 1);
      }
    }
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, W, H);

    const sideW = 110;
    const availW = W - sideW - 24;
    const cell = Math.floor(Math.min(availW / COLS, (H - 16) / ROWS));
    const bw = cell * COLS;
    const bh = cell * ROWS;
    const ox = 12;
    const oy = Math.floor((H - bh) / 2);

    // 棋盘背景 + 网格
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(ox, oy, bw, bh);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(ox + x * cell, oy);
      this.ctx.lineTo(ox + x * cell, oy + bh);
      this.ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(ox, oy + y * cell);
      this.ctx.lineTo(ox + bw, oy + y * cell);
      this.ctx.stroke();
    }

    const drawBlock = (bx: number, by: number, color: string, ghost = false) => {
      this.ctx.fillStyle = ghost ? 'rgba(148,163,184,0.35)' : color;
      this.ctx.fillRect(ox + bx * cell + 1, oy + by * cell + 1, cell - 2, cell - 2);
    };

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = this.board[y][x];
        if (t) drawBlock(x, y, COLORS[t]);
      }
    }

    if (this.current) {
      // 幽灵投影
      let gy = this.current.y;
      while (!this.collides(this.current.matrix, this.current.x, gy + 1)) gy += 1;
      for (let y = 0; y < this.current.matrix.length; y++) {
        for (let x = 0; x < this.current.matrix[y].length; x++) {
          if (!this.current.matrix[y][x]) continue;
          if (gy + y >= 0) drawBlock(this.current.x + x, gy + y, '#94a3b8', true);
          if (this.current.y + y >= 0)
            drawBlock(this.current.x + x, this.current.y + y, COLORS[this.current.type]);
        }
      }
    }

    // 侧边信息栏
    const sx = ox + bw + 12;
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = 'bold 15px sans-serif';
    this.ctx.fillText('分数', sx, 40);
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(`${this.score}`, sx, 64);
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = 'bold 15px sans-serif';
    this.ctx.fillText('等级', sx, 96);
    this.ctx.fillText('行数', sx, 148);
    this.ctx.font = 'bold 20px sans-serif';
    this.ctx.fillStyle = '#7dd3fc';
    this.ctx.fillText(`${this.level}`, sx, 120);
    this.ctx.fillText(`${this.lines}`, sx, 172);
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = 'bold 15px sans-serif';
    this.ctx.fillText('下一个', sx, 204);
    const nm = SHAPES[this.nextType];
    const ncell = 14;
    for (let y = 0; y < nm.length; y++) {
      for (let x = 0; x < nm[y].length; x++) {
        if (!nm[y][x]) continue;
        this.ctx.fillStyle = COLORS[this.nextType];
        this.ctx.fillRect(sx + x * ncell, 214 + y * ncell, ncell - 2, ncell - 2);
      }
    }

    if (!this.isRunning) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('游戏结束', W / 2, H / 2 - 20);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`分数 ${this.score} · ${this.lines} 行`, W / 2, H / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }
}
