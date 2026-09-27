export type GameDifficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABEL: Record<GameDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  difficulty: GameDifficulty;
  author: string;
  enabled: boolean;
  /** 玩法说明（开始屏展示），老数据可能缺失 */
  instructions?: string;
  /** 操作提示（开始屏 / 游戏下方展示） */
  controls?: string;
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
  playCount: number;
  favorite: boolean;
}

export interface StoredGameData {
  highScore: number;
  lastPlayed: number;
  playCount: number;
}
