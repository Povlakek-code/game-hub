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
