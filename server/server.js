import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from './routes/authRoutes.js';
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();
const port = process.env.PORT || 8080;
app.set('trust proxy', 1);
const allowedOrigins = ['https://neokey.onrender.com', 'http://localhost:5173'];

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

connectDB().then(() => {
    // API Endpoints
    app.get('/', (req, res) => res.send("API working"));
    app.use('/auth', authRouter);
    app.use('/user', userRouter);
    app.use('/admin', adminRouter);
  
    // Start the server
    app.listen(port, () => console.log(`Server started on PORT: ${port}`));
  }).catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1); // Exit if DB connection fails
  });