const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  school: {
    type: String,
    required: true,
    trim: true
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
  skills: [{
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
  cv: {
    type: String // URL to uploaded CV
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: ''
  },
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

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform output
studentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);
