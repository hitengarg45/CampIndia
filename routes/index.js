var express 	= require('express'),
	router 		= express.Router(),
	passport 	= require('passport'),
	User 		= require("../models/user"),
	Campground 	= require("../models/campground");

//HOME ROUTE
router.get("/", function(req, res){
	res.render("landing");
});

//===================================================================================================================================================
//AUTHENTICATION ROUTES
//===================================================================================================================================================

//SIGNUP
//show the register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
});
//handling user signup logic
router.post("/register", function(req, res){
	var newUser = new User(
			{
				username: req.body.username, 
				firstName: req.body.firstName, 
				lastName: req.body.lastName, 
				email: req.body.email, 
				avatar: req.body.avatar
			}
		);
	if(req.body.adminCode === "secretcode123"){
			newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp. Nice to meet you " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//LOGIN
//show the login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
});
//handling login logic
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req, res){

});

//LOGOUT
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged out successfully");
	res.redirect("/campgrounds");
});

//USER PROFILE
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Something went wrong!");
			res.redirect("/");
		}
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
			if(err){
				req.flash("error", "Something went wrong!");
				res.redirect("/");
			}
				res.render("users/show", {
				user: foundUser,
				campgrounds: campgrounds
			});
		});
	});
});

module.exports = router;