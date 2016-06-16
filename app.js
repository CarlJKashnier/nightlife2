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
//Keeps track of last Search
var sess;

var yelp = new Yelp({
  consumer_key: process.env.yelpConsumerKey,
  consumer_secret: process.env.yelpConsumerSecret,
  token: process.env.yelpToken,
  token_secret: process.env.yelpTokenSecret,
});

server.listen(process.env.PORT||8888);
console.log('Running Server: ' + process.env.PORT || 8888);
mongoose.connect(process.env.MONGOLAB_URI);
//Debugging

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));

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

//Passport for log in
app.use(passport.initialize());
//Passport to select session
app.use(passport.session());
//A routes file for all the various routes
require('./routes.js')(app, passport);
//Allow logins
require('./passport.js')(passport);
app.set('view engine', 'ejs');;
app.use(express.static('public'));

io.on('connection', function(socket) {
    socket.on('chat message', function(msg) {
      var clientID = socket.id;
      yelp.search({ term: 'Bar', location: msg })
      .then(function (data) {
        io.to(clientID).emit('yelp stuff',data);
      })
      .catch(function (err) {
        //console.error(err);
      }
      );
    });
});
