const puppeteer = require('puppeteer');

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
        //executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox']
    });

    //const browser = await puppeteer.launch({
    //    args: [
    //        '--no-sandbox',
    //        '--disable-setuid-sandbox'
    //    ]
    //});

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
//==================================save an item =======================


async function saveAwsItem(url, category, email) {
    var itemToSave = {};
    itemToSave.url = url;
    itemToSave.date = Date.now();
    itemToSave.email = email;
    //console.log("Check with json category:", category === amazonLaptop.Category_Name)
    itemToSave.category = category;

    //var browser = await puppeteer.launch();
    var browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    var pageXpath = await browser.newPage();

    await pageXpath.goto(url)
    try {
        itemToSave.img_src = await returnXPathValue(pageXpath, category.attr_xpath.img_src, 'src');
        itemToSave.title = await returnXPathValue(pageXpath, category.attr_xpath.title, 'textContent');
        itemToSave.price = await returnXPathValue(pageXpath, category.attr_xpath.price, 'textContent');
        itemToSave.price_list = await returnXPathValue(pageXpath, category.attr_xpath.price_list, 'textContent');
    }
    catch (error) {
        console.log('Error::::::::', error.message);
    }
    console.log('itemToSave to MongoDB: ', itemToSave);
    browser.close();
    //await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
    itemToSave.price_date_Arr = [];
    itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
    //await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);
    return itemToSave;
}

//==============================================

module.exports = {
    getLinkItems,
    returnXPathValue,
    saveAwsItem
}

