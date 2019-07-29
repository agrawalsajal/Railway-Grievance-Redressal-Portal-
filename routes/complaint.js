var express = require("express");
var router = express.Router({mergeParams : true});
var Complaint = require("../models/complaint")
var Employee = require("../models/employee")
var Dept = require("../models/dept")
var Train = require("../models/train")
var Station = require("../models/station")
var async = require("async")
var nodemailer = require("nodemailer");
var middleware = require("../middleware/index")
var middleDept = require("../middleware/dept")
var middlePlot = require("../middleware/plot")
var locus = require("locus")


function findCompByTitle(title1, callback){
	Complaint.find({title: title1})
    .sort({status: 1})
	.exec(function(err, complaints){
		if(err){
			console.log(err);
		} else{
			callback(complaints);		
		}
	})
}

router.get("/", function(req, res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');

		findCompByTitle(regex, function(complaints){
			if(complaints.length < 1){
				console.log(complaints);
				req.flash("error", "No such complaint found searh again !!!")
				res.redirect("/complaint");
			} else{
				middlePlot.plot1(complaints, function(stat, regSum, resSum){
					res.render("complaint/index", {complaints:complaints, stat:stat, 
											regSum:regSum, resSum:resSum});
				})
			}
		})
	} else{
		Complaint.find({})
		.sort({status: 1})
		.exec(function(err, complaints){
			if(err){
				console.log(err);
			} else{
				middlePlot.plot1(complaints, function(stat, regSum, resSum){
					res.render("complaint/index", {complaints:complaints, stat:stat, 
											regSum:regSum, resSum:resSum});
				})	
			}
		})
	}
	
})

router.get("/new", function(req, res){
	async.parallel([
		function(callback){
			middleDept.findAllDepts(function(depts){
				callback(null, depts)
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
			res.render("complaint/new", {depts:result[0], trains:result[1], stations:result[2]});
		}
	})
})

router.post("/", function(req, res){
	Complaint.create(req.body.complaint, function(err, complaint){
		if(err){
			console.log(err);
		} else {
			async.parallel([
				function(callback){
					Dept.findOne({deptName: req.body.deptName}, function(err, dept){
						if(err){
							console.log(err);
						} else{
							complaint.department.id = dept._id;
							complaint.department.deptName = dept.deptName;
							callback(null, dept);
						}
					})
				},
				function(callback){
					if(req.body.complaint.complaintType === "train"){
						Train.findOne({trainId: req.body.complaint.complaintTypeId}, function(err, train){
							if(err){
								console.log(err);
							} else{
								complaint.train.id = train._id;
								complaint.train.trainId = train.trainId;
								callback(null, train);
							}
						})
					} else{	
						Station.findOne({stationId: req.body.complaint.complaintTypeId}, function(err, station){
							if(err){
								console.log(err);
							} else{
								complaint.station.id = station._id;
								complaint.station.stationId = station.stationId;
								callback(null, station);
							}
						})	
					}
				},
				function(callback){
					var dName = req.body.deptName;
					Employee.find({
						dutyType: req.body.complaint.complaintType,
						dutyId: req.body.complaint.complaintTypeId
					 })
					.where('department.deptName').equals(dName)
					.sort({noOfCurrentComplaints:1})
					.exec(function(err, emp){
						if(err){
 							console.log(err);
						} else{
							complaint.resolver.id = emp[0]._id;
							complaint.resolver.username = emp[0].username;
							callback(null, 'one');
						}
					 })
				}		
			], function(err, result){
				if(err){
					console.log(err);
				} else{
					// complaint.complainer.id = req.user._id;
					// complaint.complainer.username = req.user.username;
					// var smtpTransport = nodemailer.createTransport({
				 //    service: 'Gmail', 
				 //    auth: {
					//       user: 'study.agrawal@gmail.com',
					//       pass: process.env.GMAILPW
					//     }
					//   });
					//   var mailOptions = {
					//     to: req.user.email,
					//     from: 'study.agrawal@gmail.com',
					//     subject: 'A complaint has been made',
					//     text: 'You are receiving this because you (or someone else) have registed a complaint..\n\n' +
					//       'Please click on the following link, or paste this into your browser to track your complaint:\n\n' +
					//       'http://' + req.headers.host + '/complaint/'+complaint._id + '\n\n' +
					//       'If you did not request this, please ignore this email.\n'
					//   };
					//   smtpTransport.sendMail(mailOptions, function(err) {
					//     console.log('mail sent');
					//     req.flash('success', 'An e-mail has been sent to ' + req.user.email + ' for tracking complaint.');
					//     done(err, 'done');
					//   });
					complaint.save()
					req.flash("success", "complaint registered successfully");
					res.redirect("/");
				}
			})
		}
	})	
})

router.get("/:id", function(req, res){
	Complaint.findById(req.params.id, function(err, complaint){
		if(err){
			console.log(err);
		} else{
			res.render("complaint/show", {complaint:complaint});
		}
	})
})

router.get("/:id/edit", function(req, res){
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
		},
		function(callback){
			Employee.find({}, function(err, employees){
				if(err){
					console.log(err);
				} else{
					callback(null, employees);
				}
			})
		},
		function(callback){
			Complaint.findById(req.params.id)
			.populate('resolver.id')
			.exec(function(err, comp){
				if(err){
					console.log(err);
				} else{
					callback(null, comp)
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
			
			res.render("complaint/edit", 
				{
					complaint:result[4],
					depts:result[0], 
					trains:result[1], 
					stations:result[2],
					employees:result[3]
				}
			);
			
		}
	})
	
})

router.put("/:id", function(req, res){
	async.parallel([
		function(callback){
			Dept.findOne({deptName: req.body.deptName}, function(err, dept){
				if(err){
					console.log(err);
				} else{
					req.body.complaint.department = {};
					req.body.complaint.department.id = dept._id;
					req.body.complaint.department.deptName = dept.deptName;
					callback(null, dept);
				}
			})
		},
		function(callback){
			if(req.body.complaint.complaintType === "train"){
				Train.findOne({trainId: req.body.complaint.complaintTypeId}, function(err, train){
					if(err){
						console.log(err);
					} else{
						req.body.complaint.train = {};
						req.body.complaint.train.id = train._id;
						req.body.complaint.train.trainId = train.trainId;
						callback(null, train);
					}
				})
			} else if(req.body.complaint.complaintType === "station"){	
				Station.findOne({stationId: req.body.complaint.complaintTypeId}, function(err, station){
					if(err){
						console.log(err);
					} else{
						req.body.complaint.station = {};
						req.body.complaint.station.id = station._id;
						req.body.complaint.station.stationId = station.stationId;
						callback(null, station);
					}
				})	
			}
		}
		,
		function(callback){
			// console.log(req.body);
			// eval(locus);
			var dName = req.body.deptName;
			Employee.findOne({username: req.body.resolverUsername}, function(err, emp){
				if(err){
						console.log(err);
				} else{
					// console.log("1");
					req.body.complaint.resolver = {};
					req.body.complaint.resolver.id = emp._id;
					req.body.complaint.resolver.username = emp.username;
					if( emp._id.toString() === req.body.oldEmployee){
						// console.log("2");
						if( req.body.complaint.status != req.body.oldStatus && req.body.complaint.status === "4"){
								// console.log("3");
							emp.noOfSolvedComplaints += 1;
							emp.noOfCurrentComplaints -= 1;
							emp.save();

						}
						callback(null, 'one');
					} else{
						// console.log("4");
						Employee.findById(req.body.oldEmployee, function(err, empOld){
							if(err){
								console.log(err)
							} else{
								// console.log("5");

								if( req.body.complaint.status === req.body.oldStatus ){
									// console.log("6");
									if(req.body.complaint.status === "4"){
										// console.log("7");
										empOld.noOfSolvedComplaints -= 1;
										emp.noOfSolvedComplaints += 1;
									} else{
										// console.log("8");
										empOld.noOfCurrentComplaints -= 1;
										emp.noOfCurrentComplaints += 1;
									}
								} else{
									// console.log("9");
									if(req.body.complaint.status === "4"){
										// console.log("10");
										empOld.noOfCurrentComplaints -= 1;
										emp.noOfSolvedComplaints += 1;
									} else{
										// console.log("11");
										empOld.noOfCurrentComplaints -= 1;
										emp.noOfCurrentComplaints += 1;
									}
								}
								// console.log("12");
								emp.save()
								empOld.save()
								callback(null, 'one');
							}
						})
						
					}
					// if(req.body.complaint.status == 4){
					// 	emp.noOfSolvedComplaints += 1;
					// 	emp.save()
					// 	console.log("updated no of solved comps ",emp.noOfSolvedComplaints);
					// } else{
					// 	emp.noOfCurrentComplaints += 1;
					// 	emp.save();
					// 	console.log("updated no of current comps ",emp.noOfCurrentComplaints);
					// }

					
				}
			 })
		}		
	], function(err, result){
		if(err){
			console.log(err);
		} else{
			Complaint.findByIdAndUpdate(req.params.id, req.body.complaint, function(err, comp){
				if(err){
					console.log(err);
				} else{

					// comp.complainer.id = req.user._id;
					// comp.complainer.username = req.user.username;
					// var smtpTransport = nodemailer.createTransport({
				 //    service: 'Gmail', 
				 //    auth: {
					//       user: 'study.agrawal@gmail.com',
					//       pass: process.env.GMAILPW
					//     }
					//   });
					//   var mailOptions = {
					//     to: req.user.email,
					//     from: 'study.agrawal@gmail.com',
					//     subject: 'Status of the complaint',
					//     text: 'You are receiving this because you (or someone else) have registed a complaint..\n\n' +
					//       'Please click on the following link, or paste this into your browser to track your complaint:\n\n' +
					//       'http://' + req.headers.host + '/complaint/'+comp._id + '\n\n' +
					//       'If you did not request this, please ignore this email.\n'
					//   };
					//   smtpTransport.sendMail(mailOptions, function(err) {
					//     console.log('mail sent');
					//     req.flash('success', 'An e-mail has been sent to ' + req.user.email + ' for tracking complaint.');
					//     done(err, 'done');
					//   });

					// console.log(comp);
					if(req.body.complaint.status == 4){
						comp.dateFinish = new Date();
						comp.save()
						// console.log(comp);
						res.redirect("/complaint");
					} else{
						res.redirect("/complaint");
					}	
				}
			})
		}
	})
	
})

router.delete("/:id", function(req, res){
	Complaint.findById(req.params.id)
	.populate("resolver.id")
	.exec(function(err, comp){
		if(err){
			console.log(err);
			req.flash("error", "complaint can not be deleted")
			res.redirect("/complaint");
		} else{
			if(comp.status < 4){
				// console.log(comp)
				comp.resolver.id.noOfCurrentComplaints -= 1;
				// console.log(comp)
				comp.resolver.id.save()
				// console.log(comp.resolver.id)
				comp.remove()
				// console.log(comp);
				req.flash("success", "deleted complaint successfully");
				res.redirect("/complaint");
			} else{
				comp.resolver.id.noOfSolvedComplaints -= 1;
				// console.log(comp)
				comp.resolver.id.save()
				// console.log(comp.resolver.id)
				comp.remove()
				// console.log(comp);
				req.flash("success", "deleted complaint successfully");
				res.redirect("/complaint");
				// req.flash("error", "The complaint is already resolved thus can not be deleted")
				// res.redirect("/complaint");
			}
			
		}
	})
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;