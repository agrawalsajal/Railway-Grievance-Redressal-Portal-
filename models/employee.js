var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');


var employeeSchema = new mongoose.Schema({
	email : {type: String, unique: true, required: true},
	username : {type: String, unique: true, required: true},
	name : {type: String, required: true},
	password : {type: String, required: true},
	noOfCurrentComplaints: {type:Number, default:0},
	noOfSolvedComplaints: {type:Number, default:0},
	adminCode : String,
	// dutyType: {type: String, required: true},
	// dutyId: {type: String, required: true},
	dutyType: String,
	dutyId: String,
	userType: {type:String, default:"employee"},
	isAdmin : {type:Boolean , default: false},
	resetPasswordToken: String,
    resetPasswordExpires: Date,
	department: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Department"
		},
		deptName: String
	},
	train: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Train"
		},
		trainId: String
	},
	station: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Station"
		},
		stationId: String
	}

})


module.exports = mongoose.model("Employee", employeeSchema);

module.exports.createEmployee = function(newEmp, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newEmp.password, salt, function(err, hash) {
	        newEmp.password = hash;
	        newEmp.save(callback);
	    });
	});
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
