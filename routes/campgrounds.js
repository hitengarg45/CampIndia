var express 	= require('express'),
	router 		= express.Router(),
	Campground 	= require("../models/campground"),
	middleware  = require("../middleware");

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//===================================================================================================================================================
//RESTFUL CAMPGROUND ROUTES
//===================================================================================================================================================

//INDEX -> campgrounds route, show all campgrounds
router.get("/", function(req, res){
  var noMatch = null;
  if(req.query.search){
     const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    //get all campgrounds from the DB
    Campground.find({name: regex}, function(err, allCampgrounds){
      if(err){
        console.log(err);
      }
      else{
        if(allCampgrounds.length < 1){
          noMatch = "Sorry, No campgrounds found!!";
        }
        res.render("campgrounds/index", {
          campgrounds: allCampgrounds,
          page: 'campgrounds',
          noMatch: noMatch
        });
      }
    });
  }
  else{
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
          page: 'campgrounds',
          noMatch: noMatch
        });
      }
    });
  }
});


//NEW -> show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});


//CREATE -> add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
    	console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, description: desc, author:author, price: price, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
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
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
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

//search function used in Index route
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;