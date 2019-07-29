var mongoose = require("mongoose");
var Train = require("./models/train");
var Station = require("./models/station");
var Complaint = require("./models/complaint");
var Employee = require("./models/employee");
var Dept = require("./models/dept");
var User = require("./models/user");
var faker = require("faker");
var bcrypt = require("bcryptjs");
var async = require("async");

faker.seed(123);

function seedDB(){
    async.series([
        function(callback){
            async.parallel([
                function(callback1){
                    User.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                },
                function(callback1){
                    Employee.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                },
                function(callback1){
                    Dept.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                },
                function(callback1){
                    Complaint.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                },
                function(callback1){
                    Train.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                },
                function(callback1){
                    Station.remove({}, function(err){
                        if(err){
                            console.log(err)
                        } else{
                            callback1(null, null);
                        }
                    });
                }
            ], function(err, res1){
                if(err){
                    console.log(err);
                } else{
                    console.log("removed the data");
                    callback(null, 'one');
                }
            })
        },
        function(callback){
            async.waterfall([
                function(callback1){ 
                    for(var i=1;i<=50;i++){ 
                        var userRandom = {
                            email : faker.internet.email(),
                            username : faker.internet.email(),
                            name : faker.name.findName(),
                            password : "password"
                        }

                        User.create(userRandom, function(err, user){
                            if(err){
                                console.log(err);
                            } else{
                                bcrypt.genSalt(10, function(err, salt) {
                                    if(err){
                                        console.log(err);
                                    } else{
                                         bcrypt.hash(user.password, salt, function(err, hash) {
                                            user.password = hash;
                                            user.save();
                                        });
                                    }
                                });
                            }
                        })
                    }
                    setTimeout(function() {
                        callback1(null, 'one');
                    }, 1000);
                },
                function(arg1, callback1){
                    for(var i=1;i<=10;i++){
                        var deptRandom = {
                            deptName: faker.random.word(),
                            deptId: i,
                            noOfEmployee: (faker.random.number())%5 + 20
                        }
                        Dept.create(deptRandom, function(err, dept){
                            if(err){
                                console.log(err);
                            }else{
                                
                            }
                        })
                    }
                    setTimeout(function() {
                        Dept.find({}, function(err, depts){
                            if(err){
                                console.log(err);
                            } else{
                                callback1(null, depts);
                            }
                        })
                    }, 100);
                },
                function(depts, callback1){
                    for(var i=1;i<=5;i++){
                        var stationRandom = {
                            stationName: faker.random.word(),
                            stationId: i,
                        }
                        Station.create(stationRandom, function(err, station){
                            if(err){
                                console.log(err);
                            }else{
                                
                            }
                        })
                    }
                    setTimeout(function() {
                        Station.find({}, function(err, stations){
                            if(err){
                                console.log(err);
                            } else{
                                callback1(null, depts, stations);
                            }
                        })
                    }, 100);
                },
                function(depts, stations, callback1){
                    for(var i=1;i<=5;i++){
                        var trainRandom = {
                            trainName: faker.random.word(),
                            trainId: i,
                        }
                        Train.create(trainRandom, function(err, train){
                            if(err){
                                console.log(err);
                            }else{
                                
                            }
                        })
                    }
                    setTimeout(function() {
                        Train.find({}, function(err, trains){
                            if(err){
                                console.log(err);
                            } else{
                                callback1(null, depts, trains, stations);
                            }
                        })
                    }, 100);
                }, 
                function(depts, trains, stations, callback1){
                    var flag = 1;
                    depts.forEach(function(dept){
                        for(var i=1; i<=dept.noOfEmployee;i++ ){
                            var empRandom = { 
                                email : faker.internet.email(),
                                username : faker.internet.email(),
                                name : faker.name.findName(),
                                password : "password"   
                            }
                            Employee.create(empRandom,function(err, emp){
                                if(err){
                                    console.log(err);
                                } else{
                                    bcrypt.genSalt(10, function(err, salt) {
                                        if(err){
                                            console.log(err);
                                        } else{
                                            bcrypt.hash(emp.password, salt, function(err, hash) {
                                                emp.password = hash;
                                                var department = {
                                                    id : dept._id,
                                                    deptName : dept.deptName
                                                }    
                                                emp.department = department;
                                                var ran = faker.random.number();
                                                if(flag === 1){
                                                    ran = ran%5;
                                                    emp.dutyType = "train";
                                                    emp.dutyId = trains[ran].trainId;
                                                    emp.train.id = trains[ran]._id;
                                                    emp.train.trainId = trains[ran].trainId;
                                                    flag = 0;
                                                    // console.log(emp);
                                                    emp.save();
                                                } else{
                                                    ran = ran%5;
                                                    emp.dutyType = "station";
                                                    emp.dutyId = stations[ran].stationId;
                                                    emp.station.id = stations[ran]._id;
                                                    emp.station.stationId = stations[ran].stationId;
                                                    flag = 1;
                                                    // console.log(emp);
                                                    emp.save();     
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        
                    })
                    setTimeout(function() {
                        Employee.find({}, function(err, emps){
                            if(err){
                                console.log(err);
                            } else{
                                callback1(null, depts, trains, stations, emps);
                            }
                        })
                    }, 1000);
                }
                ,
                function(depts, trains, stations, emps, callback1){
                    depts.forEach(function(dept){
                        var rand = faker.random.number()%20;
                        for(var j=1;j<=rand;j++){
                            var compRandom = {
                                title : faker.lorem.words(),
                                desc : faker.lorem.paragraph(),
                                image : faker.image.image(),
                                dateReg : faker.date.past()
                            }

                            Complaint.create(compRandom, function(err, comp){
                                if(err){
                                    console.log(err);
                                } else{
                                   User.aggregate(
                                        [{ $sample: { size: 1 }}],
                                    function(err,user){
                                        if(err){
                                            console.log(err);
                                        } else{
                                            comp.complainer.id = user[0]._id;
                                            comp.complainer.username = user[0].username;
                                            comp.department.id = dept._id;
                                            comp.department.deptName = dept.deptName;
                                            var dId = dept._id;
                                            Employee.find({})
                                            .where('department.id').equals(dId)
                                            .exec(function(err, emp){
                                                if(err){
                                                    console.log(err);
                                                } else{
                                                    // console.log(emp);
                                                    var len = emp.length;
                                                    var ran = faker.random.number()%len;
                                                    // console.log(emp[ran]);
                                                    if(emp[ran]){
                                                        comp.complaintType = emp[ran].dutyType;
                                                        comp.complaintTypeId = emp[ran].dutyId;
                                                        comp.resolver.id = emp[ran]._id;
                                                        comp.resolver.username = emp[ran].username;
                                                        // console.log()
                                                        if(emp[ran].dutyType === "station"){
                                                            comp.station.id = emp[ran].station.id;
                                                            comp.station.stationId = emp[ran].station.stationId;
                                                            // emp[ran].noOfCurrentComplaints =  emp[ran].noOfCurrentComplaints+ 1;
                                                            emp[ran].save();
                                                            comp.save();
                                                        } else if(emp[ran].dutyType === "train"){
                                                            comp.train.id = emp[ran].train.id;
                                                            comp.train.trainId = emp[ran].train.trainId;
                                                            // emp[ran].noOfCurrentComplaints =  emp[ran].noOfCurrentComplaints+ 1;
                                                            emp[ran].save();
                                                            comp.save();
                                                        }
                                                        
                                                        
                                                        // console.log("=================");
                                                        // console.log(comp.station);
                                                        // console.log(comp.train);
                                                        // console.log("=================");
                                                    }                                                   
                                                }
                                            })                                           
                                        }
                                    })
                                }
                            })
                        }

                    })
                    setTimeout(function() {
                        Complaint.find({}).populate("resolver.id").exec(function(err, comps){
                            if(err){
                                console.log(err);
                            } else{
                                callback1(null, emps, comps);
                            }
                        })
                        
                    }, 2000);
                }
                , 
                function(emps, comps, callback1){
                    
                    for(var i=0;i<comps.length;){
                        
                        console.log("=========="+i+"=========")
                        if(comps[i].resolver.id){
                            comps[i].resolver.id.noOfCurrentComplaints += 1;
                            comps[i].resolver.id.save();
                        
                            // comps[i].save();
                            // console.log(comps[i].resolver);
                            console.log(comps[i].title);
                        }
                        i=i+1;
                    }
                        
                    setTimeout(function() {
                        callback1(null , 'one');    
                    }, 2000);
                }   
            ], function(err, res2){
                if(err){
                    console.log(err);
                } else{
                    console.log("added the data");
                    callback(null, 'two')
                }
            })
        }
    ], function(err, results){
        if(err){
            console.log(err);
        } else{
            console.log("seeded the database");
        }
    })
}

module.exports = seedDB;