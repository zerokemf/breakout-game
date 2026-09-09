import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
test.skip(process.env.RUN_LIVE_NAS!=='1','Opt-in only: writes a marked real NAS score; cleanup required.');
test('LIVE NAS: browser submits real score, reload and new browser retrieve same database row',async({browser})=>{
 const context=await browser.newContext();await context.addInitScript(()=>{crypto.randomUUID=()=> 'e12cfaa9-2290-4878-a2c0-661a006687cc';});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.getByRole('button',{name:'開始遊戲',exact:true}).click();await page.evaluate(async()=>{const {game}=await import('./js/main.js?v=2b-inventory');game.score.addScore(200);game.finish();});
 await expect(page.getByRole('heading',{name:'刷新最高分！'})).toBeVisible();await page.getByLabel('輸入玩家代號').fill('QA1');
 const response=page.waitForResponse(r=>r.url().endsWith('/api/scores')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交分數'}).click();expect((await response).status()).toBe(200);await expect(page.locator('.score-table')).toContainText('QA1');
 await page.reload();await page.getByRole('button',{name:'排行榜',exact:true}).click();await expect(page.locator('.score-table')).toContainText('QA1');
 const other=await browser.newContext();const p=await other.newPage();await p.goto(base);await p.getByRole('button',{name:'排行榜',exact:true}).click();await expect(p.locator('.score-table')).toContainText('QA1');expect(await p.evaluate(()=>localStorage.getItem('lastInitials'))).toBeNull();expect(errors).toEqual([]);
 await page.screenshot({path:'tests/artifacts/live-nas-leaderboard.png'});await other.close();await context.close();
});
