const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const { authenticateAdmin } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== COMPANY MANAGEMENT ====================

// Get all companies
router.get('/companies', authenticateAdmin, async (req, res) => {
    try {
        const { approved, isActive } = req.query;

        let query = {};
        if (approved !== undefined) query.approved = approved === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const companies = await Company.find(query).sort({ createdAt: -1 });
        res.json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single company
router.get('/company/:id', authenticateAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate({
                path: 'internships',
                select: 'title field status positions filledPositions createdAt'
            });

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve company
router.put('/company/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        company.approved = true;
        company.updatedAt = Date.now();
        await company.save();

        res.json({ message: 'Company approved successfully', company });
    } catch (error) {
        console.error('Approve company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject company
router.put('/company/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        company.approved = false;
        company.isActive = false;
        company.updatedAt = Date.now();
        await company.save();

        res.json({ message: 'Company rejected and deactivated', company });
    } catch (error) {
        console.error('Reject company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle company status
router.put('/company/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        company.isActive = !company.isActive;
        company.updatedAt = Date.now();
        await company.save();

        res.json({
            message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`,
            company
        });
    } catch (error) {
        console.error('Toggle company status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete company
router.delete('/company/:id', authenticateAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Delete all internships by this company
        await Internship.deleteMany({ companyId: company._id });

        // Delete company
        await Company.findByIdAndDelete(req.params.id);

        res.json({ message: 'Company and all their internships deleted successfully' });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== STUDENT MANAGEMENT ====================

// Get all students
router.get('/students', authenticateAdmin, async (req, res) => {
    try {
        const { field, isActive } = req.query;

        let query = {};
        if (field) query.field = field;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const students = await Student.find(query).sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single student
router.get('/student/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get student's applications
        const internships = await Internship.find({
            'applicants.studentId': student._id
        });

        const applications = internships.map(internship => {
            const application = internship.applicants.find(
                app => app.studentId.toString() === student._id.toString()
            );
            return {
                internshipId: internship._id,
                title: internship.title,
                company: internship.companyId,
                status: application.status,
                appliedAt: application.appliedAt
            };
        });

        res.json({ student, applications });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle student status
router.put('/student/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        student.isActive = !student.isActive;
        student.updatedAt = Date.now();
        await student.save();

        res.json({
            message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
            student
        });
    } catch (error) {
        console.error('Toggle student status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student
router.delete('/student/:id', authenticateAdmin, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Remove student from all internship applications
        const internships = await Internship.find({ 'applicants.studentId': student._id });
        for (const internship of internships) {
            internship.applicants = internship.applicants.filter(
                app => app.studentId.toString() !== student._id.toString()
            );
            await internship.save();
        }

        // Delete student
        await Student.findByIdAndDelete(req.params.id);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== INTERNSHIP MANAGEMENT ====================

// Get all internships (admin view)
router.get('/internships', authenticateAdmin, async (req, res) => {
    try {
        const { status, field, companyId } = req.query;

        let query = { isActive: true };
        if (status) query.status = status;
        if (field) query.field = field;
        if (companyId) query.companyId = companyId;

        const internships = await Internship.find(query)
            .populate('companyId', 'companyName approved')
            .sort({ createdAt: -1 });

        res.json(internships);
    } catch (error) {
        console.error('Get internships error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete any internship
router.delete('/internship/:id', authenticateAdmin, async (req, res) => {
    try {
        const internship = await Internship.findByIdAndDelete(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        res.json({ message: 'Internship deleted successfully' });
    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== STATISTICS ====================

// Get system statistics
router.get('/statistics', authenticateAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalCompanies = await Company.countDocuments({ isActive: true, approved: true });
        const pendingCompanies = await Company.countDocuments({ isActive: true, approved: false });
        const totalInternships = await Internship.countDocuments({ isActive: true });
        const openInternships = await Internship.countDocuments({ status: 'open', isActive: true });
        const closedInternships = await Internship.countDocuments({ status: 'closed', isActive: true });

        // Calculate applications
        const allInternships = await Internship.find({ isActive: true });
        const totalApplications = allInternships.reduce((acc, int) => acc + int.applicants.length, 0);

        const pendingApplications = allInternships.reduce(
            (acc, int) => acc + int.applicants.filter(a => a.status === 'pending').length,
            0
        );

        const acceptedApplications = allInternships.reduce(
            (acc, int) => acc + int.applicants.filter(a => a.status === 'accepted').length,
            0
        );

        const rejectedApplications = allInternships.reduce(
            (acc, int) => acc + int.applicants.filter(a => a.status === 'rejected').length,
            0
        );

        // Field distribution
        const fieldDistribution = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$field', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Location distribution
        const locationDistribution = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$location.province', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            totalStudents,
            totalCompanies,
            pendingCompanies,
            totalInternships,
            openInternships,
            closedInternships,
            totalApplications,
            pendingApplications,
            acceptedApplications,
            rejectedApplications,
            placementSuccessRate: totalApplications > 0
                ? Math.round((acceptedApplications / totalApplications) * 100)
                : 0,
            fieldDistribution,
            locationDistribution
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
