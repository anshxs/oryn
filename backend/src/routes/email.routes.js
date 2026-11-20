import { Router } from 'express';
import { EmailController } from '../controllers/email.controller.js';

const router = Router();

// Email routes
router.get('/', EmailController.getEmails);
router.get('/:id', EmailController.getEmailById);
router.post('/send', EmailController.sendEmail);
router.post('/simulate', EmailController.simulateEmail);
router.patch('/:id', EmailController.updateEmail);
router.delete('/:id', EmailController.deleteEmail);

export default router;
