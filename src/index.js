import express from 'express';
import "dotenv/config";
import cors from 'cors';
import job from './lib/corn.js';

import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import { connectDB } from './lib/db.js';

const app = express();
const PORT = process.env.PORT;

// job.start();
app.use(express.json()); // Middleware to parse JSON data

app.use("/api/auth", authRoutes);
app.use("/api/auth", bookRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});