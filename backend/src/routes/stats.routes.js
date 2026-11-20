import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';

const router = Router();

// Server statistics & system settings routes
router.get('/stats', StatsController.getStats);
router.get('/public-ip', StatsController.getPublicIp);
router.get('/settings', StatsController.getSettings);
router.post('/settings', StatsController.updateSettings);

export default router;
