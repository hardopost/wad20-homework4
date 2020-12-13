const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const PostModel = require('../models/PostModel');


router.get('/', authorize, (request, response) => {

    // Endpoint to get posts of people that currently logged in user follows or their own posts

    PostModel.getAllForUser(request.currentUser.id, (postIds) => {

        if (postIds.length) {
            PostModel.getByIds(postIds, request.currentUser.id, (posts) => {
                response.status(201).json(posts)
            });
            return;
        }
        response.json([])

    })

});

router.post('/', authorize,  (request, response) => {

    // Endpoint to create a new post
    let text = request.body.text;
    let media = request.body.media;
    let userId = request.currentUser.id;

    if(!text && !media.url){ //if there is no post text and there is no media
        response.status(400).json({message: "Please enter text or media URL"});  //response code we send 400 means bad request
        return;
    }

    if(media && typeof media != 'object') { //if there is media present, but it is not an object
        response.status(400).json({message: "Please provide properly formatted media"})  //response code we send 400 means bad request
        return;
    }

    if(media.url && media.type === null) { //if media type is not selected
        response.status(400).json({message: "Please select media type"})  //response code we send 400 means bad request
        return;
    }

    //params for passing to create() function
    let params = {
        userId: userId,
        text: text,
        media: {
            type: media.type,
            url: media.url
        }
    }

    PostModel.create(params, function () {
        //after adding post
        PostModel.getAllForUser(request.currentUser.id, (postIds) => {
            if (postIds.length) {
                PostModel.getByIds(postIds, request.currentUser.id, (posts) => {
                    //responds withsuccessful creation of post 201 and last created post which is under 0 index
                    response.status(201).json(posts[0])
                });
                return;
            }
            response.json([])
        });

    });

});


router.put('/:postId/likes', authorize, (request, response) => {

    // Endpoint for current user to like a post
    let postId = request.params.postId;
    let userId = request.currentUser.id;

    PostModel.like(userId, postId, () => {
        response.status(200).json([]) // code 200 (OK)- post is liked
    })

});

router.delete('/:postId/likes', authorize, (request, response) => {

    // Endpoint for current user to unlike a post
    let postId = request.params.postId;
    let userId = request.currentUser.id;

    PostModel.unlike(userId, postId, () => {
        response.status(200).json([]) //post is unliked
    })

});

module.exports = router;
