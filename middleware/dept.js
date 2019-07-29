var Dept = require("../models/dept");

var deptObj = {}

deptObj.findAllDepts = function(callback){
	Dept.find({}, function(err, depts){
		if(err){
			console.log(err);
		} else{
			callback(depts)
		}
	})
}

module.exports = deptObj; 