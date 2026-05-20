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
