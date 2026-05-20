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
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
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
    }
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
}
