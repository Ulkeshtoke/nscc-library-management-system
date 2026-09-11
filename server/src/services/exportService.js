import XLSX from 'xlsx';
import Transaction from '../models/Transaction.js';

/**
 * Generate an Excel XLSX workbook buffer of all transactions using the xlsx library
 */
export async function generateTransactionsXlsx(filter = {}) {
  const transactions = await Transaction.find(filter)
    .populate('book', 'title author isbn category')
    .populate('bookCopy', 'accessionCode condition')
    .sort({ issueDate: -1 });

  const now = new Date();

  // Map transactions into rows with all required columns
  const rows = transactions.map((tx, idx) => {
    const isOverdue =
      tx.status === 'ISSUED'
        ? now > new Date(tx.dueDate)
        : tx.returnDate
          ? new Date(tx.returnDate) > new Date(tx.dueDate)
          : false;

    return {
      'Sl No': idx + 1,
      'Accession Code': tx.accessionCode || '',
      'Book Title': tx.book?.title || 'Unknown Title',
      'Author': tx.book?.author || 'Unknown Author',
      'Category': tx.book?.category || 'General',
      'ISBN': tx.book?.isbn || '',
      'Borrower Name': tx.borrowerName || '',
      'Borrower Roll Number': tx.borrowerRollNumber || '',
      'Issue Date': tx.issueDate ? new Date(tx.issueDate).toISOString().split('T')[0] : '',
      'Due Date': tx.dueDate ? new Date(tx.dueDate).toISOString().split('T')[0] : '',
      'Return Date': tx.returnDate ? new Date(tx.returnDate).toISOString().split('T')[0] : 'Not Returned',
      'Status': tx.status || '',
      'Overdue': isOverdue ? 'YES' : 'NO',
      'Remarks': tx.remarks || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 20 }, // Accession Code
    { wch: 34 }, // Book Title
    { wch: 24 }, // Author
    { wch: 18 }, // Category
    { wch: 18 }, // ISBN
    { wch: 22 }, // Borrower Name
    { wch: 18 }, // Borrower Roll Number
    { wch: 14 }, // Issue Date
    { wch: 14 }, // Due Date
    { wch: 16 }, // Return Date
    { wch: 14 }, // Status
    { wch: 10 }, // Overdue
    { wch: 28 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  // Return binary buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
