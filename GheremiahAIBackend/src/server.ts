import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import apiKeyRoutes from './routes/api-keys';
import extensionAuthRoutes from './routes/extension-auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gheremiah-ai';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://app.gheremiah.ai',
        process.env.FRONTEND_URL || ''
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/extension-auth', extensionAuthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Gheremiah AI Backend running on http://localhost:${PORT}`);
});