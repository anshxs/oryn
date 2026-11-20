import { Router } from 'express';
import emailRoutes from './email.routes.js';
import domainRoutes from './domain.routes.js';
import mailboxRoutes from './mailbox.routes.js';
import dnsRoutes from './dns.routes.js';
import relayRoutes from './relay.routes.js';
import statsRoutes from './stats.routes.js';
import { EmailController } from '../controllers/email.controller.js';

const router = Router();

// Mount individual domain resources onto the central API router
router.use('/emails', emailRoutes);
router.use('/domains', domainRoutes);
router.use('/mailboxes', mailboxRoutes);
router.use('/dns', dnsRoutes);
router.use('/relay', relayRoutes);
router.use('/', statsRoutes);

// Attachment download endpoint
router.get('/attachments/:fileId', EmailController.downloadAttachment);

export default router;
