export function validateBookPayload(req, res, next) {
  const { title, author } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Book title is required and cannot be empty' });
  }
  if (!author || typeof author !== 'string' || !author.trim()) {
    return res.status(400).json({ success: false, error: 'Author name is required and cannot be empty' });
  }
  next();
}

export function validateIssuePayload(req, res, next) {
  const { accessionCode, borrowerName, borrowerRollNumber, dueDate } = req.body;
  if (!accessionCode || typeof accessionCode !== 'string' || !accessionCode.trim()) {
    return res.status(400).json({ success: false, error: 'Accession code is required' });
  }
  if (!borrowerName || typeof borrowerName !== 'string' || !borrowerName.trim()) {
    return res.status(400).json({ success: false, error: 'Borrower name is required' });
  }
  if (!borrowerRollNumber || typeof borrowerRollNumber !== 'string' || !borrowerRollNumber.trim()) {
    return res.status(400).json({ success: false, error: 'Borrower roll number is required' });
  }
  if (!dueDate) {
    return res.status(400).json({ success: false, error: 'Due date is required' });
  }
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ success: false, error: 'Due date must be a valid date' });
  }
  if (date <= new Date()) {
    return res.status(400).json({ success: false, error: 'Due date must be in the future' });
  }
  next();
}

export function validateReturnPayload(req, res, next) {
  const { accessionCode } = req.body;
  if (!accessionCode || typeof accessionCode !== 'string' || !accessionCode.trim()) {
    return res.status(400).json({ success: false, error: 'Accession code is required' });
  }
  next();
}
