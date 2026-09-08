import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
for(const [width,height] of [[390,844],[844,390],[768,1024],[1440,1000]])test(`responsive ${width}x${height}`,async({page})=>{await page.setViewportSize({width,height});await page.goto(base);await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:'LAUNCH',exact:true}).click();const box=await page.locator('#gameCanvas').boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:`tests/artifacts/play-${width}.png`});});
test('menu, launch, pause, settings and keyboard controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await expect(page.locator('#stage')).toHaveAttribute('data-state','READY');
 await page.keyboard.press('Space');await expect(page.locator('#stage')).toHaveAttribute('data-state','PLAYING');
 await page.keyboard.press('p');await expect(page.getByRole('heading',{name:'PAUSED'})).toBeVisible();
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.getByRole('button',{name:'SETTINGS',exact:true}).click();
 await expect(page.getByLabel('Music volume')).toBeVisible();expect(errors).toEqual([]);
});
