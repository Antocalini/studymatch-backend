// src/index.js (Corrected)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { startTelegramClient } from './services/telegram.js'; // Ensure this is imported and called

// Import your main aggregated router
import apiRoutes from './routes/index.js'; // Import the default export from src/routes/index.js

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Initialize Telegram client
startTelegramClient(); // Call this function to log in the bot

// Global Middlewares
app.use(cors()); // Enable CORS for all origins (you might want to restrict this in production)
app.use(express.json()); // Body parser for JSON data
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// Security middlewares
app.use(helmet());

// Rate limiting (adjust as needed for your application's needs)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);


// Mount your main API router under the /api prefix
// All specific routes (auth, users, groups, careers, scrape) will be handled by apiRoutes
app.use('/api', apiRoutes); // This is the only line needed for mounting all your API routes

// Basic route for health check or root access
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware (optional, but good practice to have a centralized handler)
// app.use(errorHandler); // If you have a custom error handling middleware

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));