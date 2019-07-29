var Complaint = require("../models/complaint");
var Dept = require("../models/dept");
var Train = require("../models/train");
var Station = require("../models/station");

var middleObj = {};


middleObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that!!");
	res.redirect("/");
};

middleObj.isAdmin = function(req, res, next){
	if(req.isAuthenticated()){
		if(req.user.userType === "employee" && req.user.isAdmin === True){
			return next();
		}
		req.flash("error", "Sorry, but you are not an admin");
		res.redirect("/");
	} else{
		req.flash("error", "You need to be logged in to do that!!");
		res.redirect("/");
	}
};

middleObj.checkComplaintAuthorization = function(req, res, next){
	if(req.isAuthenticated()){
		Complaint.findById(req.params.id, function(err, comp){
			if(err){
				console.log(err);
			} else {
				if(comp.author.id.equals(req.user._id) || comp.resolver.id.equals(req.user._id) || req.user.isAdmin){
					return next(); 
				} else{  
					req.flash("error", "you do not have permissions to do that");
					res.redirect("back");
				}
			}
		})
	} else{
		req.flash("error", "You need to be logged in to do that!!");
		res.redirect("/login");
	}
};


// middleObj.checkCommentAuthorization = function(req, res, next){
// 	if(req.isAuthenticated()){
// 		Comment.findById(req.params.comment_id, function(err, foundComment){
// 			if(err){
// 				console.log("err");
// 			} else {
// 				if(foundComment.author.id.equals(req.user._id)){
// 					return next();
// 				} else{
// 					req.flash("error", "you do not have permissions to do that");
// 					res.redirect("back");
// 				}
// 			}
// 		})
// 	} else{
// 		req.flash("error", "You need to be logged in to do that!!")
// 		res.redirect("/login");
// 	}
// };

module.exports = middleObj;