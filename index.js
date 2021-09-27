const bodyParser = require('body-parser');
const express = require('express');
const puppeteer = require('puppeteer');
const ObjectId = require('mongodb').ObjectID;

const mongo_funcs = require('./js/mongoDB_funcs');
const fetch_funcs = require('./js/fetch_funcs');
const mongoClient = require('mongodb');
const _mongoUrl = process.env.mongoDB_URI;
const _stripeKey = process.env.stripeKey;
const paypalClientID = process.env.paypalClientID;
const paypalSecret = process.env.paypalSecret;
const MYDOMAIN = process.env.appDomain;

const stripe = require('stripe')(_stripeKey);
const dotenv = require('dotenv');

dotenv.config();

const _db = "myproject"; // database of the project
const _usersCollection = "users"; // users collection
const _fetchItemsCollection = "items_fetch";
const _itemsGraphCollection = "items_graph";
const _shopCollection = "shopping";
const _linksCollection = "links_fetch";
const _paymentsCollection = "payments_stripe_paypal";

var amazonLaptop = {};
var amazonGolf = {};
var bestbuyLaptop = {};
var kijijiOldCar = {};
var kijijiLaptop = {};
var bestbuyDrone = {};
var amazonGarmin = {};

//const urlEncodedParser = bodyParser.urlencoded({ extended: false });
const app = express();
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');

///////////////////////////////////// GET CATEGORIES INFORMATION  //////////////////////////////////

async function getCategories() {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_linksCollection).find().toArray(function (err, records) {
            if (err) throw err;
            else {
                if (!records || records.length === 0 || records == null) {
                    return false;
                }
                else {
                    for (let i = 0; i < records.length; i++) {
                        if (records[i].category_name == 'Amazon Laptop') {
                            amazonLaptop = records[i];
                        }
                        if (records[i].category_name == 'Amazon Golf') {
                            amazonGolf = records[i];
                        }
                        if (records[i].category_name == 'Amazon Garmin') {
                            amazonGarmin = records[i];
                        }
                        if (records[i].category_name == 'Bestbuy Laptop') {
                            bestbuyLaptop = records[i];
                        }
                        if (records[i].category_name == 'Kijiji Laptop') {
                            kijijiLaptop = records[i];
                        }
                        if (records[i].category_name == 'Kijiji Classic Car') {
                            kijijiOldCar = records[i];
                        }
                        if (records[i].category_name == 'Bestbuy Drone') {
                            bestbuyDrone = records[i];
                        }
                    }
                }
            }
        })
        db.close();
    })

}

getCategories();

///////////////////////////////////// END GET CATEGORIES INFORMATION  //////////////////////////////////
///////////////////////////////////// MANAGE LOGIN SESSION//////////////////////////////////

const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + '/'));

mongoose
    .connect(_mongoUrl, {
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(function(res){
        console.log('MongoDB connected');
    });

const store = new mongoDBSession({
    uri: _mongoUrl,
    collection: 'appSessions',
});

app.use(session({
    secret: 'key to sign cookie',
    resave: false,
    saveUninitialized: false,
    store: store,
}))

/////////////////////////////////////END MANAGE LOGIN SESSION//////////////////////////////////
// Check if user is logged in 

const isAuth = function(req, res, next){
    if (req.session.isAuth){
        next();
    }else{
        res.redirect('/login');
    }
}

app.get('/', function (req, res) {
    console.log(req.session.id);
    console.log(req.session.isAuth);    
    res.render('index', { menu: 0, logged: req.session.isAuth, email: req.session.email});
})

///////////////////////////////////// MANAGE USER REGISTRATION & LOGIN & LOGOUT //////////////////////////////////
// registration for new user 
// route = register , views = registration

app.get('/register', function (req, res) {
    res.render('register', { menu: 5, logged: req.session.isAuth, email: req.session.email});
})
app.post('/register', function(req, res) {
    console.log(req.body.email);
    mongoClient.connect(_mongoUrl, async function(err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_usersCollection).findOne({email: req.body.email}, function(err, user) {
            if (err) throw err;
            else {
                if(!user || user.length === 0 || user == null) {
                    mongo_funcs.insertMongoDB('users', req.body);
                    //res.render('login', { menu: 5,  logged: req.session.isAuth, email: req.session.email});
                    res.render('message', { msgID: 51, message: `new email ${req.body.email} successfully added!`, menu: 5, logged: req.session.isAuth, email: req.session.email })
                    let demo1 = require('./json/amazon_demo.json');
                        demo1.email = req.body.email;
                    let demo2 = require('./json/kijiji_demo.json');
                        demo2.email = req.body.email;
                    mongo_funcs.insertMongoDB(_fetchItemsCollection, demo1);
                    mongo_funcs.insertMongoDB(_fetchItemsCollection, demo2);
                }
                else {
                    //return res.json('email existed, chose another email');
                    res.render('message', { msgID: 52, message:'email existed, chose another email' , menu: 5, logged: req.session.isAuth, email: req.session.email } )
                }
            }    
        })
        db.close();
    })
})

app.get('/login', function(req, res){
    res.render('login', { menu: 5, logged: req.session.isAuth, email: req.session.email});
})
app.post('/login', function(req, res){
    var { email, password } = req.body;
    console.log("params: ", email);
    mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_usersCollection).findOne({ email: email, password: password }, function (err, user) {
            if (err) throw err;
            else {
                if (!user || user.length === 0 || user == null) {
                    //return res.json('username or password not matched');
                    res.render('message', { msgID: 51, message: 'username or password not matched', menu: 5, logged: req.session.isAuth, email: req.session.email })
                }
                else {
                    req.session.isAuth = true;
                    req.session.email = email;
                    res.render('index', { menu: 0, logged: req.session.isAuth, email: req.session.email});
                }
            }
        })
        db.close();
    })
})

app.post('/logout', function(req, res){
    req.session.destroy(function(err){
        if (err) throw(err);
        res.redirect('/');
    })
})
/////////////////////////////////////END MANAGE USER REGISTRATION & LOGIN //////////////////////////////////
///////////////////////////////////// MONITOR //////////////////////////////////

app.get('/monitor', function (req, res) {
    if (req.session.isAuth) {
        querySavedItemMongoDB();
    } else {
        res.redirect('/login');
    }
    // querySavedItemMongoDB query all the saved items of the logged-in user email 
    async function querySavedItemMongoDB() { 
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_fetchItemsCollection).find({ email: req.session.email }).toArray(function(err, records){
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0){
                    console.log("values send to monitor.pug is NULLLLLLL ", req.session.email);
                    res.render('monitor', { menu: 2, listItems: false, logged: req.session.isAuth, email: req.session.email})
                }else {
                    records.map(function(record, index)  {
                        record.pos = index;
                        let rawDate = new Date(record.date);
                        let displaydate = rawDate.getDate() + '/' + (rawDate.getMonth() + 1) + '/' + rawDate.getFullYear() + '\n' + rawDate.getHours() + ':' + rawDate.getMinutes();
                        record.date = displaydate;
                        //console.log(record.date);
                        if (record.saving) {
                            let lens = record.saving.length;
                            let lenp = record.price.length;
                            record.price_list = '$' + (parseFloat(record.price.slice(1, lenp)) + parseFloat(record.saving.slice(6, lens))).toString();
                            //console.log("Price listed after parsed saving + ", record.price_list);
                        }
                        
                    })
                    //console.log("values send to monitor.pug ::::::::", req.session.email);
                    res.render('monitor', { menu: 2, listItems: records, logged: req.session.isAuth, email: req.session.email });
                }
            });
        });
    }
})

/////////////////////////////////////END MONITOR //////////////////////////////////
///////////////////////////////////// MANAGE MONITOR CLICKS //////////////////////////////////

app.get('/displaygraph', function(req, res){
    res.render('graph');
})

app.post('/displaygraph', function (req, res) {
    //console.log(req.body);
    //res.json(req.body);
    mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_itemsGraphCollection).findOne({ url: req.body.url }, function (err, record) {
            if (err) {
                throw err;
            }
            else {
                if (!record || record == null) {
                    //res.render('error', {message:"Graph is null"});
                    res.render('message', { msgID: 2, message: 'Graph invalid!', menu: 2, logged: req.session.isAuth, email: req.session.email })
                }
                else {
                    if (!record.price || record.price == null || record.price.length == 0) {
                        res.render('message', { msgID: 2, message: 'Graph invalid!', menu: 2, logged: req.session.isAuth, email: req.session.email })
                    } else {
                        let arrayPrice = [];
                        let arrayDate = []
                        let graphLabel = record.title;
                        let graphUrl = record.url;
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
                        res.render('graph', { menu: 2, arrayPrice: arrayPrice, arrayDate: arrayDate, graphLabel: graphLabel, graphUrl: graphUrl });
                        //res.json(arrayPriceDate);
                        console.log("User::::::", req.session.email, '\n', arrayPrice, '\n', arrayDate);
                    }
                }
            }
        })
    })
})

app.post('/addShop', async function(req, res) {
    //var filter = { url: req.body.url };
    mongo_funcs.queryReturnItemMongoDB(_fetchItemsCollection, req.body.url);
    res.redirect('/manageshop'); 
 
})

app.post('/removeItem', async function(req, res){
    console.log(req.body);
    await mongo_funcs.deleteFetchMongoDB(req.body.email, req.body.url);
    res.redirect('/monitor');

})

app.post('/updatePriceDate', function(req, res){
    console.log(req.body);
    var itemUpdate = {};
    itemUpdate.date = Date.now();
    itemUpdate.price = "$0";

    // Check category and insert database 
    switch (req.body.category) {
        case "Amazon Laptop":
            getItemPrice(amazonLaptop, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Amazon Garmin":
            getItemPrice(amazonGarmin, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Amazon Golf":
            getItemPrice(amazonGolf, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Bestbuy Laptop":
            getItemPrice(bestbuyLaptop, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Bestbuy Drone":
            getItemPrice(bestbuyDrone, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Kijiji Classic Car":
            getItemPrice(kijijiOldCar, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        case "Kijiji Laptop":
            getItemPrice(kijijiLaptop, req.body.url);
            res.render('message', { msgID: 2, message: `Updating price & date ::: ${Date(itemUpdate.date)} ::: Go back and click display to see updated price!`, menu: 2, logged: req.session.isAuth, email: req.session.email });
            break;
        default:
            res.render('message', { msgID: 2, message: 'Updating issue!', menu: 2, logged: req.session.isAuth, email: req.session.email });
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

    async function getItemPrice(_category, _url) {
        //var browser = await puppeteer.launch();
        var browser = await puppeteer.launch({
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(_url)
        try {
            await pageXpath.waitForXPath(_category.attr_xpath.price);
            var [el4] = await pageXpath.$x(_category.attr_xpath.price);
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
/////////////////////////////////////END MANAGE MONITOR CLICKS //////////////////////////////////
/////////////////////////////////////FETCH LINKS //////////////////////////////////

app.get('/fetch', function (req, res) {
    res.render('fetch', { menu: 1, linkItems: false, logged: req.session.isAuth, email: req.session.email});
})

app.post('/fetch', async function (req, res) {
    let { category, count } = req.body;
    console.log(category);

// Check category and insert database 
    switch (category){
        case "Amazon Laptop":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(amazonLaptop, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Amazon Garmin":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(amazonGarmin, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Amazon Golf":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(amazonGolf, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Bestbuy Laptop":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(bestbuyLaptop, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Bestbuy Drone":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(bestbuyDrone, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Kijiji Classic Car":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(kijijiOldCar, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        case "Kijiji Laptop":
            res.render('fetch', { menu: 1, linkItems: await fetch_funcs.getLinkItems(kijijiLaptop, count, category), logged: req.session.isAuth, email: req.session.email });
            break;
        default:
            res.render('message', { msgID: 1, message: 'Category is not available yet. Go back and chose another category', menu: 1, logged: req.session.isAuth, email: req.session.email })

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
        itemToSave.category = category;
        saveItemToMongoDB(url);
    }
    else { 
        console.log('No url'); 
    }

    async function saveItemToMongoDB(url) { //check if item (url) exist in items_graph collection and copy if exist
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            console.log("url to find::::::", url);
            dbo.collection(_itemsGraphCollection).findOne({ url: url }, function (err, record) {
                if (err) { throw err; }
                else {
                    if (record == null) {
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

    async function saveNewItemToBothMongoDB(){
                        switch (category) {
                            case "Amazon Laptop":
                                saveFetchedItem(amazonLaptop);
                                break;
                            case "Amazon Garmin":
                                saveFetchedItem(amazonGarmin);
                                break;
                            case "Amazon Golf":
                                saveFetchedItem(amazonGolf);
                                break;
                            case "Bestbuy Laptop":
                                saveFetchedItem(bestbuyLaptop);
                                break;
                            case "Bestbuy Drone":
                                saveFetchedItem(bestbuyDrone);
                                break;
                            case "Kijiji Classic Car":
                                saveFetchedItem(kijijiOldCar);
                                break;
                            case "Kijiji Laptop":
                                saveFetchedItem(kijijiLaptop);
                                break;
                            default:
                                res.render('message', { msgID: 1, message: 'Category is not available yet. Go back and chose another category', menu: 1, logged: req.session.isAuth, email: req.session.email })
                        }
        res.render('message', { msgID: 1, message: 'Item being inserted to item & graph collections', menu: 1, logged: req.session.isAuth, email: req.session.email });
    }

    async function saveNewItemToFetchMongoDB(){
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_fetchItemsCollection).findOne({ url: url, email: req.session.email }, function (err, result) {
                if (err) { throw err; }
                else {
                    if (!result || result.length == 0) {
                        console.log("Item not in items_fetch collection. Now insert item to items_fetch collections ::::: ");
                        mongo_funcs.insertMongoDB(_fetchItemsCollection, itemToSave);
                        res.render('message', { msgID: 1, message: 'Item being inserted to item collections', menu: 1, logged: req.session.isAuth, email: req.session.email });
                    }else {
                        console.log("Item already in items_fetch collection. No insert ");
                        res.render('message', { msgID: 1, message: 'Item already existed', menu: 1, logged: req.session.isAuth, email: req.session.email });
                    }
                }
            });
            db.close();
        })
    }
    
    async function saveFetchedItem(_category) {
        //var browser = await puppeteer.launch();
        var browser = await puppeteer.launch({
            args: ['--no-sandbox']
        });
        var pageXpath = await browser.newPage();

        await pageXpath.goto(url)
        try {
            itemToSave.img_src = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.img_src, 'src');
            itemToSave.title = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.title, 'textContent');
            itemToSave.price = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.price, 'textContent');
            if (_category.category_name.startsWith("Amazon")) {
                itemToSave.price_list = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.price_list, 'textContent');
            }
            if (_category.category_name.startsWith("Bestbuy")) {
                itemToSave.saving = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.saving, 'textContent');
            }
            if (_category.category_name.startsWith("Kijiji")) {
                itemToSave.address = await fetch_funcs.returnXPathValue(pageXpath, _category.attr_xpath.address, 'textContent');
            }
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
/////////////////////////////////////MANAGE SHOP //////////////////////////////////
app.get('/manageshop', isAuth, function (req, res) {
    queryShopMongoDB();
    // queryShopMongoDB query all the items in the shop collection to display to manageshop.pug 
    async function queryShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).find().toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    res.render('manageshop', { menu: 3, listItems: false, logged: req.session.isAuth, email: req.session.email })
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                    });
                    res.render('manageshop', { menu: 3, listItems: records, logged: req.session.isAuth, email: req.session.email });
                }
            });
        });
    }
})

app.get('/editshopitem/:id', isAuth, async function (req, res) {

    var filter = {_id: ObjectId(req.params.id)};
    queryItemShopMongoDB();

    // queryShopMongoDB query all the items in the shop collection to display to manageshop.pug 
    async function queryItemShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).find(filter).toArray(function (err, item) {
                if (err) throw err;
                db.close();
                if (!item || item == null) {
                    //res.json('mongoDB lookup issue !')
                    res.render('message', { msgID: 3, message: 'item not found!', menu: 3, logged: req.session.isAuth, email: req.session.email });

                } else {
                    console.log(item[0]);
                    res.render('editshopitem', { menu: 3, item: item[0], logged: req.session.isAuth, email: req.session.email});
                }
            });
        });
    }
})

app.post('/editshopitem', isAuth, function (req, res) {
    
    var filter = { url: req.body.url };

    console.log(req.body);
    var newItemValues = {
        title: req.body.title,
        price: parseInt(req.body.price),
        price_list: parseInt(req.body.price_list),
        visible: Boolean(req.body.visible)
    }
    updateItemShopMongoDB();
    // queryShopMongoDB query all the items in the shop collection to display to manageshop.pug 
    async function updateItemShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).updateOne(filter, { $set: newItemValues }, (err, result) => {
                if (err) throw err;
                //console.log(result);
                console.log('item on shop was updated !');
                res.redirect('/manageshop');
            });
        });
    }
})

app.get('/deleteshopitem/:id', isAuth, function (req, res) {
    var filter = { _id: ObjectId(req.params.id) };
    console.log(filter);

    mongo_funcs.deleteItemShopMongoDB(filter);
    res.redirect('/manageshop');
})

/////////////////////////////////////END MANAGE SHOP//////////////////////////////////

app.get('/contact', function(req, res)  {

    res.render('contact', { menu: 4, logged: req.session.isAuth, email: req.session.email });

})

/////////////////////////////////////MANAGE BILLING//////////////////////////////////

app.get('/managebilling', isAuth, function (req, res) {
    queryShopMongoDB();
    // queryShopMongoDB query all the items in the shop collection to display to manageshop.pug 
    async function queryShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_paymentsCollection).find().toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    res.render('billing', { menu: 3, listItems: false, logged: req.session.isAuth, email: req.session.email })
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                    });
                    res.render('billing', { menu: 3, listItems: records, logged: req.session.isAuth, email: req.session.email });
                }
            });
        });
    }
})

/////////////////////////////////////END MANAGE BILLING//////////////////////////////////

/////////////////////////////////////SHOP //////////////////////////////////

app.get('/shop', function (req, res) {
    queryShopMongoDB();
    // queryShopMongoDB query all the items in the shop collection to display to shopping.pug 
    async function queryShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).find({ visible: true }).toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    res.render('shop', { listItems: false, clearcart: false})
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                    });
                    res.render('shop', { listItems: records, clearcart: false });
                }
            });
        });
    }
})

app.get('/cart', function (req, res) {

    queryShopMongoDB();

    // queryShopMongoDB query all the items in the shop collection to display to shopping.pug 
    async function queryShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).find({ visible: true }).toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    res.render('cart', { listItems: false, clearcart: false })
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                    });
                    res.render('cart', { listItems: records, clearcart: false });
                }
            });
        });
    }
})

app.get('/clearcart', function (req, res) {

    queryShopMongoDB();

    async function queryShopMongoDB() {
        await mongoClient.connect(_mongoUrl, function (err, db) {
            if (err) throw err;
            var dbo = db.db(_db);
            dbo.collection(_shopCollection).find({ visible: true }).toArray(function (err, records) {
                if (err) throw err;
                db.close();
                if (!records || records == null || records.length === 0) {
                    res.render('shop', { listItems: false, clearcart: true })
                } else {
                    records.map(function (record, index) {
                        record.pos = index;
                    });
                    res.render('shop', { listItems: records , clearcart: true });
                }
            });
        });
    }
})

app.get('/shoptest', function (req, res) {
    res.render('ex4');
})
/////////////////////////////////////END SHOP//////////////////////////////////
/////////////////////////////////////STRIPE PAYMENT//////////////////////////////////
app.post('/stripe/:totalpayment', async (req, res) => {
    var totalpayment = parseInt(req.params.totalpayment);
    let transaction = {};
    transaction.totalpayment = totalpayment;
    transaction.payment_method = "stripe";
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + ' ' + time;
    transaction.create_time = dateTime;
    console.log("stripe requests :::: ", totalpayment);
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'CAD',
                    product_data: {
                        name: 'Price Monitor',
                        images: ['https://www.elearnexcel.com/wp-content/uploads/2013/08/Stripe-Logo.png'],
                    },
                    unit_amount: totalpayment*100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        //success_url: 'http://localhost:5000/paymentsuccess',
        success_url: `${MYDOMAIN}/paymentsuccess`,
        //cancel_url: 'http://localhost:5000/paymentcancel',
        cancel_url: `${MYDOMAIN}/paymentcancel`,
    });
    //const session = await stripe.checkout.sessions.retrieve(stripeKey);
    let paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    transaction.id = paymentIntent.id;
    transaction.payment_intent = paymentIntent
    transaction.payment_intent.amount = paymentIntent.amount / 100;
    console.log('Stripe API :::: ', paymentIntent.id);
    console.log(paymentIntent.amount / 100,paymentIntent.currency);
    console.log(paymentIntent.created);
    console.log(paymentIntent.payment_method_types[0]);    
    mongo_funcs.insertMongoDB(_paymentsCollection, transaction);
    res.json({ id: session.id });
});

app.get('/paymentsuccess', (req, res) => {
    res.render('success');
})

app.get('/paymentcancel', (req, res) => {
    res.render('cancel');
})

/////////////////////////////////////END STRIPE PAYMENT//////////////////////////////////
///////////////////////////////////// PAYPAL PAYMENT//////////////////////////////////

app.get('/paypal', (req, res) => {
    res.render('paypal_client');
})

const request = require('request');
var CLIENT = paypalClientID;
var SECRET = paypalSecret;
var PAYPAL_API = 'https://api-m.sandbox.paypal.com';
// Add your credentials: 
// Add your client ID and secret
//express()
    // Set up the payment:
    // 1. Set up a URL to handle requests from the PayPal button
app.post('/paypal/create-payment/:totalPayment', function (req, res) {
        //console.log(".ENV VARS ", CLIENT, SECRET, MYDOMAIN);
        // 2. Call /v1/payments/payment to set up the payment
        //console.log(req.params);
        var totalPayment = req.params.totalPayment;
        //console.log(totalPayment);
        request.post(PAYPAL_API + '/v1/payments/payment',
            {
                auth:
                {
                    user: CLIENT,
                    pass: SECRET
                },
                body:
                {
                    intent: 'sale',
                    payer:
                    {
                        payment_method: 'paypal'
                    },
                    transactions: [
                        {
                            amount:
                            {
                                total: totalPayment,
                                currency: 'CAD'
                            }
                        }],
                    redirect_urls:
                    {
                        //return_url: 'http://localhost:5000/paymentsuccess',
                        return_url: `${MYDOMAIN}/paymentsuccess`,
                        //cancel_url: 'http://localhost:5000/paymentcancel'
                        cancel_url: `${MYDOMAIN}/paymentcancel`
                    }
                },
                json: true
            }, function (err, response) {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }
            // 3. Return the payment ID to the client
            res.json(
                {
                    id: response.body.id
                });
        });
    })
    // Execute the payment:
    // 1. Set up a URL to handle requests from the PayPal button.
app.post('/paypal/execute-payment/:totalPayment', function (req, res) {
        // 2. Get the payment ID and the payer ID from the request body.
        //console.log(req.params);
        let transaction = {};
        var totalPayment = parseInt(req.params.totalPayment);
        transaction.totalpayment = totalPayment;
        console.log("Paypal :::", totalPayment);

        var paymentID = req.body.paymentID;
        var payerID = req.body.payerID;
        // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
        request.post(PAYPAL_API + '/v1/payments/payment/' + paymentID +
            '/execute',
            {
                auth:
                {
                    user: CLIENT,
                    pass: SECRET
                },
                body:
                {
                    payer_id: payerID,
                    transactions: [
                        {
                            amount:
                            {
                                total: totalPayment,
                                currency: 'CAD'
                            }
                        }]
                },
                json: true
            },
            function (err, response) {
                if (err) {
                    console.error("Throw error :::", err);
                    return res.sendStatus(500);
                }
                // 4. Return a success response to the client
                transaction.payment_method = response.body.payer.payment_method;
                transaction.id =  response.body.id;
                transaction.create_time =  response.body.create_time;
                transaction.payer_info = response.body.payer.payer_info;
                transaction.currency = response.body.transactions[0].amount.currency;
                mongo_funcs.insertMongoDB(_paymentsCollection, transaction);

                console.log("Transaction information ::", response.body.payer.payment_method, response.body.id, response.body.create_time,
                    response.body.payer.payer_info, response.body.transactions[0].amount.total,
                    response.body.transactions[0].amount.currency);
                
                    res.json(
                    {
                        status: 'success',
                    });
            });
    });

/////////////////////////////////////END PAYPAL PAYMENT//////////////////////////////////
const port = process.env.PORT || 5000;

app.listen(port,function(){
   console.log(`My project P0 running at port ${port}`);
});
