var express = require("express");
var router = express.Router({mergeParams : true});
var User = require("../models/user");
var Dept = require("../models/dept");
var Train = require("../models/train");
var Station = require("../models/station");
var Employee = require("../models/employee");
var Complaint = require("../models/complaint");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var bcrypt = require('bcryptjs');

router.get("/", function(req, res){
	// Complaint.find({}).populate("resolver.id").exec(function(err, comps){
	// 	if(err){
	// 		console.log(err);
	// 	} else{
	// 		// console.log(comps.length);
	// 		for(var i=0;i<comps.length;){
	// 			console.log("=========="+i+"=========")
	// 			// console.log(comps[i].resolver.id)
	// 			if(comps[i].resolver.id){

	// 				comps[i].resolver.id.noOfCurrentComplaints += 1;
	// 				comps[i].resolver.id.save();
	// 				// comps[i].save();
					
	// 				console.log(comps[i].title);
				
	// 			}
	// 			i=i+1;
	// 		}
	// 		// comps.forEach(function(comp){
	// 		// 	comp.resolver.id.noOfCurrentComplaints += 1;
	// 		// 	comp.resolver.id.save()
	// 		// 	console.log(comp.resolver);
	// 		// })

	// 	}
	// })
	res.render("index");
});


router.get("/userRegister", function(req, res){
	res.render("user/register");	
})

router.post("/userregister", function(req, res){
	
	var username = req.body.username;
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;

	req.checkBody('username', 'username is required').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render("user/register", {errors:errors});
	} else{
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password
		})

		User.createUser(newUser, function(err, user){
			if(err){
				console.log(err);
			} else{
				// console.log("user created");
				// console.log(user);
				req.flash("success", "registered as user successfully");
				res.redirect("/");
			}
		})
	}
	
});

router.get("/userLogin", function(req, res){
	res.render("user/login");
})


router.post("/userLogin", passport.authenticate("user", {
	successRedirect: "/",
	failureRedirect: "/userLogin",
	failureFlash: true
}), function(req, res){
	res.redirect("/");
})

router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out !!!");
   res.redirect("/");
});


// router.get("/user/del", function(req, res){
// 	res.render("user/delete");
// })

// router.post("/user/del", function(req, res){
// 	User.findOne({email: req.body.user.email}, function(err, user){
// 		if(err){
// 			console.log(err);
// 		} else{
// 			user.remove();
// 			req.flash("success", "removed a user");
// 			res.redirect("/adminRole");
// 		}
// 	})
// })

router.get("/employeeRegister", function(req, res){
	async.parallel([
		function(callback){
			Dept.find({}, function(err, depts){
				if(err){
					console.log(err);
				} else{
					callback(null, depts);
				}
			})
		},
		function(callback){
			Train.find({}, function(err, trains){
				if(err){
					console.log(err);
				} else{
					callback(null, trains);
				}
			})
		},
		function(callback){
			Station.find({}, function(err, stations){
				if(err){
					console.log(err);
				} else{
					callback(null, stations);
				}
			})
		}

	], function(err, result){
		if(err){
			console.log(err);
		} else{
			// console.log("============================");
			// console.log(result)
			// console.log("============================");
			res.render("employee/register", {depts:result[0], trains:result[1], stations:result[2]});
		}
	})
})

router.post("/employeeregister", function(req, res){
	var username = req.body.username;
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;

	req.checkBody('username', 'username is required').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render("employee/register", {errors:errors});
	} else{
		var newEmp = new Employee({
			name: name,
			email: email,
			username: username,
			password: password,
			dutyType: req.body.dutyType,
			dutyId: req.body.dutyId
		})

		Employee.createEmployee(newEmp, function(err, employee){
			if(err){
				console.log(err);
			} else{
				async.parallel([
					function(callback){
						Dept.findOne({deptName: req.body.deptName}, function(err, dept){
							if(err){
								console.log(err);
							} else{
								employee.department.id = dept._id;
								employee.department.deptName = dept.deptName;
								callback(null, dept);
							}
						})
					},
					function(callback){
						if(req.body.dutyType === "train"){
							Train.findOne({trainId: req.body.dutyId}, function(err, train){
								if(err){
									console.log(err);
								} else{
									employee.train.id = train._id;
									employee.train.trainId = train.trainId;
									callback(null, train);
								}
							})
						} else{	
							Station.findOne({stationId: req.body.dutyId}, function(err, station){
								if(err){
									console.log(err);
								} else{
									employee.station.id = station._id;
									employee.station.stationId = station.stationId;
									callback(null, station);
								}
							})	
						}
					}
				], function(err, result){
					if(err){
						console.log(err);
					} else{
						employee.save()
						req.flash("success", "registered as employee successfully");
						res.redirect("/");
					}
				})
			}
		})
	}
})


router.get("/employeeLogin", function(req, res){
	res.render("employee/login");
})

router.post("/employeeLogin", passport.authenticate("employee", {
	successRedirect:"/",
	failureRedirect:"/employeeLogin",
	failureFlash : true
}), function(req, res){

})


// router.get("/employee/del", function(req, res){
// 	res.render("employee/delete");
// })

// router.post("/employee/del", function(req, res){
// 	Employee.findOne({email: req.body.employee.email}, function(err, user){
// 		if(err){
// 			console.log(err);
// 		} else{
// 			employee.remove();
// 			req.flash("success", "removed an employee successfully");
// 			res.redirect("/adminRole");
// 		}
// 	})
// })


module.exports = router;