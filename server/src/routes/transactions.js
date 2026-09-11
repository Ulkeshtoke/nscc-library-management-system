import express from 'express';
import {
  handleIssue,
  handleReturn,
  getAllTransactions,
  exportTransactions,
} from '../controllers/transactionController.js';
import { validateIssuePayload, validateReturnPayload } from '../middleware/validate.js';

const router = express.Router();

router.post('/issue', validateIssuePayload, handleIssue);
router.post('/return', validateReturnPayload, handleReturn);
router.get('/', getAllTransactions);
router.get('/export', exportTransactions);

export default router;
