import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
const gameEval=(page,code)=>page.evaluate(async code=>{const {game}=await import('./js/main.js?v=2b-inventory');return Function('g',code)(game);},code);
const clear="for(const b of g.bricks)if(b.destructible)while(!b.destroyed)g.hitBrick(b);";
test('level clear stays controllable and pausable without a next-level overlay',async({page})=>{
 await page.goto(base);await page.locator('[data-action="play"]').click();await page.keyboard.press('Space');
 await gameEval(page,clear);await expect(page.locator('#overlay')).toBeHidden();await expect(page.locator('[data-action="next"]')).toHaveCount(0);
 await expect(page.locator('#pauseButton')).toBeEnabled();
 const c=await page.locator('canvas').boundingBox();await page.mouse.move(c.x+c.width*.7,c.y+c.height*.9);await page.mouse.down();await page.mouse.move(c.x+c.width*.8,c.y+c.height*.9);await page.mouse.up();
 expect(await gameEval(page,'return g.paddle.centerX')).toBeCloseTo(1024,0);
 await page.locator('#pauseButton').click();await expect(page.locator('#stage')).toHaveAttribute('data-state','PAUSED');await page.waitForTimeout(1000);expect(await gameEval(page,'return g.level')).toBe(1);
 await page.locator('[data-action="resume"]').click();await expect(page.locator('#level')).toHaveText('02');await expect(page.locator('#overlay')).toBeHidden();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('unlockedLevel')))).toBe(2);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('personalBest')))).toBeGreaterThan(0);
});
test('tenth level automatically finishes and enters real result flow',async({page})=>{
 await page.route('**/web-arcade/api/**',r=>r.fulfill({json:{scores:[]}}));await page.goto(base);await page.locator('[data-action="play"]').click();
 await gameEval(page,'g.start(10);g.launch();'+clear);await expect(page.locator('#overlay')).toBeHidden();await expect(page.locator('[data-action="next"]')).toHaveCount(0);
 await expect(page.locator('#initials')).toBeVisible();await expect(page.locator('#stage')).toHaveAttribute('data-state','ENTER_INITIALS');
});
