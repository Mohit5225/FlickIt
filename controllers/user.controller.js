import { User } from "../models/user.model.js";
import bycrpt from "bcryptjs";
import jwt from "jsonwebtoken";
import getdatauri from "../utils/datauri.js";


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (username || password || email) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }


        const user = await User.findUser({ email });
        if (user) {
            return res.status(400).json({ message: "Email already exists", success: false });

        }
        const hashedPassword = await bycrpt.hash(password, 20);

        await User.create({
            username,
            email,
            password:hashedPassword

        });
        return res.status(201).json({ message: "User registered successfully", success: true });


        } catch (error) {
            console.log(error);

        }
    }


    export const login = async(req , res)=> {
        try{
            const { email, password } = req.body;
            if(!email ||!password){
                return res.status(400).json({message: "All fields are required", success: false});
            }
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message : "Incorrect email or password", success: false});

        };

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts
        }
        const token = await jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"});
        return res.cookie('token' , token , {httpOnly:true , sameSite:"strict , maxAge : 1*24*60*1000"}).json({message: `Welcome back ${user.username}`, success: true});
        } catch (error) {
            console.log(error);
            return res.status(500).json({message: "Internal server error", success: false});
        }
    }
    

 export const logout = async(_, res) => {
     try {
         return res.clearCookie('token').json({message: "Logged out successfully", success: true});
     } catch (error) {
         console.log(error);
         return res.status(500).json({message: "Internal server error", success: false});
     }
 }

 export const getProfile = async(req, res) => {
        try{
            const userId = req.params.id;
            const user = await User.findById(userID);
            return res.status(200).json({user, success: true});
        }
        catch(error){
            console.log(error);
            return res.status(500).json({message: "Internal server error", success: false});
        }
    }

    export const editProfile = async(req , res)=> {
        try{
            const userId = req.userId;
            const {bio , gender} = req.body;
            const profilePicture = req.file;
            
            

            let cloudResponse;

            if(profilePicture){
                const fileUri = getdatauri(profilePicture);
                cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            }
            const user = await User.findById(userId);
            if(!user){
                return res.status(404).json({message: "User not found", success: false});
            }
            if(bio) userbio = bio;
            if(gender) user.gender = gender;
            if(profilePicture) user.profilePicture = cloudResponse.secure_url;

            await user.save();

            return res.status(200).json({message: "Profile updated successfully", success: true});

        }catch(error){  
            console.log(error);
        }
    
    }



    export const GetsuggestedUsers = async(req , res) => {
        try{
            const suggestedUsers = await user.find({_id: {$ne:req.Id}}).select("-password")
            if(!suggestedUsers){
                return res.status(404).json({message: "No users found", success: false});
            }
            return res.status(200).json({
                users : suggestedUsers, 
                success: true
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({message: "Internal server error", success: false});
        }
    }



    export const followorUnfollow = async(req , res) => {
        try{
            const userId = req.userId;
            const {followId} = req.body;
            const user = await User.findById(userId);
            const followUser = await User.findById(followId);
            if(!user || !followUser){
                return res.status(404).json({message: "User not found", success: false});
            }
            if(user.following.includes(followId)){
                user.following = user.following.filter(id => id !== followId);
                followUser.followers = followUser.followers.filter(id => id !== userId);
            } else {
                user.following.push(followId);
                followUser.followers.push(userId);
            }
            await user.save();
            await followUser.save();
            return res.status(200).json({message: "Operation successful", success: true});
            
        } catch (error) {
            console.log(error);
            return res.status(500).json({message: "Internal server error", success: false});
        }

    }
    