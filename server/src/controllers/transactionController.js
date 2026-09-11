import Transaction from '../models/Transaction.js';
import { issueBookCopy } from '../services/issueService.js';
import { returnBookCopy } from '../services/returnService.js';
import { generateTransactionsXlsx } from '../services/exportService.js';

/**
 * Handle issue request
 */
export async function handleIssue(req, res, next) {
  try {
    const result = await issueBookCopy(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Handle return request
 */
export async function handleReturn(req, res, next) {
  try {
    const result = await returnBookCopy(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * List all transactions with computed overdue flags
 */
export async function getAllTransactions(req, res, next) {
  try {
    const { status, accessionCode, borrower, overdueOnly } = req.query;
    const filter = {};

    if (status && ['ISSUED', 'RETURNED'].includes(status)) {
      filter.status = status;
    }

    if (accessionCode) {
      filter.accessionCode = accessionCode.trim().toUpperCase();
    }

    if (borrower) {
      filter.$or = [
        { borrowerName: { $regex: borrower, $options: 'i' } },
        { borrowerRollNumber: { $regex: borrower, $options: 'i' } },
      ];
    }

    const now = new Date();
    if (overdueOnly === 'true') {
      filter.status = 'ISSUED';
      filter.dueDate = { $lt: now };
    }

    const transactions = await Transaction.find(filter)
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'accessionCode condition status')
      .sort({ createdAt: -1 });

    // Ensure overdue flag is calculated from active Transaction's dueDate and status
    const computedTransactions = transactions.map((t) => {
      const obj = t.toObject();
      const isOverdue =
        obj.status === 'ISSUED'
          ? now > new Date(obj.dueDate)
          : obj.returnDate
            ? new Date(obj.returnDate) > new Date(obj.dueDate)
            : false;

      return {
        ...obj,
        isOverdue,
      };
    });

    res.json({
      success: true,
      count: computedTransactions.length,
      data: computedTransactions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Export transactions to XLSX spreadsheet
 */
export async function exportTransactions(req, res, next) {
  try {
    const buffer = await generateTransactionsXlsx({});

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="library-transactions-${new Date().toISOString().split('T')[0]}.xlsx"`
    );

    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
