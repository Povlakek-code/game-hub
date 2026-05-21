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

  // 获取所有启用的游戏
  const enabledGames = games.filter((g) => g.config.enabled);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 顶部标题和管理按钮 */}
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

          {/* 游戏网格 */}
          {enabledGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暂无游戏，请通过管理面板添加游戏</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-lg mb-8">
                共有 <span className="font-bold text-indigo-600">{enabledGames.length}</span> 个游戏可用
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {enabledGames.map((game) => (
                  <GameCard
                    key={game.config.id}
                    game={game}
                    onPlay={() => setSelectedGameId(game.config.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 游戏模态框 */}
      {selectedGameId && (
        <GameModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}

      {/* 管理面板 */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAddGame={handleAddGame}
      />
    </>
  );
};
