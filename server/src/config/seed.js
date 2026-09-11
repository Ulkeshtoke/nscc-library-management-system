import Book from '../models/Book.js';
import BookCopy from '../models/BookCopy.js';
import Transaction from '../models/Transaction.js';
import Member from '../models/Member.js';
import { generateAccessionCode } from '../utils/accessionCodeGenerator.js';

export async function seedInitialDataIfEmpty() {
  try {
    // Seed sample members if none exist
    const memberCount = await Member.countDocuments();
    if (memberCount === 0) {
      await Member.insertMany([
        {
          membershipId: 'STU-2026-0042',
          fullName: 'Sarah Connor',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'CS-2026-042',
          email: 'sarah.connor@university.edu',
          phone: '+1 (555) 234-5678',
          department: 'Computer Science',
          maxAllowedBooks: 3,
          status: 'ACTIVE',
          remarks: 'Undergraduate student',
        },
        {
          membershipId: 'STU-2026-0015',
          fullName: 'Alex Rivera',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'MA-2026-015',
          email: 'alex.rivera@university.edu',
          phone: '+1 (555) 345-6789',
          department: 'Mathematics',
          maxAllowedBooks: 3,
          status: 'ACTIVE',
          remarks: 'Honors student',
        },
        {
          membershipId: 'FAC-2026-0001',
          fullName: 'Dr. Aris Thorne',
          memberType: 'FACULTY',
          rollOrEmployeeNumber: 'FAC-CS-001',
          email: 'aris.thorne@university.edu',
          phone: '+1 (555) 456-7890',
          department: 'Computer Science',
          maxAllowedBooks: 5,
          status: 'ACTIVE',
          remarks: 'Department Chair & Professor',
        },
        {
          membershipId: 'FAC-2026-0002',
          fullName: 'Prof. Clara Oswald',
          memberType: 'FACULTY',
          rollOrEmployeeNumber: 'FAC-PH-002',
          email: 'clara.oswald@university.edu',
          phone: '+1 (555) 567-8901',
          department: 'Physics',
          maxAllowedBooks: 5,
          status: 'ACTIVE',
          remarks: 'Associate Professor',
        },
      ]);
      console.log('[Seed] Sample members seeded successfully.');
    }

    const bookCount = await Book.countDocuments();
    if (bookCount > 0) {
      return; // Already initialized
    }

    console.log('[Seed] Seeding initial college library catalog...');

    const sampleBooks = [
      {
        title: 'Introduction to Algorithms (4th Edition)',
        author: 'Thomas H. Cormen, Charles E. Leiserson',
        isbn: '978-0262046305',
        category: 'Computer Science',
        publisher: 'MIT Press',
        publishedYear: 2022,
        copiesCount: 3,
        accessionPrefix: 'CS',
      },
      {
        title: 'Operating System Concepts (10th Edition)',
        author: 'Abraham Silberschatz, Peter B. Galvin',
        isbn: '978-1119800361',
        category: 'Computer Science',
        publisher: 'Wiley',
        publishedYear: 2021,
        copiesCount: 3,
        accessionPrefix: 'CS',
      },
      {
        title: 'Engineering Mechanics: Statics & Dynamics',
        author: 'Russell C. Hibbeler',
        isbn: '978-0133915426',
        category: 'Mechanical',
        publisher: 'Pearson',
        publishedYear: 2020,
        copiesCount: 2,
        accessionPrefix: 'ME',
      },
      {
        title: 'Calculus: Early Transcendentals (9th Edition)',
        author: 'James Stewart, Daniel Clegg',
        isbn: '978-1337613927',
        category: 'Mathematics',
        publisher: 'Cengage',
        publishedYear: 2020,
        copiesCount: 2,
        accessionPrefix: 'MA',
      },
    ];

    for (const b of sampleBooks) {
      const createdBook = await Book.create({
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category,
        publisher: b.publisher,
        publishedYear: b.publishedYear,
        totalCopies: b.copiesCount,
        availableCopies: b.copiesCount,
      });

      const copyDocs = [];
      for (let i = 1; i <= b.copiesCount; i++) {
        const accessionCode = `ACC-${b.accessionPrefix}-${String(1000 + i)}`;
        copyDocs.push({
          book: createdBook._id,
          accessionCode,
          status: 'AVAILABLE',
          condition: 'Good',
        });
      }

      await BookCopy.insertMany(copyDocs);
    }

    // Seed 1 sample transaction for demonstration
    const osBook = await Book.findOne({ title: { $regex: 'Operating System', $options: 'i' } });
    if (osBook) {
      const copyToIssue = await BookCopy.findOne({ book: osBook._id });
      if (copyToIssue) {
        copyToIssue.status = 'ISSUED';
        await copyToIssue.save();

        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - 5);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 9);

        await Transaction.create({
          book: osBook._id,
          bookCopy: copyToIssue._id,
          accessionCode: copyToIssue.accessionCode,
          borrowerName: 'Sarah Connor',
          borrowerRollNumber: 'CS-2026-042',
          issueDate,
          dueDate,
          status: 'ISSUED',
          remarks: 'Semester research reference',
        });

        await Book.syncCopyCounts(osBook._id);
      }
    }

    console.log('[Seed] Sample library catalog seeded successfully.');
  } catch (err) {
    console.error('[Seed] Warning during initial seed:', err.message);
  }
}
