import Book from '../models/Book.js';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';
import { generateAccessionCode } from '../utils/accessionCodeGenerator.js';
import { generateQrDataUrl } from '../services/qrService.js';

/**
 * List all active books with their copy counts
 */
export async function getAllBooks(req, res, next) {
  try {
    const { search, category, availability } = req.query;
    const filter = { isArchived: false };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });

    // Ensure all counts match live BookCopy records
    let booksWithLiveCounts = await Promise.all(
      books.map(async (book) => {
        const [total, available] = await Promise.all([
          BookCopy.countDocuments({ book: book._id, isArchived: false }),
          BookCopy.countDocuments({ book: book._id, status: 'AVAILABLE', isArchived: false }),
        ]);

        return {
          ...book.toObject(),
          totalCopies: total,
          availableCopies: available,
        };
      })
    );

    // Filter by availability
    if (availability === 'AVAILABLE') {
      booksWithLiveCounts = booksWithLiveCounts.filter((b) => b.availableCopies > 0);
    } else if (availability === 'ISSUED') {
      booksWithLiveCounts = booksWithLiveCounts.filter((b) => b.totalCopies - b.availableCopies > 0);
    }

    res.json({ success: true, count: booksWithLiveCounts.length, data: booksWithLiveCounts });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single book with all its physical copies
 */
export async function getBookById(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book title not found' });
    }

    const copies = await BookCopy.find({ book: book._id, isArchived: false }).sort({ accessionCode: 1 });

    // Attach generated QR data URLs to each copy
    const copiesWithQr = await Promise.all(
      copies.map(async (copy) => {
        const qrCodeUrl = await generateQrDataUrl(copy.accessionCode);
        return {
          ...copy.toObject(),
          qrCodeUrl,
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...book.toObject(),
        totalCopies: copies.length,
        availableCopies: copies.filter((c) => c.status === 'AVAILABLE').length,
        copies: copiesWithQr,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new book title and initial physical copies atomically/reliably.
 * If copy creation fails, the book is deleted to prevent orphan titles.
 */
export async function createBook(req, res, next) {
  let createdBook = null;

  try {
    const { title, author, isbn, category, publisher, publishedYear, initialCopies, customAccessionCodes } = req.body;

    const copyCount = Math.max(1, parseInt(initialCopies, 10) || 1);

    // 1. Create the bibliographic title
    createdBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn ? isbn.trim() : '',
      category: category ? category.trim() : 'General',
      publisher: publisher ? publisher.trim() : '',
      publishedYear: publishedYear ? Number(publishedYear) : null,
      totalCopies: 0,
      availableCopies: 0,
    });

    // 2. Prepare accession codes for physical copies
    const codesToCreate = [];
    if (Array.isArray(customAccessionCodes) && customAccessionCodes.length === copyCount) {
      for (const code of customAccessionCodes) {
        codesToCreate.push(code.trim().toUpperCase());
      }
    } else {
      for (let i = 0; i < copyCount; i++) {
        const code = await generateAccessionCode();
        codesToCreate.push(code);
      }
    }

    // 3. Create BookCopy records
    const copyDocs = codesToCreate.map((code) => ({
      book: createdBook._id,
      accessionCode: code,
      status: 'AVAILABLE',
      condition: 'Good',
    }));

    const createdCopies = await BookCopy.insertMany(copyDocs);

    // 4. Update the book's copy counts strictly
    createdBook.totalCopies = createdCopies.length;
    createdBook.availableCopies = createdCopies.length;
    await createdBook.save();

    res.status(201).json({
      success: true,
      message: `Book '${createdBook.title}' created with ${createdCopies.length} physical copies`,
      data: {
        ...createdBook.toObject(),
        copies: createdCopies,
      },
    });
  } catch (err) {
    // If book was created but copy creation failed, rollback created book to prevent orphan record
    if (createdBook && createdBook._id) {
      try {
        await Book.findByIdAndDelete(createdBook._id);
        await BookCopy.deleteMany({ book: createdBook._id });
        console.warn(`[Rollback] Removed orphan book ${createdBook._id} following copy creation error`);
      } catch (cleanupErr) {
        console.error('Error rolling back orphan book:', cleanupErr.message);
      }
    }
    next(err);
  }
}

/**
 * Add physical copies to an existing book title
 */
export async function addCopiesToBook(req, res, next) {
  try {
    const { id } = req.params;
    const { count, accessionCodes } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book title not found' });
    }

    const numToAdd = Math.max(1, parseInt(count, 10) || 1);
    const codesToUse = [];

    if (Array.isArray(accessionCodes) && accessionCodes.length === numToAdd) {
      for (const c of accessionCodes) {
        codesToUse.push(c.trim().toUpperCase());
      }
    } else {
      for (let i = 0; i < numToAdd; i++) {
        codesToUse.push(await generateAccessionCode());
      }
    }

    const copyDocs = codesToUse.map((code) => ({
      book: book._id,
      accessionCode: code,
      status: 'AVAILABLE',
      condition: 'Good',
    }));

    const createdCopies = await BookCopy.insertMany(copyDocs);
    await Book.syncCopyCounts(book._id);

    const updatedBook = await Book.findById(book._id);

    res.status(201).json({
      success: true,
      message: `Added ${createdCopies.length} copies to '${book.title}'`,
      data: {
        book: updatedBook,
        copies: createdCopies,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update bibliographic details
 */
export async function updateBook(req, res, next) {
  try {
    const { title, author, isbn, category, publisher, publishedYear } = req.body;

    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      {
        ...(title ? { title: title.trim() } : {}),
        ...(author ? { author: author.trim() } : {}),
        ...(isbn !== undefined ? { isbn: isbn.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(publisher !== undefined ? { publisher: publisher.trim() } : {}),
        ...(publishedYear !== undefined ? { publishedYear: Number(publishedYear) } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    res.json({ success: true, message: 'Book updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Archive a book and its physical copies (safe delete)
 */
export async function archiveBook(req, res, next) {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check if any copy is currently issued
    const issuedCount = await BookCopy.countDocuments({
      book: id,
      status: 'ISSUED',
    });

    if (issuedCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot archive '${book.title}': ${issuedCount} physical copy/copies are currently issued and must be returned first.`,
      });
    }

    // Archive book and its copies
    book.isArchived = true;
    await book.save();

    await BookCopy.updateMany({ book: id }, { isArchived: true, status: 'ARCHIVED' });

    res.json({
      success: true,
      message: `Book '${book.title}' and all associated physical copies archived successfully`,
    });
  } catch (err) {
    next(err);
  }
}
