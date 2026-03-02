const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const { generateToken, authenticateStudent, authenticateCompany, authenticateAdmin } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ==================== STUDENT AUTH ====================

// Register student
router.post('/student/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('school').trim().notEmpty().withMessage('School is required'),
  body('field').notEmpty().withMessage('Field of study is required'),
  body('location.province').notEmpty().withMessage('Province is required'),
  body('location.district').notEmpty().withMessage('District is required')
], validate, async (req, res) => {
  try {
    const { name, email, password, phone, school, field, skills, location, bio } = req.body;

    // Check if student exists
    let student = await Student.findOne({ email });
    if (student) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    // Create student
    student = new Student({
      name,
      email,
      password,
      phone,
      school,
      field,
      skills: skills || [],
      location,
      bio
    });

    await student.save();

    const token = generateToken(student);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: student
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login student
router.post('/student/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!student.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(student);

    res.json({
      message: 'Login successful',
      token,
      user: student
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current student profile
router.get('/student/me', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student profile
router.put('/student/profile', authenticateStudent, async (req, res) => {
  try {
    const { name, phone, school, field, skills, location, bio, avatar } = req.body;

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (school) student.school = school;
    if (field) student.field = field;
    if (skills) student.skills = skills;
    if (location) student.location = location;
    if (bio !== undefined) student.bio = bio;
    if (avatar) student.avatar = avatar;
    student.updatedAt = Date.now();

    await student.save();

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload CV
router.post('/student/cv', authenticateStudent, async (req, res) => {
  try {
    const { cv } = req.body;
    
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.cv = cv;
    student.updatedAt = Date.now();
    await student.save();

    res.json({ message: 'CV uploaded successfully', cv: student.cv });
  } catch (error) {
    console.error('Upload CV error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== COMPANY AUTH ====================

// Register company
router.post('/company/register', [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('location.province').notEmpty().withMessage('Province is required'),
  body('location.district').notEmpty().withMessage('District is required')
], validate, async (req, res) => {
  try {
    const { companyName, email, password, phone, industry, location, description, website, logo } = req.body;

    // Check if company exists
    let company = await Company.findOne({ email });
    if (company) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // Create company (requires approval)
    company = new Company({
      companyName,
      email,
      password,
      phone,
      industry,
      location,
      description,
      website,
      logo,
      approved: false // Requires admin approval
    });

    await company.save();

    const token = generateToken(company);

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      token,
      user: company
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login company
router.post('/company/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!company.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    if (!company.approved) {
      return res.status(403).json({ message: 'Your account is pending approval by admin' });
    }

    const token = generateToken(company);

    res.json({
      message: 'Login successful',
      token,
      user: company
    });
  } catch (error) {
    console.error('Company login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current company profile
router.get('/company/me', authenticateCompany, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company profile
router.put('/company/profile', authenticateCompany, async (req, res) => {
  try {
    const { companyName, phone, industry, location, description, website, logo } = req.body;

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (companyName) company.companyName = companyName;
    if (phone) company.phone = phone;
    if (industry) company.industry = industry;
    if (location) company.location = location;
    if (description !== undefined) company.description = description;
    if (website) company.website = website;
    if (logo) company.logo = logo;
    company.updatedAt = Date.now();

    await company.save();

    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN AUTH ====================

// Login admin
router.post('/admin/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(admin);

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    res.json({
      message: 'Login successful',
      token,
      user: admin
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current admin profile
router.get('/admin/me', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
