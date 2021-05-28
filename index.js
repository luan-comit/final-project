const bodyParser = require('body-parser');
const express = require('express');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(express.static(__dirname + 'public'));

app.get('/', function (req, res) {
    res.render('index');
});

app.listen(5000, function () {
    console.log('My project app running at port 5000');
});