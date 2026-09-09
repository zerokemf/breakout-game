import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
const gameEval=(page,code)=>page.evaluate(async code=>{const {game}=await import('./js/main.js?v=2b-inventory');return Function('g',code)(game);},code);
test('canvas is explicitly 90 percent wide while compact inventory and text stay readable',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto(base);await page.locator('[data-action="play"]').click();
 const canvas=await page.locator('canvas').boundingBox(),machine=await page.locator('.game-machine').boundingBox(),bar=await page.locator('.inventory-bar').boundingBox();
 expect(canvas.width/(machine.width-2)).toBeCloseTo(.9,2);expect(canvas.width/canvas.height).toBeCloseTo(16/9,2);
 expect(bar.height).toBeLessThanOrEqual(60);expect(bar.y).toBeGreaterThanOrEqual(canvas.y+canvas.height);expect(bar.y+bar.height).toBeLessThanOrEqual(390);
 expect(await page.locator('#inventory0').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
});
test('full inventory autoactivates the new pickup and pause protects stored slots',async({page})=>{
 await page.goto(base);await page.locator('[data-action="play"]').click();
 await gameEval(page,"g.collectPowerup('extend');g.collectPowerup('laser');g.collectPowerup('shield');g.collectPowerup('life');");
 expect(await gameEval(page,'return {inventory:g.inventory,shield:g.shield,lives:g.lives}')).toEqual({inventory:['extend','laser'],shield:true,lives:4});
 await page.keyboard.press('p');await expect(page.locator('#inventory0')).toBeDisabled();await page.keyboard.press('1');expect(await gameEval(page,'return g.inventory[0]')).toBe('extend');
 await page.keyboard.press('p');await expect(page.locator('#inventory0')).toBeEnabled();await page.keyboard.press('Space');await page.keyboard.press('1');await expect(page.locator('#inventory0')).toBeDisabled();expect(await gameEval(page,'return g.paddle.width')).toBe(255);
});
for(const [width,height] of [[390,844],[1440,1000]])test(`filled inventory and live new pickups ${width}`,async({browser})=>{
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('[data-action="play"]').click();await page.keyboard.press('Space');
 await gameEval(page,"g.collectPowerup('shield');g.collectPowerup('magnet');g.collectPowerup('shield');g.collectPowerup('magnet');g.collectPowerup('blast');");
 await expect(page.locator('#inventory0')).toContainText('底部護盾');await expect(page.locator('#inventory1')).toContainText('磁力收集');
 for(const id of ['inventory0','inventory1'])expect(await page.locator('#'+id).evaluate(el=>{const s=el.querySelector('.inventory-name');return s.scrollWidth<=s.clientWidth&&el.scrollWidth<=el.clientWidth;})).toBe(true);
 const c=await page.locator('canvas').boundingBox(),bar=await page.locator('.inventory-bar').boundingBox();expect(c.y+c.height).toBeLessThanOrEqual(bar.y);expect(bar.y+bar.height).toBeLessThanOrEqual(height);
 expect(await gameEval(page,'return {shield:g.shield,blast:g.blastCharges,magnet:g.effects.magnet>0}')).toEqual({shield:true,blast:1,magnet:true});
 await page.screenshot({path:`tests/artifacts/inventory-${width}.png`});expect(errors).toEqual([]);await ctx.close();
});
test('mobile inventory tap uses a stored pickup without launching the ball',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await ctx.newPage();await page.goto(base);await page.locator('[data-action="play"]').tap();
 await gameEval(page,"g.collectPowerup('shield');");await expect(page.locator('#inventory0')).toBeEnabled();await page.locator('#inventory0').tap();await expect(page.locator('#inventory0')).toBeDisabled();await expect(page.locator('#stage')).toHaveAttribute('data-state','READY');expect(await gameEval(page,'return g.shield')).toBe(true);await ctx.close();
});
test('two outside-canvas inventory slots store pickups and activate by click or 1/2 in READY',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[data-action="play"]').click();
 const first=page.locator('#inventory0'),second=page.locator('#inventory1');
 await expect(first).toBeVisible();await expect(first).toBeDisabled();await expect(second).toBeDisabled();
 expect(await first.evaluate(el=>!el.closest('#stage'))).toBe(true);
 await gameEval(page,"g.collectPowerup('shield');g.collectPowerup('magnet');");
 await expect(first).toContainText('底部護盾');await expect(second).toContainText('磁力收集');await expect(first).toBeEnabled();
 await first.click();await expect(first).toBeDisabled();expect(await gameEval(page,'return g.shield')).toBe(true);
 await page.keyboard.press('2');await expect(second).toBeDisabled();expect(await gameEval(page,'return g.effects.magnet')).toBe(12);
 await gameEval(page,"g.collectPowerup('blast');");await expect(first).toContainText('爆破球');await page.keyboard.press('1');await expect(first).toBeDisabled();expect(await gameEval(page,'return g.blastCharges')).toBe(1);
 await expect(page.locator('#stage')).toHaveAttribute('data-state','READY');expect(errors).toEqual([]);
});
