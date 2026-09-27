import { BaseGame } from './base/BaseGame';

const COLS = 9;
const ROWS = 9;
const MINES = 10;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export class MinesweeperGame extends BaseGame {
  private board: Cell[][] = [];
  private minesPlaced = false;
  private revealedCount = 0;
  private flagCount = 0;
  private elapsed = 0;
  private won = false;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundContext: ((e: MouseEvent) => void) | null = null;
  private boundTouch: ((e: TouchEvent) => void) | null = null;
  private lastTapTime = 0;
  private lastTapCell = '';

  init() {
    this.board = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );
    this.minesPlaced = false;
    this.revealedCount = 0;
    this.flagCount = 0;
    this.elapsed = 0;
    this.won = false;
    this.score = 0;

    this.boundClick = (e) => {
      const { x, y } = this.toCanvasCoords(e.clientX, e.clientY);
      this.revealAt(x, y);
    };
    this.boundContext = (e) => {
      e.preventDefault();
      const { x, y } = this.toCanvasCoords(e.clientX, e.clientY);
      this.flagAt(x, y);
    };
    // 移动端：快速双击=标记，单击=揭开
    this.boundTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const { x, y } = this.toCanvasCoords(t.clientX, t.clientY);
      const now = performance.now();
      const key = this.cellKeyAt(x, y);
      if (key && key === this.lastTapCell && now - this.lastTapTime < 350) {
        this.flagAt(x, y);
        this.lastTapCell = '';
      } else {
        this.revealAt(x, y);
        this.lastTapCell = key;
        this.lastTapTime = now;
      }
      e.preventDefault();
    };
    this.canvas.addEventListener('click', this.boundClick);
    this.canvas.addEventListener('contextmenu', this.boundContext);
    this.canvas.addEventListener('touchstart', this.boundTouch, { passive: false });
  }

  override destroy() {
    if (this.boundClick) this.canvas.removeEventListener('click', this.boundClick);
    if (this.boundContext) this.canvas.removeEventListener('contextmenu', this.boundContext);
    if (this.boundTouch) this.canvas.removeEventListener('touchstart', this.boundTouch);
    this.boundClick = this.boundContext = this.boundTouch = null;
    super.destroy();
  }

  handleInput(event: KeyboardEvent | TouchEvent | MouseEvent) {
    if (event instanceof MouseEvent) {
      const { x, y } = this.toCanvasCoords(event.clientX, event.clientY);
      if (event.type === 'contextmenu') this.flagAt(x, y);
      else this.revealAt(x, y);
    }
  }

  private gridRect(): { x: number; y: number; size: number } {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const top = 56;
    const size = Math.min((W - 16) / COLS, (H - top - 12) / ROWS);
    const x = (W - size * COLS) / 2;
    return { x, y: top, size };
  }

  private cellAt(px: number, py: number): { r: number; c: number } | null {
    const { x, y, size } = this.gridRect();
    const c = Math.floor((px - x) / size);
    const r = Math.floor((py - y) / size);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  }

  private cellKeyAt(px: number, py: number): string {
    const cell = this.cellAt(px, py);
    return cell ? `${cell.r},${cell.c}` : '';
  }

  private neighbors(r: number, c: number): Array<{ r: number; c: number }> {
    const out: Array<{ r: number; c: number }> = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push({ r: nr, c: nc });
      }
    }
    return out;
  }

  private placeMines(safeR: number, safeC: number) {
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if ((r === safeR && c === safeC) || this.board[r][c].mine) continue;
      this.board[r][c].mine = true;
      placed += 1;
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.board[r][c].adjacent = this.neighbors(r, c).filter(
          ({ r: nr, c: nc }) => this.board[nr][nc].mine
        ).length;
      }
    }
    this.minesPlaced = true;
  }

  private revealAt(px: number, py: number) {
    if (!this.isRunning || this.isPaused) return;
    const cell = this.cellAt(px, py);
    if (!cell) return;
    const { r, c } = cell;
    if (!this.minesPlaced) this.placeMines(r, c);
    const target = this.board[r][c];
    if (target.revealed || target.flagged) return;
    if (target.mine) {
      // 踩雷：全部摊开展示
      for (const row of this.board) for (const item of row) if (item.mine) item.revealed = true;
      this.won = false;
      this.stop();
      return;
    }
    this.floodReveal(r, c);
    this.score = this.revealedCount * 10 + Math.max(0, 500 - Math.floor(this.elapsed) * 5);
    if (this.revealedCount >= ROWS * COLS - MINES) {
      this.won = true;
      this.score += 300;
      this.stop();
    }
  }

  private floodReveal(r: number, c: number) {
    const stack: Array<{ r: number; c: number }> = [{ r, c }];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      const cell = this.board[cur.r][cur.c];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      this.revealedCount += 1;
      if (cell.adjacent === 0) {
        for (const n of this.neighbors(cur.r, cur.c)) {
          if (!this.board[n.r][n.c].revealed) stack.push(n);
        }
      }
    }
  }

  private flagAt(px: number, py: number) {
    if (!this.isRunning || this.isPaused) return;
    const cell = this.cellAt(px, py);
    if (!cell) return;
    const target = this.board[cell.r][cell.c];
    if (target.revealed) return;
    target.flagged = !target.flagged;
    this.flagCount += target.flagged ? 1 : -1;
  }

  update() {
    this.elapsed += 1 / 60;
  }

  render() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.fillRect(0, 0, W, H);

    this.ctx.fillStyle = '#334155';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText(`分数 ${this.score}`, 12, 26);
    this.ctx.fillText(`🚩 ${this.flagCount}/${MINES}`, 12, 48);
    this.ctx.fillText(`⏱ ${Math.floor(this.elapsed)}s`, W - 70, 26);

    const { x: gx, y: gy, size } = this.gridRect();
    const numColors = ['', '#2563eb', '#15803d', '#dc2626', '#7c3aed', '#b45309', '#0d9488', '#000', '#555'];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.board[r][c];
        const x = gx + c * size;
        const y = gy + r * size;
        if (cell.revealed) {
          this.ctx.fillStyle = cell.mine ? '#ef4444' : '#e2e8f0';
          this.ctx.fillRect(x, y, size, size);
          if (cell.mine) {
            this.ctx.font = `${Math.floor(size * 0.6)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💣', x + size / 2, y + size * 0.72);
            this.ctx.textAlign = 'left';
          } else if (cell.adjacent > 0) {
            this.ctx.fillStyle = numColors[cell.adjacent];
            this.ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${cell.adjacent}`, x + size / 2, y + size * 0.72);
            this.ctx.textAlign = 'left';
          }
        } else {
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.fillRect(x, y, size, size);
          this.ctx.fillStyle = '#cbd5e1';
          this.ctx.fillRect(x + 1, y + 1, size - 2, 3);
          if (cell.flagged) {
            this.ctx.font = `${Math.floor(size * 0.6)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🚩', x + size / 2, y + size * 0.72);
            this.ctx.textAlign = 'left';
          }
        }
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      }
    }

    if (!this.isRunning) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.won ? '扫雷成功！🎉' : '踩到地雷！', W / 2, H / 2 - 20);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`最终分数: ${this.score}`, W / 2, H / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }
}
