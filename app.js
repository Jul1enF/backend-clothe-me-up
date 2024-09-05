require('dotenv').config()
require('./models/connection')
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var articlesRouter = require('./routes/articles');
var boRouter = require('./routes/bo')
var cartRouter = require('./routes/cart')
var modificationRouter = require('./routes/modification')
var ordersRouter = require('./routes/orders')
var deliveriesRouter = require('./routes/deliveries')

var app = express();
const cors = require('cors')
app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/articles', articlesRouter);
app.use('/bo', boRouter)
app.use('/cart', cartRouter)
app.use('/modification', modificationRouter)
app.use('/orders', ordersRouter)
app.use('/deliveries', deliveriesRouter)

module.exports = app;
