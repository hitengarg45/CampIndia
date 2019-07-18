var Campground = require("../models/campground"),
	Comment    = require("../models/comment");

var middlewareObj = {
	checkCampgroundOwnership: function(req, res, next){
		//is user logged in at all?
		if(req.isAuthenticated()){
			Campground.findById(req.params.id, function(err, foundCampground){
				if(err){
					console.log(err);
					req.flash("error", "Campground not found!");
					res.redirect("back");
				}
				else{
					//does the user own the campground
					//if yes
					if(foundCampground.author.id.equals(req.user._id)){
						next();
					}
					//if no
					else{
						req.flash("error", "You don't have permission to do that!");
						res.redirect("back");
					}
				}
			});
		}
		//if not logged in
		else{
			req.flash("error", "Please Login First!");
			res.redirect("back");
		}
	},
	checkCommentOwnership: function(req, res, next){
		//is user logged in at all?
		if(req.isAuthenticated()){
			Comment.findById(req.params.comment_id, function(err, foundComment){
				if(err){
					console.log(err);
					req.flash("error", "Comment not found!");
					res.redirect("back");
				}
				else{
					//does the user own the comment
					//if yes
					if(foundComment.author.id.equals(req.user._id)){
						next();
					}
					//if no
					else{
						req.flash("error", "You don't have permission to do that!");
						res.redirect("back");
					}
				}
			});
		}
		//if not logged in
		else{
			req.flash("error", "Please Login First!");
			res.redirect("back");
		}
	},
	isLoggedIn: function(req, res, next){
		if(req.isAuthenticated()){
			return next();
		}
		req.flash("error","Please Login First!");
		res.redirect("/login");
	}
};

module.exports = middlewareObj;