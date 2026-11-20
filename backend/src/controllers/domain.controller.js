import { DomainModel } from '../models/domain.model.js';
import { detectPublicIp } from '../helpers/networkHelper.js';

export const DomainController = {
  /**
   * GET /api/domains
   */
  async getDomains(req, res) {
    try {
      const domains = DomainModel.getAll();
      return res.status(200).json({ success: true, domains });
    } catch (err) {
      console.error('[DomainController.getDomains] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/domains
   */
  async createDomain(req, res) {
    try {
      const { name, serverHost, serverIp } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Domain name is required (e.g. yourcompany.com)' });
      }

      const realIp = serverIp || await detectPublicIp();
      const newDomain = DomainModel.create({ name, serverHost, serverIp: realIp });

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('domain_added', newDomain);
      }

      return res.status(201).json({ success: true, domain: newDomain });
    } catch (err) {
      console.error('[DomainController.createDomain] Error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  /**
   * PATCH /api/domains/:name
   */
  async updateDomain(req, res) {
    try {
      const { serverIp, serverHost } = req.body;
      const updated = DomainModel.update(req.params.name, {
        ...(serverIp ? { serverIp: serverIp.trim() } : {}),
        ...(serverHost ? { serverHost: serverHost.trim() } : {})
      });

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('domain_updated', updated);
      }

      return res.status(200).json({ success: true, domain: updated });
    } catch (err) {
      console.error('[DomainController.updateDomain] Error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  /**
   * DELETE /api/domains/:name
   */
  async deleteDomain(req, res) {
    try {
      DomainModel.delete(req.params.name);

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('domain_deleted', { name: req.params.name });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[DomainController.deleteDomain] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
