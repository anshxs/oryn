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
  Plus, 
  Trash2, 
  UserPlus, 
  Key, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function DomainSettingsModal({
  isOpen,
  onClose,
  initialTab = 'domains',
  settings,
  domains = [],
  mailboxes = [],
  activeMailbox,
  onSelectMailbox,
  onRefreshData,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'domains', 'mailboxes', 'outbound'
  
  // Domain creation form state
  const [newDomainName, setNewDomainName] = useState('');
  const [selectedDomainForDns, setSelectedDomainForDns] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  // Mailbox creation form state
  const [mbUsername, setMbUsername] = useState('');
  const [mbDomain, setMbDomain] = useState('');
  const [mbName, setMbName] = useState('');
  const [mbPassword, setMbPassword] = useState('');
  const [isCreatingMb, setIsCreatingMb] = useState(false);

  // Outbound relay settings
  const [outboundMode, setOutboundMode] = useState('direct');
  const [relayHost, setRelayHost] = useState('');
  const [relayPort, setRelayPort] = useState(587);
  const [relayUser, setRelayUser] = useState('');
  const [relayPass, setRelayPass] = useState('');
  const [isSavingOutbound, setIsSavingOutbound] = useState(false);

  // DNS records & verification
  const [dnsRecords, setDnsRecords] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'domains');
      const targetDom = domains[0]?.name || 'example.com';
      setSelectedDomainForDns(targetDom);
      setMbDomain(targetDom);
      fetchDnsRecords(targetDom);

      if (settings) {
        setOutboundMode(settings.outboundMode || 'direct');
        if (settings.relay) {
          setRelayHost(settings.relay.host || '');
          setRelayPort(settings.relay.port || 587);
          setRelayUser(settings.relay.user || '');
          setRelayPass(settings.relay.pass || '');
        }
      }
    }
  }, [isOpen, initialTab, settings, domains]);

  const fetchDnsRecords = async (domainName) => {
    if (!domainName) return;
    try {
      const data = await api.getDnsRecords(domainName, `mail.${domainName}`, settings?.serverIp);
      if (data.records) setDnsRecords(data.records);
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

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    try {
      setIsAddingDomain(true);
      const res = await api.addDomain({ name: newDomainName.trim() });
      onNotify(`Domain "${res.domain.name}" added successfully!`, 'success');
      setNewDomainName('');
      setSelectedDomainForDns(res.domain.name);
      setMbDomain(res.domain.name);
      await onRefreshData();
      fetchDnsRecords(res.domain.name);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (name) => {
    if (!confirm(`Are you sure you want to remove domain "${name}" and all its email addresses?`)) return;
    try {
      await api.deleteDomain(name);
      onNotify(`Domain "${name}" removed.`, 'info');
      await onRefreshData();
      const remaining = domains.filter(d => d.name !== name);
      if (remaining.length > 0) {
        setSelectedDomainForDns(remaining[0].name);
        fetchDnsRecords(remaining[0].name);
      }
    } catch (err) {
      onNotify('Failed to delete domain: ' + err.message, 'error');
    }
  };

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    if (!mbUsername.trim() || !mbDomain) {
      onNotify('Please specify email username and select a domain', 'error');
      return;
    }
    if (!mbPassword || mbPassword.length < 4) {
      onNotify('Password must be at least 4 characters', 'error');
      return;
    }

    try {
      setIsCreatingMb(true);
      const res = await api.createMailbox({
        username: mbUsername.trim(),
        domain: mbDomain,
        name: mbName.trim() || mbUsername.trim(),
        password: mbPassword
      });
      onNotify(`Created email account ${res.mailbox.email}!`, 'success');
      setMbUsername('');
      setMbName('');
      setMbPassword('');
      await onRefreshData();
      onSelectMailbox(res.mailbox.email);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setIsCreatingMb(false);
    }
  };

  const handleDeleteMailbox = async (email) => {
    if (!confirm(`Delete mailbox "${email}"? All emails associated with it will remain or be unlinked.`)) return;
    try {
      await api.deleteMailbox(email);
      onNotify(`Mailbox ${email} removed.`, 'info');
      await onRefreshData();
    } catch (err) {
      onNotify('Failed to delete mailbox: ' + err.message, 'error');
    }
  };

  const handleVerifyDns = async () => {
    try {
      setIsVerifying(true);
      const res = await api.verifyDns(selectedDomainForDns, `mail.${selectedDomainForDns}`);
      setVerifyResult(res.check);
    } catch (e) {
      onNotify('Failed to verify DNS: ' + e.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveOutbound = async (e) => {
    e.preventDefault();
    try {
      setIsSavingOutbound(true);
      await api.updateSettings({
        outboundMode,
        relay: {
          host: relayHost,
          port: parseInt(relayPort, 10),
          user: relayUser,
          pass: relayPass
        }
      });
      onNotify('Outbound delivery configuration saved!', 'success');
      await onRefreshData();
    } catch (err) {
      onNotify(err.message || 'Failed to update outbound settings', 'error');
    } finally {
      setIsSavingOutbound(false);
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
              <h3 className="font-bold text-white text-base">Mailserver Control Center</h3>
              <p className="text-xs text-slate-400">Domains, DNS Records, and Custom Email Accounts</p>
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
            onClick={() => setActiveTab('domains')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'domains'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Domains & DNS</span>
          </button>
          <button
            onClick={() => setActiveTab('mailboxes')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'mailboxes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>2. Email Accounts ({mailboxes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'outbound'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. Outbound Delivery</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: DOMAINS & DNS */}
          {activeTab === 'domains' && (
            <div className="space-y-6">
              {/* Add Domain Input Form */}
              <form onSubmit={handleAddDomain} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Connect a Domain</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="Enter domain (e.g. yourrealcompany.com)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isAddingDomain || !newDomainName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                  >
                    {isAddingDomain ? 'Adding...' : 'Add Domain'}
                  </button>
                </div>
              </form>

              {/* Added Domains List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Your Connected Domains:</span>
                  <span className="text-xs text-slate-500">{domains.length} domain{domains.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {domains.map((dom) => {
                    const isSelected = selectedDomainForDns === dom.name;
                    return (
                      <div
                        key={dom.id || dom.name}
                        onClick={() => {
                          setSelectedDomainForDns(dom.name);
                          fetchDnsRecords(dom.name);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="font-mono">{dom.name}</span>
                        {domains.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDomain(dom.name);
                            }}
                            className="p-1 hover:text-rose-400 transition-colors ml-1"
                            title="Remove domain"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generated DNS Records for selected domain */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>DNS Setup for</span>
                      <span className="text-blue-400 font-mono normal-case">@{selectedDomainForDns}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Add these records to your domain provider (Cloudflare, GoDaddy, Namecheap) to receive mail.</p>
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
                  <div className={`p-3 rounded-xl border text-xs ${
                    verifyResult.mxConfigured 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {verifyResult.mxConfigured ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      <span>{verifyResult.mxConfigured ? 'MX records successfully detected on DNS!' : 'MX records not yet detected on live DNS'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {dnsRecords.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
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
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 select-all overflow-x-auto">
                        {rec.value}
                      </div>
                      <p className="text-[10px] text-slate-500">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL ACCOUNTS (MAILBOXES) */}
          {activeTab === 'mailboxes' && (
            <div className="space-y-6">
              {/* Create Mailbox Form */}
              <form onSubmit={handleCreateMailbox} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Create New Email Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email Username</label>
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                      <input
                        type="text"
                        value={mbUsername}
                        onChange={(e) => setMbUsername(e.target.value)}
                        placeholder="ansh"
                        className="flex-1 bg-transparent text-white focus:outline-none font-mono"
                        required
                      />
                      <span className="text-slate-500">@</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Domain</label>
                    <select
                      value={mbDomain}
                      onChange={(e) => setMbDomain(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    >
                      {domains.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={mbName}
                      onChange={(e) => setMbName(e.target.value)}
                      placeholder="e.g. Ansh Sharma"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={mbPassword}
                      onChange={(e) => setMbPassword(e.target.value)}
                      placeholder="Set mailbox password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isCreatingMb || !mbUsername.trim() || !mbPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isCreatingMb ? 'Creating...' : 'Create Email Account'}</span>
                  </button>
                </div>
              </form>

              {/* Configured Mailboxes List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Mailboxes</h4>
                  <span className="text-xs text-slate-500">{mailboxes.length} accounts configured</span>
                </div>

                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                  {mailboxes.map((mb) => {
                    const isActive = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                    return (
                      <div
                        key={mb.id || mb.email}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-blue-600/10' : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {mb.name ? mb.name.slice(0, 2).toUpperCase() : 'MB'}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white">{mb.name}</span>
                              {isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-blue-400">{mb.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMailbox(mb.email);
                                onNotify(`Switched active mailbox to ${mb.email}`, 'info');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                              Switch to this
                            </button>
                          )}
                          {mailboxes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMailbox(mb.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete mailbox"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OUTBOUND DELIVERY */}
          {activeTab === 'outbound' && (
            <form onSubmit={handleSaveOutbound} className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Outbound Delivery Mode</h4>
                <p className="text-xs text-slate-400">
                  Select how external outgoing emails are routed to recipient mail servers.
                </p>
              </div>

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
                    Directly looks up the recipient's domain MX record via DNS and opens a socket on port 25.
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
                    <span className="font-semibold text-xs text-white">SMTP Relay (SendGrid, Mailgun, Brevo)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Routes through an external relay host to guarantee delivery if your ISP blocks port 25.
                  </p>
                </div>
              </div>

              {outboundMode === 'relay' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h5 className="text-xs font-semibold text-slate-200">Relay Credentials</h5>
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
                      <label className="block text-[11px] text-slate-400 mb-1">User / API Key</label>
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingOutbound}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-md shadow-blue-600/30"
                >
                  {isSavingOutbound ? 'Saving...' : 'Save Outbound Mode'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            SMTP Port: :{settings?.smtpPort || 2525} • Active Mailbox: {activeMailbox}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
