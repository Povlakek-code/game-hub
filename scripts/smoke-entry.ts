/**
 * 游戏逻辑冒烟测试（Node 环境运行，不依赖浏览器）。
 * 用 stub 的 canvas/document 跑全部 7 个游戏的 update/render 循环，
 * 并模拟键盘/鼠标输入，目标：零异常 + 覆盖开局/暂停/结束/销毁路径。
 *
 * 运行：npm run test:games
 */
import { SnakeGame } from '../src/games/SnakeGame';
import { DodgeGame } from '../src/games/DodgeGame';
import { BreakoutGame } from '../src/games/BreakoutGame';
import { TetrisGame } from '../src/games/TetrisGame';
import { FlappyGame } from '../src/games/FlappyGame';
import { MemoryGame } from '../src/games/MemoryGame';
import { MinesweeperGame } from '../src/games/MinesweeperGame';
import type { BaseGame } from '../src/games/base/BaseGame';

// ---------- 全局 stub ----------
class FakeKeyboardEvent {
  key = '';
  type = 'keydown';
  preventDefault() { /* noop */ }
}
class FakeMouseEvent {
  type = 'click';
  clientX = 0;
  clientY = 0;
  preventDefault() { /* noop */ }
}
class FakeTouchEvent {
  type = 'touchstart';
  touches: Array<{ clientX: number; clientY: number }> = [];
  changedTouches: Array<{ clientX: number; clientY: number }> = [];
  preventDefault() { /* noop */ }
}

(globalThis as Record<string, unknown>).KeyboardEvent = FakeKeyboardEvent;
(globalThis as Record<string, unknown>).MouseEvent = FakeMouseEvent;
(globalThis as Record<string, unknown>).TouchEvent = FakeTouchEvent;
(globalThis as Record<string, unknown>).document = {
  addEventListener() { /* noop */ },
  removeEventListener() { /* noop */ },
};
(globalThis as Record<string, unknown>).requestAnimationFrame = () => 0;
(globalThis as Record<string, unknown>).cancelAnimationFrame = () => undefined;

const ctxStub = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'createLinearGradient') return () => ({ addColorStop() { /* noop */ } });
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'canvas') return null;
      return () => undefined;
    },
    set() {
      return true;
    },
  }
);

function makeCanvas(w = 640, h = 400): HTMLCanvasElement {
  return {
    width: w,
    height: h,
    offsetWidth: w,
    offsetHeight: h,
    clientWidth: w,
    clientHeight: h,
    getContext: () => ctxStub,
    addEventListener() { /* noop */ },
    removeEventListener() { /* noop */ },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
  } as unknown as HTMLCanvasElement;
}

function key(k: string): KeyboardEvent {
  const e = new FakeKeyboardEvent();
  e.key = k;
  return e as unknown as KeyboardEvent;
}

function clickAt(x: number, y: number): MouseEvent {
  const e = new FakeMouseEvent();
  e.clientX = x;
  e.clientY = y;
  return e as unknown as MouseEvent;
}

// 确定性伪随机，保证测试可复现
let seed = 123456789;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

// ---------- 通用驱动 ----------
interface DriveOptions {
  frames: number;
  onFrame?: (frame: number, game: BaseGame) => void;
  pauseAt?: number;
}

function drive(game: BaseGame, opts: DriveOptions): { score: number; ended: boolean } {
  const canvas = makeCanvas();
  void canvas;
  game.start();
  let ended = false;
  for (let f = 0; f < opts.frames; f++) {
    if (opts.pauseAt === f) game.pause();
    if (opts.pauseAt !== undefined && f === opts.pauseAt + 20) game.resume();
    opts.onFrame?.(f, game);
    (game as unknown as { update: (dt: number) => void }).update(1 / 60);
    game.render();
    if (!game.getIsRunning()) {
      ended = true;
      game.render(); // 再渲染一次结算屏
      break;
    }
  }
  const score = game.getScore();
  if (!Number.isFinite(score)) throw new Error('score 不是有限数字');
  game.destroy();
  return { score, ended };
}

// ---------- 各游戏脚本 ----------
const results: string[] = [];
function test(name: string, fn: () => { score: number; ended: boolean }) {
  const { score, ended } = fn();
  results.push(`${name}: frames OK, score=${score}, ended=${ended}`);
}

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

test('snake', () => {
  const g = new SnakeGame(makeCanvas());
  return drive(g, {
    frames: 900,
    pauseAt: 100,
    onFrame: (f, game) => {
      if (f % 30 === 0) game.handleInput(key(ARROWS[Math.floor(rand() * 4)]));
    },
  });
});

test('dodge', () => {
  const g = new DodgeGame(makeCanvas());
  let dir = 'ArrowLeft';
  return drive(g, {
    frames: 1200,
    pauseAt: 60,
    onFrame: (f, game) => {
      if (f % 45 === 0) {
        dir = dir === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
        game.handleInput(key(dir));
      }
    },
  });
});

test('breakout-launch-and-play', () => {
  const g = new BreakoutGame(makeCanvas());
  return drive(g, {
    frames: 2400,
    pauseAt: 50,
    onFrame: (f, game) => {
      if (f === 5) game.handleInput(key(' ')); // 发射
      if (f % 25 === 0) game.handleInput(key(rand() > 0.5 ? 'ArrowLeft' : 'ArrowRight'));
    },
  });
});

test('tetris', () => {
  const g = new TetrisGame(makeCanvas());
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'z', 'x'];
  return drive(g, {
    frames: 3600,
    pauseAt: 200,
    onFrame: (f, game) => {
      if (f % 4 === 0) game.handleInput(key(keys[Math.floor(rand() * keys.length)]));
    },
  });
});

test('flappy', () => {
  const g = new FlappyGame(makeCanvas());
  return drive(g, {
    frames: 1500,
    pauseAt: 40,
    onFrame: (f, game) => {
      if (f % 22 === 0) game.handleInput(key(' '));
    },
  });
});

test('memory', () => {
  const g = new MemoryGame(makeCanvas());
  // 4x4 网格中心点（640x400, top=56）
  const top = 56;
  const gap = 8;
  const w = (640 - gap * 5) / 4;
  const h = (400 - top - gap * 5 - 8) / 4;
  const centers: Array<[number, number]> = [];
  for (let i = 0; i < 16; i++) {
    const c = i % 4;
    const r = Math.floor(i / 4);
    centers.push([gap + c * (w + gap) + w / 2, top + gap + r * (h + gap) + h / 2]);
  }
  let order = centers.map((_, i) => i);
  // 每 200 帧 reshuffle 点击顺序，模拟真实翻牌
  return drive(g, {
    frames: 2000,
    pauseAt: 30,
    onFrame: (f, game) => {
      if (f % 200 === 0) {
        order = [...order].sort(() => rand() - 0.5);
      }
      if (f % 8 === 0) {
        const idx = order[(f / 8) % 16 | 0];
        const [x, y] = centers[idx];
        game.handleInput(clickAt(x, y));
      }
    },
  });
});

test('minesweeper', () => {
  const g = new MinesweeperGame(makeCanvas());
  return drive(g, {
    frames: 600,
    pauseAt: 20,
    onFrame: (f, game) => {
      if (f % 10 === 0) {
        // 网格居中 9x9，随机点格子
        const size = Math.min((640 - 16) / 9, (400 - 56 - 12) / 9);
        const gx = (640 - size * 9) / 2;
        const gy = 56;
        const c = Math.floor(rand() * 9);
        const r = Math.floor(rand() * 9);
        game.handleInput(clickAt(gx + c * size + size / 2, gy + r * size + size / 2));
      }
    },
  });
});

// 重启路径：同一 canvas 上建第二个实例（覆盖监听器泄漏回归）
test('restart-snake', () => {
  const canvas = makeCanvas();
  const g1 = new SnakeGame(canvas);
  g1.start();
  for (let i = 0; i < 60; i++) {
    (g1 as unknown as { update: (dt: number) => void }).update(1 / 60);
    g1.render();
  }
  g1.destroy();
  const g2 = new SnakeGame(canvas);
  return drive(g2, { frames: 300 });
});

// eslint-disable-next-line no-console
console.log('🎮 烟雾测试全部通过：');
for (const line of results) {
  // eslint-disable-next-line no-console
  console.log(`  ✅ ${line}`);
}
