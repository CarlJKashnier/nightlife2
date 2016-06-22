var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    local: {
        username: String,
        password: String
    },
    facebook: {
        id: String,
        token: String,
        name: String
    },
    places:{
      tonight: Array,
    }
});

module.exports = mongoose.model('user', userSchema);
