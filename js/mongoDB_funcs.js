
const mongoClient = require('mongodb').MongoClient;
//const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const _mongoUrl = process.env.mongoDB_URI;

//const _mongoUrl = "mongodb+srv://luan:12345abcdE@cluster0.jgfni.mongodb.net/myproject?retryWrites=true&w=majority";

const _db = "myproject"; // database of the project
const _usersCollection = "users" // users collection
const _itemFetchCollection = "items_fetch";
const _itemGraphCollection = "items_graph";
const _shoppingCollection = "shopping";

async function insertMongoDB(_collection, _object) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_collection).insertOne(_object, function (err, res) 
        {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        
        });
    });
}

async function deleteFetchMongoDB(_email, _url) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_itemFetchCollection).deleteOne({ email: _email, url: _url }, function (err, res) {
            if (err) throw err;
            console.log("1 document deleted ");
            db.close();
        });
    });
}

async function deleteItemShopMongoDB(_filter) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_shoppingCollection).deleteOne(_filter, function (err, res) {
            if (err) throw err;
            console.log("1 item removed from shop ");
            db.close();
        });
    });
}

async function deleteGraphMongoDB(_url) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_itemFetchCollection).deleteOne({ url: _url }, function (err, res) {
            if (err) throw err;
            console.log("1 document deleted ");
            db.close();
        });
    });
}

async function updatePriceDateMongoDB(_collection, _url, _priceDate) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_collection).updateOne({url: _url} , { $push: {price_date_Arr: {_priceDate}}}, function (err, res) {
            if (err) throw err;
            console.log("price & date added ");
            db.close();
        });
    });
}

async function insertArrayMongoDB(_collection, _objectArray) {
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_collection).insertMany(_objectArray, function (err, res) {
            if (err) throw err;
            console.log(" documentArray inserted");
            db.close();
        });
    });
}


async function checkUrlMongoDB(_collection, _url){
     return await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        var result;
        console.log('url before check db', _url);
        dbo.collection(_collection).findOne({ url: _url }, function (err, res) {
            if (err) throw err;
            console.log('checkUrl: ', res);
            if (!res || res.length == 0) {
                console.log("no url found");
                db.close();

                result = false;
            }
            else {
                console.log("1 url found");
                db.close();

                result = true;
            }
        })
        return result;
    })
}

async function insertFetchedItem(_collection, _item){
    if (checkUrlMongoDB(_collection,_item.url) == false) {
        insertMongoDB(_collection, _item);
    }
    else {
        console.log('Item existed in database');
    }
}

async function querySavedItemsMongoDB(_collection, _email) { //check if item (url) exist in DB and insert if not exist
    await mongoClient.connect(_mongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db(_db);
        dbo.collection(_collection).find({ email: _email }).toArray(function (err, records) {
            if (err) throw err;
    
            if (!records || records == null || records.length === 0) {
                console.log("values send to monitor.pug is NULLLLLLL ", _email);
                db.close();
                return false;
                //res.render('monitor', { listItems: false, logged: req.session.isAuth, email: req.session.email })
            } else {
                records.map(function (record, index) {
                    record.pos = index;
                    //console.log(record.date);
                    let rawDate = new Date(record.date);
                    let displaydate = rawDate.getDate() + '/' + (rawDate.getMonth() + 1) + '/' + rawDate.getFullYear() + '\n' + rawDate.getHours() + ':' + rawDate.getMinutes();
                    //console.log(displaydate);
                    record.date = displaydate;
                    //console.log(record.date);
                    if (record.saving) {
                        let lens = record.saving.length;
                        let lenp = record.price.length;
                        //console.log("Price origin : ", record.price,'/' ,record.price.slice(1, lenp));
                        //console.log("Saving origin : ", record.saving, '/', record.saving.slice(6, lens));
                        record.price_list = '$' + (parseFloat(record.price.slice(1, lenp)) + parseFloat(record.saving.slice(6, lens))).toString();
                        //console.log("Price listed after parsed  ", record.price_list);
                    }
                    else {
                        if (record.price_list) {
                            //console.log("Price list before:  ", record.price_list);
                            let len = record.price_list.length;
                            //console.log("Parsed::: ", parseFloat(record.price_list.slice(2, len)));
                            record.price_list = '$' + parseFloat(record.price_list.slice(2, len)).toString();
                            //console.log("Price listed after parsed  ", record.price_list);
                        }
                    }

                })
                db.close();
                console.log("values send to monitor.pug :::::::: ", _email , '\n', records);
                return records;
                //res.render('monitor', { listItems: records, logged: _isAuth, email: _email });
            }
        });
    });
}


// queryShopMongoDB query all the items in the shop collection to display to manageshop.pug 

async function queryReturnItemMongoDB(_collection, _url) {
     await mongoClient.connect(_mongoUrl, async function (err, db) {
        if (err)
            throw err;
        var dbo = await db.db(_db);
        //console.log('url to check db', _url);
        await dbo.collection(_collection).findOne({ url: _url }, function (err, item) {
             if (err)
                 throw err;
             if (!item || item == null) {
                 console.log("no item found");
                 db.close();
                 return ;
             }
             else {
                console.log("1 item found, now insert to shop");
                db.close();
                item.visible = false;
                console.log(item);
                insertMongoDB("shopping", item);
             }
         });
    })}

/*
async function queryReturnItemMongoDB(_collection, _filter) {
    await mongoose.connect(_mongooseUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    var db = await mongoose.connection;
    await db.on('error', console.error.bind('MongoDB connection error !'));
    var Schema = mongoose.Schema;
    var item = new Schema({
        url: { Type: String },
        email: { Type: String },
        category: { Type: String },
        img_src: { Type: String },
        title: { Type: String },
        price: { Type: Number },
        date: { Type: Number },
        price_list: { Type: Number },
        visible: { Type: Boolean }
    });

    console.log(_collection);
    console.log(_filter);

    const itemModel =  mongoose.model(_collection, item);

    var myData = new itemModel({
        url: 'test',
        email: 'test',
        category: 'test',
        img_src: 'test',
        title: 'test',
        price: 'test',
        date: 111,
        price_list: 122,
        visible: true
    });

     myData.save( (err) => {
        if (err) console.log(err);
    });

    await itemModel.find(_filter, 'url email category img_src title price date price_list visible' , (err, result) => {
        if (err) throw err;
        console.log(result);
        return result;
    });
}
*/


module.exports =
{
    insertMongoDB,
    insertArrayMongoDB,
    checkUrlMongoDB,
    insertFetchedItem,
    deleteFetchMongoDB,
    deleteGraphMongoDB,
    querySavedItemsMongoDB,
    queryReturnItemMongoDB,
    deleteItemShopMongoDB
};
