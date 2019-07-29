require('dotenv').config();

var express = require("express");
var app = express();
var mongoose = require("mongoose");
var complaintRoute = require("./routes/complaint");
var deptRoute = require("./routes/department");
var indexRoute = require("./routes/index");
var trainRoute = require("./routes/train");
var stationRoute = require("./routes/station");
var userRoute = require("./routes/user");
var employeeRoute = require("./routes/employee");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var passportLocalMongoose = require("passport-local-mongoose");
var expressValidator = require("express-validator");
var User = require("./models/user");
var Employee = require("./models/employee");
var flash = require("connect-flash");
var cookieParser = require('cookie-parser')
var bcrypt = require("bcryptjs");
var seeds = require("./seeds");
var async = require("async");

// seeds();


// mongoose.connect("mongodb://"+ process.env.MONGOUSER +":"+process.env.MONGOPASSWD+"@ds145474.mlab.com:45474/railways");
mongoose.connect("mongodb://localhost/rail_v8");

app.use(require('express-session')({ 
	secret: 'Web development is awesome', 
	resave: false, 
	saveUninitialized: false 
}));
app.use(express.static(__dirname+"/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

passport.use("user",new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      User.comparePassword(password, user.password, function (err, isMatch) {
			if (err) throw err;
			if (isMatch) {
				return done(null, user);
			} else {
				return done(null, false, { message: 'Invalid password' });
			}
		});
    });
  }
));

passport.use("employee",new LocalStrategy(
  function(username, password, done) {
    Employee.findOne({ username: username }, function(err, employee) {
      if (err) throw err;
      if (!employee) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      Employee.comparePassword(password, employee.password, function (err, isMatch) {
			if (err) throw err;
			if (isMatch) {
				return done(null, employee);
			} else {
				return done(null, false, { message: 'Invalid password' });
			}
		});
    });
  }
));

passport.serializeUser(function (user, done) {
	let type;
	if(isUser(user)){
		type = 'user';
	} else if(isEmployee(user)){
		type = 'employee';
	}

	const key = {
    id: user.id,
    // With ES6 we don't need to put 'type: type'
    type
  }
	done(null, key);
});

passport.deserializeUser(function(key, done) {
  // Check if user should be searched in the User model or
  // in the Enterprise one
  const Model = key.type === 'user' ? User : Employee
  // Find the user, if found then pass it to the done() function
  Model.findById(key.id, function(err, user) {
    done(err, user);
  })
})

app.use(flash());
app.use(function(req, res, next){
	res.locals.currentUser = req.user || null;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
  res.locals.cpage = req.query.cpage || 0;
  res.locals.epage = req.query.epage || 0;
	next();
})

app.use("/", indexRoute);
app.use("/dept", deptRoute);
app.use("/complaint", complaintRoute);
app.use("/train", trainRoute);
app.use("/station", stationRoute);
app.use("/user", userRoute);
app.use("/employee", employeeRoute);

app.listen(5000, process.env.IP,function(){
	console.log("server started");
})

const isUser = user => user instanceof User

// Checks if the user is an instance of the Enterprise model
const isEmployee = employee => employee instanceof Employee