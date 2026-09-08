import {test,expect} from '@playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
test('Traditional Chinese menu and settings fit a 320px viewport',async({page})=>{
 await page.setViewportSize({width:320,height:700});await page.goto(base);
 await expect(page.locator('html')).toHaveAttribute('lang','zh-Hant');
 for(const name of ['開始遊戲','選擇關卡','排行榜','設定'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 await expect(page.getByLabel('遊戲狀態')).toContainText('分數');
 await page.getByRole('button',{name:'設定',exact:true}).click();
 await expect(page.getByLabel('音樂音量')).toBeVisible();await expect(page.getByLabel('音效音量')).toBeVisible();await expect(page.getByLabel('畫面震動')).toBeVisible();
 for(const label of ['加寬擋板','減速','額外生命','多重球','火焰球','雷射擋板','黏性擋板'])await expect(page.getByText(label,{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'主選單',exact:true}).scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('#panel')).not.toContainText(/EXTEND|SLOW|EXTRA LIFE|MULTI BALL|FIRE BALL|LASER PADDLE|STICKY PADDLE/);
 await page.getByRole('button',{name:'主選單',exact:true}).click();await page.getByRole('button',{name:'開始遊戲',exact:true}).click();
 await expect(page.locator('#panel h2')).toHaveText('準備好了嗎？');await expect(page.getByRole('button',{name:'發球',exact:true})).toBeVisible();await expect(page.locator('#panel')).toContainText('初次接觸');await expect(page.getByLabel('剩餘 3 條生命')).toBeVisible();
});
