var express 	= require('express'),
	router 		= express.Router(),
	Campground 	= require("../models/campground"),
	middleware  = require("../middleware");

//===================================================================================================================================================
//RESTFUL CAMPGROUND ROUTES
//===================================================================================================================================================

//INDEX -> campgrounds route, show all campgrounds
router.get("/", function(req, res){
	//get all campgrounds from the DB
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		}
		else{
			//can leave it as it is as early there was campground array of objects
			//now are getting it from the database as function arg which is also array of objects
			//but for avoiding confusion changing its arg name from campgrounds -> allCampgrounds
			res.render("campgrounds/index", {
				campgrounds: allCampgrounds,
				page: 'campgrounds'
			});
		}
	});
});


//NEW -> show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});


//CREATE -> add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
	//get data from form and add it to campgrounds collection in database
	var name = req.body.name;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newCampground = {
		name: name,
		image: image,
		description: description,
		author: author
	}
	console.log(req.user);
	//create a new campground and save it to database
	Campground.create(newCampground, function(err, newlyCreated){
		if(err){
			console.log(err);
		}
		else{
			console.log(newlyCreated);
			//redirect to the campgrounds page
			//default redirect to get request campgrounds page
			res.redirect("/campgrounds");
		}
	})
});

//SHOW -> to show contents of paticular campground
router.get("/:id", function(req, res){
	//find the campground with provided ID in DB
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		}
		else{
			console.log(foundCampground);
			//rendering show page and sending data of obtained campground
			res.render("campgrounds/show", {
				campground: foundCampground
			});
		}
	});
});

//EDIT -> takes us to edit page
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
		Campground.findById(req.params.id, function(err, foundCampground){
				res.render("campgrounds/edit", {
				campground: foundCampground
			});
		});
});

//UPDATE -> updates the data in database
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	//find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds/" + updatedCampground._id);
		}
	});
});

//DESTROY -> destroy the campground
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;