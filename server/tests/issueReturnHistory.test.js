import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import XLSX from 'xlsx';
import app from '../src/app.js';
import Book from '../src/models/Book.js';
import BookCopy from '../src/models/BookCopy.js';
import Transaction from '../src/models/Transaction.js';

describe('Library Management System - End-to-End API Integration Suite', () => {
  let createdBookId;
  let testAccessionCode = 'ACC-TEST-001';

  beforeEach(async () => {
    // Seed one book title with two copies
    const bookRes = await request(app)
      .post('/api/books')
      .send({
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        category: 'Computer Science',
        initialCopies: 2,
        customAccessionCodes: [testAccessionCode, 'ACC-TEST-002'],
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    createdBookId = bookRes.body.data._id;
  });

  describe('1. Book & Physical-Copy Separation & Consistency', () => {
    it('creates book and physical copies with synchronized counts', async () => {
      const book = await Book.findById(createdBookId);
      expect(book.totalCopies).toBe(2);
      expect(book.availableCopies).toBe(2);

      const copies = await BookCopy.find({ book: createdBookId });
      expect(copies).toHaveLength(2);
      expect(copies[0].status).toBe('AVAILABLE');
      expect(copies[1].status).toBe('AVAILABLE');
    });

    it('enforces database-level uniqueness on accession codes', async () => {
      // Attempt to create a duplicate copy with same accession code
      const dupRes = await request(app)
        .post(`/api/books/${createdBookId}/copies`)
        .send({
          count: 1,
          accessionCodes: [testAccessionCode],
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error).toContain('already assigned');
    });

    it('prevents orphan book if copy creation fails', async () => {
      // Intentionally request duplicate code on new book
      const orphanAttempt = await request(app)
        .post('/api/books')
        .send({
          title: 'Failing Book',
          author: 'Some Author',
          initialCopies: 1,
          customAccessionCodes: [testAccessionCode], // Duplicate!
        });

      expect(orphanAttempt.status).toBe(409);

      // Verify book was rolled back and does not exist as orphan
      const orphanBook = await Book.findOne({ title: 'Failing Book' });
      expect(orphanBook).toBeNull();
    });
  });

  describe('2. Accession Code Lookup & QR Data', () => {
    it('looks up a copy by accession code and includes QR data URL', async () => {
      const res = await request(app).get(`/api/copies/lookup/${testAccessionCode}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessionCode).toBe(testAccessionCode);
      expect(res.body.data.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.body.data.book.title).toBe('Introduction to Algorithms');
    });

    it('returns 404 for nonexistent accession code', async () => {
      const res = await request(app).get('/api/copies/lookup/NONEXISTENT-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Issue Workflow & Double-Issue Prevention', () => {
    it('issues an available copy and creates exactly one active transaction', async () => {
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Alice Johnson',
          borrowerRollNumber: 'CS2026-042',
          dueDate: futureDue,
          remarks: 'Semester project reference',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.status).toBe('ISSUED');
      expect(res.body.transaction.borrowerName).toBe('Alice Johnson');
      expect(res.body.copy.status).toBe('ISSUED');

      // Verify copy in DB is ISSUED
      const copyInDb = await BookCopy.findOne({ accessionCode: testAccessionCode });
      expect(copyInDb.status).toBe('ISSUED');

      // Verify active transaction count in DB
      const activeTxCount = await Transaction.countDocuments({
        accessionCode: testAccessionCode,
        status: 'ISSUED',
      });
      expect(activeTxCount).toBe(1);

      // Verify book available copy count decremented
      const book = await Book.findById(createdBookId);
      expect(book.availableCopies).toBe(1);
    });

    it('rejects duplicate issue of an already issued copy', async () => {
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // First issue
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Alice',
          borrowerRollNumber: 'CS01',
          dueDate: futureDue,
        });

      // Second issue attempt on the same copy
      const secondRes = await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Bob',
          borrowerRollNumber: 'CS02',
          dueDate: futureDue,
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.error).toContain('is currently issued');
    });

    it('rejects issue with past due date', async () => {
      const pastDue = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Alice',
          borrowerRollNumber: 'CS01',
          dueDate: pastDue,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('future');
    });
  });

  describe('4. Return Workflow & Duplicate Return Prevention', () => {
    it('returns an issued copy and closes the active transaction', async () => {
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Issue first
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Alice',
          borrowerRollNumber: 'CS01',
          dueDate: futureDue,
        });

      // Return
      const returnRes = await request(app)
        .post('/api/transactions/return')
        .send({
          accessionCode: testAccessionCode,
          remarks: 'Returned in good condition',
        });

      expect(returnRes.status).toBe(200);
      expect(returnRes.body.success).toBe(true);
      expect(returnRes.body.transaction.status).toBe('RETURNED');
      expect(returnRes.body.transaction.returnDate).not.toBeNull();
      expect(returnRes.body.copy.status).toBe('AVAILABLE');

      // Verify DB state
      const copyInDb = await BookCopy.findOne({ accessionCode: testAccessionCode });
      expect(copyInDb.status).toBe('AVAILABLE');

      const activeTxCount = await Transaction.countDocuments({
        accessionCode: testAccessionCode,
        status: 'ISSUED',
      });
      expect(activeTxCount).toBe(0);

      const book = await Book.findById(createdBookId);
      expect(book.availableCopies).toBe(2);
    });

    it('rejects return for a book copy that is not currently issued', async () => {
      // testAccessionCode is AVAILABLE right now
      const res = await request(app)
        .post('/api/transactions/return')
        .send({
          accessionCode: testAccessionCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not currently issued');
    });
  });

  describe('5. Overdue Status & Transaction History', () => {
    it('calculates and marks overdue state based on active transaction due date', async () => {
      const copy = await BookCopy.findOne({ accessionCode: testAccessionCode });
      copy.status = 'ISSUED';
      await copy.save();

      // Manually insert an overdue transaction (dueDate in past)
      const pastDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await Transaction.create({
        book: createdBookId,
        bookCopy: copy._id,
        accessionCode: testAccessionCode,
        borrowerName: 'Overdue Borrower',
        borrowerRollNumber: 'OD-99',
        issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueDate: pastDueDate,
        status: 'ISSUED',
      });

      // Query history
      const historyRes = await request(app).get('/api/transactions');
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);

      const overdueTx = historyRes.body.data.find(
        (t) => t.accessionCode === testAccessionCode && t.status === 'ISSUED'
      );

      expect(overdueTx).toBeDefined();
      expect(overdueTx.isOverdue).toBe(true);
      expect(overdueTx.borrowerRollNumber).toBe('OD-99');
    });
  });

  describe('6. Dashboard Statistics Calculation', () => {
    it('reports live database metrics including active transactions and currently issued books', async () => {
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Issue 1 copy
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Charlie',
          borrowerRollNumber: 'CS03',
          dueDate: futureDue,
        });

      const dashRes = await request(app).get('/api/dashboard/stats');
      expect(dashRes.status).toBe(200);
      expect(dashRes.body.success).toBe(true);

      const stats = dashRes.body.data;
      expect(stats.totalTitles).toBe(1);
      expect(stats.totalCopies).toBe(2);
      expect(stats.availableCopies).toBe(1);
      expect(stats.issuedCopies).toBe(1);
      expect(stats.activeTransactions).toBe(1); // Derived from open transactions
      expect(stats.currentlyIssuedBooks).toBeDefined();
      expect(stats.currentlyIssuedBooks.length).toBe(1);
      expect(stats.currentlyIssuedBooks[0].accessionCode).toBe(testAccessionCode);
      expect(stats.currentlyIssuedBooks[0].borrowerName).toBe('Charlie');
    });
  });

  describe('7. XLSX Export with xlsx Library', () => {
    it('generates a valid XLSX spreadsheet containing accurate transaction headers and records', async () => {
      // Issue a copy to ensure at least one transaction exists
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Dana Scully',
          borrowerRollNumber: 'FBI-2026',
          dueDate: futureDue,
        });

      const res = await request(app)
        .get('/api/transactions/export')
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const buf = Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.body);
      expect(buf.length).toBeGreaterThan(100);

      // Parse XLSX workbook
      const workbook = XLSX.read(buf, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('Transactions');

      const worksheet = workbook.Sheets['Transactions'];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      expect(rows.length).toBeGreaterThanOrEqual(1);

      // Verify all required columns are present in row
      const firstRow = rows[0];
      expect(firstRow).toHaveProperty('Accession Code');
      expect(firstRow).toHaveProperty('Book Title');
      expect(firstRow).toHaveProperty('Borrower Name');
      expect(firstRow).toHaveProperty('Borrower Roll Number');
      expect(firstRow).toHaveProperty('Due Date');
      expect(firstRow).toHaveProperty('Status');
      expect(firstRow['Accession Code']).toBe(testAccessionCode);
      expect(firstRow['Borrower Name']).toBe('Dana Scully');
    });
  });

  describe('8. Search & Availability Filtering', () => {
    it('filters books by search query and availability status', async () => {
      // Issue testAccessionCode (ACC-TEST-001) so book has 1 available, 1 issued
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Filter Test',
          borrowerRollNumber: 'FT-01',
          dueDate: futureDue,
        });

      // Filter: AVAILABLE
      const availRes = await request(app).get('/api/books?availability=AVAILABLE');
      expect(availRes.status).toBe(200);
      expect(availRes.body.data.some((b) => b._id === createdBookId)).toBe(true);

      // Filter: ISSUED
      const issuedRes = await request(app).get('/api/books?availability=ISSUED');
      expect(issuedRes.status).toBe(200);
      expect(issuedRes.body.data.some((b) => b._id === createdBookId)).toBe(true);

      // Search by author
      const searchRes = await request(app).get('/api/books?search=Cormen');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data).toHaveLength(1);
      expect(searchRes.body.data[0].author).toBe('Thomas H. Cormen');
    });
  });

  describe('9. Member Management Suite', () => {
    it('registers a student with auto-generated unique membership ID and contact tracking', async () => {
      const res = await request(app)
        .post('/api/members')
        .send({
          fullName: 'Grace Hopper',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'CS-GRACE-01',
          email: 'grace.hopper@university.edu',
          phone: '+1 (555) 123-9999',
          department: 'Computer Science',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.membershipId).toMatch(/^STU-\d{4}-\d{4}$/);
      expect(res.body.data.fullName).toBe('Grace Hopper');
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('registers a faculty member with custom membership ID and higher borrowing limit', async () => {
      const res = await request(app)
        .post('/api/members')
        .send({
          fullName: 'Dr. Alan Turing',
          memberType: 'FACULTY',
          rollOrEmployeeNumber: 'FAC-ALAN-01',
          email: 'alan.turing@university.edu',
          phone: '+1 (555) 321-8888',
          department: 'Mathematics',
          customMembershipId: 'FAC-CUSTOM-007',
          maxAllowedBooks: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.membershipId).toBe('FAC-CUSTOM-007');
      expect(res.body.data.maxAllowedBooks).toBe(5);
    });

    it('rejects duplicate roll number registration', async () => {
      await request(app)
        .post('/api/members')
        .send({
          fullName: 'Ada Lovelace',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'ADA-001',
          email: 'ada@university.edu',
          phone: '+1 (555) 111-2222',
          department: 'Computer Science',
        });

      const dupRes = await request(app)
        .post('/api/members')
        .send({
          fullName: 'Ada Lovelace Duplicate',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'ADA-001',
          email: 'ada2@university.edu',
          phone: '+1 (555) 111-3333',
          department: 'Computer Science',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error).toContain('already exists');
    });

    it('performs quick lookup by roll number and lists active borrowing loans', async () => {
      // Register member
      await request(app)
        .post('/api/members')
        .send({
          fullName: 'Linus Torvalds',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'LINUS-001',
          email: 'linus@university.edu',
          phone: '+1 (555) 999-0000',
          department: 'Computer Science',
        });

      // Issue book to Linus
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: testAccessionCode,
          borrowerName: 'Linus Torvalds',
          borrowerRollNumber: 'LINUS-001',
          dueDate: futureDue,
        });

      // Quick lookup
      const lookupRes = await request(app).get('/api/members/lookup/LINUS-001');
      expect(lookupRes.status).toBe(200);
      expect(lookupRes.body.data.fullName).toBe('Linus Torvalds');
      expect(lookupRes.body.data.activeLoansCount).toBe(1);

      // Attempt deletion while book is on loan - must be blocked
      const deleteRes = await request(app).delete(`/api/members/${lookupRes.body.data._id}`);
      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.error).toContain('unreturned book');
    });

    it('enforces maxAllowedBooks borrowing limit on registered members', async () => {
      // 1. Register a member with limit of 1 book
      const regRes = await request(app)
        .post('/api/members')
        .send({
          fullName: 'Marie Curie',
          memberType: 'STUDENT',
          rollOrEmployeeNumber: 'CURIE-001',
          email: 'curie@university.edu',
          phone: '+1 (555) 333-4444',
          department: 'Physics',
          maxAllowedBooks: 1,
        });
      expect(regRes.status).toBe(201);

      // 2. Create a book with 2 copies
      const bookRes = await request(app)
        .post('/api/books')
        .send({
          title: 'Radioactivity Principles',
          author: 'Marie Curie',
          category: 'Physics',
          isbn: 'ISBN-CURIE-999',
          initialCopies: 2,
          customAccessionCodes: ['CURIE-001', 'CURIE-002'],
        });
      expect(bookRes.status).toBe(201);

      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // 3. Issue first book copy to Curie (should succeed, count = 1)
      const issue1Res = await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: 'CURIE-001',
          borrowerName: 'Marie Curie',
          borrowerRollNumber: 'CURIE-001',
          dueDate: futureDue,
        });
      expect(issue1Res.status).toBe(201);
      expect(issue1Res.body.success).toBe(true);

      // 4. Attempt to issue second copy to Curie (should fail because limit is 1)
      const issue2Res = await request(app)
        .post('/api/transactions/issue')
        .send({
          accessionCode: 'CURIE-002',
          borrowerName: 'Marie Curie',
          borrowerRollNumber: 'CURIE-001',
          dueDate: futureDue,
        });
      expect(issue2Res.status).toBe(400);
      expect(issue2Res.body.success).toBe(false);
      expect(issue2Res.body.error).toContain('Borrowing limit reached');
    });
  });
});
