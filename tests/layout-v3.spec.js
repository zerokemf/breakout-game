import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
for(const [width,height] of [[320,700],[390,844],[844,390],[768,1024],[1440,1000]]){
 test(`readable layout ${width}x${height}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000});const page=await context.newPage();
  await page.goto(base);await expect(page.locator('[data-action="play"]')).toBeVisible();
  expect(await page.locator('[data-action="play"]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await page.screenshot({path:`/tmp/breakout-v3-menu-${width}.png`});
  await page.locator('[data-action="settings"]').click();
  expect(await page.locator('.settings-grid label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  expect(await page.locator('.notice').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
  await page.locator('[data-action="menu"]').scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/breakout-v3-settings-${width}.png`});
  await page.locator('[data-action="menu"]').click();await page.locator('[data-action="play"]').click();
  if(width<height&&width<1000){await expect(page.locator('#touchPad')).toBeVisible();expect((await page.locator('#touchPad').boundingBox()).height).toBeGreaterThanOrEqual(120);await expect(page.locator('#touchLaunch')).toBeVisible();}
  else await expect(page.locator('#touchPad')).toBeHidden();
  await page.locator('[data-action="launch"]').click();
  const box=await page.locator('#gameCanvas').boundingBox();console.log(`${width}x${height}`,box);
  expect(box.y+box.height).toBeLessThanOrEqual(height);expect(Math.abs(box.width/box.height-16/9)).toBeLessThan(.01);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  expect((await page.locator('.arcade-shell').boundingBox()).width).toBeLessThanOrEqual(1440);
  await page.screenshot({path:`/tmp/breakout-v3-play-${width}.png`});await context.close();
 });
}
test('landscape playfield uses at least three quarters of viewport height',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto(base);
  await page.locator('[data-action="play"]').click();
  const box=await page.locator('#gameCanvas').boundingBox();console.log('landscape canvas',box);
  expect(box.height).toBeGreaterThanOrEqual(390*.75);
  expect(box.y+box.height).toBeLessThanOrEqual(390);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
