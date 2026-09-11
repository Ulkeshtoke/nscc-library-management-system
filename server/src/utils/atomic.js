import mongoose from 'mongoose';

/**
 * Execute work within a MongoDB transaction if replica set/sessions are supported,
 * or gracefully execute with null session on standalone MongoDB instances.
 * 
 * @param {Function} workFn - (session) => Promise<T>
 * @returns {Promise<T>}
 */
export async function withTransaction(workFn) {
  let session = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await workFn(session);

    await session.commitTransaction();
    return result;
  } catch (err) {
    // If the failure is due to standalone MongoDB not supporting transactions
    const isStandaloneError =
      err.message &&
      (err.message.includes('Transaction numbers are only allowed on a replica set member') ||
        err.message.includes('standalone') ||
        err.message.includes('This MongoDB deployment does not support retryable writes'));

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignore abort error if transaction was never active
      }
    }

    if (isStandaloneError) {
      // Re-run safely without session for local standalone/memory instances
      return await workFn(null);
    }

    throw err;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (endErr) {
        // Safe cleanup
      }
    }
  }
}
