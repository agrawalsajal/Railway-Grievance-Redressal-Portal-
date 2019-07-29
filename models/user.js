var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');

var userSchema = new mongoose.Schema({
	username : {type: String, unique: true, required: true},
	email :{type: String, unique: true, required: true},
	name : {type: String, required: true},
	userType: {type: String, default:"user"},
	password : {type: String, required: true},
	resetPasswordToken: String,
    resetPasswordExpires: Date,
})

module.exports = mongoose.model("User", userSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
