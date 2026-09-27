import React, { useMemo, useState } from 'react';
import { GameCard } from './GameCard';
import { GameModal } from './GameModal';
import { AdminPanel } from './AdminPanel';
import { gameRegistry } from '../utils/gameRegistry';
import { GameConfig, GameDifficulty } from '../types/game';

type SortKey = 'recommend' | 'name' | 'highScore' | 'lastPlayed' | 'playCount';

const SORT_LABEL: Record<SortKey, string> = {
  recommend: '✨ 推荐排序',
  name: '🔤 按名称',
  highScore: '🏆 最高分优先',
  lastPlayed: '🕒 最近玩过',
  playCount: '🎮 最常玩',
};

export const GameGrid: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [games, setGames] = useState(gameRegistry.getAllGames());
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | GameDifficulty>('all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState<SortKey>('recommend');
  const [onlyFavorite, setOnlyFavorite] = useState(false);

  const refresh = () => setGames([...gameRegistry.getAllGames()]);

  const handleAddGame = (config: GameConfig) => {
    gameRegistry.upsertGame(config);
    refresh();
    setIsAdminOpen(false);
  };

  const handleToggleFavorite = (id: string) => {
    gameRegistry.toggleFavorite(id);
    refresh();
  };

  const handleCloseModal = () => {
    setSelectedGameId(null);
    refresh(); // 同步结算后的最高分 / 游玩次数
  };

  const handleRandomPlay = () => {
    const pool = games.filter((g) => g.config.enabled && gameRegistry.isImplemented(g.config.id));
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelectedGameId(pick.config.id);
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => g.config.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [games]);

  const stats = useMemo(() => {
    const playable = games.filter((g) => g.config.enabled);
    return {
      gameCount: playable.length,
      totalPlays: playable.reduce((s, g) => s + g.playCount, 0),
      totalScore: playable.reduce((s, g) => s + g.highScore, 0),
    };
  }, [games]);

  const visibleGames = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = games.filter((g) => {
      if (!g.config.enabled) return false;
      if (onlyFavorite && !g.favorite) return false;
      if (difficulty !== 'all' && g.config.difficulty !== difficulty) return false;
      if (tag !== 'all' && !g.config.tags.includes(tag)) return false;
      if (keyword) {
        const hay = `${g.config.title} ${g.config.description} ${g.config.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(keyword)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.config.title.localeCompare(b.config.title, 'zh-CN'));
        break;
      case 'highScore':
        sorted.sort((a, b) => b.highScore - a.highScore);
        break;
      case 'lastPlayed':
        sorted.sort((a, b) => b.lastPlayed - a.lastPlayed);
        break;
      case 'playCount':
        sorted.sort((a, b) => b.playCount - a.playCount);
        break;
      default:
        // 推荐：收藏置顶，其次按游玩次数
        sorted.sort(
          (a, b) => Number(b.favorite) - Number(a.favorite) || b.playCount - a.playCount
        );
        break;
    }
    return sorted;
  }, [games, search, difficulty, tag, sort, onlyFavorite]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
        <div className="max-w-7xl mx-auto w-full p-8 flex-1">
          {/* 顶部标题 + 操作 */}
          <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-800 mb-2">🎮 游戏中心</h1>
              <p className="text-lg text-gray-600">
                {stats.gameCount} 个游戏 · 累计游玩 {stats.totalPlays} 次 · 历史总分{' '}
                {stats.totalScore}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRandomPlay}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🎲 随机开玩
              </button>
              <button
                onClick={() => setOnlyFavorite((v) => !v)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  onlyFavorite
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border'
                }`}
              >
                ⭐ 收藏
              </button>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ⚙️ 管理
              </button>
            </div>
          </div>

          {/* 搜索 + 筛选栏 */}
          <div className="bg-white rounded-lg shadow p-4 mb-8 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 搜索游戏名称、描述、标签…"
              className="flex-1 min-w-[200px] border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'all' | GameDifficulty)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="all">全部难度</option>
              <option value="easy">🟢 简单</option>
              <option value="medium">🟡 中等</option>
              <option value="hard">🔴 困难</option>
            </select>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="all">全部标签</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none bg-white"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          {/* 游戏网格 */}
          {visibleGames.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 text-lg mb-4">没有符合条件的游戏</p>
              <button
                onClick={() => {
                  setSearch('');
                  setDifficulty('all');
                  setTag('all');
                  setOnlyFavorite(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                清除筛选
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                共 <span className="font-bold text-indigo-600">{visibleGames.length}</span> 个游戏
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleGames.map((game) => (
                  <GameCard
                    key={game.config.id}
                    game={game}
                    onPlay={() => setSelectedGameId(game.config.id)}
                    onToggleFavorite={() => handleToggleFavorite(game.config.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="text-center text-sm text-gray-500 py-6 border-t border-indigo-100">
          🎮 Game Hub · 本地存档保存在浏览器中 · 点击卡片开始游戏
        </footer>
      </div>

      {/* 游戏模态框 */}
      {selectedGameId && <GameModal gameId={selectedGameId} onClose={handleCloseModal} />}

      {/* 管理面板 */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAddGame={handleAddGame}
      />
    </>
  );
};
