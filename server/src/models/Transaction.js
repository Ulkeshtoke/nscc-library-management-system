import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Associated book is required'],
      index: true,
    },
    bookCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCopy',
      required: [true, 'Associated book copy is required'],
      index: true,
    },
    accessionCode: {
      type: String,
      required: [true, 'Accession code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    borrowerName: {
      type: String,
      required: [true, 'Borrower name is required'],
      trim: true,
    },
    borrowerRollNumber: {
      type: String,
      required: [true, 'Borrower roll number is required'],
      trim: true,
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED'],
      default: 'ISSUED',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for overdue determination
transactionSchema.virtual('isOverdue').get(function () {
  if (this.status === 'ISSUED') {
    return new Date() > new Date(this.dueDate);
  }
  if (this.returnDate && this.dueDate) {
    return new Date(this.returnDate) > new Date(this.dueDate);
  }
  return false;
});

// Fast lookups for active issues on an accession code
transactionSchema.index({ accessionCode: 1, status: 1 });
transactionSchema.index({ status: 1, dueDate: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
