export abstract class BaseGame {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected animationId: number | null = null;
  protected isRunning = false;
  protected score = 0;
  protected isPaused = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to get 2D context');
    }
    this.ctx = context;
    this.setupCanvas();
  }

  protected setupCanvas() {
    // canvas 可能在挂载瞬间 offset 为 0（如 display:none），给一个合理的后备尺寸
    const width = this.canvas.offsetWidth || this.canvas.clientWidth || 640;
    const height = this.canvas.offsetHeight || this.canvas.clientHeight || 400;
    // 避免 0 宽高导致除零 / 游戏逻辑异常
    this.canvas.width = Math.max(1, Math.floor(width));
    this.canvas.height = Math.max(1, Math.floor(height));
  }

  abstract init(): void;
  abstract update(deltaTime: number): void;
  abstract render(): void;
  abstract handleInput(event: KeyboardEvent | TouchEvent | MouseEvent): void;

  start() {
    this.isRunning = true;
    this.init();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 彻底销毁实例：停止循环 + 子类清理事件监听。
   * GameModal 在 unmount / restart / close 时必须调用，防止监听器泄漏。
   */
  destroy() {
    this.stop();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  private gameLoop = () => {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      this.update(1 / 60);
    }
    this.render();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  getScore(): number {
    return this.score;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * 把鼠标/触摸的 client 坐标换算成 canvas 内部坐标。
   * （canvas CSS 尺寸和内部像素尺寸可能不一致，必须换算）
   */
  protected toCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }
}
