import {Builder,By,until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../catalog.json' with {type:'json'};
const options=new chrome.Options().addArguments('--headless=new','--no-sandbox','--disable-dev-shm-usage','--window-size=1440,1000');
const driver=await new Builder().forBrowser('chrome').setChromeOptions(options).build();
async function click(selector){const el=await driver.findElement(By.css(selector));await driver.executeScript("arguments[0].scrollIntoView({block:'center',behavior:'instant'})",el);await el.click();}
async function screenshot(name){if(!process.env.SCREENSHOT_DIR)return;await fs.mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await fs.writeFile(path.join(process.env.SCREENSHOT_DIR,config.slug+'-'+name+'.png'),await driver.takeScreenshot(),'base64');}
try{
 await driver.get(process.env.BASE_URL||'http://127.0.0.1:4202');
 await driver.wait(until.elementLocated(By.css('.product')),15000);
 assert.equal((await driver.findElements(By.css('.product'))).length,6);
 await driver.executeScript("document.querySelectorAll('img').forEach(img=>img.loading='eager')");
 await driver.wait(async()=>driver.executeScript("return [...document.images].every(img=>img.complete && img.naturalWidth>0)"),15000,'All product photographs should load');
 assert.equal(await driver.findElements(By.css('.object')).then(x=>x.length),0);
 await screenshot('desktop');
 await driver.executeScript("document.querySelector('#collection').scrollIntoView()");
 await driver.executeAsyncScript("const done=arguments[0];Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))).then(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))");
 await screenshot('collection');
 await driver.executeScript('window.scrollTo(0,0)');
 if(config.theme==='volt'){await click('.compare-check input');assert.equal((await driver.findElements(By.css('.compare-grid>div'))).length,1);await click('.comparison button');}

 await driver.findElement(By.css('input[type=search]')).sendKeys(config.products[0].name);
 await driver.wait(async()=> (await driver.findElements(By.css('.product'))).length===1,3000);
 await click('.product-bottom button');
 await driver.navigate().refresh();
 await driver.wait(until.elementLocated(By.css('.product')),10000);
 assert.equal(await driver.findElement(By.css('.bag span')).getText(),'1');
 await click('.bag');
 await driver.wait(until.elementIsVisible(await driver.findElement(By.css('dialog'))),3000);
 await click('.extra input');
 await driver.findElement(By.css('input[name=name]')).sendKeys('Browser Demo');
 await driver.findElement(By.css('input[name=email]')).sendKeys('browser@example.com');
 await click('.checkout');
 await driver.wait(until.elementLocated(By.css('.confirmation')),10000);
 assert.match(await driver.findElement(By.css('.confirmation')).getText(),/No payment was taken/);
 assert.match(await driver.findElement(By.css('.confirmation strong')).getText(),new RegExp(String(config.products[0].price+config.extra).split('').join('[,]?')));
 await screenshot('order');
 await click('.confirmation button');
 await driver.manage().window().setRect({width:500,height:900});
 await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await driver.executeScript('window.scrollTo(0,0)');
 await screenshot('mobile');
 const overflow=await driver.executeScript('return document.documentElement.scrollWidth > window.innerWidth');assert.equal(overflow,false,'Mobile page must not overflow');
 console.log(config.name+': catalog, unique feature, search, cart persistence, optional service checkout and mobile layout passed.');
}finally{await driver.quit();}

