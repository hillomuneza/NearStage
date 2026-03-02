const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'interview'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  coverLetter: {
    type: String
  },
  cvUrl: {
    type: String
  },
  notes: {
    type: String
  },
  placementLetterUrl: {
    type: String
  }
});

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  requirements: {
    type: String,
    maxlength: 1000
  },
  field: {
    type: String,
    required: true,
    enum: [
      'IT', 'Computer Science', 'Engineering', 'Business', 'Marketing',
      'Finance', 'Accounting', 'Health', 'Education', 'Agriculture',
      'Tourism', 'Hospitality', 'Law', 'Arts', 'Science', 'Other'
    ]
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  location: {
    province: {
      type: String,
      required: true,
      enum: ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western', 'Northern']
    },
    district: {
      type: String,
      required: true
    },
    sector: {
      type: String
    }
  },
  duration: {
    type: String,
    required: true,
    enum: ['1 month', '2 months', '3 months', '4 months', '5 months', '6 months', '6+ months']
  },
  positions: {
    type: Number,
    required: true,
    min: 1
  },
  filledPositions: {
    type: Number,
    default: 0
  },
  salary: {
    type: String,
    default: 'Negotiable'
  },
  type: {
    type: String,
    enum: ['paid', 'unpaid', 'credit'],
    default: 'unpaid'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'filled'],
    default: 'open'
  },
  applicants: [applicationSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for searching
internshipSchema.index({ title: 'text', description: 'text', field: 'text' });

module.exports = mongoose.model('Internship', internshipSchema);
