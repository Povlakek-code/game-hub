import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gameRegistry } from '../utils/gameRegistry';
import { SnakeGame } from '../games/SnakeGame';
import { DodgeGame } from '../games/DodgeGame';
import { BreakoutGame } from '../games/BreakoutGame';
import { TetrisGame } from '../games/TetrisGame';
import { FlappyGame } from '../games/FlappyGame';
import { MemoryGame } from '../games/MemoryGame';
import { MinesweeperGame } from '../games/MinesweeperGame';
import type { BaseGame } from '../games/base/BaseGame';

interface GameModalProps {
  gameId: string;
  onClose: () => void;
}

type Phase = 'ready' | 'playing' | 'paused' | 'ended';

function createGame(gameId: string, canvas: HTMLCanvasElement): BaseGame | null {
  switch (gameId) {
    case 'snake':
      return new SnakeGame(canvas);
    case 'dodge':
      return new DodgeGame(canvas);
    case 'breakout':
      return new BreakoutGame(canvas);
    case 'tetris':
      return new TetrisGame(canvas);
    case 'flappy':
      return new FlappyGame(canvas);
    case 'memory':
      return new MemoryGame(canvas);
    case 'minesweeper':
      return new MinesweeperGame(canvas);
    default:
      return null;
  }
}

export const GameModal: React.FC<GameModalProps> = ({ gameId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<BaseGame | null>(null);
  const timerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const game = gameRegistry.getGame(gameId);
  const isSupported = gameRegistry.isImplemented(gameId);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const destroyGame = useCallback(() => {
    clearTimer();
    gameRef.current?.destroy();
    gameRef.current = null;
  }, [clearTimer]);

  /** 开局（首次开始 / 重新开始）：销毁旧实例，计一次游玩 */
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    destroyGame();
    const instance = createGame(gameId, canvas);
    if (!instance) return;
    gameRef.current = instance;
    gameRegistry.recordPlay(gameId);
    setScore(0);
    setIsNewRecord(false);
    setPhase('playing');
    instance.start();
    timerRef.current = window.setInterval(() => {
      setScore(instance.getScore());
      if (!instance.getIsRunning()) {
        const finalScore = instance.getScore();
        const broke = gameRegistry.updateGameScore(gameId, finalScore);
        setBest(gameRegistry.getGame(gameId)?.highScore ?? finalScore);
        setIsNewRecord(broke);
        setPhase('ended');
        clearTimer();
      }
    }, 150);
  }, [gameId, destroyGame, clearTimer]);

  const togglePause = useCallback(() => {
    const instance = gameRef.current;
    if (!instance || !instance.getIsRunning()) return;
    if (instance.getIsPaused()) {
      instance.resume();
      setPhase('playing');
    } else {
      instance.pause();
      setPhase('paused');
    }
  }, []);

  const handleClose = useCallback(() => {
    destroyGame();
    onClose();
  }, [destroyGame, onClose]);

  // Esc 关闭 / P 暂停
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      else if ((e.key === 'p' || e.key === 'P') && phase === 'playing') togglePause();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleClose, togglePause, phase]);

  useEffect(() => {
    setBest(game?.highScore ?? 0);
    return destroyGame;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 标题栏：实时分数 + 最高分 + 操作 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate">
              {game.config.thumbnail} {game.config.title}
            </h2>
            <p className="text-sm text-blue-100">
              得分 <span className="font-bold text-white text-base">{score}</span>
              <span className="mx-2">·</span>最高 <span className="font-bold text-yellow-300">{best}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(phase === 'playing' || phase === 'paused') && isSupported && (
              <button
                onClick={togglePause}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded transition-colors text-sm"
                title="暂停/继续 (P)"
              >
                {phase === 'paused' ? '▶ 继续' : '⏸ 暂停'}
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-2xl hover:scale-110 transition-transform"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          {!isSupported ? (
            <div className="w-full border-2 border-dashed border-gray-300 rounded bg-gray-50 flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-6xl mb-4">{game.config.thumbnail || '🚧'}</span>
              <p className="text-lg font-bold text-gray-800 mb-2">该游戏正在开发中</p>
              <p className="text-sm text-gray-500">敬请期待后续版本。</p>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                className="w-full border-2 border-gray-300 rounded bg-gray-100"
                style={{ height: '400px' }}
              />
              {/* 开始屏 */}
              {phase === 'ready' && (
                <div className="absolute inset-0 rounded bg-slate-900/85 flex flex-col items-center justify-center text-center p-6">
                  <span className="text-6xl mb-3">{game.config.thumbnail}</span>
                  <h3 className="text-2xl font-bold text-white mb-2">{game.config.title}</h3>
                  {game.config.instructions && (
                    <p className="text-sm text-slate-200 max-w-md mb-2">{game.config.instructions}</p>
                  )}
                  {game.config.controls && (
                    <p className="text-xs text-slate-400 max-w-md mb-4">🎮 {game.config.controls}</p>
                  )}
                  {best > 0 && (
                    <p className="text-sm text-yellow-300 mb-4">🏆 历史最佳：{best}</p>
                  )}
                  <button
                    onClick={startGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-lg text-lg transition-colors shadow-lg"
                  >
                    ▶ 开始游戏
                  </button>
                </div>
              )}
              {/* 暂停遮罩 */}
              {phase === 'paused' && (
                <div className="absolute inset-0 rounded bg-slate-900/70 flex flex-col items-center justify-center p-6">
                  <p className="text-3xl font-bold text-white mb-4">⏸ 已暂停</p>
                  <div className="flex gap-3">
                    <button
                      onClick={togglePause}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded transition-colors"
                    >
                      ▶ 继续
                    </button>
                    <button
                      onClick={startGame}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded transition-colors"
                    >
                      🔄 重开
                    </button>
                  </div>
                </div>
              )}
              {/* 结算横幅 */}
              {phase === 'ended' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-5 py-2 flex items-center gap-3 text-sm">
                  <span className="text-gray-700">
                    本局 <span className="font-bold text-lg text-indigo-600">{score}</span>
                  </span>
                  {isNewRecord ? (
                    <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full">
                      🎉 新纪录！
                    </span>
                  ) : (
                    <span className="text-gray-500">最佳 {best}</span>
                  )}
                </div>
              )}
            </div>
          )}
          {isSupported && game.config.controls && phase !== 'ready' && (
            <p className="text-xs text-gray-400 mt-2">🎮 {game.config.controls} · P 暂停 · Esc 关闭</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 flex justify-between items-center border-t">
          <div className="text-gray-700 text-sm">
            {phase === 'ended' ? (
              <span>
                {isNewRecord ? '🎉 打破了历史最佳！' : `本局 ${score} 分，再接再厉！`}
              </span>
            ) : (
              <span>🏆 最佳 {best}</span>
            )}
          </div>
          <div className="space-x-2">
            {(phase === 'ended' || phase === 'paused') && isSupported && (
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 重新开始
              </button>
            )}
            <button
              onClick={handleClose}
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
