var User = require('./users.js');
var mongo = require('mongodb');
var Yelp = require('yelp');
require('./passport.js');

module.exports = function(app, passport) {
  var yelp = new Yelp({
    consumer_key: process.env.yelpConsumerKey,
    consumer_secret: process.env.yelpConsumerSecret,
    token: process.env.yelpToken,
    token_secret: process.env.yelpTokenSecret,
  });

  app.get('/', function(req, res){
    res.render('index.ejs', {
        user: req.user,
    });
  });

/*
yelp.search({ term: 'Bar', location: 'Cleveland' })
.then(function (data) {
  res.send(data);
})
.catch(function (err) {
  //console.error(err);
}
);
*/



};
