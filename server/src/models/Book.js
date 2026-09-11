import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publishedYear: {
      type: Number,
      default: null,
    },
    totalCopies: {
      type: Number,
      default: 0,
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      default: 0,
      min: [0, 'Available copies cannot be negative'],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual relationship to BookCopy documents
bookSchema.virtual('copies', {
  ref: 'BookCopy',
  localField: '_id',
  foreignField: 'book',
});

// Helper static method to resynchronize counts from BookCopy documents
bookSchema.statics.syncCopyCounts = async function (bookId) {
  const BookCopy = mongoose.model('BookCopy');
  const [total, available] = await Promise.all([
    BookCopy.countDocuments({ book: bookId, isArchived: false }),
    BookCopy.countDocuments({ book: bookId, status: 'AVAILABLE', isArchived: false }),
  ]);

  await this.findByIdAndUpdate(bookId, {
    totalCopies: total,
    availableCopies: available,
  });

  return { totalCopies: total, availableCopies: available };
};

const Book = mongoose.model('Book', bookSchema);
export default Book;
