import React, { useState } from 'react';
import { GameConfig } from '../types/game';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (config: GameConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onAddGame }) => {
  const [formData, setFormData] = useState<GameConfig>({
    id: '',
    title: '',
    description: '',
    thumbnail: '',
    tags: [],
    difficulty: 'medium',
    author: 'Custom',
    enabled: true,
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) {
      alert('请填写游戏 ID 和标题');
      return;
    }
    onAddGame(formData);
    setFormData({
      id: '',
      title: '',
      description: '',
      thumbnail: '',
      tags: [],
      difficulty: 'medium',
      author: 'Custom',
      enabled: true,
    });
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">➕ 添加新游戏</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">游戏 ID *</label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="game-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="游戏标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="游戏描述"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">缩略图 (emoji 或 URL)</label>
            <input
              type="text"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="🎮 或 https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value as any })
              }
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            >
              <option value="easy">🟢 简单</option>
              <option value="medium">🟡 中等</option>
              <option value="hard">🔴 困难</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="作者名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="输入标签"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              启用此游戏
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition-colors"
            >
              ✅ 添加游戏
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 rounded transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
