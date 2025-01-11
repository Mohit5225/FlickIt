import { User } from "../models/user.model";

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

        await User.create


        } catch (error) {
            console.log(error);

        }
    }