//REQUIRING PACKAGES
var express 				= require('express'),
	app 					= express(),
	bodyParser 				= require('body-parser'),
	mongoose 				= require('mongoose'),
	flash					= require('connect-flash'),
	passport				= require('passport'),
	methodOverride 			= require('method-override'),
	localStrategy			= require('passport-local'),
	passportLocalMongoose 	= require('passport-local-mongoose'),
	seedDB					= require('./seeds');

//REQUIRING ROUTES
var campgroundRoutes = require("./routes/campgrounds"),
	commentRoutes 	 = require("./routes/comments"),
	indexRoutes		 = require("./routes/index");

//REQUIRING MODELS
var Campground 		= require("./models/campground"),
	Comment 		= require("./models/comment"),
	User 			= require("./models/user");

//calling seedDB function created in seeds.js file
//seedDB();

//connecting to mongodb and creating database yelp_camp
mongoose.connect("mongodb://localhost/yelp_camp_v11Deployed", {useNewUrlParser: true});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
//using stylesheets
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//===================================================================================================================================================
//PASSPORT CONIGURATION
//===================================================================================================================================================
app.use(require("express-session")({
	secret: "My dream is to marry Tunisha",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//MIDDLEWARE
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//USING ROUTES
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

//===================================================================================================================================================
//SERVER STARTING
//===================================================================================================================================================
app.listen(process.env.PORT, function(){
	console.log("SERVER LISTENING ON PORT=3000");
	console.log("THE YELPCAMP APP HAS STARTED!");
});