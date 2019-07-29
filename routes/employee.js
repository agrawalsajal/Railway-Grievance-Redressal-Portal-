var express = require("express");
var router = express.Router({mergeParams : true});
var Employee = require("../models/employee");
var Complaint = require("../models/complaint");
var Dept = require("../models/dept");
var Train = require("../models/train");
var Station = require("../models/station");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var bcrypt = require('bcryptjs');
var middlePlot = require("../middleware/plot")
var async = require("async")

router.get("/", function(req, res){ 
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Employee.find({name: regex}, function(err, employees){
            if(err){
                console.log(err);
            } else{
                if(employees.length < 1){
                    // console.log("no employees");
                    req.flash("error", "No such employee found searh again !!!")
                    res.redirect("/employee");
                } else{
                    res.render("employee/index", {employees:employees});
                }       
            }
        })
    } else{
        Employee.find({} , function(err, employees){
            if(err){
                console.log(err);
            } else{
                res.render("employee/index", {employees:employees});
            }
        })
    }  
})

router.get('/forgot', function(req, res) {
  res.render('employee/forgot');
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
      Employee.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/employee/forgot');
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
          'http://' + req.headers.host + '/employee/reset/' + token + '\n\n' +
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
    res.redirect('/employee/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  Employee.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/employee/forgot');
    }
    res.render('employee/reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Employee.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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
    // Employee.findById(req.params.id, function(err, employee){
    //     if(err){
    //         console.log(err);
    //     } else{
    //         var empId = employee._id;
    //         empId = empId.toString()
    //         // console.log(empId);
    //         // console.log(typeof(empId));
    //         Complaint.find({})
    //         .where('resolver.id').equals(empId)
    //         .exec(function(err, complaints){
    //             if(err){
    //                 console.log(err);
    //             } else{
    //                 middlePlot.plot1(complaints, function(stat, regSum, resSum){
    //                     // console.log(complaints);
    //                     res.render("employee/show", {employee:employee, complaints:complaints, 
    //                                             stat:stat, regSum:regSum, resSum:resSum });
    //                 })

    //             }
    //         })
    //     } 
    // })
    Employee.findById(req.params.id, function(err, employee){
        if(err){
            console.log(err);
        } else{
            var eId = employee._id;
            eId = eId.toString();
            var cskip = (req.query.cpage)*3 >=0 ? (req.query.cpage)*3 :0;
            var eskip = (req.query.epage)*3 >=0 ? (req.query.epage)*3 :0;

            // console.log(req.query.cpage);        
            // console.log(typeof(req.query.cpage));        
            async.parallel([
                function(callback){
                    Complaint.find({})
                    .where('resolver.id').equals(eId)
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
                    Complaint.find({})
                    .where('resolver.id').equals(eId)
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
                res.render("employee/show", {employee:employee, complaints:result[0], 
                                        allComps:result[1][0], stat: result[1][1],
                                        regSum: result[1][2], resSum: result[1][3]
                                    });
            })  
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
            Employee.findById(req.params.id)
            .exec(function(err, emp){
                if(err){
                    console.log(err);
                } else{
                    callback(null, emp)
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
            
            res.render("employee/edit", 
                {
                    depts:result[0], 
                    trains:result[1], 
                    stations:result[2],
                    employee: result[3]
                }
            );
            
        }
    })
    
})

router.put("/:id", function(req, res){
    // eval(locus)
    async.parallel([
        function(callback){
            Dept.findOne({deptName: req.body.deptName}, function(err, dept){
                if(err){
                    console.log(err);
                } else{
                    if( req.body.oldDeptName ){
                        Dept.findById(req.body.oldDId, function(err, oldDept){
                            if(err){
                                console.log(err);
                            } else{
                                if( req.body.deptName ){
                                    if( !(req.body.oldDeptName === req.body.deptName) ) {
                                        oldDept.noOfEmployee -= 1;
                                        oldDept.save()
                                        dept.noOfEmployee += 1;
                                        req.body.employee.department = {};
                                        req.body.employee.department.id = dept._id;
                                        req.body.employee.department.deptName = dept.deptName;
                                        dept.save()
                                        
                                    } 
                                } else{
                                    oldDept.noOfEmployee -= 1;
                                    oldDept.save()
                                }
                                callback(null, dept);         
                            }
                        })
                    } else {
                        if(req.body.deptName){
                            dept.noOfEmployee += 1;
                            req.body.employee.department = {};
                            req.body.employee.department.id = dept._id;
                            req.body.employee.department.deptName = dept.deptName;
                            dept.save()  
                        }
                        callback(null, dept);
                    }
                } 
            })
        },
        function(callback){
            if(req.body.employee.dutyType === "train"){
                Train.findOne({trainId: req.body.employee.dutyId}, function(err, train){
                    if(err){
                        console.log(err);
                    } else{
                        req.body.employee.train = {};
                        req.body.employee.train.id = train._id;
                        req.body.employee.train.trainId = train.trainId;
                        callback(null, train);
                    }
                })
            } else if(req.body.employee.dutyType === "station"){  
                Station.findOne({stationId: req.body.employee.dutyId}, function(err, station){
                    if(err){
                        console.log(err);
                    } else{
                        req.body.employee.station = {};
                        req.body.employee.station.id = station._id;
                        req.body.employee.station.stationId = station.stationId;
                        callback(null, station);
                    }
                })  
            }
        } 
    ], function(err, result){
        if(err){
            console.log(err);
        } else{
            Employee.findByIdAndUpdate(req.params.id, req.body.employee, function(err, comp){
                if(err){
                    console.log(err);
                } else{
                    res.redirect("/employee/"+req.params.id); 
                }
            })
        }
    })
    
})

router.delete("/:id", function(req, res){
    async.parallel([
        function(callback){
            var eId = req.params.id;
            Complaint.find({})
            .where('resolver.id').equals(eId)
            .exec(function(err, comps){
                if(err){
                    console.log(err);
                } else{
                    var promises = comps.map(function(comp){
                        return new Promise(function(resolve){
                            comp.resolver.id = null;
                            comp.save()
                            resolve();
                        })
                    })

                    Promise.all(promises).then(function(result){
                        callback(null, "one")
                    })
                }
            })
        },
        function(callback){
            Employee.findById(req.params.id)
            .populate("department.id")
            .exec(function(err, emp){
                if(err){
                    console.log(err);
                    req.flash("error", "employee can not be deleted")
                    res.redirect("/employee");
                } else{
                    emp.department.id.noOfEmployee -= 1;
                    emp.department.id.save();
                    emp.remove()
                    callback(null, emp);
                }
            })
        }
    ],function(result){
        res.redirect("/employee");
    })
    
})





module.exports = router;

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};