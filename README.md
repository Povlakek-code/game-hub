# 🎮 Game Hub - 网页游戏中心

免费在线小游戏合集：贪吃蛇、躲避方块、打砖块、俄罗斯方块、飞扬小鸟、记忆翻牌、扫雷。打开即玩，自动保存最高分，支持手机触屏操作。

## ✨ 特性

- 🎯 **7 款可玩游戏**: 贪吃蛇、躲避方块、打砖块、俄罗斯方块、飞扬小鸟、记忆翻牌、扫雷（+ 3 款开发中）
- 🔍 **搜索筛选排序**：按名称/标签/难度筛选，按最高分/游玩次数/最近游玩排序
- ⭐ **收藏**：一键收藏常玩游戏，可只看收藏
- 🎲 **随机开玩**：选择困难户一键直达
- 📊 **游玩统计**：累计游玩次数、历史总分一目了然
- ⏸ **完整游戏体验**：开始说明屏、暂停/继续、实时分数、结算 + 新纪录徽章
- 📱 **触屏适配**：滑动、拖拽、点击，各游戏均支持手机操作
- 💾 **本地存档**：最高分 / 游玩次数 / 收藏保存在浏览器 localStorage（损坏自动降级）
- ⚙️ **管理面板**：运行时添加和自定义游戏
- 🚀 **快速加载**：基于 Vite 构建
- 📦 **易部署**: 支持 GitHub Pages 和 Cloudflare Pages

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/Povlakek-code/game-hub.git
cd game-hub

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:5173
```

### 常用脚本

```bash
npm run dev              # 本地开发（base=./）
npm run build            # 类型检查 + 生产构建（base=./，适合 Cloudflare Pages / 本地预览）
npm run build:gh-pages   # GitHub Pages 项目页构建（base=/game-hub/）
npm run lint             # ESLint 检查
npm run preview          # 预览 dist 产物
npm run deploy:pages     # 构建并推送到 gh-pages 分支
npm run test:games       # 游戏逻辑冒烟测试（Node stub canvas 跑全部游戏）
```

## 📁 项目结构

```
src/
  components/   # GameGrid / GameCard / GameModal / AdminPanel
  games/        # 各游戏实现（均继承 BaseGame：init/update/render/handleInput/destroy）
  games/base/   # BaseGame 基类：游戏循环、暂停、画布坐标换算
  types/game.ts # GameConfig / GameInstance 等类型
  utils/        # gameRegistry（注册表+统计）/ storage（localStorage 封装）
scripts/
  smoke-games.mjs  # 游戏冒烟测试
```

## 🎮 添加新游戏

1. 在 `src/games/` 新建一个继承 `BaseGame` 的类，实现 `init / update / render / handleInput`，
   并在 `destroy()` 里移除自己注册的所有事件监听（参考 `BreakoutGame` 的鼠标+键盘+触屏三件套）。
2. 在 `src/components/GameModal.tsx` 的 `createGame()` 工厂里注册 `gameId -> 类` 的映射。
3. 在 `src/utils/gameRegistry.ts`：默认游戏配置里加一项（含 `instructions` 玩法说明和 `controls` 操作提示），
   并把 id 加入 `IMPLEMENTED_GAME_IDS`。
4. 跑 `npm run test:games` 确认新游戏在冒烟测试里能跑完不报错。

## ⌨️ 操作说明

| 游戏 | 键盘 | 手机 |
| --- | --- | --- |
| 贪吃蛇 | 方向键 / WASD | 滑动屏幕 |
| 躲避方块 | ← → / A D | 左右拖拽 |
| 打砖块 | ← → / A D / 鼠标，空格发射 | 拖拽挡板，点击发射 |
| 俄罗斯方块 | ← → 移动，↓ 加速，↑/X 旋转，Z 逆旋，空格硬降 | 轻点左右/中间旋转，下滑硬降 |
| 飞扬小鸟 | 空格 / ↑ / W | 点击屏幕 |
| 记忆翻牌 | — | 点击翻牌 |
| 扫雷 | 左键揭开，右键标旗 | 单击揭开，双击标旗 |

弹窗内按 `P` 暂停、`Esc` 关闭。

## 📦 部署

### GitHub Pages（项目页）

仓库已内置 `.github/workflows/deploy.yml`：推送到 `main` 自动执行
`npm run build:gh-pages`（`GITHUB_PAGES=1`，base=`/game-hub/`）并发布 `dist/`。
如果 fork 后改了仓库名，记得同步改 `vite.config.ts` 里的 `/game-hub/` 前缀。

### Cloudflare Pages（推荐，根域名/自定义域）

- 连接仓库，构建命令 `npm run build`，输出目录 `dist`。
- 也可以直接 `npx wrangler pages deploy dist`。
