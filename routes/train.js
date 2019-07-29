var express = require("express");
var router = express.Router({mergeParams : true});
var Train = require("../models/train");
var Complaint = require("../models/complaint");
var Employee = require("../models/employee");
var randomColor = require("randomcolor")
var async = require("async")
var middlePlot = require("../middleware/plot")

function plotTrainData(trains, callback){
	var tname = [];
	var noe = [];
	var color = randomColor({count: trains.length});
	var noc = [];

	var promises = trains.map(function(train){
		var tId = train._id;
		tId = tId.toString();
		return new Promise(function(resolve){
			Complaint.find({})
			.where("train.id").equals(tId)
			.exec(function(err, comps){
				if(err){
					console.log(err);
				} else{
					Employee.find({})
					.where("train.id").equals(tId)
					.exec(function(err, emps){
						if(err){
							console.log(err);
						} else{
							tname.push(train.trainName);
							noc.push(comps.length);
							noe.push(emps.length);
							// console.log(noc);
							// console.log(Date.now())
							resolve(emps);
						}
					})
				}
			})
		})
	})

	Promise.all(promises).then(function(result){
		// console.log(result)
		// console.log(noc);
		// console.log(noe);
		// console.log(tname);
		// console.log("====",Date.now());
		callback(tname, noe, color, noc);
	})
}

router.get("/", function(req, res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Train.find({trainName: regex}, function(err, trains){
			if(err){
				console.log(err);
			} else{
				if(trains.length < 1){
					// console.log("no complaints");
					req.flash("error", "No such train found searh again !!!")
					res.redirect("/train");
				} else{
					plotTrainData(trains, function(tname, noe, color, noc){
						res.render("train/index", {trains:trains, tname:tname, noe:noe, color1:color, noc:noc});
					})	
				}
			}
		})
	} else{
		Train.find({}, function(err, trains){
			if(err){
				console.log(err);
			} else{
				plotTrainData(trains, function(tname, noe, color, noc){
					res.render("train/index", {trains:trains, tname:tname, noe:noe, color1:color, noc:noc});
				})
			}
		})
	}
})

router.get("/new", function(req, res){
	res.render("train/new");
})

router.post("/", function(req, res){
	Train.create(req.body.train, function(err, train){
		if(err){
			console.log(err);
		} else{
			// console.log(train);
			res.redirect("/train");
		}
	})
})

router.get("/:id", function(req, res){
	Train.findById(req.params.id, function(err, train){
		if(err){
			console.log(err);
		} else{
			var tId = train._id;
			tId = tId.toString();
			var cskip = (req.query.cpage)*3 >=0 ? (req.query.cpage)*3 :0;
			var eskip = (req.query.epage)*3 >=0 ? (req.query.epage)*3 :0;

			// console.log(req.query.cpage); 		
			// console.log(typeof(req.query.cpage)); 		
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('train.id').equals(tId)
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
					.where('train.id').equals(tId)
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
					.where('train.id').equals(tId)
					.exec(function(err, comps){
						if(err){
							console.log(err);
						} else{
							
							middlePlot.plot1(comps, function(stat, regSum, resSum){
								callback(null, comps, stat, regSum, resSum);
							})
							
						}
					})
				},
				function(callback){
					Employee.find({})
					.where('train.id').equals(tId)
					.exec(function(err, employees){
						if(err){
							console.log(err);
						} else{
							callback(null, employees);
						}
					})
				}
			], function(err, result){
				// console.log("month1 is ",result[2][1])
				// console.log("month2 is ",result[2][2])
				res.render("train/show", {train:train, complaints:result[0], 
										employees:result[1], allComps:result[2][0], 
										stat: result[2][1], regSum:result[2][2],
										resSum: result[2][3], allEmps: result[3]
									});
			})	
		}
	})
})

router.get("/:id/edit", function(req, res){
	Train.findById(req.params.id, function(err, train){
		if(err){
			console.log(err)
		} else{
			res.render("train/edit", {train:train})
		}
	})
})

router.put("/:id", function(req, res){
	Train.findByIdAndUpdate(req.params.id, req.body.train, function(err, train){
		if(err){
			console.log(err);
		} else{
			// console.log(train);
			// console.log(req.body);
			// eval(locus);
			if( !(req.body.oldTrainId === req.body.train.trainId) ){
				// console.log("reached in ");
				var tId = train._id
				tId = tId.toString()
				// console.log(tId);
				async.parallel([
					function(callback){
						Complaint.find({})
						.where('train.id').equals(tId)
						.exec(function(err, comps){
							if(err){
								console.log(err)
							} else{
								// console.log(comps)
								// if(comps && )
								var promises = comps.map(function(comp){
									return new Promise(function(resolve){
										comp.complaintTypeId = req.body.train.trainId
										comp.train.trainId = req.body.train.trainId
										comp.save()
										// console.log(comp);
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
						.where('train.id').equals(tId)
						.exec(function(err, emps){
							if(err){
								console.log(err);
							} else{
								// console.log(emps);
								var promises = emps.map(function(emp){
									return new Promise(function(resolve){
										emp.dutyId = req.body.train.trainId
										emp.train.trainId = req.body.train.trainId
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
					res.redirect("/train/"+req.params.id);
				})
			} else{
				res.redirect("/train/"+req.params.id);
			}
		}
	})
})

router.delete("/:id", function(req, res){	
	Train.findById(req.params.id, function(err, train){
		if(err){
			console.log(err);
		} else{
			var tId = train._id
			tId = tId.toString()
			// console.log(tId);
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('train.id').equals(tId)
					.exec(function(err, comps){
						if(err){
							console.log(err)
						} else{
							// console.log(comps)
							// if(comps && )
							var promises = comps.map(function(comp){
								return new Promise(function(resolve){
									comp.complaintTypeId = null
									comp.train.id = null
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
					.where('train.id').equals(tId)
					.exec(function(err, emps){
						if(err){
							console.log(err);
						} else{
							// console.log(emps);
							var promises = emps.map(function(emp){
								return new Promise(function(resolve){
									emp.dutyId = null
									emp.train.id = null;
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
				train.remove();
				res.redirect("/train");
			})
		}
	})
})
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;