# BREAKOUT — Modern Neon Arcade

A complete ten-sector HTML5 Canvas arcade game, designed and made by Willie.

Intended Pages URL: https://zerokemf.github.io/breakout-game/

Deployment status: source is locally complete; GitHub push and Pages activation are pending tool approval. Do not treat this URL as live until deployment succeeds.

## Controls
- Move: Arrow Left / Arrow Right, A / D, mouse, or touch drag.
- Launch: Space or a tap (dragging in READY does not launch).
- Pause: P / Escape or the HUD pause button. Changing tabs pauses automatically.
- Three lives; extra lives are capped at five. Level select unlocks locally.

Normal bricks score 100, two-hit strong bricks 200, power bricks 150. Steel is indestructible and excluded from level completion. Power-ups: 15-second paddle extend, 10-second 20% slow ball, extra life. Timers freeze while paused. Maximum ball speed is 1.7× initial speed.

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

A GitHub Actions Pages workflow is included. Enable Pages with the GitHub Actions build type, then push to `main`; the workflow runs logic tests, uploads only static `index.html`, `css/`, `js/`, `assets/`, then publishes Pages. All asset references are relative for project-page hosting. No backend packages or secrets enter the Pages artifact.

## Scope

Phase 1 includes MENU / READY / PLAYING / PAUSED / LEVEL_CLEAR / GAME_OVER / ENTER_INITIALS / LEADERBOARD, ten levels and three power-ups. Multi-ball gameplay, fire/laser/sticky, combo, achievements and additional modes are future extensions, not claimed implemented. No accounts, editor, UGC or multiplayer.
