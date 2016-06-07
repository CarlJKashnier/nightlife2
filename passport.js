var FacebookStrategy = require('passport-facebook').Strategy;
var User = require("./users.js");
//var configAuth = require("./auth")

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new FacebookStrategy({
            clientID: process.env.facebook_api_key,
            clientSecret: process.env.facebook_api_secret,
            callbackURL: 'https://warm-sands-51936.herokuapp.com/auth/facebook/callback'
        },

        function(accessToken, refreshToken, profile, callback) {
            process.nextTick(function() {
                User.findOne({
                    'facebook.id': profile.id
                }, function(err, user) {
                    if (err)
                        return callback(error);
                    if (user)
                        return callback(null, user);
                    else {
                        var newUser = new User();
                        //console.log(profile);
                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = accessToken;
                        newUser.facebook.name = profile.displayName;
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return callback(null, newUser);
                        });
                    }
                });
            });
        }));
};
