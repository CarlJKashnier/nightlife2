var User = require('./users.js');
var mongo = require('mongodb');
var Yelp = require('yelp');
require('./passport.js');

module.exports = function(app, passport) {


  app.get('/', function(req, res){
    res.render('index.ejs', {
        user: req.user,
    });
  });

  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback',
      passport.authenticate('facebook', {
          successRedirect: '/',
          failureRedirect: '/'
      }));

      app.get('/logout', function(req, res) {
          req.logout();
          res.redirect('/');
      });

};


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}
