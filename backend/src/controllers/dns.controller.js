import { SettingsModel } from '../models/settings.model.js';
import { DomainModel } from '../models/domain.model.js';
import { getRecommendedDnsRecords, verifyDomainDns } from '../helpers/dnsEngine.js';
import { detectPublicIp } from '../helpers/networkHelper.js';

export const DnsController = {
  /**
   * GET /api/dns/records
   */
  async getRecommendedRecords(req, res) {
    try {
      const settings = SettingsModel.get();
      const domainName = req.query.domain || settings.domain || 'example.com';
      const domains = DomainModel.getAll();
      const matchedDomain = domains.find(d => (d.name || '').toLowerCase() === domainName.toLowerCase());

      const host = req.query.host || matchedDomain?.serverHost || `mail.${domainName}`;
      let ip = req.query.ip || matchedDomain?.serverIp || settings.serverIp;
      if (!ip || ip === '127.0.0.1') {
        ip = await detectPublicIp();
      }

      const records = getRecommendedDnsRecords(domainName, host, ip);
      return res.status(200).json({ success: true, domain: domainName, host, ip, records });
    } catch (err) {
      console.error('[DnsController.getRecommendedRecords] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/dns/verify
   */
  async verifyDomain(req, res) {
    try {
      const domain = req.query.domain;
      if (!domain) {
        return res.status(400).json({ success: false, error: 'Domain parameter is required' });
      }
      const host = req.query.host || `mail.${domain}`;
      const check = await verifyDomainDns(domain, host);
      return res.status(200).json({ success: true, check });
    } catch (err) {
      console.error('[DnsController.verifyDomain] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
