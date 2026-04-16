const path = require('path');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const publicRoutes = require('./routes/publicRoutes');
const productRoutes = require('./routes/productRoutes');
const startReminderCron = require('./utils/reminderCron');
const agentRoutes = require('./routes/agentRoutes');
const agentCronService = require('./agents/agentCron');

connectDB();

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — restrict to known frontend origin in production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow any origin if FRONTEND_URL is not set (dev fallback)
        if (!process.env.FRONTEND_URL) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Rate limiting — auth routes: 20 req/15min per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50000,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter — 200 req/15min per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200000,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customer', apiLimiter, customerRoutes);
app.use('/api/invoice', apiLimiter, invoiceRoutes);
app.use('/api/whatsapp', apiLimiter, whatsappRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/agents', apiLimiter, agentRoutes);
app.use('/api/product', apiLimiter, productRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startReminderCron();

    // Start background agents if enabled
    if (process.env.ENABLE_BACKGROUND_AGENTS !== 'false') {
        try {
            agentCronService.start();
            console.log('Background agents started successfully');
        } catch (error) {
            console.error('Failed to start background agents:', error.message);
        }
    } else {
        console.log('Background agents disabled (ENABLE_BACKGROUND_AGENTS=false)');
    }
});
