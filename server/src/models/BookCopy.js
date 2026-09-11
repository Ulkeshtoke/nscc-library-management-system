import mongoose from 'mongoose';

const bookCopySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Associated book ID is required'],
      index: true,
    },
    accessionCode: {
      type: String,
      required: [true, 'Accession code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ISSUED', 'LOST', 'ARCHIVED'],
      default: 'AVAILABLE',
      index: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged'],
      default: 'Good',
    },
    barcodeData: {
      type: String,
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

// Post-save hook to resync parent Book copy counts
bookCopySchema.post('save', async function () {
  try {
    const Book = mongoose.model('Book');
    await Book.syncCopyCounts(this.book);
  } catch (err) {
    console.error('Failed to sync copy counts after save:', err.message);
  }
});

const BookCopy = mongoose.model('BookCopy', bookCopySchema);
export default BookCopy;
