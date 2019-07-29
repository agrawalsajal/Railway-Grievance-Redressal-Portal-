var express = require("express");
var router = express.Router({mergeParams : true});
var Station = require("../models/station");
var Complaint = require("../models/complaint");
var Employee = require("../models/employee");
var randomColor = require("randomcolor")
var async = require("async")
var middlePlot = require("../middleware/plot")

function plotStationData(stations, callback){
	var sname = [];
	var noe = [];
	var color = randomColor({count: stations.length});
	var noc = [];

	var promises = stations.map(function(station){
		var sId = station._id;
		sId = sId.toString();
		return new Promise(function(resolve){
			Complaint.find({})
			.where("station.id").equals(sId)
			.exec(function(err, comps){
				if(err){
					console.log(err);
				} else{
					Employee.find({})
					.where("station.id").equals(sId)
					.exec(function(err, emps){
						if(err){
							console.log(err);
						} else{
							sname.push(station.stationName);
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
		// console.log(sname);
		// console.log("====",Date.now());
		callback(sname,noe,color,noc)
	})
}

router.get("/", function(req, res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Station.find({stationName: regex}, function(err, stations){
			if(err){
				console.log(err);
			} else{
				if(stations.length < 1){
					// console.log("no complaints");
					req.flash("error", "No such station found searh again !!!")
					res.redirect("/station");
				} else{
					plotStationData(stations, function(sname,noe,color,noc){
						res.render("station/index", {stations:stations, sname:sname, noe:noe,
													color1:color, noc:noc});
					})
					
				}
			}
		})
	} else{
		
		Station.find({}, function(err, stations){
			if(err){
				console.log(err);
			} else{
				plotStationData(stations, function(sname,noe,color,noc){
					res.render("station/index", {stations:stations, sname:sname, noe:noe,
												color1:color, noc:noc});
				})
			}
		})
	}
})

router.get("/new", function(req, res){
	res.render("station/new");
})

router.post("/", function(req, res){
	Station.create(req.body.station, function(err, station){
		if(err){
			console.log(err);
		} else{
			// console.log(station);
			res.redirect("/station");
		}
	})
})

router.get("/:id", function(req, res){
	Station.findById(req.params.id, function(err, station){
		if(err){
			console.log(err);
		} else{
			var sId = station._id;
			sId = sId.toString();
			var cskip = (req.query.cpage)*3 >=0 ? (req.query.cpage)*3 :0;
			var eskip = (req.query.epage)*3 >=0 ? (req.query.epage)*3 :0;

			// console.log(req.query.cpage); 		
			// console.log(typeof(req.query.cpage)); 		
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('station.id').equals(sId)
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
					.where('station.id').equals(sId)
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
					.where('station.id').equals(sId)
					.exec(function(err, comps){
						if(err){
							console.log(err);
						} else{
							// console.log("count is", comp.length)
							middlePlot.plot1(comps, function(stat, regSum, resSum){
								callback(null, comps, stat, regSum, resSum);
							})
							
						}
					})
				},
				function(callback){
					Employee.find({})
					.where('station.id').equals(sId)
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
				res.render("station/show", {station:station, complaints:result[0], 
										employees:result[1], allComps:result[2][0], 
										stat: result[2][1], regSum:result[2][2],
										resSum: result[2][3], allEmps: result[3]
									});
			})	
		}
	})
})

router.get("/:id/edit", function(req, res){
	Station.findById(req.params.id, function(err, station){
		if(err){
			console.log(err)
		} else{
			res.render("station/edit", {station:station})
		}
	})
})

router.put("/:id", function(req, res){
	Station.findByIdAndUpdate(req.params.id, req.body.station, function(err, station){
		if(err){
			console.log(err);
		} else{
			// console.log(station);
			// console.log(req.body);
			// eval(locus);
			if( !(req.body.oldStationId === req.body.station.stationId) ){
				// console.log("reached in ");
				var sId = station._id
				sId = sId.toString()
				// console.log(sId);
				async.parallel([
					function(callback){
						Complaint.find({})
						.where('station.id').equals(sId)
						.exec(function(err, comps){
							if(err){
								console.log(err)
							} else{
								// console.log(comps)
								// if(comps && )
								var promises = comps.map(function(comp){
									return new Promise(function(resolve){
										comp.complaintTypeId = req.body.station.stationId
										comp.station.stationId = req.body.station.stationId
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
						.where('station.id').equals(sId)
						.exec(function(err, emps){
							if(err){
								console.log(err);
							} else{
								// console.log(emps);
								var promises = emps.map(function(emp){
									return new Promise(function(resolve){
										emp.dutyId = req.body.station.stationId
										emp.station.stationId = req.body.station.stationId
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
					res.redirect("/station/"+req.params.id);
				})
			} else{
				res.redirect("/station/"+req.params.id);
			}
		}
	})
})

router.delete("/:id", function(req, res){	
	Station.findById(req.params.id, function(err, station){
		if(err){
			console.log(err);
		} else{
			var sId = station._id
			sId = sId.toString()
			// console.log(sId);
			async.parallel([
				function(callback){
					Complaint.find({})
					.where('station.id').equals(sId)
					.exec(function(err, comps){
						if(err){
							console.log(err)
						} else{
							// console.log(comps)
							// if(comps && )
							var promises = comps.map(function(comp){
								return new Promise(function(resolve){
									comp.complaintTypeId = null
									comp.station.id = null
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
					.where('station.id').equals(sId)
					.exec(function(err, emps){
						if(err){
							console.log(err);
						} else{
							// console.log(emps);
							var promises = emps.map(function(emp){
								return new Promise(function(resolve){
									emp.dutyId = null
									emp.station.id = null;
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
				station.remove();
				res.redirect("/station");
			})
		}
	})
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;