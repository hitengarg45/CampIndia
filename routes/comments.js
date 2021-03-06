var express 	= require('express'),
	router 		= express.Router({mergeParams: true}),
	Campground 	= require("../models/campground"),
	Comment 	= require("../models/comment"),
	middleware  = require("../middleware");

//===================================================================================================================================================
//COMMENTS ROUTES
//===================================================================================================================================================

//NEW -> to show form to create a new comment
router.get("/new", middleware.isLoggedIn, function(req, res){
	//find campground by id and render new comment form
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments/new", {
				campground: campground
			});
		}
	});
});

//CREATE -> add a new comment to the database
router.post("/", middleware.isLoggedIn, function(req, res){
	//lookup for campground by id
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			//create a new comment
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong!");
					console.log(err);
				}
				else{
					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					//connect the new comment to campground
					campground.comments.push(comment);
					campground.save();
					//redirect back to show page
					req.flash("success", "Comment added successfully!");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});

//EDIT -> route to edit comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			console.log(err);
			res.redirect("back");
		}
		else{
			res.render("comments/edit", {
				campground_id: req.params.id,
				comment: foundComment
			});
		}
	});
});

//UPDATE -> route to update comment in database
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			console.log(err);
			res.redirect("back");
		}
		else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});


//DESTROY -> route to delete comment from database

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			console.log(err);
			res.redirect("back");
		}
		else{
			req.flash("success", "Comment deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;