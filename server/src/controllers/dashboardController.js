import Book from '../models/Book.js';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';

/**
 * Live dashboard stats calculated directly from database records
 */
export async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();

    const [
      totalActiveTitles,
      totalPhysicalCopies,
      availableCopies,
      issuedCopies,
      activeTransactions,
      overdueTransactionsCount,
      recentTransactions,
      activeLoans,
    ] = await Promise.all([
      // Total active book titles
      Book.countDocuments({ isArchived: false }),

      // Total physical copies
      BookCopy.countDocuments({ isArchived: false }),

      // Available copies
      BookCopy.countDocuments({ status: 'AVAILABLE', isArchived: false }),

      // Issued copies
      BookCopy.countDocuments({ status: 'ISSUED', isArchived: false }),

      // Active transactions: calculated strictly from open/ISSUED Transaction records
      Transaction.countDocuments({ status: 'ISSUED' }),

      // Overdue copies: active transactions where dueDate is in the past
      Transaction.countDocuments({
        status: 'ISSUED',
        dueDate: { $lt: now },
      }),

      // Recent 6 transactions
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('book', 'title author isbn category')
        .populate('bookCopy', 'accessionCode status'),

      // Currently issued active loans (strictly status === 'ISSUED')
      Transaction.find({ status: 'ISSUED' })
        .sort({ dueDate: 1 })
        .populate('book', 'title author isbn category')
        .populate('bookCopy', 'accessionCode status condition'),
    ]);

    // Compute overdue status for currently issued books
    const currentlyIssuedBooks = activeLoans.map((loan) => {
      const isOverdue = loan.dueDate ? now > new Date(loan.dueDate) : false;
      return {
        ...loan.toObject(),
        isOverdue,
      };
    });

    res.json({
      success: true,
      data: {
        totalTitles: totalActiveTitles,
        totalCopies: totalPhysicalCopies,
        availableCopies,
        issuedCopies,
        overdueCopies: overdueTransactionsCount,
        activeTransactions, // Strictly calculated from Transaction.countDocuments({ status: 'ISSUED' })
        recentTransactions,
        currentlyIssuedBooks,
      },
    });
  } catch (err) {
    next(err);
  }
}
