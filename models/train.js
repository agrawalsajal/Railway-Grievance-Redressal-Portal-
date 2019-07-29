var mongoose = require("mongoose");

var trainSchema = new mongoose.Schema({
	trainId : {type: String, unique: true, required: true},
	trainName: {type: String, unique: true, required: true}
	// ,
	// employee: [{
	// 	id: {
	// 		type: mongoose.Schema.Types.ObjectId,
	// 		ref: "Employee"
	// 	},
	// 	username: String
	// }],
	// complaint: [{
	// 	id: {
	// 		type: mongoose.Schema.Types.ObjectId,
	// 		ref: "Complaint"
	// 	},
	// 	title: String
	// }]
})

module.exports = mongoose.model("Train", trainSchema);