const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema({
  companyName: {
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
  industry: {
    type: String,
    required: true,
    enum: [
      'IT', 'Finance', 'Healthcare', 'Education', 'Agriculture',
      'Tourism', 'Hospitality', 'Manufacturing', 'Retail', 'Construction',
      'Media', 'Telecommunications', 'Consulting', 'NGO', 'Government', 'Other'
    ]
  },
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
    },
    address: {
      type: String
    }
  },
  description: {
    type: String,
    maxlength: 1000
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  approved: {
    type: Boolean,
    default: false
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
companySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
companySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform output
companySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Company', companySchema);
