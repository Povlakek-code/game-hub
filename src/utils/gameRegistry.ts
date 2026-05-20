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
