import React from 'react';
import { DIFFICULTY_LABEL, GameInstance } from '../types/game';

interface GameCardProps {
  game: GameInstance;
  onPlay: () => void;
  onToggleFavorite: () => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-green-600',
  medium: 'text-yellow-600',
  hard: 'text-red-600',
};

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, onToggleFavorite }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all
                 cursor-pointer transform hover:scale-[1.03] flex flex-col"
      onClick={onPlay}
    >
      <div
        className="w-full h-44 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500
                      flex items-center justify-center relative"
      >
        <span className="text-7xl">{game.config.thumbnail}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 text-2xl bg-white/80 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
          title={game.favorite ? '取消收藏' : '收藏'}
          aria-label="收藏"
        >
          {game.favorite ? '⭐' : '☆'}
        </button>
        {game.playCount > 0 && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded-full">
            🎮 玩过 {game.playCount} 次
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{game.config.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{game.config.description}</p>

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
            <span className={DIFFICULTY_COLOR[game.config.difficulty] ?? 'text-gray-600'}>
              {DIFFICULTY_LABEL[game.config.difficulty] ?? game.config.difficulty}
            </span>
          </span>
          <span>🏆 {game.highScore}</span>
        </div>
      </div>
    </div>
  );
};
