import { User } from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";
import bcryptjs from "bcryptjs";

import jwt from "jsonwebtoken";
import getdatauri from "../utils/datauri.js";
import mongoose from "mongoose";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }


        const user = await User.findUser({ email });
        if (user) {
            return res.status(400).json({ message: "Email already exists", success: false });

        }
        const hashedPassword = await bcryptjs.hash(password, 20);

        await User.create({
            username,
            email,
            password: hashedPassword

        });
        return res.status(201).json({ message: "User registered successfully", success: true });


    } catch (error) {
        console.log(error);

    }
}


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email or password", success: false });

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
        const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.cookie('token', token, {
            httpOnly: true,
            sameSite: "strict", // ✅ Properly formatted string
            maxAge: 1 * 24 * 60 * 60 * 1000 // ✅ 1 day in milliseconds
        }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user: user
        });
        ;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}


export const logout = async (_, res) => {
    try {
        return res.clearCookie('token').json({ message: "Logged out successfully", success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export const getProfile = async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        return res.status(200).json({ user, success: true });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}

export const editProfile = async (req, res) => {
    // Add this to the top of your controller for debugging

    try {
        const userId = req.userId;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
       
        console.log("Profile Picture:", profilePicture);
        console.log("User ID from req in editProfile:", userId);

        console.log("FULL REQUEST BODY:", req.body);
        console.log("CONTENT TYPE:", req.headers['content-type']);

        let cloudResponse;

        if (profilePicture) {
            const fileUri = getdatauri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        // Add after user lookup
        let updatePerformed = false;

        if (bio) {
            user.bio = bio;
            updatePerformed = true;
        }
        if (gender) {
            user.gender = gender;
            updatePerformed = true;
        }
        if (profilePicture && cloudResponse) {
            user.profilePicture = cloudResponse.secure_url;
            updatePerformed = true;
        }

        if (!updatePerformed) {
            return res.status(400).json({
                message: "No valid update data provided",
                success: false
            });
        }

        // Only then proceed with user.save()

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            updates: {
                bioUpdated: Boolean(bio),
                genderUpdated: Boolean(gender),
                profilePictureUpdated: Boolean(profilePicture && cloudResponse)
            }
        });
    }


    catch (error) {
        console.log("Error in editProfile:", error);
        return res.status(500).json({ message: "Profile update failed", success: false, error: error.message });
    }
}



export const GetsuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.userId } }).select("-password")
        if (!suggestedUsers) {
            return res.status(404).json({ message: "No users found", success: false });
        }
        return res.status(200).json({
            users: suggestedUsers,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
}



export const followorUnfollow = async (req, res) => {
    try {
        const follower = req.id;
        const followee = req.params.id;

        // Self-following check
        if (follower === followee) {
            return res.status(400).json({ message: "Haha Sorry...You cannot follow yourself", success: false });
        }

        // Start a Mongoose session
        const session = await mongoose.startSession();
        session.startTransaction();

        // Fetch both users concurrently within the session
        const [user, followeeUser] = await Promise.all([
            User.findById(follower).session(session),
            User.findById(followee).session(session)
        ]);

        // Check if both users exist
        if (!user || !followeeUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isFollowing = user.following.includes(followee);

        if (isFollowing) {
            await Promise.all([
                User.updateOne({ _id: follower }, { $pull: { following: followee } }, { session }),
                User.updateOne({ _id: followee }, { $pull: { followers: follower } }, { session })
            ]);
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Unfollowed successfully', success: true });
        } else {
            await Promise.all([
                User.updateOne({ _id: follower }, { $addToSet: { following: followee } }, { session }),
                User.updateOne({ _id: followee }, { $addToSet: { followers: follower } }, { session })
            ]);
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Followed successfully', success: true });
        }

    } catch (error) {
        console.error(error);
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
}