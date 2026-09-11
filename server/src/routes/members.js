import express from 'express';
import {
  getAllMembers,
  getMemberById,
  lookupMember,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/memberController.js';

const router = express.Router();

router.get('/', getAllMembers);
router.post('/', createMember);
router.get('/lookup/:query', lookupMember);
router.get('/:id', getMemberById);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
