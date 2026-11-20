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
  Mail
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
  const [isTestingRelay, setIsTestingRelay] = useState(false);

  // DNS records & verification
  const [dnsRecords, setDnsRecords] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [serverIpInput, setServerIpInput] = useState('115.244.141.202');
  const [isDetectingIp, setIsDetectingIp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'domains');
      const targetDom = domains[0]?.name || 'example.com';
      setSelectedDomainForDns(targetDom);
      setMbDomain(targetDom);

      const matched = domains.find(d => d.name === targetDom);
      const initialIp = matched?.serverIp && matched.serverIp !== '127.0.0.1' ? matched.serverIp : '115.244.141.202';
      setServerIpInput(initialIp);
      fetchDnsRecords(targetDom, initialIp);

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

  const fetchDnsRecords = async (domainName, ipOverride) => {
    if (!domainName) return;
    try {
      const ip = ipOverride || serverIpInput || '115.244.141.202';
      const data = await api.getDnsRecords(domainName, `mail.${domainName}`, ip);
      if (data.records) setDnsRecords(data.records);
    } catch (e) {
      console.error('Error fetching DNS records:', e);
    }
  };

  const handleAutoDetectIp = async () => {
    try {
      setIsDetectingIp(true);
      const res = await api.getPublicIp();
      const detected = res.ip || '115.244.141.202';
      setServerIpInput(detected);
      if (selectedDomainForDns) {
        await api.updateDomain(selectedDomainForDns, { serverIp: detected });
        await onRefreshData();
      }
      fetchDnsRecords(selectedDomainForDns, detected);
      onNotify(`Detected IP: ${detected}`, 'info');
    } catch (err) {
      onNotify('Failed to detect public IP: ' + err.message, 'error');
    } finally {
      setIsDetectingIp(false);
    }
  };

  const handleIpChange = async (newIp) => {
    setServerIpInput(newIp);
    if (selectedDomainForDns) {
      try {
        await api.updateDomain(selectedDomainForDns, { serverIp: newIp.trim() });
      } catch (e) {}
    }
    fetchDnsRecords(selectedDomainForDns, newIp);
  };

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    try {
      setIsAddingDomain(true);
      const res = await api.addDomain({ name: newDomainName.trim() });
      onNotify(`Domain "${res.domain.name}" added.`, 'info');
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
    if (!confirm(`Are you sure you want to remove domain "${name}"?`)) return;
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
      onNotify(`Created account ${res.mailbox.email}!`, 'info');
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
    if (!confirm(`Delete mailbox "${email}"?`)) return;
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
      onNotify('Outbound delivery configuration saved.', 'info');
      await onRefreshData();
    } catch (err) {
      onNotify(err.message || 'Failed to update outbound settings', 'error');
    } finally {
      setIsSavingOutbound(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800/80 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg viewBox="0 0 1155 1000" className="w-3.5 h-3.5 fill-white">
                <path d="M577.346 0L1154.69 1000H0L577.346 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white text-xs tracking-tight">Mail Infrastructure Control</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Navigation Tabs */}
        <div className="flex border-b border-neutral-850 bg-black px-5">
          <button
            onClick={() => setActiveTab('domains')}
            className={`py-2.5 px-3 text-xs font-medium border-b transition-colors flex items-center gap-2 ${
              activeTab === 'domains'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Domains & DNS</span>
          </button>
          <button
            onClick={() => setActiveTab('mailboxes')}
            className={`py-2.5 px-3 text-xs font-medium border-b transition-colors flex items-center gap-2 ${
              activeTab === 'mailboxes'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Accounts ({mailboxes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`py-2.5 px-3 text-xs font-medium border-b transition-colors flex items-center gap-2 ${
              activeTab === 'outbound'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Outbound Relay</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 font-sans">
          {/* TAB 1: DOMAINS & DNS */}
          {activeTab === 'domains' && (
            <div className="space-y-5">
              {/* Add Domain Input Form */}
              <form onSubmit={handleAddDomain} className="p-3.5 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2">
                <span className="text-xs font-medium text-neutral-300 block">
                  Add Domain
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="e.g. company.com"
                    className="flex-1 bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isAddingDomain || !newDomainName.trim()}
                    className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-medium rounded-md transition-colors whitespace-nowrap shadow-sm"
                  >
                    {isAddingDomain ? 'Adding...' : 'Connect'}
                  </button>
                </div>
              </form>

              {/* Added Domains List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">Configured Domains:</span>
                  <span className="font-mono text-neutral-600">{domains.length} total</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {domains.map((dom) => {
                    const isSelected = selectedDomainForDns === dom.name;
                    return (
                      <div
                        key={dom.id || dom.name}
                        onClick={() => {
                          setSelectedDomainForDns(dom.name);
                          fetchDnsRecords(dom.name);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-neutral-900 border-neutral-600 text-white font-medium'
                            : 'bg-black border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-mono">{dom.name}</span>
                        {domains.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDomain(dom.name);
                            }}
                            className="p-0.5 hover:text-rose-400 transition-colors ml-1"
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

              {/* Server Public IP Control */}
              <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Host Public IP (A Record target)</span>
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Must be your public internet IP for A-record routing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={serverIpInput}
                      onChange={(e) => handleIpChange(e.target.value)}
                      placeholder="e.g. 115.244.141.202"
                      className="bg-black border border-neutral-800 focus:border-neutral-600 rounded-md px-2.5 py-1 text-xs text-white font-mono w-36 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAutoDetectIp}
                      disabled={isDetectingIp}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-750 transition-colors whitespace-nowrap"
                    >
                      {isDetectingIp ? 'Detecting...' : 'Auto-Detect'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated DNS Records for selected domain with clear, step-by-step registrar instructions */}
              <div className="space-y-3 pt-1 border-t border-neutral-850">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-medium text-white flex items-center gap-2">
                      <span>DNS Configuration for</span>
                      <span className="font-mono text-neutral-400">@{selectedDomainForDns}</span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyDns}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>Check Live DNS</span>
                  </button>
                </div>

                {verifyResult && (
                  <div className={`p-2.5 rounded-md border text-xs font-mono ${
                    verifyResult.mxConfigured 
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {verifyResult.mxConfigured ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />}
                      <span>{verifyResult.mxConfigured ? 'MX records detected on DNS' : 'MX records pending DNS propagation'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {dnsRecords.map((rec, idx) => {
                    const hostKey = `${idx}_host`;
                    const valKey = `${idx}_val`;
                    const prioKey = `${idx}_prio`;
                    const instrKey = `${idx}_instr`;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2.5"
                      >
                        {/* Step Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-neutral-850">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-750 text-neutral-300 font-mono text-[10px] flex items-center justify-center font-bold">
                              {rec.step || idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {rec.title || `${rec.type} Record`}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.instruction, instrKey)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors self-start sm:self-auto"
                          >
                            {copiedKey === instrKey ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span className="text-white">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Instruction</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Explicit Guidance Banner */}
                        <div className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          Select Type <strong className="text-white font-mono bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">{rec.type}</strong>, set Host to <strong className="text-white font-mono bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">{rec.host}</strong>, {rec.priority ? <>set Priority to <strong className="text-white font-mono bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">{rec.priority}</strong>, </> : ''}and set Points To to:
                        </div>

                        {/* Structured Field Tiles */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                          {/* 1. TYPE */}
                          <div className="p-2 rounded bg-neutral-900/60 border border-neutral-850">
                            <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                              1. Type
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {rec.type}
                            </span>
                          </div>

                          {/* 2. HOST / NAME */}
                          <div className="p-2 rounded bg-neutral-900/60 border border-neutral-850 flex flex-col justify-between">
                            <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                              2. Host / Name
                            </span>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-mono font-bold text-white truncate">{rec.host}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.host, hostKey)}
                                className="p-0.5 text-neutral-500 hover:text-white"
                                title="Copy Host"
                              >
                                {copiedKey === hostKey ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* 3. PRIORITY */}
                          {rec.priority !== null && rec.priority !== undefined ? (
                            <div className="p-2 rounded bg-neutral-900/60 border border-neutral-850 flex flex-col justify-between">
                              <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                                3. Priority
                              </span>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-mono font-bold text-neutral-200">{rec.priority}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(String(rec.priority), prioKey)}
                                  className="p-0.5 text-neutral-500 hover:text-white"
                                  title="Copy Priority"
                                >
                                  {copiedKey === prioKey ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded bg-neutral-900/60 border border-neutral-850">
                              <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                                3. TTL
                              </span>
                              <span className="text-xs font-mono text-neutral-400">Auto</span>
                            </div>
                          )}

                          {/* 4. TTL */}
                          {rec.priority !== null && rec.priority !== undefined && (
                            <div className="p-2 rounded bg-neutral-900/60 border border-neutral-850">
                              <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-0.5">
                                4. TTL
                              </span>
                              <span className="text-xs font-mono text-neutral-400">Auto</span>
                            </div>
                          )}
                        </div>

                        {/* 5. VALUE / POINTS TO */}
                        <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                              Points To / Value:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(rec.value, valKey)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                            >
                              {copiedKey === valKey ? (
                                <>
                                  <Check className="w-3 h-3 text-white" />
                                  <span className="text-white">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Value</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-xs text-white select-all overflow-x-auto break-all bg-black p-2 rounded border border-neutral-850">
                            {rec.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL ACCOUNTS (MAILBOXES) */}
          {activeTab === 'mailboxes' && (
            <div className="space-y-5">
              {/* Create Mailbox Form */}
              <form onSubmit={handleCreateMailbox} className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-3">
                <span className="text-xs font-medium text-white block">
                  Create Mailbox
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Username</label>
                    <div className="flex items-center bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs">
                      <input
                        type="text"
                        value={mbUsername}
                        onChange={(e) => setMbUsername(e.target.value)}
                        placeholder="ansh"
                        className="flex-1 bg-transparent text-white focus:outline-none font-mono"
                        required
                      />
                      <span className="text-neutral-600">@</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Domain</label>
                    <select
                      value={mbDomain}
                      onChange={(e) => setMbDomain(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                    >
                      {domains.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={mbName}
                      onChange={(e) => setMbName(e.target.value)}
                      placeholder="e.g. Ansh Sharma"
                      className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={mbPassword}
                      onChange={(e) => setMbPassword(e.target.value)}
                      placeholder="Mailbox password"
                      className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isCreatingMb || !mbUsername.trim() || !mbPassword}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-semibold rounded-md shadow-sm transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isCreatingMb ? 'Creating...' : 'Create Account'}</span>
                  </button>
                </div>
              </form>

              {/* Configured Mailboxes List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">Active Accounts:</span>
                  <span className="font-mono text-neutral-600">{mailboxes.length} configured</span>
                </div>

                <div className="divide-y divide-neutral-850 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                  {mailboxes.map((mb) => {
                    const isActive = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                    return (
                      <div
                        key={mb.id || mb.email}
                        className={`p-3 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-neutral-900/70' : 'hover:bg-neutral-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono text-[10px] text-neutral-400 shrink-0">
                            {mb.name ? mb.name.slice(0, 2).toUpperCase() : 'MB'}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-white">{mb.name}</span>
                              {isActive && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-neutral-400">{mb.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMailbox(mb.email);
                                onNotify(`Switched to ${mb.email}`, 'info');
                              }}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                            >
                              Switch
                            </button>
                          )}
                          {mailboxes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMailbox(mb.email)}
                              className="p-1 rounded text-neutral-500 hover:text-rose-400 transition-colors"
                              title="Delete"
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
            <form onSubmit={handleSaveOutbound} className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-white mb-0.5">Outbound SMTP Routing</h4>
                <p className="text-[11px] text-neutral-500">
                  Select delivery transport for external recipients.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setOutboundMode('relay')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    outboundMode === 'relay'
                      ? 'bg-neutral-900 border-neutral-600'
                      : 'bg-black border-neutral-850 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">SMTP Relay (Port 587)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded border border-neutral-750 font-mono text-neutral-400">RECOMMENDED</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Uses authenticated relay via Gmail, Brevo, or SendGrid. Works on any WiFi connection without ISP port 25 blocks.
                  </p>
                </div>

                <div
                  onClick={() => setOutboundMode('direct')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    outboundMode === 'direct'
                      ? 'bg-neutral-900 border-neutral-600'
                      : 'bg-black border-neutral-850 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">Direct MX (Port 25)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded border border-neutral-800 font-mono text-neutral-500">VPS ONLY</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Direct delivery to recipient MX. Requires a Cloud VPS (AWS/DigitalOcean) with port 25 unblocked by provider.
                  </p>
                </div>
              </div>

              {outboundMode === 'relay' && (
                <div className="space-y-3.5 p-4 rounded-lg bg-neutral-900/40 border border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white">Quick Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp.gmail.com');
                          setRelayPort(587);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-750 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors"
                      >
                        Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp-relay.brevo.com');
                          setRelayPort(587);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-750 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors"
                      >
                        Brevo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp.sendgrid.net');
                          setRelayPort(587);
                          setRelayUser('apikey');
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-neutral-900 border border-neutral-750 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors"
                      >
                        SendGrid
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Relay Host</label>
                      <input
                        type="text"
                        value={relayHost}
                        onChange={(e) => setRelayHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Port</label>
                      <input
                        type="number"
                        value={relayPort}
                        onChange={(e) => setRelayPort(e.target.value)}
                        placeholder="587"
                        className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Login / Email</label>
                      <input
                        type="text"
                        value={relayUser}
                        onChange={(e) => setRelayUser(e.target.value)}
                        placeholder="username"
                        className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1 font-mono">Password / Key</label>
                      <input
                        type="password"
                        value={relayPass}
                        onChange={(e) => setRelayPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!relayHost) {
                          onNotify('Enter relay host first', 'error');
                          return;
                        }
                        try {
                          setIsTestingRelay(true);
                          await api.testRelay({
                            host: relayHost,
                            port: parseInt(relayPort, 10),
                            user: relayUser,
                            pass: relayPass
                          });
                          onNotify('Relay credentials verified and connected!', 'info');
                        } catch (err) {
                          onNotify('Relay failed: ' + err.message, 'error');
                        } finally {
                          setIsTestingRelay(false);
                        }
                      }}
                      disabled={isTestingRelay || !relayHost}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingRelay ? 'animate-spin' : ''}`} />
                      <span>{isTestingRelay ? 'Testing Socket...' : 'Test Connection'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-neutral-500">Port {relayPort || 587} TLS</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingOutbound}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSavingOutbound ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-neutral-800/80 bg-black flex items-center justify-between text-neutral-500 text-[11px] font-mono">
          <span>SMTP :{settings?.smtpPort || 2525}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
