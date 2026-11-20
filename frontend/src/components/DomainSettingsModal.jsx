import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server, 
  Radio
} from 'lucide-react';
import { api } from '../services/api';

export default function DomainSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('dns'); // 'dns' or 'outbound'
  const [domain, setDomain] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [defaultFrom, setDefaultFrom] = useState('');
  const [outboundMode, setOutboundMode] = useState('direct');
  const [relayHost, setRelayHost] = useState('');
  const [relayPort, setRelayPort] = useState(587);
  const [relayUser, setRelayUser] = useState('');
  const [relayPass, setRelayPass] = useState('');
  
  const [records, setRecords] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && isOpen) {
      setDomain(settings.domain || '');
      setServerHost(settings.serverHost || '');
      setServerIp(settings.serverIp || '');
      setDefaultFrom(settings.defaultFromAddress || '');
      setOutboundMode(settings.outboundMode || 'direct');
      if (settings.relay) {
        setRelayHost(settings.relay.host || '');
        setRelayPort(settings.relay.port || 587);
        setRelayUser(settings.relay.user || '');
        setRelayPass(settings.relay.pass || '');
      }
      fetchRecords(settings.domain, settings.serverHost, settings.serverIp);
    }
  }, [settings, isOpen]);

  const fetchRecords = async (d, h, ip) => {
    try {
      const data = await api.getDnsRecords(d, h, ip);
      if (data.records) setRecords(data.records);
    } catch (e) {
      console.error('Error fetching DNS records:', e);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleVerifyDns = async () => {
    try {
      setIsVerifying(true);
      const res = await api.verifyDns(domain, serverHost);
      setVerifyResult(res.check);
    } catch (e) {
      onNotify('Failed to verify DNS: ' + e.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings({
        domain,
        serverHost,
        serverIp,
        defaultFromAddress: defaultFrom,
        outboundMode,
        relay: {
          host: relayHost,
          port: parseInt(relayPort, 10),
          user: relayUser,
          pass: relayPass
        }
      });
      onNotify('Settings & domain updated successfully!', 'success');
      onClose();
    } catch (err) {
      onNotify(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Custom Domain & Mailserver Config</h3>
              <p className="text-xs text-slate-400">Connect your custom domain and configure delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('dns')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'dns'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Connect Domain & DNS Records
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'outbound'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Outbound Delivery (Direct / Relay)
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'dns' ? (
            <>
              {/* Domain Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      fetchRecords(e.target.value, serverHost, serverIp);
                    }}
                    placeholder="example.com"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mail Host (FQDN)</label>
                  <input
                    type="text"
                    value={serverHost}
                    onChange={(e) => {
                      setServerHost(e.target.value);
                      fetchRecords(domain, e.target.value, serverIp);
                    }}
                    placeholder="mail.example.com"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Server Public IP</label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => {
                      setServerIp(e.target.value);
                      fetchRecords(domain, serverHost, e.target.value);
                    }}
                    placeholder="123.45.67.89"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DNS Records Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Required DNS Records</h4>
                    <p className="text-[11px] text-slate-400">Add these records to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyDns}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>Check Live DNS</span>
                  </button>
                </div>

                {verifyResult && (
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    verifyResult.mxConfigured 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {verifyResult.mxConfigured ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      <span>{verifyResult.mxConfigured ? 'MX records successfully detected for ' + domain : 'MX records not yet detected for ' + domain}</span>
                    </div>
                    {verifyResult.errors && verifyResult.errors.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-[11px] text-slate-400">
                        {verifyResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {records.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 font-mono">
                            {rec.type}
                          </span>
                          <span className="text-xs text-slate-300 font-mono font-medium">{rec.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.value, idx)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Value</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 select-all overflow-x-auto">
                        {rec.value}
                      </div>
                      <p className="text-[10px] text-slate-400">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Outbound Delivery Mode</h4>
                <p className="text-xs text-slate-400">
                  Choose how your mail server delivers outbound messages to external email providers.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setOutboundMode('direct')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    outboundMode === 'direct'
                      ? 'bg-blue-600/15 border-blue-500/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-xs text-white">Direct MX Delivery</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Queries the recipient's DNS MX record directly and delivers straight to their mail server on port 25.
                  </p>
                </div>

                <div
                  onClick={() => setOutboundMode('relay')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    outboundMode === 'relay'
                      ? 'bg-indigo-600/15 border-indigo-500/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-xs text-white">SMTP Relay (Recommended for ISPs)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Routes outbound mail through an SMTP provider (SendGrid, Mailgun, Brevo, or custom host) to bypass port 25 ISP blocks.
                  </p>
                </div>
              </div>

              {outboundMode === 'relay' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 animate-in fade-in duration-150">
                  <h5 className="text-xs font-semibold text-slate-200">SMTP Relay Credentials</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Relay Host</label>
                      <input
                        type="text"
                        value={relayHost}
                        onChange={(e) => setRelayHost(e.target.value)}
                        placeholder="smtp.sendgrid.net"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Port</label>
                      <input
                        type="number"
                        value={relayPort}
                        onChange={(e) => setRelayPort(e.target.value)}
                        placeholder="587"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Username / API Key</label>
                      <input
                        type="text"
                        value={relayUser}
                        onChange={(e) => setRelayUser(e.target.value)}
                        placeholder="apikey"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                      <input
                        type="password"
                        value={relayPass}
                        onChange={(e) => setRelayPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Inbound SMTP listening: :{settings?.smtpPort || 2525}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
