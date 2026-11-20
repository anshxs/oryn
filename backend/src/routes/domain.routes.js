import { Router } from 'express';
import { DomainController } from '../controllers/domain.controller.js';

const router = Router();

// Domain management routes
router.get('/', DomainController.getDomains);
router.post('/', DomainController.createDomain);
router.patch('/:name', DomainController.updateDomain);
router.delete('/:name', DomainController.deleteDomain);

export default router;
