import BookCopy from '../models/BookCopy.js';

/**
 * Generate a sequence-based or random unique accession code
 * Format: ACC-<YEAR>-<5 DIGIT RANDOM / SEQUENCE>
 */
export async function generateAccessionCode(prefix = 'ACC') {
  const currentYear = new Date().getFullYear();
  let uniqueCode = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 15) {
    attempts++;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5 digits
    uniqueCode = `${prefix}-${currentYear}-${randomSuffix}`;

    const existing = await BookCopy.findOne({ accessionCode: uniqueCode }).select('_id');
    if (!existing) {
      exists = false;
    }
  }

  if (exists) {
    // High-concurrency fallback with timestamp
    uniqueCode = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }

  return uniqueCode;
}

/**
 * Generate multiple unique accession codes at once
 */
export async function generateAccessionCodes(count, prefix = 'ACC') {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = await generateAccessionCode(prefix);
    codes.push(code);
  }
  return codes;
}
