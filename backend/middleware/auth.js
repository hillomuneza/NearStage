const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'riapms_secret_key_2024';

// Verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token.' });
    }
};

// Authenticate student
const authenticateStudent = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Student role required.' });
        }

        const student = await Student.findById(decoded.id);
        if (!student || !student.isActive) {
            return res.status(401).json({ message: 'Invalid token or account inactive.' });
        }

        req.user = { ...decoded, user: student };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Authenticate company
const authenticateCompany = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'company') {
            return res.status(403).json({ message: 'Access denied. Company role required.' });
        }

        const company = await Company.findById(decoded.id);
        if (!company || !company.isActive) {
            return res.status(401).json({ message: 'Invalid token or account inactive.' });
        }

        if (!company.approved) {
            return res.status(403).json({ message: 'Company account not approved.' });
        }

        req.user = { ...decoded, user: company };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Authenticate admin
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: 'Invalid token or account inactive.' });
        }

        req.user = { ...decoded, user: admin };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role || 'student' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = {
    verifyToken,
    authenticateStudent,
    authenticateCompany,
    authenticateAdmin,
    generateToken,
    JWT_SECRET
};
