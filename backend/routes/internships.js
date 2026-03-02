const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Internship = require('../models/Internship');
const Student = require('../models/Student');
const Company = require('../models/Company');
const { authenticateStudent, authenticateCompany, authenticateAdmin } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== SMART MATCHING ALGORITHM ====================

const calculateMatchScore = (student, internship) => {
    let score = 0;
    const maxScore = 100;

    // Field matching (40 points)
    if (student.field === internship.field) {
        score += 40;
    } else if (student.field.toLowerCase().includes(internship.field.toLowerCase()) ||
        internship.field.toLowerCase().includes(student.field.toLowerCase())) {
        score += 20;
    }

    // Location matching (30 points)
    if (student.location.district === internship.location.district) {
        score += 30;
    } else if (student.location.province === internship.location.province) {
        score += 15;
    }

    // Skills matching (30 points)
    if (internship.skillsRequired && internship.skillsRequired.length > 0 &&
        student.skills && student.skills.length > 0) {
        const matchingSkills = internship.skillsRequired.filter(skill =>
            student.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(s.toLowerCase()))
        );
        const skillScore = (matchingSkills.length / internship.skillsRequired.length) * 30;
        score += Math.round(skillScore);
    }

    return score;
};

// Get matched internships for a student
const getMatchedInternships = async (studentId) => {
    const student = await Student.findById(studentId);
    if (!student) return [];

    const internships = await Internship.find({
        status: 'open',
        isActive: true,
        $expr: { $lt: ['$filledPositions', '$positions'] }
    }).populate('companyId', 'companyName logo industry location');

    const matchedInternships = internships.map(internship => {
        const score = calculateMatchScore(student, internship);
        return { ...internship.toObject(), matchScore: score };
    });

    // Sort by match score (highest first)
    return matchedInternships.sort((a, b) => b.matchScore - a.matchScore);
};

// ==================== STUDENT ROUTES ====================

// Get matched internships for current student
router.get('/student/matched', authenticateStudent, async (req, res) => {
    try {
        const matchedInternships = await getMatchedInternships(req.user.id);
        res.json(matchedInternships);
    } catch (error) {
        console.error('Get matched internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search internships
router.get('/student/search', async (req, res) => {
    try {
        const { field, province, district, keyword } = req.query;

        let query = { status: 'open', isActive: true };

        if (field) query.field = field;
        if (province) query['location.province'] = province;
        if (district) query['location.district'] = district;
        if (keyword) {
            query.$text = { $search: keyword };
        }

        const internships = await Internship.find(query)
            .populate('companyId', 'companyName logo industry location')
            .sort({ createdAt: -1 });

        res.json(internships);
    } catch (error) {
        console.error('Search internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all open internships
router.get('/student/internships', async (req, res) => {
    try {
        const internships = await Internship.find({
            status: 'open',
            isActive: true
        })
            .populate('companyId', 'companyName logo industry location')
            .sort({ createdAt: -1 });

        res.json(internships);
    } catch (error) {
        console.error('Get internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single internship details
router.get('/student/internship/:id', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id)
            .populate('companyId', 'companyName logo industry location description website');

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        res.json(internship);
    } catch (error) {
        console.error('Get internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Apply for internship
router.post('/student/apply/:id', authenticateStudent, [
    body('coverLetter').optional().trim()
], validate, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.status !== 'open') {
            return res.status(400).json({ message: 'This internship is no longer accepting applications' });
        }

        // Check if already applied
        const alreadyApplied = internship.applicants.some(
            app => app.studentId.toString() === req.user.id
        );

        if (alreadyApplied) {
            return res.status(400).json({ message: 'You have already applied for this internship' });
        }

        // Get student CV
        const student = await Student.findById(req.user.id);

        // Add application
        internship.applicants.push({
            studentId: req.user.id,
            coverLetter: req.body.coverLetter || '',
            cvUrl: student.cv || ''
        });

        await internship.save();

        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Apply for internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student's applications
router.get('/student/applications', authenticateStudent, async (req, res) => {
    try {
        const internships = await Internship.find({
            'applicants.studentId': req.user.id
        }).populate('companyId', 'companyName logo location');

        const applications = internships.map(internship => {
            const application = internship.applicants.find(
                app => app.studentId.toString() === req.user.id
            );
            return {
                internship: {
                    _id: internship._id,
                    title: internship.title,
                    field: internship.field,
                    duration: internship.duration,
                    location: internship.location,
                    company: internship.companyId
                },
                status: application.status,
                appliedAt: application.appliedAt,
                updatedAt: application.updatedAt
            };
        });

        res.json(applications);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Withdraw application
router.delete('/student/withdraw/:id', authenticateStudent, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        internship.applicants = internship.applicants.filter(
            app => app.studentId.toString() !== req.user.id
        );

        await internship.save();

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error('Withdraw application error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== COMPANY ROUTES ====================

// Create internship
router.post('/company/internship', authenticateCompany, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('field').notEmpty().withMessage('Field is required'),
    body('location.province').notEmpty().withMessage('Province is required'),
    body('location.district').notEmpty().withMessage('District is required'),
    body('duration').notEmpty().withMessage('Duration is required'),
    body('positions').isInt({ min: 1 }).withMessage('Positions must be at least 1')
], validate, async (req, res) => {
    try {
        const { title, description, requirements, field, skillsRequired, location, duration, positions, salary, type, startDate, endDate } = req.body;

        const internship = new Internship({
            title,
            companyId: req.user.id,
            description,
            requirements,
            field,
            skillsRequired: skillsRequired || [],
            location,
            duration,
            positions,
            salary: salary || 'Negotiable',
            type: type || 'unpaid',
            startDate,
            endDate
        });

        await internship.save();

        res.status(201).json({
            message: 'Internship posted successfully',
            internship
        });
    } catch (error) {
        console.error('Create internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get company's internships
router.get('/company/internships', authenticateCompany, async (req, res) => {
    try {
        const internships = await Internship.find({ companyId: req.user.id })
            .sort({ createdAt: -1 });

        res.json(internships);
    } catch (error) {
        console.error('Get company internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get applicants for company's internship
router.get('/company/internship/:id/applicants', authenticateCompany, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id)
            .populate('applicants.studentId', 'name email phone school field skills location cv bio');

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.companyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this internship' });
        }

        // Calculate match scores for each applicant
        const applicantsWithScores = internship.applicants.map(applicant => {
            const student = applicant.studentId;
            const matchScore = student ? calculateMatchScore(student, internship) : 0;
            return { ...applicant.toObject(), matchScore };
        });

        // Sort by match score
        applicantsWithScores.sort((a, b) => b.matchScore - a.matchScore);

        res.json(applicantsWithScores);
    } catch (error) {
        console.error('Get applicants error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update application status
router.put('/company/application/:internshipId/:studentId', authenticateCompany, [
    body('status').isIn(['accepted', 'rejected', 'interview']).withMessage('Invalid status')
], validate, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const internship = await Internship.findById(req.params.internshipId);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.companyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const applicant = internship.applicants.find(
            app => app.studentId.toString() === req.params.studentId
        );

        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }

        applicant.status = status;
        applicant.notes = notes || '';
        applicant.updatedAt = Date.now();

        if (status === 'accepted') {
            internship.filledPositions += 1;
            if (internship.filledPositions >= internship.positions) {
                internship.status = 'filled';
            }
        }

        await internship.save();

        res.json({ message: 'Application status updated', applicant });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update internship
router.put('/company/internship/:id', authenticateCompany, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.companyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, description, requirements, field, skillsRequired, location, duration, positions, salary, type, status, startDate, endDate } = req.body;

        if (title) internship.title = title;
        if (description) internship.description = description;
        if (requirements !== undefined) internship.requirements = requirements;
        if (field) internship.field = field;
        if (skillsRequired) internship.skillsRequired = skillsRequired;
        if (location) internship.location = location;
        if (duration) internship.duration = duration;
        if (positions) internship.positions = positions;
        if (salary) internship.salary = salary;
        if (type) internship.type = type;
        if (status) internship.status = status;
        if (startDate) internship.startDate = startDate;
        if (endDate) internship.endDate = endDate;
        internship.updatedAt = Date.now();

        await internship.save();

        res.json({ message: 'Internship updated successfully', internship });
    } catch (error) {
        console.error('Update internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete internship
router.delete('/company/internship/:id', authenticateCompany, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.companyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        internship.isActive = false;
        internship.status = 'closed';
        await internship.save();

        res.json({ message: 'Internship deleted successfully' });
    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all internships (admin)
router.get('/admin/internships', authenticateAdmin, async (req, res) => {
    try {
        const { status, field, company } = req.query;

        let query = {};
        if (status) query.status = status;
        if (field) query.field = field;
        if (company) query.companyId = company;

        const internships = await Internship.find(query)
            .populate('companyId', 'companyName approved')
            .sort({ createdAt: -1 });

        res.json(internships);
    } catch (error) {
        console.error('Get all internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete any internship (admin)
router.delete('/admin/internship/:id', authenticateAdmin, async (req, res) => {
    try {
        const internship = await Internship.findByIdAndDelete(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        res.json({ message: 'Internship deleted successfully' });
    } catch (error) {
        console.error('Admin delete internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get system statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Company = require('../models/Company');

        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalCompanies = await Company.countDocuments({ isActive: true, approved: true });
        const pendingCompanies = await Company.countDocuments({ isActive: true, approved: false });
        const totalInternships = await Internship.countDocuments({ isActive: true });
        const openInternships = await Internship.countDocuments({ status: 'open', isActive: true });
        const filledInternships = await Internship.countDocuments({ status: 'filled', isActive: true });

        // Calculate total applications
        const allInternships = await Internship.find({ isActive: true });
        const totalApplications = allInternships.reduce((acc, int) => acc + int.applicants.length, 0);
        const acceptedApplications = allInternships.reduce(
            (acc, int) => acc + int.applicants.filter(a => a.status === 'accepted').length,
            0
        );

        const placementRate = totalApplications > 0
            ? Math.round((acceptedApplications / totalApplications) * 100)
            : 0;

        res.json({
            totalStudents,
            totalCompanies,
            pendingCompanies,
            totalInternships,
            openInternships,
            filledInternships,
            totalApplications,
            acceptedApplications,
            placementRate
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
