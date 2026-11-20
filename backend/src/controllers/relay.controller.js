import { testRelayConnection } from '../helpers/mailerEngine.js';

export const RelayController = {
  /**
   * POST /api/relay/test
   */
  async testRelay(req, res) {
    try {
      const { host, port, secure, user, pass } = req.body;
      await testRelayConnection({ host, port, secure, user, pass });
      return res.status(200).json({ success: true, message: 'SMTP relay connection verified successfully!' });
    } catch (err) {
      console.error('[RelayController.testRelay] Error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }
};
