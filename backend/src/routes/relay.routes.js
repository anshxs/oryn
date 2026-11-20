import { Router } from 'express';
import { RelayController } from '../controllers/relay.controller.js';

const router = Router();

// SMTP Relay testing route
router.post('/test', RelayController.testRelay);

export default router;
