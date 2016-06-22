var dotenv = require('dotenv').config();
var express = require('express');
var app = express();
var passport = require('passport');
var mongoose = require('mongoose');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongostore')(session);
var mongo = require('mongodb');
var morgan = require('morgan');
var http = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Yelp = require('yelp');
var async = require('async');
var returnedData = {};
var dataToReturnCount = 0;
//Keeps track of last Search

var yelp = new Yelp({
    consumer_key: process.env.yelpConsumerKey,
    consumer_secret: process.env.yelpConsumerSecret,
    token: process.env.yelpToken,
    token_secret: process.env.yelpTokenSecret,
});

server.listen(process.env.PORT || 8888);
console.log('Running Server: ' + process.env.PORT || 8888);
mongoose.connect(process.env.MONGOLAB_URI);
//Debugging

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());
//Save Session in DB not memory -- Heroku gives nasty warnings about memory plus the users are logged out everyday during the server's sleep phase if you don't buy a dedicated dyno
app.use(session({
    cookie: {
        maxAge: 691200000
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    secret: 'anystringoftext',
    saveUninitialized: true,
    resave: true
}));
app.use(express.static('public'));
//Passport for log in
app.use(passport.initialize());
//Passport to select session
app.use(passport.session());

//Allow logins
require('./passport.js')(passport);
app.set('view engine', 'ejs');


io.on('connection', function(socket) {
    console.log("A User Connected");
    socket.on('chat message', function(msg) {
        console.log("A search");
        var clientID = socket.id;
        yelp.search({
                term: 'Bar',
                location: msg
            })
            .then(function(data) {
              returnedData = {};
                var preparedData = renderData(data, clientID);
                //console.log(prepairedData);
                //io.to(clientID).emit('yelp stuff',data);
            })
            .catch(function(err) {
                console.error(err);
            });
    });

    socket.on('going', function(msg) {
        console.log("An update: " + msg);
/*
        var clientID = socket.id;
        yelp.search({
                term: 'Bar',
                location: msg
            })
            .then(function(data) {
              returnedData = {};
                var preparedData = renderData(data, clientID);
                //console.log(prepairedData);
                //io.to(clientID).emit('yelp stuff',data);
            })
            .catch(function(err) {
                console.error(err);
            });
*/
    });
});

//A routes file for all the various routes
require('./routes.js')(app, passport);

function renderData(data, clientID) {
    console.log("in render");
    var relevantData = data.businesses;
    dataToReturn = relevantData;
    //console.log('relevantData',relevantData);
    var i = 1;
    var dataToReturnCount = 1;
    for (var prop in relevantData) {
        findDataAndReturn(relevantData[prop].name, relevantData[prop].phone, relevantData[prop].rating, relevantData[prop].snippet_text, relevantData[prop].image_url, clientID, i);
        console.log(i);
        i++;
    }

}


function findDataAndReturn(name, phone, rating, description, image, clientID, idnum) {
    console.log("in find and return");
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        db.collection("nla").findOne({
            "phone": phone
        }, function(err, result) {
            if (result === null) {

                returnedData["id-"+ idnum] = {"name":name, "phone":phone, "rating":rating, "description":description, "image":image, "count": 0};
                dataToReturnCount++;
                console.log(dataToReturnCount + ":" + dataToReturn.length);
                if (dataToReturnCount >= dataToReturn.length) {
                    io.to(clientID).emit('yelp stuff', returnedData);
                    returnedData = {};
                    dataToReturnCount= 0;
                    console.log("should be found");

                }


            } else {

                returnedData["id-"+ idnum] = {"name":name, "phone":phone, "rating":rating, "description":description, "image":image, "count":result.count};
                dataToReturnCount++;
                console.log(dataToReturnCount + ":" + dataToReturn.length);
                if (dataToReturnCount >= dataToReturn.length) {
                    io.to(clientID).emit('yelp stuff', returnedData);
                    returnedData = {};
                    dataToReturnCount= 0;
                    console.log("should be found");

                }

            }
        });
    });
}
