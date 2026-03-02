require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./backend/routes/auth');
const internshipRoutes = require('./backend/routes/internships');
const adminRoutes = require('./backend/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NearStage API is running',
        timestamp: new Date().toISOString()
    });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nearstage';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');

        // Seed admin account if not exists
        seedAdmin();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });

// Seed admin account
const Admin = require('./backend/models/Admin');

const seedAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ email: 'admin@nearstage.rw' });
        if (!adminExists) {
            const admin = new Admin({
                name: 'Super Admin',
                email: 'admin@nearstage.rw',
                password: 'admin123',
                role: 'super_admin',
                phone: '+250788000000'
            });
            await admin.save();
            console.log('✅ Admin account created: admin@nearstage.rw / admin123');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

// Serve frontend for any unknown routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (optional, but good practice)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// ... existing code ...

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Export as Firebase Function
exports.api = functions.https.onRequest(app);

// Start server locally (if not running as a function)
if (process.env.NODE_ENV !== 'production' || !process.env.FIREBASE_CONFIG) {
    app.listen(PORT, () => {
        console.log(`🚀 NearStage Server running on port ${PORT}`);
        console.log(`📱 API available at http://localhost:${PORT}/api`);
    });
}
