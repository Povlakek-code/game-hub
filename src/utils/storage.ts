import { StoredGameData } from '../types/game';

const STORAGE_PREFIX = 'game-hub:';
const GAMES_CONFIG_KEY = 'games-config';
const FAVORITES_KEY = 'favorites';

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  setGameData: (gameId: string, data: StoredGameData) => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(data));
    } catch {
      // 隐私模式 / 配额满时静默失败，不阻塞游戏
    }
  },

  getGameData: (gameId: string): StoredGameData | null => {
    if (!isStorageAvailable()) return null;
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
      return safeParse<StoredGameData | null>(data, null);
    } catch {
      return null;
    }
  },

  setGamesConfig: (configs: object[]) => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${GAMES_CONFIG_KEY}`,
        JSON.stringify(configs)
      );
    } catch {
      // ignore quota errors
    }
  },

  getGamesConfig: (): Array<Record<string, unknown>> => {
    if (!isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${GAMES_CONFIG_KEY}`);
      const parsed = safeParse<unknown>(data, []);
      return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
    } catch {
      return [];
    }
  },

  getFavorites: (): string[] => {
    if (!isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${FAVORITES_KEY}`);
      const parsed = safeParse<unknown>(data, []);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  },

  setFavorites: (ids: string[]) => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${FAVORITES_KEY}`, JSON.stringify(ids));
    } catch {
      // ignore
    }
  },

  clear: () => {
    if (!isStorageAvailable()) return;
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }
  },
};
