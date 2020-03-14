var express 	= require('express'),
	router 		= express.Router(),
	Campground 	= require("../models/campground"),
	middleware  = require("../middleware");

// var NodeGeocoder = require('node-geocoder');
 
// var options = {
//   provider: 'google',
//   httpAdapter: 'https',
//   apiKey: process.env.GEOCODER_API_KEY,
//   formatter: null
// };
 
// var geocoder = NodeGeocoder(options);

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'mystic1099', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var location = req.body.location;
  cloudinary.uploader.upload(req.file.path, function(result) {
    // add cloudinary url for the image to the campground object under image property
    var image = result.secure_url;
    var newCampground = {name: name, image: image, description: desc, author:author, price: price, location: location, lat: 0, lng: 0};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, campground) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/campgrounds');
    });
  });
});

//SHOW -> to show contents of paticular campground
router.get("/:id", function(req, res){
	//find the campground with provided ID in DB
	Campground.findById(req.params.id).populate("comments likes").exec(function(err, foundCampground){
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

//LIKES ROUTE
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});


//search function used in Index route
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;