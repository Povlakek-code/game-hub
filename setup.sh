#!/bin/bash

# 创建项目目录结构
mkdir -p src/components
mkdir -p src/games/base
mkdir -p src/types
mkdir -p src/utils
mkdir -p public
mkdir -p .github/workflows

# 创建所有文件
# ============ 配置文件 ============

cat > package.json << 'EOF'
{
  "name": "game-hub",
  "private": false,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "deploy:pages": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/game-hub/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
EOF

cat > tailwind.config.js << 'EOF'
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat > .gitignore << 'EOF'
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOF

cat > wrangler.toml << 'EOF'
name = "game-hub"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "game-hub-prod"
vars = { ENVIRONMENT = "production" }

[env.development]
name = "game-hub-dev"
vars = { ENVIRONMENT = "development" }
EOF

# ============ HTML 文件 ============

cat > index.html << 'EOF'
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/game-hub/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🎮 游戏中心</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ============ 源代码文件 ============

cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

canvas {
  display: block;
  background: #f5f5f5;
}
EOF

cat > src/App.tsx << 'EOF'
import { GameGrid } from './components/GameGrid'
import './App.css'

function App() {
  return <GameGrid />
}

export default App
EOF

cat > src/App.css << 'EOF'
/* App styles */
EOF

cat > src/types/game.ts << 'EOF'
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  difficulty: GameDifficulty;
  author: string;
  enabled: boolean;
}

export interface GameInstanceProps {
  onGameEnd: (score: number) => void;
  onClose: () => void;
}

export interface GameInstance {
  config: GameConfig;
  component: React.ComponentType<GameInstanceProps>;
  highScore: number;
  lastPlayed: number;
}

export interface StoredGameData {
  highScore: number;
  lastPlayed: number;
}
EOF

cat > src/utils/storage.ts << 'EOF'
import { StoredGameData } from '../types/game';

const STORAGE_PREFIX = 'game-hub:';
const GAMES_CONFIG_KEY = 'games-config';

export const storage = {
  setGameData: (gameId: string, data: StoredGameData) => {
    localStorage.setItem(
      `${STORAGE_PREFIX}${gameId}`,
      JSON.stringify(data)
    );
  },

  getGameData: (gameId: string): StoredGameData | null => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    return data ? JSON.parse(data) : null;
  },

  setGamesConfig: (configs: any[]) => {
    localStorage.setItem(
      `${STORAGE_PREFIX}${GAMES_CONFIG_KEY}`,
      JSON.stringify(configs)
    );
  },

  getGamesConfig: (): any[] => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${GAMES_CONFIG_KEY}`);
    return data ? JSON.parse(data) : [];
  },

  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};
EOF

cat > src/utils/gameRegistry.ts << 'EOF'
import { GameConfig, GameInstance } from '../types/game';
import { storage } from './storage';

class GameRegistry {
  private games: Map<string, GameInstance> = new Map();
  private defaultGames: GameConfig[] = [
    {
      id: 'snake',
      title: '贪吃蛇',
      description: '经典的贪吃蛇游戏，吃掉食物长大，避免撞到自己和墙壁',
      thumbnail: '🐍',
      tags: ['动作', '经典'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'dodge',
      title: '躲避游戏',
      description: '躲避掉落的障碍物，坚持得越久分数越高',
      thumbnail: '⚪',
      tags: ['动作', '反应'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'shooting',
      title: '简单射击游戏',
      description: '射击来袭的敌人，保护自己',
      thumbnail: '🏯',
      tags: ['动作', '射击'],
      difficulty: 'hard',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'pacman',
      title: '吃豆人',
      description: '吃掉所有的豆子，避免幽灵',
      thumbnail: '👾',
      tags: ['经典', '冒险'],
      difficulty: 'hard',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'memory',
      title: '翻牌游戏',
      description: '找出匹配的卡牌对，锻练记忆力',
      thumbnail: '🎴',
      tags: ['益智', '记忆'],
      difficulty: 'easy',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'tetris',
      title: '俄罗斯方块',
      description: '堆积方块，消除整行获得分数',
      thumbnail: '🧩',
      tags: ['益智', '经典'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'minesweeper',
      title: '扫雷',
      description: '推理游戏，找出所有的地雷',
      thumbnail: '💣',
      tags: ['益智', '推理'],
      difficulty: 'hard',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'cardmatch',
      title: '记忆卡牌',
      description: '快速找到匹配的卡牌，考验你的记忆力',
      thumbnail: '🃏',
      tags: ['益智', '记忆'],
      difficulty: 'easy',
      author: 'Game Hub',
      enabled: true,
    },
    {
      id: 'match3',
      title: '消消乐',
      description: '三个或以上相同的方块可以消除，获得分数',
      thumbnail: '💎',
      tags: ['益智', '消除'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
    },
  ];

  constructor() {
    this.initializeGames();
  }

  private initializeGames() {
    const savedConfigs = storage.getGamesConfig();
    const configsToUse = savedConfigs.length > 0 ? savedConfigs : this.defaultGames;

    configsToUse.forEach(config => {
      const gameData = storage.getGameData(config.id);
      this.games.set(config.id, {
        config,
        component: () => null,
        highScore: gameData?.highScore || 0,
        lastPlayed: gameData?.lastPlayed || 0,
      });
    });
  }

  addGame(config: GameConfig, component: React.ComponentType<any>) {
    this.games.set(config.id, {
      config,
      component,
      highScore: 0,
      lastPlayed: 0,
    });
    this.saveToStorage();
  }

  updateGame(id: string, updates: Partial<GameConfig>) {
    const game = this.games.get(id);
    if (game) {
      game.config = { ...game.config, ...updates };
      this.saveToStorage();
    }
  }

  removeGame(id: string) {
    this.games.delete(id);
    this.saveToStorage();
  }

  getGame(id: string) {
    return this.games.get(id);
  }

  getAllGames() {
    return Array.from(this.games.values());
  }

  updateGameScore(id: string, score: number) {
    const game = this.games.get(id);
    if (game && score > game.highScore) {
      game.highScore = score;
      storage.setGameData(id, {
        highScore: score,
        lastPlayed: Date.now(),
      });
    }
  }

  private saveToStorage() {
    const configs = Array.from(this.games.values()).map(g => g.config);
    storage.setGamesConfig(configs);
  }
}

export const gameRegistry = new GameRegistry();
EOF

cat > src/games/base/BaseGame.ts << 'EOF'
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
EOF

cat > src/games/SnakeGame.ts << 'EOF'
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
EOF

cat > src/games/DodgeGame.ts << 'EOF'
import { BaseGame } from './base/BaseGame';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export class DodgeGame extends BaseGame {
  private player: GameObject;
  private obstacles: GameObject[] = [];
  private gameOver = false;
  private obstacleSpawnRate = 0.02;
  private gameTime = 0;
  private difficulty = 1;

  init() {
    this.player = {
      x: this.canvas.width / 2 - 15,
      y: this.canvas.height - 40,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
    };
    this.obstacles = [];
    this.score = 0;
    this.gameOver = false;
    this.gameTime = 0;
    this.difficulty = 1;

    document.addEventListener('keydown', this.handleInput.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.player.vx = 0;
    }
  }

  handleInput(event: KeyboardEvent) {
    const speed = 5;
    if (event.key === 'ArrowLeft') {
      this.player.vx = -speed;
    } else if (event.key === 'ArrowRight') {
      this.player.vx = speed;
    }
  }

  update() {
    if (this.gameOver) return;

    this.gameTime += 1 / 60;
    this.difficulty = 1 + Math.floor(this.gameTime / 10) * 0.1;
    this.obstacleSpawnRate = Math.min(0.02 + this.gameTime * 0.001, 0.05);

    this.player.x += this.player.vx;
    this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));

    if (Math.random() < this.obstacleSpawnRate) {
      this.obstacles.push({
        x: Math.random() * (this.canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        vx: 0,
        vy: 2 + this.difficulty,
      });
    }

    this.obstacles = this.obstacles.filter(obs => {
      obs.y += obs.vy;
      return obs.y < this.canvas.height;
    });

    for (const obs of this.obstacles) {
      if (this.checkCollision(this.player, obs)) {
        this.gameOver = true;
        this.stop();
        return;
      }
    }

    this.score = Math.floor(this.gameTime);
  }

  private checkCollision(rect1: GameObject, rect2: GameObject): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  render() {
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = '#ff6b6b';
    for (const obs of this.obstacles) {
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(`分数: ${this.score}`, 10, 30);
    this.ctx.fillText(`难度: ${this.difficulty.toFixed(1)}`, 10, 60);

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
EOF

cat > src/games/index.ts << 'EOF'
export { BaseGame } from './base/BaseGame';
export { SnakeGame } from './SnakeGame';
export { DodgeGame } from './DodgeGame';
EOF

cat > src/components/GameCard.tsx << 'EOF'
import React from 'react';
import { GameInstance } from '../types/game';

interface GameCardProps {
  game: GameInstance;
  onPlay: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all 
                 cursor-pointer transform hover:scale-105"
      onClick={onPlay}
    >
      <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 
                      flex items-center justify-center">
        <span className="text-7xl">{game.config.thumbnail}</span>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {game.config.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {game.config.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {game.config.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>
            难度:{' '}
            <span
              className={{
                easy: 'text-green-600',
                medium: 'text-yellow-600',
                hard: 'text-red-600',
              }[game.config.difficulty]}
            >
              {game.config.difficulty}
            </span>
          </span>
          <span>🏆 {game.highScore}</span>
        </div>
      </div>
    </div>
  );
};
EOF

cat > src/components/GameGrid.tsx << 'EOF'
import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { GameModal } from './GameModal';
import { AdminPanel } from './AdminPanel';
import { gameRegistry } from '../utils/gameRegistry';

export const GameGrid: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [games, setGames] = React.useState(gameRegistry.getAllGames());

  const handleAddGame = (config: any) => {
    gameRegistry.updateGame(config.id, config);
    setGames([...gameRegistry.getAllGames()]);
  };

  const enabledGames = games.filter((g) => g.config.enabled);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-4">🎮 游戏中心</h1>
              <p className="text-xl text-gray-600">选择一个游戏开始玩吧！</p>
            </div>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg 
                       transition-colors"
            >
              ⚙️ 管理
            </button>
          </div>

          {enabledGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暂无游戏，请通过管理面板添加游戏</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enabledGames.map((game) => (
                <GameCard
                  key={game.config.id}
                  game={game}
                  onPlay={() => setSelectedGameId(game.config.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedGameId && (
        <GameModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAddGame={handleAddGame}
      />
    </>
  );
};
EOF

cat > src/components/GameModal.tsx << 'EOF'
import React, { useEffect, useRef, useState } from 'react';
import { gameRegistry } from '../utils/gameRegistry';
import { SnakeGame } from '../games/SnakeGame';
import { DodgeGame } from '../games/DodgeGame';

interface GameModalProps {
  gameId: string;
  onClose: () => void;
}

type GameType = SnakeGame | DodgeGame | null;

export const GameModal: React.FC<GameModalProps> = ({ gameId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameType>(null);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const game = gameRegistry.getGame(gameId);

  useEffect(() => {
    if (!canvasRef.current || !game) return;

    let gameInstance: GameType = null;

    if (gameId === 'snake') {
      gameInstance = new SnakeGame(canvasRef.current);
    } else if (gameId === 'dodge') {
      gameInstance = new DodgeGame(canvasRef.current);
    }

    if (gameInstance) {
      gameRef.current = gameInstance;
      gameInstance.start();

      const checkGameStatus = setInterval(() => {
        if (gameInstance && !gameInstance.getIsRunning()) {
          setScore(gameInstance.getScore());
          setGameEnded(true);
          gameRegistry.updateGameScore(gameId, gameInstance.getScore());
          clearInterval(checkGameStatus);
        }
      }, 100);

      return () => {
        clearInterval(checkGameStatus);
        gameInstance?.stop();
      };
    }
  }, [gameId, game]);

  const handleRestart = () => {
    if (canvasRef.current) {
      setGameEnded(false);
      setScore(0);
      gameRef.current?.stop();

      let gameInstance: GameType = null;
      if (gameId === 'snake') {
        gameInstance = new SnakeGame(canvasRef.current);
      } else if (gameId === 'dodge') {
        gameInstance = new DodgeGame(canvasRef.current);
      }

      if (gameInstance) {
        gameRef.current = gameInstance;
        gameInstance.start();

        const checkGameStatus = setInterval(() => {
          if (gameInstance && !gameInstance.getIsRunning()) {
            setScore(gameInstance.getScore());
            setGameEnded(true);
            gameRegistry.updateGameScore(gameId, gameInstance.getScore());
            clearInterval(checkGameStatus);
          }
        }, 100);
      }
    }
  };

  if (!game) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-center text-gray-800">游戏加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{game.config.title}</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-gray-300 rounded bg-gray-100"
            style={{ height: '400px' }}
          />
        </div>

        <div className="bg-gray-100 p-4 flex justify-between items-center border-t">
          <div className="text-gray-700">
            <p className="text-sm">当前分数: <span className="font-bold text-lg">{score}</span></p>
          </div>
          <div className="space-x-2">
            {gameEnded && (
              <button
                onClick={handleRestart}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 重新开始
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
EOF

cat > src/components/AdminPanel.tsx << 'EOF'
import React, { useState } from 'react';
import { GameConfig } from '../types/game';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (config: GameConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onAddGame }) => {
  const [formData, setFormData] = useState<GameConfig>({
    id: '',
    title: '',
    description: '',
    thumbnail: '',
    tags: [],
    difficulty: 'medium',
    author: 'Custom',
    enabled: true,
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) {
      alert('请填写游戏 ID 和标题');
      return;
    }
    onAddGame(formData);
    setFormData({
      id: '',
      title: '',
      description: '',
      thumbnail: '',
      tags: [],
      difficulty: 'medium',
      author: 'Custom',
      enabled: true,
    });
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">➕ 添加新游戏</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">游戏 ID *</label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="game-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="游戏标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="游戏描述"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">缩略图 (emoji 或 URL)</label>
            <input
              type="text"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="🎮 或 https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value as any })
              }
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            >
              <option value="easy">🟢 简单</option>
              <option value="medium">🟡 中等</option>
              <option value="hard">🔴 困难</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="作者名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="输入标签"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              启用此游戏
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition-colors"
            >
              ✅ 添加游戏
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 rounded transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
EOF

cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
EOF

cat > README.md << 'EOF'
# 🎮 Game Hub - 网页游戏中心

一个现代化的网页游戏平台，集合了多个经典小游戏。支持 GitHub Pages 和 Cloudflare Workers 部署。

## ✨ 特性

- 🎯 **多种游戏**: 贪吃蛇、躲避、射击、吃豆人、翻牌、俄罗斯方块、扫雷、记忆卡牌、消消乐
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 🎨 **现代 UI**: 使用 Tailwind CSS 构建美观的界面
- ⚙️ **管理面板**: 轻松添加和自定义游戏
- 💾 **本地存储**: 自动保存最高分数
- 🚀 **快速加载**: 基于 Vite 构建，启动速度快
- 📦 **易部署**: 支持 GitHub Pages 和 Cloudflare Workers

## 🚀 快速开始

### 前置要求

- Node.js 16+
- npm 或 yarn

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/Povlakek-code/game-hub.git
cd game-hub

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:5173