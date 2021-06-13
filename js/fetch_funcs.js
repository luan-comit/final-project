const puppeteer = require('puppeteer');

async function getAwsLaptop() {
    var linkItems = [];
    var browser = await puppeteer.launch();
    var pageURL = await browser.newPage();
    var pageXpath = await browser.newPage();
    const amazonLaptop = require('../json/amazon_laptop.json');


    var items = [{}, {}, {}, {}, {}];
    var count = 5;

    await pageURL.goto(amazonLaptop.Url);
    for (let i = 0; i < count; i++) {

        await pageURL.waitForXPath(amazonLaptop.link_xpath[i]);
        var [el0] = await pageURL.$x(amazonLaptop.link_xpath[i]);
        var link0 = await el0.getProperty('href');
        linkItems[i] = await link0.jsonValue();
        items[i].linkItem = linkItems[i];

        await pageXpath.goto(linkItems[i]);
        try {
            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(amazonLaptop.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            items[i].img_src = await src.jsonValue();

            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.title);
            var [el2] = await pageXpath.$x(amazonLaptop.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            items[i].title = await title.jsonValue();

            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.price);
            var [el3] = await pageXpath.$x(amazonLaptop.attr_xpath.price);
            var price = await el3.getProperty('textContent');
            items[i].price = await price.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
    }
    // map item and send to fetch.ejs
    if (!items || items.length === 0) {
        res.render('fetch', { items: false });
    }
    else {
        items.map(item => {  // STILL GOT ISSUE with setting linkisNull value 
            if (item === '' || item === null || item.length === 0) {
                item.isNull = false;
            }
            else {
                item.isNull = true;
            }
        })
        res.render('fetch', { items: items });
    }
    browser.close();
}

async function getAwsGolf() {
    var linkItems = [];
    var browser = await puppeteer.launch();
    var pageURL = await browser.newPage();
    var pageXpath = await browser.newPage();
    const amazonGolf = require('../json/amazon_golf.json');

    var items = [{}, {}, {}, {}, {}];
    var count = 5;

    await pageURL.goto(amazonGolf.Url);
    for (let i = 0; i < count; i++) {

        await pageURL.waitForXPath(amazonGolf.link_xpath[i]);
        var [el0] = await pageURL.$x(amazonGolf.link_xpath[i]);
        var link0 = await el0.getProperty('href');
        linkItems[i] = await link0.jsonValue();
        items[i].linkItem = linkItems[i];

        await pageXpath.goto(linkItems[i]);
        try {
            await pageXpath.waitForXPath(amazonGolf.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(amazonGolf.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            items[i].img_src = await src.jsonValue();

            await pageXpath.waitForXPath(amazonGolf.attr_xpath.title);
            var [el2] = await pageXpath.$x(amazonGolf.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            items[i].title = await title.jsonValue();

            await pageXpath.waitForXPath(amazonGolf.attr_xpath.price);
            var [el3] = await pageXpath.$x(amazonGolf.attr_xpath.price);
            var price = await el3.getProperty('textContent');
            items[i].price = await price.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
    }
    // map item and send to fetch.ejs
    if (!items || items.length === 0) {
        res.render('fetch', { items: false });
    }
    else {
        items.map(item => {  // STILL GOT ISSUE with setting linkisNull value 
            if (item === '' || item === null || item.length === 0) {
                item.isNull = false;
            }
            else {
                item.isNull = true;
            }
        })
        res.render('fetch', { items: items });
    }
    browser.close();
}


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

async function getKJJLaptop(categoryJson,count,category) {
    let linkItems = []
    var browser = await puppeteer.launch();
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
    //res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
    //console.log(linkItems);
}

async function getLinkItems(categoryJson, count, category) {
    let linkItems = []
    //var browser = await puppeteer.launch();
    var browser = await puppeteer.launch({
        //executablePath: '/usr/bin/chromium-browser',
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
    //res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
    //console.log(linkItems);
}

/*
async function getItemAttributes(categoryJson, _attr) {
    let attribute = {};

    await pageXpath.waitForXPath(categoryJson.attr_xpath._attr);
    var [el1] = await pageXpath.$x(categoryJson.attr_xpath._attr);
    var src = await el1.getProperty('src');
    itemToSave.img_src = await src.jsonValue();

    let linkItems = []
    var browser = await puppeteer.launch();
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
    //res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
    //console.log(linkItems);
}
*/

module.exports = {
    getLinkItems,
    returnXPathValue
}

