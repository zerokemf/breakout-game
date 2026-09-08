# BREAKOUT — Modern Neon Arcade

A complete ten-sector HTML5 Canvas arcade game, designed and made by Willie.

Play: https://zerokemf.github.io/breakout-game/

Deployment status: live on GitHub Pages. Production-URL browser acceptance passed, including real NAS score submission, reload persistence and retrieval by a separate browser.

## 介面語言

介面採繁體中文：選單、關卡名稱、操作提示、設定、道具說明、排行榜及連線錯誤訊息。保留 BREAKOUT 品牌與中央英文道具特效大字，特效下方提供繁中解說。排行榜代號仍使用三碼 A–Z／0–9。語系更新不改動分數、物理、關卡、存檔或 API schema。

## Controls
- Move: Arrow Left / Arrow Right, A / D, mouse, or touch drag.
- Launch: Space or a tap (dragging in READY does not launch).
- Pause: P / Escape or the HUD pause button. Changing tabs pauses automatically.
- Three lives; extra lives are capped at five. Level select unlocks locally.

Normal bricks score 100, two-hit strong bricks 200, power bricks 150. Steel is indestructible and excluded from level completion. Power-ups: 15-second paddle extend, 10-second 20% slow ball, extra life, multi-ball (three initially, six maximum), 15-second penetrating fire ball, 12-second automatic dual laser paddle, and 12-second sticky paddle. Space or tap releases sticky balls. Fire destroys strong bricks for the same 200 points, never bonus points; steel still blocks attacks. Timed pickups refresh rather than stack. All balls, including held ones, must be lost before one life is deducted. Timers freeze while paused. Maximum ball speed is 1.7× initial speed.

## Local development

Requires Python 3 for a static development server; Node is needed only for tests.

```sh
npm start
# open http://localhost:8765
npm ci --include=dev
npm test
npx playwright test
```
Browser tests use installed Chrome (`channel: chrome`). Local server must be running. Set `TEST_BASE_URL` to test a deployed URL. Tests explicitly distinguish mocked API UI cases from live NAS persistence tests.

## Architecture

- `js/game.js`: explicit state machine, fixed 240Hz simulation; bounded frame delta.
- `js/physics.js`: continuous circle/rectangle face and rounded-corner collision, contact normals, position correction, anti-horizontal-lock rule.
- `balls[]`, extensible brick and power-up registries, independent `ScoreManager`, data-driven `levels.js`, and a mode field preserve Phase 2 extension points.
- `js/renderer.js`, `particles.js`, `audio.js`: Canvas rendering and procedural Web Audio. No third-party asset downloads, framework or runtime server dependency.
- `js/api.js`: shared NAS leaderboard, request timeouts, idempotent run IDs, max 20 pending scores and at most three retry attempts per score on later openings. Exhausted attempts remain local instead of retrying forever.
- LocalStorage holds only personal best, unlocked levels, settings, last initials and pending submissions. It is never the global leaderboard.

## API configuration

Edit `API_BASE_URL` in `js/config.js` (public URL, never a secret):

```js
export const API_BASE_URL = 'https://willienas.myqnapcloud.com/web-arcade';
```

`GET /api/leaderboard/breakout` returns `{scores:[{initials,score,level,created_at}]}`. `POST /api/scores` accepts `game_id`, `initials`, `score`, `level`, and optional `run_id` UUID. Returns `{rank,scores}`. Server-side sanity checks do not prove a run is genuine; this client-side arcade is not cheat-proof. Ties favor earlier database entries; qualification shown before submitting is provisional.

The NAS backend, configuration, SQLite and logs are deliberately **not** in this repository. Production CORS permits the exact GitHub Pages origin (GitHub project paths share that origin), not `*`. NAS outage does not stop gameplay.

## GitHub Pages deployment

GitHub Pages is enabled with the GitHub Actions build type. Push to `main`; the workflow runs logic tests, uploads only static `index.html`, `css/`, `js/`, `assets/`, then publishes Pages. All asset references are relative for project-page hosting. No backend packages or secrets enter the Pages artifact.

## Phase 2A feedback

Ordinary brick destruction, wall contacts, paddle contacts and laser hits never shake the screen. Multi-ball/fire activation, life loss and level clear use brief bounded feedback, disabled by Screen shake settings. Level/row palettes are richer while the ball retains a bright white core and brick types keep their visual symbols. Existing campaign scores remain compatible: the same finite bricks yield the same maximum points.

## Scope

Includes MENU / READY / PLAYING / PAUSED / LEVEL_CLEAR / GAME_OVER / ENTER_INITIALS / LEADERBOARD, ten levels and seven power-ups. Multi-ball, fire, laser and sticky are implemented in Phase 2A. Combo, achievements, Boss and additional modes remain future extensions, not claimed implemented. No accounts, editor, UGC or multiplayer.
