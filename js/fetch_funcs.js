const puppeteer = require('puppeteer');

async function checkXPath(){
const browser = await puppeteer.launch(/* { headless: false, defaultViewport: null } */);
try {
    const [page] = await browser.pages();

    await page.goto('https://example.org/');

    console.log(await isVisible1(page, '//p')); // true
    console.log(await isVisible1(page, '//table')); // false

    console.log(await isVisible2(page, '//p')); // true
    console.log(await isVisible2(page, '//table')); // false
} catch (err) { console.error(err); } finally { await browser.close(); }

async function isVisible1(page, xPathSelector) {
    try {
        await page.waitForXPath(xPathSelector, { visible: true, timeout: 1000 });
        return true;
    } catch {
        return false;
    }
}

async function isVisible2(page, xPathSelector) {
    const [element] = await page.$x(xPathSelector);
    if (element === undefined) return false;

    return await page.evaluate((e) => {
        const style = window.getComputedStyle(e);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, element);
}
}

async function returnXPathValue(_pageURL,_xPath,_property){

    try {
        await _pageURL.waitForXPath(_xPath, { visible: true, timeout: 5000 });
        let [el0] = await _pageURL.$x(_xPath);
        let link0 = await el0.getProperty(_property);
        return await link0.jsonValue();
    } catch {
        return '';
    }
}

async function getLinkItems(categoryJson, count, category) {
    let linkItems = []
    //var browser = await puppeteer.launch();
    var browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    var pageURL = await browser.newPage();
    console.log("get url ::: ", categoryJson.Url);
    await pageURL.goto(categoryJson.Url);
    for (let i = 0; i < count; i++) {
        linkItems[i] = {};
        linkItems[i].link = await returnXPathValue(pageURL, categoryJson.link_xpath[i], 'href');
        linkItems[i].pos = i + 1;
        linkItems[i].cat = category;
    }
    browser.close();
    console.log(linkItems);
    return linkItems;
    //console.log(linkItems);
}

module.exports = {
    getLinkItems,
    returnXPathValue
}

