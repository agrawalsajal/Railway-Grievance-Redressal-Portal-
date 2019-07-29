var express = require("express");
var router = express.Router({mergeParams : true});
var User = require("../models/user");
var Complaint = require("../models/complaint");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var bcrypt = require('bcryptjs');

router.get("/", function(req, res){ 
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        User.find({name: regex}, function(err, users){
            if(err){
                console.log(err);
            } else{
                if(users.length < 1){
                    // console.log("no users");
                    req.flash("error", "No such user found searh again !!!")
                    res.redirect("/user");
                } else{
                    res.render("user/index", {users:users});
                }       
            }
        })
    } else{
        User.find({} , function(err, users){
            if(err){
                console.log(err);
            } else{
                res.render("user/index", {users:users});
            }
        })
    }  
})

router.get('/forgot', function(req, res) {
  res.render('user/forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/user/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'study.agrawal@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'study.agrawal@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/user/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/user/forgot');
    }
    res.render('user/reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          // user.setPassword(req.body.password, function(err) {
          //   user.resetPasswordToken = undefined;
          //   user.resetPasswordExpires = undefined;

          //   user.save(function(err) {
          //     req.logIn(user, function(err) {
          //       done(err, user);
          //     });
          //   });
          // })
            user.password = req.body.password;  
      bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(user.password, salt, function(err, hash) {
              user.password = hash;
              user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
              user.save();
              done(err, user);
          });
      });
        
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'study.agrawal@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'study.agrawal@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

router.get("/:id", function(req, res){
	User.findById(req.params.id, function(err, user){
		if(err){
			console.log(err);
		} else{
			var userId = user._id;
			userId = userId.toString()
			// console.log(userId);
			// console.log(typeof(userId));
			Complaint.find({})
			.where('complainer.id').equals(userId)
			.exec(function(err, complaints){
				if(err){
					console.log(err);
				} else{
					// console.log(complaints);
					res.render("user/show", {user:user, complaints:complaints});
				}
			})
		}	
	})
})

router.get("/:id/edit", function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        } else{
            res.render("user/edit", {user:user})
        }
    })
})

router.put("/:id", function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, user){
        if(err){
            console.log(err);
        } else{
            var cId  = req.params.id
            if( !(req.body.oldUsername === req.body.user.username ) ){
                Complaint.find({})
                .where('complainer.id').equals(cId)
                .exec(function(err, comps){
                    var promises = comps.map(function(comp){
                        return new Promise(function(resolve){
                            comp.complainer.username = req.body.user.username
                            comp.save()
                            resolve()
                        })
                    })
                    Promise.all(promises).then(function(result){
                        res.redirect("/user/"+req.params.id);
                    })
                })
            } else{
                res.redirect("/user/"+req.params.id);
            }

        }
    })
})

router.delete("/:id", function(req, res){
    User.findByIdAndRemove(req.params.id, function(err, user){
        if(err){
            console.log(err);
        } else{
            var cId  = req.params.id
            Complaints.find({})
            .where('complainer.id').equals(cId)
            .exec(function(err, comps){
                var promises = comps.map(function(comp){
                    return new Promise(function(resolve){
                        comp.complainer.id = null
                        comp.save()
                        resolve()
                    })
                })
                Promise.all(promises).then(function(result){
                    res.redirect("/user");
                })
            })
           

        }
    })
    
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};




module.exports = router;