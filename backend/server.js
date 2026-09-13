import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors'; 
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import aiRoutes from './routes/aiRoutes.js';

// 1. Load environment variables first so mongoose can read MONGO_URI
dotenv.config();

// 2. Initialize the express application object
const app = express();

// 3. Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json()); // This allows Express to read JSON data sent by the client.

// 4. Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// 5. API Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes); // This mounts your login/register endpoints perfectly!
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/ai', aiRoutes);
// 6. Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});