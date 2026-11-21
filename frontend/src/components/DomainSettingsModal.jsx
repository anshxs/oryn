import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Copy, 
  Check, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Plus, 
  Trash2, 
  UserPlus, 
  Zap,
  Users,
  Activity,
  ShieldCheck,
  Radio,
  ExternalLink
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
import { cn } from '../lib/utils';

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
      onNotify(`Detected Host Public IP: ${detected}`, 'info');
    } catch (err) {
      onNotify('Failed to detect public IP: ' + err.message, 'error');
    } finally {
      setIsDetectingIp(false);
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
      <DialogContent className="max-w-4xl max-h-[88vh] bg-white dark:bg-[#0e0f11] border-zinc-200/90 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Header */}
        <DialogHeader className="p-4 border-b border-zinc-200/80 dark:border-zinc-850 flex flex-row items-center justify-between shrink-0 bg-[#fafbfc] dark:bg-[#121316]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Mail Server Control Center
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-3 border-b border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-[#0e0f11] shrink-0">
            <TabsList className="p-0.5 bg-zinc-100 dark:bg-zinc-900">
              <TabsTrigger value="domains" className="text-xs">
                Domains & DNS
              </TabsTrigger>
              <TabsTrigger value="mailboxes" className="text-xs">
                Mailboxes ({mailboxes.length})
              </TabsTrigger>
              <TabsTrigger value="relay" className="text-xs">
                Outbound SMTP Relay
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="text-xs">
                Runtime & Team
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-[#fafbfc] dark:bg-[#090a0c]">
            {/* TAB 1: DOMAINS & DNS */}
            <TabsContent value="domains" className="space-y-5 mt-0">
              <div className="flex flex-col md:flex-row gap-5">
                {/* Domain Selector Column */}
                <div className="w-full md:w-60 space-y-2 shrink-0">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    Domains ({domains.length})
                  </span>
                  <div className="space-y-1">
                    {domains.map((dom) => {
                      const isSelected = dom.name === selectedDomainForDns;
                      return (
                        <div
                          key={dom.name}
                          onClick={() => handleDomainSelect(dom.name)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                            isSelected
                              ? "bg-white border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:bg-[#15161a] dark:text-zinc-50 font-semibold shadow-xs"
                              : "bg-white/80 border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:bg-white dark:bg-[#101114] dark:border-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-medium">{dom.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">{dom.serverIp}</p>
                          </div>
                          {domains.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(dom.name);
                              }}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                        placeholder="yourdomain.com"
                        className="h-8 text-xs font-mono"
                      />
                      <Button type="submit" size="sm" disabled={isAddingDomain} className="h-8 px-2.5">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </form>
                </div>

                {/* DNS Setup Card */}
                <div className="flex-1 space-y-4 min-w-0">
                  <Card className="border-zinc-200/80 dark:border-zinc-800">
                    <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-850">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                            <span>{selectedDomainForDns}</span>
                            <Badge variant="outline" className="text-[10px] py-0 font-mono">
                              IP: {serverIpInput}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-500 mt-1">
                            Configure these DNS records with your domain registrar (Cloudflare, Namecheap, GoDaddy).
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAutoDetectIp}
                            disabled={isDetectingIp}
                            className="h-7.5 text-xs"
                          >
                            <Activity className={cn("w-3 h-3 mr-1.5", isDetectingIp && "animate-spin")} />
                            Detect Host IP
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleVerifyDns}
                            disabled={isVerifying}
                            className="h-7.5 text-xs"
                          >
                            <RotateCw className={cn("w-3 h-3 mr-1.5", isVerifying && "animate-spin")} />
                            Verify Live DNS
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Live Verification Banner */}
                    {verifyResult && (
                      <div className="px-5 pt-3">
                        <div className={cn(
                          "p-3 rounded-xl border text-xs flex items-center justify-between",
                          verifyResult.mxConfigured 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                        )}>
                          <div className="flex items-center gap-2">
                            {verifyResult.mxConfigured ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span className="font-medium">
                              {verifyResult.mxConfigured 
                                ? `Active MX detected pointing to ${verifyResult.mxRecords?.[0]?.exchange || 'mail host'}. Inbound delivery is ready!` 
                                : `MX record not detected yet. If you just added it, allow 1–5 minutes for DNS propagation.`}
                            </span>
                          </div>
                          {verifyResult.spfConfigured && (
                            <Badge variant="success" className="text-[10px] ml-2">SPF OK</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <CardContent className="space-y-2.5 p-4">
                      {dnsRecords.map((rec) => (
                        <div
                          key={rec.step}
                          className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-[#121316] space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                                {rec.type}
                              </span>
                              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                {rec.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Step {rec.step}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            {rec.instruction}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-[#0c0d0e] border border-zinc-200/60 dark:border-zinc-800 text-xs font-mono">
                              <div className="truncate pr-1">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Host / Name</span>
                                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{rec.host}</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(rec.host, `host_${rec.step}`)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                                title="Copy Host"
                              >
                                {copiedKey === `host_${rec.step}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-[#0c0d0e] border border-zinc-200/60 dark:border-zinc-800 text-xs font-mono">
                              <div className="truncate pr-1">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Value / Target</span>
                                <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">{rec.value}</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(rec.value, `val_${rec.step}`)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                                title="Copy Value"
                              >
                                {copiedKey === `val_${rec.step}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
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

            {/* TAB 2: MAILBOXES */}
            <TabsContent value="mailboxes" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Active Mailbox List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    Provisioned Mailboxes ({mailboxes.length})
                  </span>
                  <div className="space-y-1.5">
                    {mailboxes.map((mb) => {
                      const isCurrent = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                      return (
                        <div
                          key={mb.email}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between transition-colors",
                            isCurrent
                              ? "bg-white border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:bg-[#121316] dark:text-zinc-50 shadow-xs"
                              : "bg-white/80 border-zinc-200/80 text-zinc-700 dark:bg-[#101114] dark:border-zinc-800 dark:text-zinc-300"
                          )}
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{mb.name || mb.username}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">{mb.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!isCurrent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectMailbox(mb.email)}
                                className="h-6.5 text-[11px]"
                              >
                                Switch
                              </Button>
                            )}
                            {mailboxes.length > 1 && (
                              <button
                                onClick={() => handleDeleteMailbox(mb.email)}
                                className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                <Card className="border-zinc-200/80 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Provision Email Account
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Add a custom address under your registered domain.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateMailbox} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Display Name</label>
                        <Input
                          type="text"
                          value={mbName}
                          onChange={(e) => setMbName(e.target.value)}
                          placeholder="e.g. Arpit Rajput"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Username</label>
                          <Input
                            type="text"
                            value={mbUsername}
                            onChange={(e) => setMbUsername(e.target.value)}
                            placeholder="e.g. arpit"
                            className="h-8 text-xs font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Domain</label>
                          <select
                            value={mbDomain}
                            onChange={(e) => setMbDomain(e.target.value)}
                            className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#0c0d0e] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                          >
                            {domains.map(d => (
                              <option key={d.name} value={d.name}>@{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Password</label>
                        <Input
                          type="password"
                          value={mbPassword}
                          onChange={(e) => setMbPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-8 text-xs"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isCreatingMb}
                        className="w-full text-xs h-8.5 mt-2"
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
              <Card className="border-zinc-200/80 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Server className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Outbound Delivery Engine
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Configure how Oryn delivers outbound email to external servers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setOutboundMode('direct')}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all",
                        outboundMode === 'direct'
                          ? "bg-white border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:bg-[#121316] dark:text-zinc-50 font-semibold shadow-xs"
                          : "bg-white/80 border-zinc-200/80 text-zinc-600 dark:bg-[#101114] dark:border-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      <h4 className="text-xs font-bold mb-1">Direct Delivery (Port 25 MX)</h4>
                      <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                        Resolves recipient domain MX records directly via DNS. Note: Home ISPs commonly block outbound port 25.
                      </p>
                    </div>

                    <div
                      onClick={() => setOutboundMode('relay')}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all",
                        outboundMode === 'relay'
                          ? "bg-white border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:bg-[#121316] dark:text-zinc-50 font-semibold shadow-xs"
                          : "bg-white/80 border-zinc-200/80 text-zinc-600 dark:bg-[#101114] dark:border-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      <h4 className="text-xs font-bold mb-1">Authenticated SMTP Relay (Port 587)</h4>
                      <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                        Bypasses ISP port 25 filters using Brevo, SendGrid, Mailgun, or AWS SES for 100% reliable delivery.
                      </p>
                    </div>
                  </div>

                  {outboundMode === 'relay' && (
                    <form onSubmit={handleSaveOutbound} className="space-y-3 pt-2">
                      {/* Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-1">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mr-1">Presets:</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRelayHost('smtp-relay.brevo.com');
                            setRelayPort(587);
                          }}
                          className="h-6 text-[10px] px-2"
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
                          className="h-6 text-[10px] px-2"
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
                          className="h-6 text-[10px] px-2"
                        >
                          Mailgun
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">SMTP Host</label>
                          <Input
                            type="text"
                            value={relayHost}
                            onChange={(e) => setRelayHost(e.target.value)}
                            placeholder="smtp-relay.brevo.com"
                            className="h-8 text-xs font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Port</label>
                          <Input
                            type="number"
                            value={relayPort}
                            onChange={(e) => setRelayPort(e.target.value)}
                            placeholder="587"
                            className="h-8 text-xs font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Username / Login</label>
                          <Input
                            type="text"
                            value={relayUser}
                            onChange={(e) => setRelayUser(e.target.value)}
                            placeholder="api-key or login"
                            className="h-8 text-xs font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Password / API Key</label>
                          <Input
                            type="password"
                            value={relayPass}
                            onChange={(e) => setRelayPass(e.target.value)}
                            placeholder="••••••••"
                            className="h-8 text-xs font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          type="submit"
                          disabled={isSavingOutbound}
                          className="text-xs h-8 px-4"
                        >
                          Save Relay Settings
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestRelay}
                          disabled={isTestingRelay}
                          className="text-xs h-8 px-3"
                        >
                          <Zap className={cn("w-3.5 h-3.5 mr-1.5 text-amber-500", isTestingRelay && "animate-spin")} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Server Diagnostics */}
                <Card className="border-zinc-200/80 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" /> Runtime Diagnostics
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      RFC 5321 SMTP daemon & REST API metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between p-2.5 rounded-lg bg-white dark:bg-[#121316] border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-zinc-400">Inbound SMTP Port</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{settings?.smtpPort || 2525} (RFC 5321)</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-white dark:bg-[#121316] border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-zinc-400">API & WebSockets</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{settings?.httpPort || 4000}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-white dark:bg-[#121316] border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-zinc-400">Public Server IP</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{serverIpInput}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-white dark:bg-[#121316] border border-zinc-200/60 dark:border-zinc-800">
                      <span className="text-zinc-400">Outbound Dispatch Mode</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold uppercase">{settings?.outboundMode || 'Direct'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Roster */}
                <Card className="border-zinc-200/80 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Project Contributors
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Group engineering project authors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: 'Arpit Rajput', email: 'imironman7599@gmail.com', role: 'Security & Low-level Engines' },
                      { name: 'Ansh Sharma', email: 'anshsxa@gmail.com', role: 'Architecture & Fullstack Core' },
                      { name: 'Mayank Chauhan', email: 'mchauhantha@gmail.com', role: 'Models & Storage' },
                      { name: 'Swaraj Agarwal', email: 'agarwalswaraj123@gmail.com', role: 'Controllers & Routing' }
                    ].map((member) => (
                      <div
                        key={member.email}
                        className="p-2 rounded-lg bg-white dark:bg-[#121316] border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{member.name}</p>
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
