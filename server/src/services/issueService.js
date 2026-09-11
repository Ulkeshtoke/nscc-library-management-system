import Book from '../models/Book.js';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';
import Member from '../models/Member.js';
import { withTransaction } from '../utils/atomic.js';

/**
 * Issue a book copy to a borrower
 */
export async function issueBookCopy({
  accessionCode,
  borrowerName,
  borrowerRollNumber,
  dueDate,
  remarks,
}) {
  // 1. Basic validation
  if (!accessionCode || typeof accessionCode !== 'string' || !accessionCode.trim()) {
    const error = new Error('Accession code is required');
    error.statusCode = 400;
    throw error;
  }

  if (!borrowerName || typeof borrowerName !== 'string' || !borrowerName.trim()) {
    const error = new Error('Borrower name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!borrowerRollNumber || typeof borrowerRollNumber !== 'string' || !borrowerRollNumber.trim()) {
    const error = new Error('Borrower roll number is required');
    error.statusCode = 400;
    throw error;
  }

  if (!dueDate) {
    const error = new Error('Due date is required');
    error.statusCode = 400;
    throw error;
  }

  const parsedDueDate = new Date(dueDate);
  if (isNaN(parsedDueDate.getTime())) {
    const error = new Error('Invalid due date format');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (parsedDueDate <= now) {
    const error = new Error('Due date must be in the future');
    error.statusCode = 400;
    throw error;
  }

  const cleanCode = accessionCode.trim().toUpperCase();
  const cleanBorrower = borrowerName.trim();
  const cleanRollNo = borrowerRollNumber.trim();

  // 2. Perform atomic issue within session
  return await withTransaction(async (session) => {
    // Look up copy first
    const copyQuery = BookCopy.findOne({ accessionCode: cleanCode });
    if (session) copyQuery.session(session);
    const existingCopy = await copyQuery;

    if (!existingCopy) {
      const error = new Error(`Book copy with accession code '${cleanCode}' not found`);
      error.statusCode = 404;
      throw error;
    }

    if (existingCopy.isArchived) {
      const error = new Error(`Book copy '${cleanCode}' is archived and cannot be issued`);
      error.statusCode = 400;
      throw error;
    }

    if (existingCopy.status !== 'AVAILABLE') {
      const error = new Error(`Book copy '${cleanCode}' is currently ${existingCopy.status.toLowerCase()} and cannot be issued`);
      error.statusCode = 400;
      throw error;
    }

    // Verify member borrowing limit if borrower is a registered member
    const member = await Member.findOne({
      $or: [
        { rollOrEmployeeNumber: cleanRollNo.toUpperCase() },
        { membershipId: cleanRollNo.toUpperCase() },
      ],
    });

    if (member) {
      if (member.status === 'SUSPENDED') {
        const error = new Error(`Borrowing blocked: Member account '${member.fullName}' (${cleanRollNo}) is currently suspended`);
        error.statusCode = 400;
        throw error;
      }

      if (member.status === 'INACTIVE') {
        const error = new Error(`Borrowing blocked: Member account '${member.fullName}' (${cleanRollNo}) is currently inactive`);
        error.statusCode = 400;
        throw error;
      }

      const activeLoansCount = await Transaction.countDocuments({
        $or: [
          { borrowerRollNumber: { $regex: `^${member.rollOrEmployeeNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
          { borrowerRollNumber: { $regex: `^${member.membershipId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        ],
        status: 'ISSUED',
      });

      if (activeLoansCount >= member.maxAllowedBooks) {
        const error = new Error(
          `Borrowing limit reached: Member '${member.fullName}' already has ${activeLoansCount} of ${member.maxAllowedBooks} allowed books on loan. Return an issued book before borrowing another.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Atomically transition from AVAILABLE to ISSUED
    const updateQuery = BookCopy.findOneAndUpdate(
      {
        _id: existingCopy._id,
        status: 'AVAILABLE',
        isArchived: false,
      },
      {
        status: 'ISSUED',
      },
      {
        new: true,
        ...(session ? { session } : {}),
      }
    );

    const updatedCopy = await updateQuery;
    if (!updatedCopy) {
      const error = new Error(`Concurrent modification: Book copy '${cleanCode}' was just issued to another borrower`);
      error.statusCode = 409;
      throw error;
    }

    // Create the active transaction
    const transactionData = {
      book: updatedCopy.book,
      bookCopy: updatedCopy._id,
      accessionCode: cleanCode,
      borrowerName: cleanBorrower,
      borrowerRollNumber: cleanRollNo,
      issueDate: new Date(),
      dueDate: parsedDueDate,
      status: 'ISSUED',
      remarks: remarks?.trim() || '',
    };

    let newTransaction;
    if (session) {
      const [created] = await Transaction.create([transactionData], { session });
      newTransaction = created;
    } else {
      newTransaction = await Transaction.create(transactionData);
    }

    // Sync parent book available copy counts
    await Book.syncCopyCounts(updatedCopy.book);

    // Populate book details for client
    const populatedTransaction = await Transaction.findById(newTransaction._id)
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'accessionCode condition status');

    return {
      success: true,
      message: `Book '${cleanCode}' successfully issued to ${cleanBorrower}`,
      transaction: populatedTransaction,
      copy: updatedCopy,
    };
  });
}
