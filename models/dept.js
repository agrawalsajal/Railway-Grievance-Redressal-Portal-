var mongoose = require("mongoose");

var deptSchema = new mongoose.Schema({
	deptName : {type:String, required:true, unique:true},
	deptId : {type:String, required:true, unique:true},
	noOfEmployee: {type: Number, default:0},
	load: {type: Number, default: 0}
})

module.exports = mongoose.model("Department", deptSchema);