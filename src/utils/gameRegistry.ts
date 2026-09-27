import { GameConfig, GameInstance, GameInstanceProps } from '../types/game';
import { storage } from './storage';

/** 当前真正有可玩实现的游戏 ID。GameModal 工厂只支持这几个。 */
export const IMPLEMENTED_GAME_IDS = [
  'snake',
  'dodge',
  'breakout',
  'tetris',
  'flappy',
  'memory',
  'minesweeper',
] as const;

function isValidConfig(raw: object): raw is GameConfig {
  const r = raw as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    Array.isArray(r.tags)
  );
}

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
      instructions: '吃掉红色食物让蛇变长，活得越久、吃得越多分数越高。撞墙或咬到自己游戏结束。',
      controls: '方向键 / WASD 移动，手机上滑动屏幕改变方向',
    },
    {
      id: 'dodge',
      title: '躲避方块',
      description: '躲避掉落的障碍物，坚持得越久分数越高',
      thumbnail: '🛸',
      tags: ['动作', '反应'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
      instructions: '左右移动飞船，躲避从天而降的红色方块。存活时间就是你的分数，难度会随时间提升。',
      controls: '← → / A D 移动，手机上左右拖拽飞船',
    },
    {
      id: 'breakout',
      title: '打砖块',
      description: '控制挡板反弹小球，击碎所有砖块过关',
      thumbnail: '🧱',
      tags: ['动作', '经典'],
      difficulty: 'easy',
      author: 'Game Hub',
      enabled: true,
      instructions: '移动挡板反弹小球，击碎全部砖块进入下一关（球速提升）。掉球会失去一条生命，共 3 条命。',
      controls: '← → / A D 或鼠标移动挡板，空格 / 点击发射小球',
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
      instructions: '旋转并堆放下落的方块，填满整行即可消除得分。每消 10 行升一级，下落更快。一次消 4 行（Tetris）分数最高！',
      controls: '← → 移动，↓ 加速，↑ / X 顺时针旋转，Z 逆时针，空格硬降',
    },
    {
      id: 'flappy',
      title: '飞扬小鸟',
      description: '穿越水管间隙，飞得越远分数越高',
      thumbnail: '🐤',
      tags: ['动作', '休闲'],
      difficulty: 'easy',
      author: 'Game Hub',
      enabled: true,
      instructions: '点击或按键让小鸟上跳，穿过每对水管得 1 分。撞到水管或地面游戏结束。',
      controls: '空格 / ↑ / 点击 / 触摸屏幕上跳',
    },
    {
      id: 'memory',
      title: '记忆翻牌',
      description: '翻出所有配对的水果，步数越少越厉害',
      thumbnail: '🎴',
      tags: ['益智', '记忆'],
      difficulty: 'easy',
      author: 'Game Hub',
      enabled: true,
      instructions: '16 张牌藏着 8 对图案，轮流翻开两张记住位置，配对成功得分。步数越少，结算分越高。',
      controls: '鼠标点击 / 触摸翻牌',
    },
    {
      id: 'minesweeper',
      title: '扫雷',
      description: '推理游戏，找出所有的地雷',
      thumbnail: '💣',
      tags: ['益智', '推理'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: true,
      instructions: '9×9 棋盘藏着 10 颗地雷。数字表示周围 8 格的地雷数，揭开所有安全格即获胜。第一次点击必定安全。',
      controls: '左键 / 触摸揭开，右键标记旗帜',
    },
    // 以下游戏暂无玩法实现，默认禁用。实现后：加玩法类 +
    // 在 GameModal 工厂注册 + 加入 IMPLEMENTED_GAME_IDS + enabled 改 true。
    {
      id: 'shooting',
      title: '太空射击（开发中）',
      description: '射击来袭的敌人，保护自己',
      thumbnail: '🚀',
      tags: ['动作', '射击'],
      difficulty: 'hard',
      author: 'Game Hub',
      enabled: false,
    },
    {
      id: 'pacman',
      title: '吃豆人（开发中）',
      description: '吃掉所有的豆子，躲避幽灵',
      thumbnail: '👾',
      tags: ['经典', '冒险'],
      difficulty: 'hard',
      author: 'Game Hub',
      enabled: false,
    },
    {
      id: 'match3',
      title: '消消乐（开发中）',
      description: '三个或以上相同的方块可以消除',
      thumbnail: '💎',
      tags: ['益智', '消除'],
      difficulty: 'medium',
      author: 'Game Hub',
      enabled: false,
    },
  ];

  constructor() {
    this.initializeGames();
  }

  private initializeGames() {
    const savedConfigs = storage.getGamesConfig();
    // 合并策略：默认游戏以代码为准；用户自建游戏保留；
    // 无实现的默认游戏一律禁用，防止老版本脏数据导致空白画布。
    const defaultById = new Map(this.defaultGames.map((c) => [c.id, c]));
    const merged: GameConfig[] = this.defaultGames.map((c) => ({ ...c, tags: [...c.tags] }));
    const favorites = new Set(storage.getFavorites());

    for (const raw of savedConfigs) {
      if (!raw || typeof raw !== 'object') continue;
      const id = raw.id;
      if (typeof id !== 'string') continue;
      if (defaultById.has(id)) {
        if (!(IMPLEMENTED_GAME_IDS as readonly string[]).includes(id)) {
          const idx = merged.findIndex((c) => c.id === id);
          if (idx >= 0) merged[idx] = { ...merged[idx], enabled: false };
        }
      } else if (isValidConfig(raw)) {
        merged.push({
          ...raw,
          description: typeof raw.description === 'string' ? raw.description : '',
          thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : '🎮',
          difficulty:
            raw.difficulty === 'easy' || raw.difficulty === 'hard' ? raw.difficulty : 'medium',
          author: typeof raw.author === 'string' ? raw.author : 'Custom',
          enabled: raw.enabled !== false,
        });
      }
    }

    merged.forEach((config) => {
      const gameData = storage.getGameData(config.id);
      this.games.set(config.id, {
        config,
        component: () => null,
        highScore: gameData?.highScore ?? 0,
        lastPlayed: gameData?.lastPlayed ?? 0,
        playCount: gameData?.playCount ?? 0,
        favorite: favorites.has(config.id),
      });
    });
  }

  addGame(config: GameConfig, component?: React.ComponentType<GameInstanceProps>) {
    this.games.set(config.id, {
      config,
      component: component ?? (() => null),
      highScore: 0,
      lastPlayed: 0,
      playCount: 0,
      favorite: false,
    });
    this.saveToStorage();
  }

  /** 新增或更新：管理面板添加新 ID 时也能生效 */
  upsertGame(config: GameConfig) {
    const existing = this.games.get(config.id);
    if (existing) {
      existing.config = { ...config, tags: [...config.tags] };
    } else {
      this.games.set(config.id, {
        config: { ...config, tags: [...config.tags] },
        component: () => null,
        highScore: 0,
        lastPlayed: 0,
        playCount: 0,
        favorite: false,
      });
    }
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

  getImplementedGames() {
    return this.getAllGames().filter((g) => this.isImplemented(g.config.id));
  }

  /** 每次开局调用：累计游玩次数 + 最近游玩时间 */
  recordPlay(id: string) {
    const game = this.games.get(id);
    if (!game) return;
    game.playCount += 1;
    game.lastPlayed = Date.now();
    storage.setGameData(id, {
      highScore: game.highScore,
      lastPlayed: game.lastPlayed,
      playCount: game.playCount,
    });
  }

  /** 游戏结束调用：返回是否打破纪录 */
  updateGameScore(id: string, score: number): boolean {
    const game = this.games.get(id);
    if (!game) return false;
    const isRecord = score > game.highScore;
    if (isRecord) {
      game.highScore = score;
    }
    game.lastPlayed = Date.now();
    storage.setGameData(id, {
      highScore: game.highScore,
      lastPlayed: game.lastPlayed,
      playCount: game.playCount,
    });
    return isRecord;
  }

  toggleFavorite(id: string): boolean {
    const game = this.games.get(id);
    if (!game) return false;
    game.favorite = !game.favorite;
    const ids = this.getAllGames()
      .filter((g) => g.favorite)
      .map((g) => g.config.id);
    storage.setFavorites(ids);
    return game.favorite;
  }

  isImplemented(id: string): boolean {
    return (IMPLEMENTED_GAME_IDS as readonly string[]).includes(id);
  }

  private saveToStorage() {
    const configs = Array.from(this.games.values()).map((g) => g.config);
    storage.setGamesConfig(configs);
  }
}

export const gameRegistry = new GameRegistry();
