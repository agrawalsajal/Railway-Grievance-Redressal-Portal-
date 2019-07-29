var mongoose = require("mongoose");

var stationSchema = new mongoose.Schema({
	stationId : {type: String, unique: true, required: true},
	stationName: {type: String, unique: true, required: true}
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

module.exports = mongoose.model("Station", stationSchema);