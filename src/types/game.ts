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
