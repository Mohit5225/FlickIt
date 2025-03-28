
import dotenv from 'dotenv';
dotenv.config();

console.log("Environment check:", {
    MONGODB_URI: process.env.MONGODB_URI,
    FRONTEND_URL: process.env.FRONTEND_URL,
    PORT: process.env.PORT
});

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './utils/db.js';
import userRouter from './routes/user_route.js';
import postRouter from './routes/post_route.js';
import mess
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL
}));


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "i'm coming from backend",
        success: true
    });
});

app.use("/api/v1/user" , userRouter)

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});