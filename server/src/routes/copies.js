import express from 'express';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';
import { generateQrDataUrl } from '../services/qrService.js';

const router = express.Router();

/**
 * List all physical copies with filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, bookId, search } = req.query;
    const filter = { isArchived: false };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (bookId) {
      filter.book = bookId;
    }

    if (search) {
      filter.accessionCode = { $regex: search, $options: 'i' };
    }

    const copies = await BookCopy.find(filter)
      .populate('book', 'title author isbn category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: copies.length, data: copies });
  } catch (err) {
    next(err);
  }
});

/**
 * Lookup a single copy by its accession code.
 * Returns book details, copy status, and active transaction if currently issued.
 * Crucial for manual entry and QR scanner resolution.
 */
router.get('/lookup/:accessionCode', async (req, res, next) => {
  try {
    const code = req.params.accessionCode.trim().toUpperCase();
    const copy = await BookCopy.findOne({ accessionCode: code, isArchived: false })
      .populate('book', 'title author isbn category publisher');

    if (!copy) {
      return res.status(404).json({
        success: false,
        error: `No book copy found with accession code '${code}'. Please verify the code.`,
      });
    }

    let activeTransaction = null;
    if (copy.status === 'ISSUED') {
      activeTransaction = await Transaction.findOne({
        bookCopy: copy._id,
        status: 'ISSUED',
      }).sort({ issueDate: -1 });
    }

    const qrCodeUrl = await generateQrDataUrl(copy.accessionCode);

    res.json({
      success: true,
      data: {
        ...copy.toObject(),
        qrCodeUrl,
        activeTransaction,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get reproducible QR code data URL for a copy
 */
router.get('/:id/qr', async (req, res, next) => {
  try {
    const copy = await BookCopy.findById(req.params.id);
    if (!copy) {
      return res.status(404).json({ success: false, error: 'Book copy not found' });
    }

    const qrCodeUrl = await generateQrDataUrl(copy.accessionCode);
    res.json({ success: true, accessionCode: copy.accessionCode, qrCodeUrl });
  } catch (err) {
    next(err);
  }
});

/**
 * Printable copy labels with QR codes
 */
router.get('/labels/all', async (req, res, next) => {
  try {
    const copies = await BookCopy.find({ isArchived: false })
      .populate('book', 'title author category')
      .sort({ accessionCode: 1 });

    const labels = await Promise.all(
      copies.map(async (copy) => {
        const qrCodeUrl = await generateQrDataUrl(copy.accessionCode, { width: 180 });
        return {
          id: copy._id,
          accessionCode: copy.accessionCode,
          title: copy.book?.title || 'Unknown Title',
          author: copy.book?.author || 'Unknown Author',
          category: copy.book?.category || 'General',
          condition: copy.condition,
          status: copy.status,
          qrCodeUrl,
        };
      })
    );

    res.json({ success: true, count: labels.length, data: labels });
  } catch (err) {
    next(err);
  }
});

export default router;
