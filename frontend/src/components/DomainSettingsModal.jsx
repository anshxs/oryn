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
      onNotify(`Detected public IP: ${detected}`, 'success');
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

              {/* Real Server Public IP Control */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-400" />
                      <span>Server Public IP (Used for Step 1 A Record)</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      External mail servers must know your real public IP (not localhost/127.0.0.1) to deliver emails.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={serverIpInput}
                      onChange={(e) => handleIpChange(e.target.value)}
                      placeholder="e.g. 115.244.141.202"
                      className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono w-40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAutoDetectIp}
                      disabled={isDetectingIp}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors whitespace-nowrap"
                      title="Detect this machine's public internet IP"
                    >
                      {isDetectingIp ? 'Detecting...' : 'Auto-Detect My IP'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated DNS Records for selected domain with clear, step-by-step registrar instructions */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/30 border border-blue-500/20 p-3.5 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span>How to add records in your DNS Provider</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Go to your DNS manager (Cloudflare, Namecheap, GoDaddy, Hostinger, etc.) for <strong className="text-white font-mono">{selectedDomainForDns}</strong>. Click <strong className="text-white">"Add record"</strong> for each step below:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyDns}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors shrink-0"
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
                      <span>{verifyResult.mxConfigured ? 'MX records successfully detected on public DNS!' : 'MX records not yet detected on live DNS'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {dnsRecords.map((rec, idx) => {
                    const hostKey = `${idx}_host`;
                    const valKey = `${idx}_val`;
                    const prioKey = `${idx}_prio`;
                    const instrKey = `${idx}_instr`;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                      >
                        {/* Step Header & Plain English Instruction */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40">
                              {rec.step || idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white tracking-wide">
                              {rec.title || `${rec.type} Record`}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.instruction, instrKey)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors self-start sm:self-auto"
                            title="Copy full instruction text"
                          >
                            {copiedKey === instrKey ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied Instructions</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Summary</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Explicit Guidance Banner */}
                        <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300">
                          <span className="font-semibold text-blue-400">Step Action: </span>
                          <span>Select Type <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">{rec.type}</strong>, set Host / Name to <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">{rec.host}</strong>, {rec.priority ? <>set Priority to <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">{rec.priority}</strong>, </> : ''}and set Value / Points To to <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono truncate">{rec.value}</strong>.</span>
                        </div>

                        {/* Structured Field Tiles */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {/* 1. TYPE */}
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              1. Select Type
                            </span>
                            <span className="text-xs font-bold text-blue-400 font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 inline-block">
                              {rec.type}
                            </span>
                          </div>

                          {/* 2. HOST / NAME */}
                          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              2. Host / Name
                            </span>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-mono font-bold text-white truncate">{rec.host}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.host, hostKey)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Copy Host"
                              >
                                {copiedKey === hostKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* 3. PRIORITY (or TTL if none) */}
                          {rec.priority !== null && rec.priority !== undefined ? (
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                3. Priority
                              </span>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-mono font-bold text-amber-300">{rec.priority}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(String(rec.priority), prioKey)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Copy Priority"
                                >
                                  {copiedKey === prioKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                3. TTL
                              </span>
                              <span className="text-xs font-mono text-slate-300">Auto / 3600</span>
                            </div>
                          )}

                          {/* 4. TTL */}
                          {rec.priority !== null && rec.priority !== undefined && (
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                4. TTL
                              </span>
                              <span className="text-xs font-mono text-slate-300">Auto / 3600</span>
                            </div>
                          )}
                        </div>

                        {/* 5. VALUE / POINTS TO (Full width) */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {rec.type === 'MX' ? 'Mail Server / Points To:' : 'Points To / Value / Content:'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(rec.value, valKey)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                              {copiedKey === valKey ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Copied Value</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Value</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-xs text-slate-100 select-all overflow-x-auto break-all bg-slate-950 p-2 rounded border border-slate-800/70">
                            {rec.value}
                          </div>
                        </div>

                        {/* Helper tip */}
                        <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <span className="text-blue-400 shrink-0">ℹ️</span>
                          <span>{rec.description} {rec.host === '@' && `(If your DNS provider doesn't accept "@", leave the Host field empty or enter "${selectedDomainForDns}")`}</span>
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
                  Select how external outgoing emails (e.g. to Gmail, Yahoo, Outlook) are routed from this server.
                </p>
              </div>

              {/* ISP Port 25 Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Important Note on Sending to Gmail / External Inboxes:</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Almost all residential ISPs (Airtel, Jio, Comcast, etc.) block outbound <strong>TCP Port 25</strong> to prevent spam. Direct MX delivery gives <em>"Greeting never received"</em> from a home connection.
                </p>
                <p className="text-[11px] text-amber-300 font-medium">
                  👉 To send emails from your computer to real Gmail addresses, select <strong>SMTP Relay</strong> below and use a free service like Brevo (Sendinblue) or your Gmail App Password!
                </p>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setOutboundMode('relay')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    outboundMode === 'relay'
                      ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-xs text-white">SMTP Relay (Recommended)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold font-mono">Port 587</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Uses authenticated port 587 via Gmail, Brevo, or SendGrid. Works 100% reliably on any home or office WiFi connection without port 25 blocks.
                  </p>
                </div>

                <div
                  onClick={() => setOutboundMode('direct')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    outboundMode === 'direct'
                      ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-xs text-white">Direct MX (Cloud VPS)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Port 25</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Connects directly to recipient's MX server. Requires a VPS (AWS, DigitalOcean, Hetzner) with outbound port 25 unblocked by provider.
                  </p>
                </div>
              </div>

              {outboundMode === 'relay' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Quick Provider Presets</h5>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp.gmail.com');
                          setRelayPort(587);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white transition-colors"
                      >
                        Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp-relay.brevo.com');
                          setRelayPort(587);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white transition-colors"
                      >
                        Brevo (Sendinblue)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRelayHost('smtp.sendgrid.net');
                          setRelayPort(587);
                          setRelayUser('apikey');
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white transition-colors"
                      >
                        SendGrid
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Relay Host</label>
                      <input
                        type="text"
                        value={relayHost}
                        onChange={(e) => setRelayHost(e.target.value)}
                        placeholder="e.g. smtp.gmail.com or smtp-relay.brevo.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Port</label>
                      <input
                        type="number"
                        value={relayPort}
                        onChange={(e) => setRelayPort(e.target.value)}
                        placeholder="587"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Username / Email</label>
                      <input
                        type="text"
                        value={relayUser}
                        onChange={(e) => setRelayUser(e.target.value)}
                        placeholder="yourname@gmail.com or Brevo login"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Password / App Password / API Key</label>
                      <input
                        type="password"
                        value={relayPass}
                        onChange={(e) => setRelayPass(e.target.value)}
                        placeholder="Google App Password (16 chars) or API key"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {relayHost.includes('gmail.com') && (
                    <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200">
                      💡 <strong>Gmail Setup:</strong> Don't enter your standard password. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-300">myaccount.google.com/apppasswords</a>, generate a 16-character App Password, and paste it above.
                    </div>
                  )}

                  {relayHost.includes('brevo.com') && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                      💡 <strong>Brevo Setup:</strong> Free 300 emails/day. Create a free account on <a href="https://app.brevo.com" target="_blank" rel="noreferrer" className="underline font-semibold text-indigo-300">app.brevo.com</a>, go to SMTP & API to get your login and key.
                    </div>
                  )}

                  {/* Test Connection Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!relayHost) {
                          onNotify('Please enter relay host first', 'error');
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
                          onNotify('Relay credentials verified and connected successfully!', 'success');
                        } catch (err) {
                          onNotify('Relay test failed: ' + err.message, 'error');
                        } finally {
                          setIsTestingRelay(false);
                        }
                      }}
                      disabled={isTestingRelay || !relayHost}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingRelay ? 'animate-spin' : ''}`} />
                      <span>{isTestingRelay ? 'Testing Socket...' : 'Test Relay Connection'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Verifies authentication on port {relayPort || 587}</span>
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
