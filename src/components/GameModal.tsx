import React, { useEffect, useRef, useState } from 'react';
import { gameRegistry } from '../utils/gameRegistry';
import { SnakeGame } from '../games/SnakeGame';
import { DodgeGame } from '../games/DodgeGame';

interface GameModalProps {
  gameId: string;
  onClose: () => void;
}

type GameType = SnakeGame | DodgeGame | null;

export const GameModal: React.FC<GameModalProps> = ({ gameId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameType>(null);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const game = gameRegistry.getGame(gameId);

  useEffect(() => {
    if (!canvasRef.current || !game) return;

    let gameInstance: GameType = null;

    if (gameId === 'snake') {
      gameInstance = new SnakeGame(canvasRef.current);
    } else if (gameId === 'dodge') {
      gameInstance = new DodgeGame(canvasRef.current);
    }

    if (gameInstance) {
      gameRef.current = gameInstance;
      gameInstance.start();

      const checkGameStatus = setInterval(() => {
        if (gameInstance && !gameInstance.getIsRunning()) {
          setScore(gameInstance.getScore());
          setGameEnded(true);
          gameRegistry.updateGameScore(gameId, gameInstance.getScore());
          clearInterval(checkGameStatus);
        }
      }, 100);

      return () => {
        clearInterval(checkGameStatus);
        gameInstance?.stop();
      };
    }
  }, [gameId, game]);

  const handleRestart = () => {
    if (canvasRef.current) {
      setGameEnded(false);
      setScore(0);
      gameRef.current?.stop();

      let gameInstance: GameType = null;
      if (gameId === 'snake') {
        gameInstance = new SnakeGame(canvasRef.current);
      } else if (gameId === 'dodge') {
        gameInstance = new DodgeGame(canvasRef.current);
      }

      if (gameInstance) {
        gameRef.current = gameInstance;
        gameInstance.start();

        const checkGameStatus = setInterval(() => {
          if (gameInstance && !gameInstance.getIsRunning()) {
            setScore(gameInstance.getScore());
            setGameEnded(true);
            gameRegistry.updateGameScore(gameId, gameInstance.getScore());
            clearInterval(checkGameStatus);
          }
        }, 100);
      }
    }
  };

  if (!game) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-center text-gray-800">游戏加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{game.config.title}</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-gray-300 rounded bg-gray-100"
            style={{ height: '400px' }}
          />
        </div>

        <div className="bg-gray-100 p-4 flex justify-between items-center border-t">
          <div className="text-gray-700">
            <p className="text-sm">当前分数: <span className="font-bold text-lg">{score}</span></p>
          </div>
          <div className="space-x-2">
            {gameEnded && (
              <button
                onClick={handleRestart}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 重新开始
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
