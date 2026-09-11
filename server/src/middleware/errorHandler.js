export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message);

  let statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  let message = err.message || 'An unexpected server error occurred';

  // Handle Mongoose duplicate key error (E11000)
  const isDuplicate =
    err.code === 11000 ||
    (err.writeErrors && err.writeErrors[0]?.code === 11000) ||
    (err.message && err.message.includes('E11000'));

  if (isDuplicate) {
    statusCode = 409;
    const kv = err.keyValue || (err.writeErrors && err.writeErrors[0]?.keyValue) || {};
    const field = Object.keys(kv)[0] || (err.message.includes('accessionCode') ? 'accessionCode' : 'field');
    const value = kv[field] || (err.message.match(/dup key: \{ [^:]+: "([^"]+)" \}/)?.[1] || '');

    if (field === 'accessionCode' || err.message.includes('accessionCode')) {
      message = `Accession code '${value}' is already assigned to an existing book copy. Each physical copy must have a unique accession code.`;
    } else {
      message = `Duplicate value '${value}' for unique ${field}.`;
    }
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format: '${err.value}'`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}
