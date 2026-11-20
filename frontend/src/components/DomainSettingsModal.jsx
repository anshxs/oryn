import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server, 
  Plus, 
  Trash2, 
  UserPlus, 
  Mail,
  Zap,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Separator } from './ui/separator';

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
  const [activeTab, setActiveTab] = useState(initialTab);
  
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
      const targetDom = domains[0]?.name || 'glennesports.app';
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
      onNotify(`Detected Server IP: ${detected}`, 'info');
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
        fetchDnsRecords(selectedDomainForDns, newIp.trim());
      } catch (err) {}
    }
  };

  const handleDomainSelect = (domName) => {
    setSelectedDomainForDns(domName);
    const matched = domains.find(d => d.name === domName);
    const ip = matched?.serverIp || serverIpInput;
    setServerIpInput(ip);
    fetchDnsRecords(domName, ip);
    setVerifyResult(null);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName || !newDomainName.trim()) return;
    try {
      setIsAddingDomain(true);
      const clean = newDomainName.trim().toLowerCase();
      await api.addDomain({
        name: clean,
        serverHost: `mail.${clean}`,
        serverIp: serverIpInput
      });
      setNewDomainName('');
      await onRefreshData();
      handleDomainSelect(clean);
      onNotify(`Domain "${clean}" registered successfully!`, 'success');
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (name) => {
    if (!confirm(`Are you sure you want to delete domain "${name}"? All associated mailboxes will also be deleted.`)) return;
    try {
      await api.deleteDomain(name);
      await onRefreshData();
      onNotify(`Domain "${name}" removed.`, 'info');
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    if (!mbUsername || !mbDomain) {
      onNotify('Username and Domain are required.', 'error');
      return;
    }
    if (!mbPassword || mbPassword.length < 4) {
      onNotify('Password must be at least 4 characters long.', 'error');
      return;
    }

    try {
      setIsCreatingMb(true);
      const res = await api.createMailbox({
        username: mbUsername.trim().toLowerCase(),
        domain: mbDomain,
        name: mbName.trim() || mbUsername.trim(),
        password: mbPassword
      });
      setMbUsername('');
      setMbPassword('');
      setMbName('');
      await onRefreshData();
      if (res.mailbox) {
        onSelectMailbox(res.mailbox.email);
      }
      onNotify(`Mailbox created: ${res.mailbox?.email}`, 'success');
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
      await onRefreshData();
      onNotify(`Mailbox "${email}" removed.`, 'info');
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleVerifyDns = async () => {
    if (!selectedDomainForDns) return;
    try {
      setIsVerifying(true);
      const res = await api.verifyDns(selectedDomainForDns, `mail.${selectedDomainForDns}`);
      setVerifyResult(res.check);
      if (res.check?.mxConfigured) {
        onNotify(`DNS Active: MX points to mail.${selectedDomainForDns}!`, 'success');
      } else {
        onNotify(`DNS Records not detected yet. DNS propagation may take a few minutes.`, 'info');
      }
    } catch (err) {
      onNotify(`Verification check failed: ${err.message}`, 'error');
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
          host: relayHost.trim(),
          port: parseInt(relayPort, 10),
          secure: relayPort === 465,
          user: relayUser.trim(),
          pass: relayPass.trim()
        }
      });
      await onRefreshData();
      onNotify('Outbound SMTP settings updated.', 'success');
    } catch (err) {
      onNotify('Failed to save settings: ' + err.message, 'error');
    } finally {
      setIsSavingOutbound(false);
    }
  };

  const handleTestRelay = async () => {
    if (!relayHost || !relayUser || !relayPass) {
      onNotify('Host, user and password are required to test relay.', 'error');
      return;
    }
    try {
      setIsTestingRelay(true);
      await api.testRelay({
        host: relayHost.trim(),
        port: parseInt(relayPort, 10),
        secure: relayPort === 465,
        user: relayUser.trim(),
        pass: relayPass.trim()
      });
      onNotify('Relay credentials verified successfully!', 'success');
    } catch (err) {
      onNotify('Relay test failed: ' + err.message, 'error');
    } finally {
      setIsTestingRelay(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Header */}
        <DialogHeader className="p-4 border-b border-zinc-800/80 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-300" /> Control Center
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-3 border-b border-zinc-800/80 bg-zinc-950/60 shrink-0">
            <TabsList className="bg-zinc-900 border-zinc-800 p-1">
              <TabsTrigger value="domains" className="text-xs">
                Domains & DNS
              </TabsTrigger>
              <TabsTrigger value="mailboxes" className="text-xs">
                Mailbox Accounts ({mailboxes.length})
              </TabsTrigger>
              <TabsTrigger value="relay" className="text-xs">
                Outbound SMTP Relay
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="text-xs">
                Diagnostics & Team
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* TAB 1: DOMAINS & DNS */}
            <TabsContent value="domains" className="space-y-6 mt-0">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Domain selector pills */}
                <div className="w-full md:w-64 space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Registered Domains
                  </span>
                  <div className="space-y-1">
                    {domains.map((dom) => {
                      const isSelected = dom.name === selectedDomainForDns;
                      return (
                        <div
                          key={dom.name}
                          onClick={() => handleDomainSelect(dom.name)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-zinc-900 border-zinc-300 text-white'
                              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium truncate">{dom.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{dom.serverIp}</p>
                          </div>
                          {domains.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(dom.name);
                              }}
                              className="text-zinc-500 hover:text-red-400 p-1"
                              title="Delete domain"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Domain Form */}
                  <form onSubmit={handleAddDomain} className="pt-2">
                    <div className="flex gap-1.5">
                      <Input
                        type="text"
                        value={newDomainName}
                        onChange={(e) => setNewDomainName(e.target.value)}
                        placeholder="newdomain.com"
                        className="h-8 text-xs bg-zinc-900/60 border-zinc-800"
                      />
                      <Button type="submit" size="sm" disabled={isAddingDomain} className="h-8 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </form>
                </div>

                {/* DNS Setup Card */}
                <div className="flex-1 space-y-4">
                  <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                            <span>{selectedDomainForDns}</span>
                            <Badge variant="outline" className="text-[10px] py-0 font-mono">
                              Server IP: {serverIpInput}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-400 mt-1">
                            Add these records into your domain registrar's DNS management console (Cloudflare, Namecheap, GoDaddy, Hostinger).
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAutoDetectIp}
                            disabled={isDetectingIp}
                            className="h-8 text-xs border-zinc-800"
                          >
                            <Activity className={cn("w-3 h-3 mr-1.5", isDetectingIp && "animate-spin")} />
                            Detect IP
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleVerifyDns}
                            disabled={isVerifying}
                            className="h-8 text-xs"
                          >
                            <RotateCw className={cn("w-3 h-3 mr-1.5", isVerifying && "animate-spin")} />
                            Verify Live DNS
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Live Verification Banner if run */}
                    {verifyResult && (
                      <div className="px-5 pb-3">
                        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          verifyResult.mxConfigured 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            {verifyResult.mxConfigured ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                            )}
                            <span>
                              {verifyResult.mxConfigured 
                                ? `Active MX detected pointing to ${verifyResult.mxRecords?.[0]?.exchange || 'mail server'}. Mail delivery is active!` 
                                : `MX record not detected yet. If recently saved, allow a few minutes for DNS cache to propagate.`}
                            </span>
                          </div>
                          {verifyResult.spfConfigured && (
                            <Badge variant="success" className="text-[10px] ml-2">SPF Active</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <CardContent className="space-y-3 pt-0">
                      {dnsRecords.map((rec) => (
                        <div
                          key={rec.step}
                          className="p-3 rounded-lg border border-zinc-800/90 bg-zinc-950/70 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                                {rec.type}
                              </Badge>
                              <span className="text-xs font-semibold text-zinc-200">
                                {rec.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Step {rec.step}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400">
                            {rec.instruction}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono">
                              <div className="truncate pr-1">
                                <span className="text-[10px] text-zinc-500 uppercase block">Host / Name</span>
                                <span className="text-zinc-200">{rec.host}</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(rec.host, `host_${rec.step}`)}
                                className="text-zinc-400 hover:text-white p-1"
                                title="Copy Host"
                              >
                                {copiedKey === `host_${rec.step}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono">
                              <div className="truncate pr-1">
                                <span className="text-[10px] text-zinc-500 uppercase block">Value / Points To</span>
                                <span className="text-zinc-200 truncate">{rec.value}</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(rec.value, `val_${rec.step}`)}
                                className="text-zinc-400 hover:text-white p-1"
                                title="Copy Value"
                              >
                                {copiedKey === `val_${rec.step}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: MAILBOX ACCOUNTS */}
            <TabsContent value="mailboxes" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Mailbox List */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Configured Mailboxes ({mailboxes.length})
                  </span>
                  <div className="space-y-2">
                    {mailboxes.map((mb) => {
                      const isCurrent = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                      return (
                        <div
                          key={mb.email}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-zinc-900 border-zinc-400 text-white shadow-xs'
                              : 'bg-zinc-900/40 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-semibold text-zinc-100">{mb.name || mb.username}</p>
                            <p className="text-[11px] text-zinc-400 font-mono truncate">{mb.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!isCurrent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectMailbox(mb.email)}
                                className="h-7 text-xs border-zinc-800"
                              >
                                Switch
                              </Button>
                            )}
                            {mailboxes.length > 1 && (
                              <button
                                onClick={() => handleDeleteMailbox(mb.email)}
                                className="p-1 text-zinc-500 hover:text-red-400"
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

                {/* Create Mailbox Form */}
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Create New Mailbox
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Provision a new custom address on any of your active domains.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateMailbox} className="space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Display Name</label>
                        <Input
                          type="text"
                          value={mbName}
                          onChange={(e) => setMbName(e.target.value)}
                          placeholder="e.g. Arpit Rajput"
                          className="h-8 text-xs bg-zinc-950 border-zinc-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Username</label>
                          <Input
                            type="text"
                            value={mbUsername}
                            onChange={(e) => setMbUsername(e.target.value)}
                            placeholder="e.g. arpit"
                            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Domain</label>
                          <select
                            value={mbDomain}
                            onChange={(e) => setMbDomain(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                          >
                            {domains.map(d => (
                              <option key={d.name} value={d.name}>@{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Password</label>
                        <Input
                          type="password"
                          value={mbPassword}
                          onChange={(e) => setMbPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-8 text-xs bg-zinc-950 border-zinc-800"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isCreatingMb}
                        className="w-full text-xs h-9 mt-2"
                      >
                        {isCreatingMb ? 'Provisioning...' : 'Provision Mailbox'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: OUTBOUND SMTP RELAY */}
            <TabsContent value="relay" className="space-y-6 mt-0">
              <Card className="border-zinc-800 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Outbound Delivery Settings
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Choose how outbound messages are routed to recipients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setOutboundMode('direct')}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        outboundMode === 'direct'
                          ? 'bg-zinc-900 border-zinc-300 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <h4 className="text-xs font-semibold mb-1">Direct Delivery (Port 25 MX)</h4>
                      <p className="text-[11px] text-zinc-500">Resolves recipient domain MX records directly. Note: May be blocked by residential ISPs.</p>
                    </div>

                    <div
                      onClick={() => setOutboundMode('relay')}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        outboundMode === 'relay'
                          ? 'bg-zinc-900 border-zinc-300 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <h4 className="text-xs font-semibold mb-1">Authenticated SMTP Relay (Port 587)</h4>
                      <p className="text-[11px] text-zinc-500">Routes through Brevo, SendGrid, or Mailgun for 100% reliable inbox delivery.</p>
                    </div>
                  </div>

                  {outboundMode === 'relay' && (
                    <form onSubmit={handleSaveOutbound} className="space-y-3 pt-2">
                      {/* Presets */}
                      <div className="flex items-center gap-2 pb-1">
                        <span className="text-[11px] text-zinc-400 font-mono uppercase">Quick Presets:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRelayHost('smtp-relay.brevo.com');
                            setRelayPort(587);
                          }}
                          className="h-6 text-[11px] px-2 border-zinc-800"
                        >
                          Brevo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRelayHost('smtp.sendgrid.net');
                            setRelayPort(587);
                          }}
                          className="h-6 text-[11px] px-2 border-zinc-800"
                        >
                          SendGrid
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRelayHost('smtp.mailgun.org');
                            setRelayPort(587);
                          }}
                          className="h-6 text-[11px] px-2 border-zinc-800"
                        >
                          Mailgun
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">SMTP Host</label>
                          <Input
                            type="text"
                            value={relayHost}
                            onChange={(e) => setRelayHost(e.target.value)}
                            placeholder="smtp-relay.brevo.com"
                            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Port</label>
                          <Input
                            type="number"
                            value={relayPort}
                            onChange={(e) => setRelayPort(e.target.value)}
                            placeholder="587"
                            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Username / Login</label>
                          <Input
                            type="text"
                            value={relayUser}
                            onChange={(e) => setRelayUser(e.target.value)}
                            placeholder="user or api-key"
                            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400 uppercase font-mono block mb-1">Password / API Key</label>
                          <Input
                            type="password"
                            value={relayPass}
                            onChange={(e) => setRelayPass(e.target.value)}
                            placeholder="••••••••"
                            className="h-8 text-xs font-mono bg-zinc-950 border-zinc-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          type="submit"
                          disabled={isSavingOutbound}
                          className="text-xs h-8"
                        >
                          Save Outbound Settings
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestRelay}
                          disabled={isTestingRelay}
                          className="text-xs h-8 border-zinc-800"
                        >
                          <Zap className={cn("w-3.5 h-3.5 mr-1.5 text-amber-400", isTestingRelay && "animate-bounce")} />
                          {isTestingRelay ? 'Verifying...' : 'Test Connection'}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: DIAGNOSTICS & TEAM */}
            <TabsContent value="diagnostics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Server Diagnostics */}
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Server Runtime Diagnostics
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      RFC 5321 SMTP daemon & HTTP REST API status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400">Inbound SMTP Port</span>
                      <span className="text-zinc-100 font-semibold">{settings?.smtpPort || 2525} (RFC 5321)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400">HTTP & WebSocket Port</span>
                      <span className="text-zinc-100 font-semibold">{settings?.httpPort || 4000}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400">Public Server IP</span>
                      <span className="text-zinc-100 font-semibold">{serverIpInput}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400">Outbound Dispatch Mode</span>
                      <span className="text-zinc-100 font-semibold uppercase">{settings?.outboundMode || 'Direct'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Roster */}
                <Card className="border-zinc-800 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-300" /> Project Contributors
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Academic project assignment team members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: 'Arpit Rajput', email: 'imironman7599@gmail.com', role: 'Security & Low-level Engines' },
                      { name: 'Ansh Sharma', email: 'anshsxa@gmail.com', role: 'Architecture & Fullstack Core' },
                      { name: 'Mayank Chauhan', email: 'mchauhantha@gmail.com', role: 'Models & Data Management' },
                      { name: 'Swaraj Agarwal', email: 'agarwalswaraj123@gmail.com', role: 'Controllers & API Lifecycle' }
                    ].map((member) => (
                      <div
                        key={member.email}
                        className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-zinc-200">{member.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{member.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
