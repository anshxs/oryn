const API_BASE = '/api';

export const api = {
  async getEmails(folder = 'inbox', search = '') {
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/emails?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
  },

  async getEmail(id) {
    const res = await fetch(`${API_BASE}/emails/${id}`);
    if (!res.ok) throw new Error('Failed to fetch email details');
    return res.json();
  },

  async sendEmail(payload) {
    const res = await fetch(`${API_BASE}/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send email');
    }
    return data;
  },

  async simulateEmail(payload = {}) {
    const res = await fetch(`${API_BASE}/emails/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateEmail(id, updates) {
    const res = await fetch(`${API_BASE}/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteEmail(id, permanent = false) {
    const res = await fetch(`${API_BASE}/emails/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async getDnsRecords(domain, host, ip) {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (host) params.append('host', host);
    if (ip) params.append('ip', ip);

    const res = await fetch(`${API_BASE}/dns/records?${params.toString()}`);
    return res.json();
  },

  async verifyDns(domain, host) {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (host) params.append('host', host);

    const res = await fetch(`${API_BASE}/dns/verify?${params.toString()}`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  }
};

export function setupWebSocket(onEvent) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  let ws = null;
  let reconnectTimeout = null;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected to mail server stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.warn('[WS] Stream closed, retrying in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('[WS] Connect error:', e);
      reconnectTimeout = setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) ws.close();
  };
}
