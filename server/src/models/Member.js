import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    membershipId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    memberType: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'STAFF'],
      default: 'STUDENT',
      required: true,
      index: true,
    },
    rollOrEmployeeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    maxAllowedBooks: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound index for searches
memberSchema.index({ fullName: 'text', rollOrEmployeeNumber: 'text', membershipId: 'text' });

const Member = mongoose.model('Member', memberSchema);

export default Member;
