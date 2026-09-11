import express from 'express';
import {
  getAllBooks,
  getBookById,
  createBook,
  addCopiesToBook,
  updateBook,
  archiveBook,
} from '../controllers/bookController.js';
import { validateBookPayload } from '../middleware/validate.js';

const router = express.Router();

router.get('/', getAllBooks);
router.post('/', validateBookPayload, createBook);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', archiveBook);
router.post('/:id/copies', addCopiesToBook);

export default router;
