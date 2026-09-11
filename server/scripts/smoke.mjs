import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import request from 'supertest';

console.log('--- STARTING LIBRARY MANAGEMENT SYSTEM SMOKE TEST ---');

let mongoServer;

async function runSmoke() {
  try {
    // 1. Setup in-memory DB for smoke test
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Smoke] Connected to database');

    // 2. Health check
    const health = await request(app).get('/api/health');
    if (health.status !== 200 || health.body.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(health.body)}`);
    }
    console.log('✓ Health check passed');

    // 3. Create a title with physical copies
    const bookRes = await request(app)
      .post('/api/books')
      .send({
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Software Engineering',
        initialCopies: 2,
        customAccessionCodes: ['ACC-SMOKE-01', 'ACC-SMOKE-02'],
      });

    if (bookRes.status !== 201 || !bookRes.body.success) {
      throw new Error(`Create book failed: ${JSON.stringify(bookRes.body)}`);
    }
    const bookId = bookRes.body.data._id;
    console.log(`✓ Title created with 2 copies (Book ID: ${bookId})`);

    // 4. Verify accession uniqueness constraint
    const dupRes = await request(app)
      .post(`/api/books/${bookId}/copies`)
      .send({ count: 1, accessionCodes: ['ACC-SMOKE-01'] });

    if (dupRes.status !== 409) {
      throw new Error(`Duplicate accession code was not rejected: HTTP ${dupRes.status}`);
    }
    console.log('✓ Duplicate accession code correctly rejected (409 Conflict)');

    // 5. Look up copy and verify QR code data
    const lookup = await request(app).get('/api/copies/lookup/ACC-SMOKE-01');
    if (lookup.status !== 200 || !lookup.body.data.qrCodeUrl) {
      throw new Error(`Lookup copy failed: ${JSON.stringify(lookup.body)}`);
    }
    console.log('✓ Copy lookup & QR code URL verified');

    // 6. Issue book copy
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const issueRes = await request(app)
      .post('/api/transactions/issue')
      .send({
        accessionCode: 'ACC-SMOKE-01',
        borrowerName: 'Sarah Connor',
        borrowerRollNumber: 'ENG-2026-09',
        dueDate,
      });

    if (issueRes.status !== 201 || !issueRes.body.success) {
      throw new Error(`Issue failed: ${JSON.stringify(issueRes.body)}`);
    }
    console.log('✓ Book copy issued successfully to Sarah Connor');

    // 7. Verify duplicate issue attempt is rejected
    const dupIssue = await request(app)
      .post('/api/transactions/issue')
      .send({
        accessionCode: 'ACC-SMOKE-01',
        borrowerName: 'John Doe',
        borrowerRollNumber: 'ENG-2026-10',
        dueDate,
      });

    if (dupIssue.status !== 400) {
      throw new Error(`Concurrent double issue was not blocked: HTTP ${dupIssue.status}`);
    }
    console.log('✓ Duplicate issue on already issued copy correctly blocked (400)');

    // 8. Return book copy
    const returnRes = await request(app)
      .post('/api/transactions/return')
      .send({
        accessionCode: 'ACC-SMOKE-01',
        remarks: 'Smoke test returned on time',
      });

    if (returnRes.status !== 200 || !returnRes.body.success) {
      throw new Error(`Return failed: ${JSON.stringify(returnRes.body)}`);
    }
    console.log('✓ Book copy returned successfully and transaction closed');

    // 9. Verify duplicate return attempt is rejected
    const dupReturn = await request(app)
      .post('/api/transactions/return')
      .send({
        accessionCode: 'ACC-SMOKE-01',
      });

    if (dupReturn.status !== 400) {
      throw new Error(`Duplicate return was not blocked: HTTP ${dupReturn.status}`);
    }
    console.log('✓ Duplicate return on available copy correctly blocked (400)');

    // 10. Verify dashboard live metrics
    const dash = await request(app).get('/api/dashboard/stats');
    if (dash.status !== 200 || !dash.body.success) {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(dash.body)}`);
    }
    const { totalTitles, totalCopies, availableCopies, issuedCopies, activeTransactions } = dash.body.data;
    if (totalTitles !== 1 || totalCopies !== 2 || availableCopies !== 2 || issuedCopies !== 0 || activeTransactions !== 0) {
      throw new Error(`Dashboard counts mismatch: ${JSON.stringify(dash.body.data)}`);
    }
    console.log('✓ Live dashboard metrics verified from DB records');

    // 11. Verify XLSX export
    const exp = await request(app)
      .get('/api/transactions/export')
      .responseType('blob');
    const byteLength = Buffer.isBuffer(exp.body)
      ? exp.body.length
      : exp.text
        ? Buffer.byteLength(exp.text)
        : 0;
    if (exp.status !== 200 || byteLength < 50) {
      throw new Error(`XLSX export failed or was empty (Byte length: ${byteLength})`);
    }
    console.log(`✓ XLSX export succeeded (Buffer size: ${byteLength} bytes)`);

    console.log('--- ALL SMOKE TEST CHECKS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('✗ SMOKE TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runSmoke();
