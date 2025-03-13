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


