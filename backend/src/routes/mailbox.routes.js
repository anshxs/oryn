import { Router } from 'express';
import { MailboxController } from '../controllers/mailbox.controller.js';

const router = Router();

// Mailbox management routes
router.get('/', MailboxController.getMailboxes);
router.post('/', MailboxController.createMailbox);
router.post('/verify', MailboxController.verifyMailbox);
router.delete('/:email', MailboxController.deleteMailbox);

export default router;
