const bodyParser = require('body-parser');
const express = require('express');
const puppeteer = require('puppeteer');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

const mongo_funcs = require('./public/js/mongoDB_funcs');
const mongoClient = require('mongodb');
const _mongoUrl = "mongodb://luan:12345abcdE@20.48.146.232:27017";
const _appSessionsURI = "mongodb://luan:12345abcdE@20.48.146.232:27017/myproject"
const _db = "myproject"; // database of the project
const _usersCollection = "users"; // users collection
const _fetchItemsCollection = "items_fetch";
const _itemsGraphCollection = "items_graph";
const amazonLaptop = require('./json/amazon_laptop.json');
const amazonGolf = require('./json/amazon_golf.json');
const bestbuyLaptop = require('./json/bestbuy_laptop.json');
const kijijiHouse = require('./json/kijiji_house.json');
const kijijiOldCar = require('./json/kijiji_oldcars.json');
const kijijiLaptop = require('./json/kijiji_laptop.json');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(express.static(__dirname + 'public'));


//=============================================================================================

///////////////////////////////////// MANAGE LOGIN SESSION//////////////////////////////////

mongoose
    .connect(_appSessionsURI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(function (res) {
        console.log('MongoDB connected');
    });

const store = new mongoDBSession({
    uri: _appSessionsURI,
    collection: 'appSessions',
});

app.use(session({
    secret: '12457239abxef;;',
    resave: false,
    saveUninitialized: false,
    store: store,
}))

// check if authed to whether redirect to login

const isAuth = function (req, res, next) {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect('/login');
    }
}

/////////////////////////////////////END MANAGE LOGIN SESSION//////////////////////////////////

app.get('/', function (req, res) {
    console.log(req.session);
    console.log(req.session.id);
    console.log(req.session.isAuth);
    res.render('index', { logged: req.session.isAuth, email: req.session.email });
})

///////////////////////////////////// MANAGE USER REGISTRATION & LOGIN & LOGOUT //////////////////////////////////

// registration for new user 

app.get('/register', function (req, res) {
    res.render('register', { logged: req.session.isAuth, email: req.session.email });
})
app.post('/register', function (req, res) {
    console.log(req.body);
    // check user if existed 
    mongoClient.connect(_mongoUrl, async function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_usersCollection).findOne({ email: req.body.email }, function (err, user) {
            if (err) throw err;
            else {
                if (!user || user.length === 0 || user == null) {
                    mongo_funcs.insertMongoDB('users', req.body);
                    res.render('login', { logged: req.session.isAuth, email: req.session.email });
                    let demo1 = require('./public/json/amazon_demo.json');
                    demo1.email = req.body.email;
                    demo1.password = req.body.password;
                    let demo2 = require('./public/json/kijiji_demo.json');
                    demo2.email = req.body.email;
                    demo2.password = req.body.password;
                    mongo_funcs.insertMongoDB("items_fetch", demo1);
                    mongo_funcs.insertMongoDB("items_fetch", demo2);
                }
                else {
                    return res.json('email existed, chose another email');
                }
            }
        })
        db.close();
    })
})

app.get('/login', function (req, res) {
    res.render('login', { logged: req.session.isAuth, email: req.session.email });
})

app.post('/login', function (req, res) {
    var { email, password } = req.body;
    console.log("params: ", email, '/', password);
    mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_usersCollection).findOne({ email: email, password: password }, function (err, user) {
            if (err) throw err;
            else {
                if (!user || user.length === 0 || user == null) {
                    return res.json('username or password not matched');
                }
                else {
                    req.session.isAuth = true;
                    req.session.email = email;
                    res.render('index', { logged: req.session.isAuth, email: req.session.email });
                }
            }
        })
        db.close();
    })
})

app.post('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw (err);
        res.redirect('/');
    })
})
/////////////////////////////////////END MANAGE USER REGISTRATION & LOGIN //////////////////////////////////

///////////////////////////////////// MANAGE SAVED ITEMS & MONITOR //////////////////////////////////

app.get('/monitor', function (req, res) {
    if (req.session.isAuth) {
        querySavedItemMongoDB();
    } else {
        res.redirect('/login');
    }

    async function querySavedItemMongoDB() { //check if item (url) exist in DB and insert if not exist
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_fetchItemsCollection).find({ email: req.session.email }).toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    console.log("values send to monitor.pug is NULL ", req.session.email);
                    res.render('monitor', { listItems: false, logged: req.session.isAuth, email: req.session.email })
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                        // change format of price & date before sending to pug to display
                        let rawDate = new Date(record.date);
                        let displaydate = rawDate.getDate() + '/' + (rawDate.getMonth() + 1) + '/' + rawDate.getFullYear() + '\n' + rawDate.getHours() + ':' + rawDate.getMinutes();
                        record.date = displaydate;
                        if (record.saving) {
                            let lens = record.saving.length;
                            let lenp = record.price.length;
                            record.price_list = '$' + (parseFloat(record.price.slice(1, lenp)) + parseFloat(record.saving.slice(6, lens))).toString();
                        }
                        else {
                            if (record.price_list) {
                                let len = record.price_list.length;
                                record.price_list = '$' + parseFloat(record.price_list.slice(2, len)).toString();
                            }
                        }
                    })
                    res.render('monitor', { listItems: records, logged: req.session.isAuth, email: req.session.email });
                }
            });
        });
    }
    //console.log("list Items ::::::::: ", listItems);
})

/////////////////////////////////////END MANAGE SAVED ITEMS & MONITOR //////////////////////////////////

///////////////////////////////////// MANAGE ITEMS CLICKS //////////////////////////////////

app.get('/displaygraph', function (req, res) {
    res.render('graph');
})

app.post('/displaygraph', function (req, res) {
    //console.log(req.body);
    //res.json(req.body);
    mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_itemsGraphCollection).findOne({ url: req.body.url }, function (err, record) {
            if (err) throw err;
            let arrayPrice = [];
            let arrayDate = []
            let graphLabel = record.title;
            let graphUrl = record.url;
            if (!record.price || record.price == null || record.price.length == 0) {
                res.json('Graph invalid !');
            } else {

                for (i = 0; i < record.price_date_Arr.length; i++) {
                    let rawDate = new Date(record.price_date_Arr[i].date);
                    let displaydate = rawDate.getDate() + '/' + (rawDate.getMonth() + 1) + '/' + rawDate.getFullYear() + ' ' + rawDate.getHours() + ':' + rawDate.getMinutes();
                    //console.log(displaydate);
                    arrayDate[i] = displaydate;
                    if (!record.price_date_Arr[i].price || record.price_date_Arr[i].price == null || record.price_date_Arr[i].price.length == 0) {
                        arrayPrice[i] = 0;
                    } else {
                        let len = record.price_date_Arr[i].price.length;
                        //console.log("price length::::", len);
                        let priceStr = record.price_date_Arr[i].price.slice(1, len).replace(/,/, '');
                        //console.log(priceStr);
                        arrayPrice[i] = parseFloat(priceStr);
                    }
                    //arrayPrice[i] = record.price_date_Arr.price;
                }
                res.render('graph', { arrayPrice: arrayPrice, arrayDate: arrayDate, graphLabel: graphLabel, graphUrl: graphUrl });
                //res.json(arrayPriceDate);
                console.log("User::::::", req.session.email, '\n', arrayPrice, '\n', arrayDate);
            }
        })
    })
})

app.post('/removeItem', async function (req, res) {
    console.log(req.body);
    await mongo_funcs.deleteFetchMongoDB(req.body.email, req.body.url);
    res.redirect('/monitor');

})

app.post('/updatePriceDate', function (req, res) {
    console.log(req.body);
    var itemUpdate = {};
    itemUpdate.date = Date.now();
    itemUpdate.price = "$0";

    // Check category and insert database 
    switch (req.body.category) {
        case "Amazon Laptop":
            getpriceAwsLaptop(req.body.url);
            res.json("Updating price & date :::: " + Date(itemUpdate.date) + ". Go back and click display to see updated price");
            break;
        case "Amazon Golf":
            getpriceAwsGolf(req.body.url);
            res.json("Updating price & date :::: " + Date(itemUpdate.date) + ". Go back and click display to see updated price");
            break;
        case "Bestbuy Laptop":
            getpriceBBLaptop(req.body.url);
            res.json("Updating price & date :::: " + Date(itemUpdate.date) + ". Go back and click display to see updated price");
            break;
        case "Kijiji Old Car":
            getpriceKJJOldCar(req.body.url);
            res.json("Updating price & date :::: " + Date(itemUpdate.date) + ". Go back and click display to see updated price");
            break;
        case "Kijiji Laptop":
            getpriceKJJLaptop(req.body.url);
            res.json("Updating price & date :::: " + Date(itemUpdate.date) + ". Go back and click display to see updated price");
            break;
        default:
            res.send('Category is not available yet. Go back and chose another category');
    }

    async function updatePriceDateMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_itemsGraphCollection).updateOne({ url: req.body.url }, { $push: { price_date_Arr: { price: itemUpdate.price, date: itemUpdate.date } } }, function (err, res) {
                if (err) throw err;
                console.log("price & date added ");
            });
            db.close();
        });
    }

    async function getpriceAwsLaptop(_url) {
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });

        var pageXpath = await browser.newPage();
        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(amazonLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemUpdate.price = await price.jsonValue();
            console.log("Price Date got:::::", itemUpdate);
            updatePriceDateMongoDB();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        browser.close();
    }

    async function getpriceAwsGolf(_url) {
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(amazonGolf.attr_xpath.price);
            var [el4] = await pageXpath.$x(amazonGolf.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemUpdate.price = await price.jsonValue();
            console.log("Price Date got:::::", itemUpdate);
            updatePriceDateMongoDB();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        browser.close();
    }

    async function getpriceBBLaptop(_url) {
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(bestbuyLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemUpdate.price = await price.jsonValue();
            console.log("Price Date got:::::", itemUpdate);
            updatePriceDateMongoDB();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        browser.close();
    }

    async function getpriceKJJLaptop(_url) {
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(kijijiLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(kijijiLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemUpdate.price = await price.jsonValue();
            console.log("Price Date got:::::", itemUpdate);
            updatePriceDateMongoDB();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        browser.close();
    }
    async function getpriceKJJOldCar(_url) {
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(kijijiOldCar.attr_xpath.price);
            var [el4] = await pageXpath.$x(kijijiOldCar.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemUpdate.price = await price.jsonValue();
            console.log("Price Date got:::::", itemUpdate);
            updatePriceDateMongoDB();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        browser.close();
    }
})

/////////////////////////////////////END MANAGE ITEMS CLICKS //////////////////////////////////

/////////////////////////////////////FETCH LINKS //////////////////////////////////

app.get('/fetch', function (req, res) {
    res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
})

app.post('/fetch', function (req, res) {
    var { category, count } = req.body;
    var linkItems = [];
    console.log(category);
    if (count >= 10) count = 9;
    
    // get Amazon Laptop
    async function getAwsLaptop() {
    
        var browser = await puppeteer.launch();

    /*   use this code if run nodejs in Linux and got problem with chromium
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox']
        });
    */

        var pageURL = await browser.newPage();
        console.log("getAwsLaptop: ", amazonLaptop.Url);

        await pageURL.goto(amazonLaptop.Url);
        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(amazonLaptop.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var [el0] = await pageURL.$x(amazonLaptop.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then()
                .catch(e => res.json(e))
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        browser.close();
        console.log(linkItems);
    }

    // get Amazon Golf
    async function getAwsGolf() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageURL = await browser.newPage();

        console.log("getAwsGolf: ", amazonGolf.Url);

        await pageURL.goto(amazonGolf.Url);
        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(amazonGolf.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var [el0] = await pageURL.$x(amazonGolf.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then(console.log('OK next'))
                .catch(e => res.json(e))
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch.ejs
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        browser.close();
        console.log(linkItems);
    }

    // getBestBuyLaptop
    async function getBBLaptop() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageURL = await browser.newPage();
        console.log("getBestBuyLaptop: ", bestbuyLaptop.Url);

        //await pageURL.setDefaultNavigationTimeout(0);
        await pageURL.goto(bestbuyLaptop.Url)
            .then()
            .catch(e => res.json(e))

        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(bestbuyLaptop.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var [el0] = await pageURL.$x(bestbuyLaptop.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then(console.log('OK next'))
                .catch(e => res.json(e))
            console.log('Json value:::::::', await link0.jsonValue());
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        await browser.close();
        console.log(linkItems);
    }
    // get Kijiji laptop
    async function getKJJLaptop() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageURL = await browser.newPage();
        console.log("getKijijiLaptop: ", kijijiLaptop.Url);

        //await pageURL.setDefaultNavigationTimeout(0);
        await pageURL.goto(kijijiLaptop.Url);

        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(kijijiLaptop.link_xpath[i])
                .then(console.log('OK next'))
                .catch(e => res.json(e))

            var [el0] = await pageURL.$x(kijijiLaptop.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then()
                .catch(e => res.json(e))
            console.log('Json value:::::::', await link0.jsonValue());
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        await browser.close();
        console.log(linkItems);
    }
    // get Kijiji Old Car
    async function getKJJOldCar() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageURL = await browser.newPage();
        console.log("getKijijiOldCar: ", kijijiOldCar.Url);

        //await pageURL.setDefaultNavigationTimeout(0);
        await pageURL.goto(kijijiOldCar.Url);

        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(kijijiOldCar.link_xpath[i])
                .then(console.log('OK next'))
                .catch(e => res.json(e))

            var [el0] = await pageURL.$x(kijijiOldCar.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then()
                .catch(e => res.json(e))
            console.log('Json value:::::::', await link0.jsonValue());
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        await browser.close();
        console.log(linkItems);
    }
    // get Kijiji House
    async function getKJJHouse() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageURL = await browser.newPage();
        console.log("getKijijiHouse: ", kijijiHouse.Url);

        //await pageURL.setDefaultNavigationTimeout(0);
        await pageURL.goto(kijijiHouse.Url);

        for (let i = 0; i < count; i++) {
            linkItems[i] = {};
            await pageURL.waitForXPath(kijijiHouse.link_xpath[i])
                .then(console.log('OK next'))
                .catch(e => res.json(e))

            var [el0] = await pageURL.$x(kijijiHouse.link_xpath[i])
                .then()
                .catch(e => res.json(e))
            var link0 = await el0.getProperty('href')
                .then()
                .catch(e => res.json(e))
            console.log('Json value:::::::', await link0.jsonValue());
            linkItems[i].link = await link0.jsonValue();
            linkItems[i].pos = i + 1;
            linkItems[i].cat = category;
        }
        // map item and send to fetch
        if (!linkItems || linkItems.length === 0) {
            res.render('fetch', { linkItems: false, logged: req.session.isAuth, email: req.session.email });
        }
        else {
            linkItems.map(linkItem => {  // STILL GOT ISSUE with setting linkisNull value
                if (linkItem.link === '' || linkItem.link === null || linkItem.link.length === 0) {
                    linkItem.isNull = true;
                }
                else {
                    linkItem.isNull = false;
                }
            })
            res.render('fetch', { linkItems: linkItems, logged: req.session.isAuth, email: req.session.email });
        }
        await browser.close();
        console.log(linkItems);
    }
    // Check category and insert database 
    switch (category) {
        case "Amazon Laptop":
            getAwsLaptop();
            break;
        case "Amazon Golf":
            getAwsGolf();
            break;
        case "Bestbuy Laptop":
            getBBLaptop();
            break;
        case "Kijiji Old Car":
            getKJJOldCar();
            break;
        case "Kijiji Laptop":
            getKJJLaptop();
            break;
        default:
            res.send('Category is not available yet. Go back and chose another category');
    }
})
/////////////////////////////////////FETCH LINKS END//////////////////////////////////

/////////////////////////////////////SAVE 1 FETCHED ITEM//////////////////////////////////

app.post('/saveItem', isAuth, function (req, res) {
    var { category, url } = req.body;
    console.log("receive to save:::::", req.body);
    console.log("email of session to save:::::", req.session.email);
    if (url) {
        var itemToSave = {};
        itemToSave.url = url;
        itemToSave.date = Date.now();
        itemToSave.email = req.session.email;
        //console.log("Check with json category:", category === amazonLaptop.Category_Name)
        itemToSave.category = category;
        saveItemToMongoDB();
    }
    else {
        console.log('No url');
    }

    async function saveItemToMongoDB() { //check if item (url) exist in items_graph collection and copy if exist
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_itemsGraphCollection).findOne({ url: url }, function (err, record) {
                if (err) { throw err; }
                else {
                    if (!record || record == null || record.length == 0) {
                        console.log("Item not in Graph collection. Goto new item process ::::: ");
                        saveNewItemToBothMongoDB();
                    } else {
                        console.log("Item already in Graph collection. Now check in item_fetch collection ::::: ");
                        itemToSave.title = record.title;
                        itemToSave.price_list = record.price_list;
                        itemToSave.price = record.price;
                        saveNewItemToFetchMongoDB();
                    }
                }
            });
            db.close();
        });
    }

    async function saveNewItemToBothMongoDB() {
        switch (category) {
            case "Amazon Laptop":
                SaveAwsLaptop();
                break;
            case "Amazon Golf":
                SaveAwsGolf();
                break;
            case "Bestbuy Laptop":
                SaveBBLaptop();
                break;
            case "Kijiji Old Car":
                SaveKJJOldCar();
                break;
            case "Kijiji Laptop":
                SaveKJJLaptop();
                break;
            default:
                res.send('Category is not available yet. Go back and chose another category');
        }
        res.json("Item being inserted to both collections")
    }

    async function saveNewItemToFetchMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_fetchItemsCollection).findOne({ url: url, email: req.session.email }, function (err, result) {
                if (err) { throw err; }
                else {
                    if (!result || result.length == 0) {
                        console.log("Item not in items_fetch collection. Now insert item to items_fetch collections ::::: ");
                        mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
                        res.json("Item being inserted into items_fetch collection")
                    } else {
                        console.log("Item already in items_fetch collection. No insert ");
                        res.json("Item existed in both collections ")
                    }
                }
            });
            db.close();
        })
    }

    // fetch info 1 item AWS Laptop then insert to items_fetch collection
    async function SaveAwsLaptop() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();
        //itemToSave.email = email;
        //itemToSave.category = category;

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(amazonLaptop.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.title);
            var [el2] = await pageXpath.$x(amazonLaptop.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(amazonLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(amazonLaptop.attr_xpath.price_list);
            var [el4] = await pageXpath.$x(amazonLaptop.attr_xpath.price_list);
            var price_list = await el4.getProperty('textContent');
            itemToSave.price_list = await price_list.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }

    // fetch info 1 item AWS Golf then insert to items_fetch collection
    async function SaveAwsGolf() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(amazonGolf.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(amazonGolf.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(amazonGolf.attr_xpath.title);
            var [el2] = await pageXpath.$x(amazonGolf.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(amazonGolf.attr_xpath.price);
            var [el4] = await pageXpath.$x(amazonGolf.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(amazonGolf.attr_xpath.price_list);
            var [el4] = await pageXpath.$x(amazonGolf.attr_xpath.price_list);
            var price_list = await el4.getProperty('textContent');
            itemToSave.price_list = await price_list.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }
    // fetch info 1 item Bestbuy Laptop then insert to items_fetch collection
    async function SaveBBLaptop() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(bestbuyLaptop.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.title);
            var [el2] = await pageXpath.$x(bestbuyLaptop.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(bestbuyLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.saving);
            var [el4] = await pageXpath.$x(bestbuyLaptop.attr_xpath.saving);
            var saving = await el4.getProperty('textContent');
            itemToSave.saving = await saving.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }
    // fetch info 1 item Kijiji laptop then insert to items_fetch collection
    async function SaveKJJLaptop() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(kijijiLaptop.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(kijijiLaptop.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(kijijiLaptop.attr_xpath.title);
            var [el2] = await pageXpath.$x(kijijiLaptop.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(kijijiLaptop.attr_xpath.price);
            var [el4] = await pageXpath.$x(kijijiLaptop.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(kijijiLaptop.attr_xpath.address);
            var [el4] = await pageXpath.$x(kijijiLaptop.attr_xpath.address);
            var address = await el4.getProperty('textContent');
            itemToSave.address = await address.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }
    // fetch info 1 item Kijiji old car then insert to items_fetch collection
    async function SaveKJJOldCar() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(kijijiOldCar.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(kijijiOldCar.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(kijijiOldCar.attr_xpath.title);
            var [el2] = await pageXpath.$x(kijijiOldCar.attr_xpath.title);
            var title = await el4.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(kijijiOldCar.attr_xpath.price);
            var [el4] = await pageXpath.$x(kijijiOldCar.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(kijijiOldCar.attr_xpath.address);
            var [el4] = await pageXpath.$x(kijijiOldCar.attr_xpath.address);
            var address = await el4.getProperty('textContent');
            itemToSave.address = await address.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }
    // fetch info 1 item Kijiji House then insert to items_fetch collection
    async function SaveKJJHouse() {
        var browser = await puppeteer.launch();
        /*   use this code if run nodejs in Linux and got problem with chromium
            var browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox']
            }); */
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            await pageXpath.waitForXPath(kijijiHouse.attr_xpath.img_src);
            var [el1] = await pageXpath.$x(kijijiHouse.attr_xpath.img_src);
            var src = await el1.getProperty('src');
            itemToSave.img_src = await src.jsonValue();

            await pageXpath.waitForXPath(kijijiHouse.attr_xpath.title);
            var [el2] = await pageXpath.$x(kijijiHouse.attr_xpath.title);
            var title = await el2.getProperty('textContent');
            itemToSave.title = await title.jsonValue();

            await pageXpath.waitForXPath(kijijiHouse.attr_xpath.price);
            var [el4] = await pageXpath.$x(kijijiHouse.attr_xpath.price);
            var price = await el4.getProperty('textContent');
            itemToSave.price = await price.jsonValue();

            await pageXpath.waitForXPath(bestbuyLaptop.attr_xpath.saving);
            var [el4] = await pageXpath.$x(bestbuyLaptop.attr_xpath.saving);
            var saving = await el4.getProperty('textContent');
            itemToSave.saving = await saving.jsonValue();
        }
        catch (error) {
            console.log('Error::::::::', error.message);
        }
        console.log('itemToSave to MongoDB: ', itemToSave);
        browser.close();
        await mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
        itemToSave.price_date_Arr = [];
        itemToSave.price_date_Arr[0] = { price: itemToSave.price, date: itemToSave.date };
        await mongo_funcs.insertMongoDB(_itemsGraphCollection, itemToSave);

    }
})

/////////////////////////////////////END SAVE 1 FETCHED ITEM SELECTED//////////////////////////////////


app.listen(5000, function () {
    console.log('My project app running at port 5000');
});