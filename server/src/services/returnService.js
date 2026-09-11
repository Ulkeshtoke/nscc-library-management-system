import Book from '../models/Book.js';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';
import { withTransaction } from '../utils/atomic.js';

/**
 * Process the return of an issued book copy
 */
export async function returnBookCopy({ accessionCode, remarks }) {
  if (!accessionCode || typeof accessionCode !== 'string' || !accessionCode.trim()) {
    const error = new Error('Accession code is required to return a book');
    error.statusCode = 400;
    throw error;
  }

  const cleanCode = accessionCode.trim().toUpperCase();

  return await withTransaction(async (session) => {
    // 1. Check copy exists
    const copyQuery = BookCopy.findOne({ accessionCode: cleanCode });
    if (session) copyQuery.session(session);
    const existingCopy = await copyQuery;

    if (!existingCopy) {
      const error = new Error(`Book copy with accession code '${cleanCode}' not found`);
      error.statusCode = 404;
      throw error;
    }

    if (existingCopy.status !== 'ISSUED') {
      const error = new Error(
        `Book copy '${cleanCode}' is not currently issued (current status: ${existingCopy.status})`
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Atomically transition copy from ISSUED to AVAILABLE
    const updateCopyQuery = BookCopy.findOneAndUpdate(
      {
        _id: existingCopy._id,
        status: 'ISSUED',
      },
      {
        status: 'AVAILABLE',
      },
      {
        new: true,
        ...(session ? { session } : {}),
      }
    );

    const updatedCopy = await updateCopyQuery;
    if (!updatedCopy) {
      const error = new Error(
        `Duplicate return attempt: Book copy '${cleanCode}' has already been returned`
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Find and close the active ISSUED transaction
    const returnTime = new Date();
    const updateTxQuery = Transaction.findOneAndUpdate(
      {
        bookCopy: updatedCopy._id,
        status: 'ISSUED',
      },
      {
        status: 'RETURNED',
        returnDate: returnTime,
        ...(remarks ? { remarks: remarks.trim() } : {}),
      },
      {
        new: true,
        sort: { issueDate: -1 },
        ...(session ? { session } : {}),
      }
    ).populate('book', 'title author isbn category');

    const closedTransaction = await updateTxQuery;

    // Sync parent book copy counts
    await Book.syncCopyCounts(updatedCopy.book);

    const wasOverdue =
      closedTransaction && closedTransaction.dueDate
        ? returnTime > new Date(closedTransaction.dueDate)
        : false;

    return {
      success: true,
      message: `Book '${cleanCode}' returned successfully${wasOverdue ? ' (Overdue return recorded)' : ''}`,
      transaction: closedTransaction,
      copy: updatedCopy,
      wasOverdue,
    };
  });
}
