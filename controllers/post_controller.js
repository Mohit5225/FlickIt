import sharp from "sharp";
import cloudinary from "../utils/cloudinary";
import { Post } from "../models/post.model.js";
export const addNewPost =async  (req, res) => {
    try {
        const {caption} = req.body;
        const image = req.file;
        const authorId = req.iq ;

        if(!image) 
            return res.status(400).json({ message: "Image is required", success: false });

            const optimizedImageBuffer = await sharp(image.buffer)
            .resize({width:800 , height:800 , fit: "inside"})
            .toFormat('jpeg' , {quality:80})
            .toBuffer();

            const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`
            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            const post = await Post.create({
                caption,
                image: cloudResponse.secure_url,
                author: authorId
            });


            const user = await user.findById(authorId);
            if(user){
                user.posts.push(post._id);
                await user.save();
            }
            await post.populate({ path: 'author', select: '-password' });
            return response.status(200).json({
                message: "Post created successfully",
                success: true,
                post
            })
        
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
}


export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username , profilePicture' })
            .populate({ 
                path: 'comments',
                options: { sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username, profilePicture'
                }
            
            }

            })  
            return res.status(200).json({
                message: "Posts fetched successfully",
                success: true,
                posts
            });
            
    } catch (error) {   
        res.status(500).json({ message: "Internal server error", success: false });
    }
}




export const GetUserPost = async (req, res) => {
    try {
        const authorId = req.id ;
        const posts = await post.find({author : authorId}).sort({createdAt : -1 }).populate({
            path: 'author',
            select: 'username, profilePicture'
        })
        .populate({ 
            path: 'comments',
            options: { 
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username, profilePicture'
                }
            }
            
            })
            return res.status(200).json({
                message: "Posts fetched successfully",
                success: true,
                posts
            
        });
    }
     catch (error) {
         console.log(error);
    }
}









export const LikePost = async (req, res) => {
    try {
        const likedBy = req.id;
        const postId = req.params.id;

        const post = await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: likedBy } },
            { new: true } // Return updated post
        );

        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }

        return res.status(200).json({ message: "Post liked", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const DisLikePost = async (req, res) => {
    try {
        const dislikedBy = req.id;
        const postId = req.params.id;

        const post = await Post.findByIdAndUpdate(
            postId,
            { $pull: { likes: dislikedBy } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }

        return res.status(200).json({ message: "Like removed", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};



export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.id;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: "Comment text is required", success: false });

        // Create comment as a separate document
        const comment = await Comment.create({
            text,
            author: userId,
            post: postId,
        });

        // Populate author details for immediate frontend use
        await comment.populate("author", "username profilePicture");

        // Push comment reference into post
        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

        return res.status(201).json({
            message: "Comment added",
            comment,
            success: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId })
            .populate("author", "username profilePicture")
            .sort({ createdAt: -1 }); // Sorting by newest first

        if (!comments.length) return res.status(404).json({ message: "No comments found", success: false });

        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", success: false });
    }
};


export const deletePost = async (req,res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'Post not found', success:false});

        // check if the logged-in user is the owner of the post
        if(post.author.toString() !== authorId) return res.status(403).json({message:'Unauthorized'});

        // delete post
        await Post.findByIdAndDelete(postId);

        // remove the post id from the user's post
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        // delete associated comments
        await Comment.deleteMany({post:postId});

        return res.status(200).json({
            success:true,
            message:'Post deleted'
        })

    } catch (error) {
        console.log(error);
    }
}
export const bookmarkPost = async (req,res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'Post not found', success:false});
        
        const user = await User.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            // already bookmarked -> remove from the bookmark
            await user.updateOne({$pull:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'unsaved', message:'Post removed from bookmark', success:true});

        }else{
            // bookmark krna pdega
            await user.updateOne({$addToSet:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'saved', message:'Post bookmarked', success:true});
        }

    } catch (error) {
        console.log(error);
    }
}


