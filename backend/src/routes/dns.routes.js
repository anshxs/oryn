import { Router } from 'express';
import { DnsController } from '../controllers/dns.controller.js';

const router = Router();

// DNS inspection and verification routes
router.get('/records', DnsController.getRecommendedRecords);
router.get('/verify', DnsController.verifyDomain);

export default router;
