var mongoose = require("mongoose");

var complaintSchema = new mongoose.Schema({
	title : {type:String, required:true},
	desc : {type:String, required:true},
	image : String,
	// complaintType: {type:String, required:true},
	// complaintTypeId: {type:String, required:true},
	complaintType: String,
	complaintTypeId: String,
	status : {type:Number, default: 1},
	dateReg: { type: Date, default: Date() },
	dateFinish: Date,
	complainer: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
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
	},
	resolver: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Employee"
		},
		username: String
	}
})

module.exports = mongoose.model("Complaint", complaintSchema);