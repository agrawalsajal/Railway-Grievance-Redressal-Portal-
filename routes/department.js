var express = require("express");
var router = express.Router({mergeParams : true});
var Dept = require("../models/dept");
var Complaint = require("../models/complaint");
var Employee = require("../models/employee");
var Train = require("../models/train");
var Station = require("../models/station");
var async = require("async")
var randomColor = require('randomcolor');
var middlePlot = require("../middleware/plot")


function plotDeptData(depts, callback){
	var dname = [];
	var noe = [];
	var color = randomColor({count: depts.length});
	var noc = [];

	var promises = depts.map(function(dept){
		var dId = dept._id;
		dId = dId.toString();
		return new Promise(function(resolve){
			Complaint.find({})
			.where("department.id").equals(dId)
			.exec(function(err, comps){
				if(err){
					console.log(err);
				} else{
					dname.push(dept.deptName);
					noe.push(dept.noOfEmployee);
					noc.push(comps.length);
					// console.log(noc);
					// console.log(Date.now())
					resolve(comps);

				}
			})
		})
	})

	Promise.all(promises).then(function(result){
		// console.log(result)
		// console.log(noc);
		// console.log(noe);
		// console.log(dname);
		// console.log("====",Date.now());
		callback(dname,noe,color,noc)
	})
}

router.get("/", function(req, res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Dept.find({deptName: regex}, function(err, depts){
			if(err){
				console.log(err);
			} else{
				if(depts.length < 1){
					// console.log("no complaints");
					req.flash("error", "No such department found searh again !!!")
					res.redirect("/dept");
				} else{
					plotDeptData(depts, function(dname, noe, color, noc){
						res.render("dept/index", {depts:depts, dname:dname, noe:noe, color1:color, noc:noc});
					})
				}
			}
		})
	} else{
		Dept.find({}, function(err, depts){
			if(err){
				console.log(err);
			} else{
				plotDeptData(depts, function(dname, noe, color, noc){
					res.render("dept/index", {depts:depts, dname:dname, noe:noe, color1:color, noc:noc});
				})			
			}
		})
	}
})

router.post("/", function(req, res){
	Dept.create(req.body.dept, function(err, dept){
		if(err){
			console.log(err);
		} else{
			// console.log(dept);
			res.redirect("/dept");
		}
	})
})

router.get("/new", function(req, res){
	res.render("dept/new");
})

router.get("/:id", function(req, res){
	Dept.findById(req.params.id, function(err, dept){
		if(err){
			console.log(err);
		} else{
			var dId = dept._id;
			dId = dId.toString();
			var cskip = (req.query.cpage)*3 >=0 ? (req.query.cpage)*3 :0;
			var eskip = (req.query.epage)*3 >=0 ? (req.query.epage)*3 :0;

			// console.log(req.query.cpage); 		
			// console.log(typeof(req.query.cpage)); 		
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('department.id').equals(dId)
					.skip(cskip)
					.limit(3)
					.exec(function(err, complaints){
						if(err){
							console.log(err);
						} else{
							callback(null, complaints);
						}
					})
				},
				function(callback){
					Employee.find({})
					.where('department.id').equals(dId)
					.skip(eskip)
					.limit(3)
					.exec(function(err, employees){
						if(err){
							console.log(err);
						} else{
							callback(null, employees);
						}
					})
				},
				function(callback){
					Complaint.find({})
					.where('department.id').equals(dId)
					.exec(function(err, comps){
						if(err){
							console.log(err);
						} else{
							middlePlot.plot1(comps, function(stat, regSum, resSum){
								callback(null, comps, stat, regSum, resSum);
							})
						}
					})
				}
			], function(err, result){
				// console.log("month1 is ",result[2][1])
				// console.log("month2 is ",result[2][2])
				res.render("dept/show", {dept:dept, complaints:result[0], 
										employees:result[1], allComps:result[2][0], 
										stat: result[2][1], regSum: result[2][2],
										resSum : result[2][3]
									});
			})	
		}
	})
})

router.get("/:id/edit", function(req, res){
	Dept.findById(req.params.id, function(err, dept){
		if(err){
			console.log(err)
		} else{
			res.render("dept/edit", {dept:dept})
		}
	})
})

router.put("/:id", function(req, res){
	Dept.findByIdAndUpdate(req.params.id, req.body.dept, function(err, dept){
		if(err){
			console.log(err);
		} else{
			// console.log(dept);
			// console.log(req.body);
			// eval(locus);
			if( !(req.body.oldDeptName === req.body.dept.deptName) ){
				// console.log("reached in ");
				var dId = dept._id
				dId = dId.toString()
				// console.log(dId);
				async.parallel([
					function(callback){
						Complaint.find({})
						.where('department.id').equals(dId)
						.exec(function(err, comps){
							if(err){
								console.log(err)
							} else{
								// console.log(comps)
								// if(comps && )
								var promises = comps.map(function(comp){
									return new Promise(function(resolve){
										comp.department.deptName = req.body.dept.deptName
										comp.save()
										resolve()
									})
								})

								Promise.all(promises).then(function(result){
									callback(null, 'one')
								})
							}
								
						})
					},
					function(callback){
						Employee.find({})
						.where('department.id').equals(dId)
						.exec(function(err, emps){
							if(err){
								console.log(err);
							} else{
								// console.log(emps);
								var promises = emps.map(function(emp){
									return new Promise(function(resolve){
										emp.department.deptName = req.body.dept.deptName
										emp.save()
										resolve()
									})
								})

								Promise.all(promises).then(function(result){
									callback(null, 'one')
								})
							}
								
						})
					}
				], function(err, result){
					res.redirect("/dept/"+req.params.id);
				})
			} else{
				res.redirect("/dept/"+req.params.id);
			}
		}
	})
})

router.delete("/:id", function(req, res){	
	Dept.findById(req.params.id, function(err, dept){
		if(err){
			console.log(err);
		} else{
			var dId = dept._id
			dId = dId.toString()
			// console.log(dId);
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('department.id').equals(dId)
					.exec(function(err, comps){
						if(err){
							console.log(err)
						} else{
							// console.log(comps)
							// if(comps && )
							var promises = comps.map(function(comp){
								return new Promise(function(resolve){
									comp.department.id = null
									comp.save()
									resolve()
								})
							})

							Promise.all(promises).then(function(result){
								callback(null, 'one')
							})
						}
							
					})
				},
				function(callback){
					Employee.find({})
					.where('department.id').equals(dId)
					.exec(function(err, emps){
						if(err){
							console.log(err);
						} else{
							// console.log(emps);
							var promises = emps.map(function(emp){
								return new Promise(function(resolve){
									emp.department.id = null;
									emp.save()
									resolve()
								})
							})

							Promise.all(promises).then(function(result){
								callback(null, 'one')
							})
						}
							
					})
				}
			], function(err, result){
				dept.remove();
				res.redirect("/dept");
			})
		}
	})
})







function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;