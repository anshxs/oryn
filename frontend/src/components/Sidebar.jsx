import React, { useState, useRef, useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus, 
  Globe, 
  Settings, 
  Mail, 
  Zap,
  ChevronDown,
  Check,
  UserPlus
} from 'lucide-react';

export default function Sidebar({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  onOpenSettings,
  onSimulateInbound,
  stats,
  settings,
  domains = [],
  mailboxes = [],
  activeMailbox,
  onSelectMailbox,
  isSimulating
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats?.unreadInbox },
    { id: 'sent', label: 'Sent', icon: Send, count: stats?.sentCount },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats?.trashCount }
  ];

  const currentMailboxObj = mailboxes.find(m => m.email.toLowerCase() === activeMailbox?.toLowerCase()) || mailboxes[0];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div>
        {/* Brand & Mailbox Switcher */}
        <div className="p-4 border-b border-slate-800/60 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Oryn <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">MTA</span>
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              Live
            </span>
          </div>

          {/* Mailbox Selector Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors text-left"
          >
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {currentMailboxObj?.name || 'My Mailbox'}
              </p>
              <p className="text-[11px] text-blue-400 font-mono truncate">
                {activeMailbox || 'No mailbox selected'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mailbox Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute top-[105px] left-3 right-3 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Accounts ({mailboxes.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {mailboxes.map((mb) => {
                  const isCurrent = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                  return (
                    <button
                      key={mb.id || mb.email}
                      onClick={() => {
                        onSelectMailbox(mb.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/20 text-blue-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate text-left">
                        <p className="truncate leading-tight">{mb.name}</p>
                        <p className="text-[10px] font-mono opacity-70 truncate">{mb.email}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-slate-800 space-y-0.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings('mailboxes');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create New Email</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings('domains');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>+ Add Custom Domain</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div className="p-3">
          <button
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Compose Mail</span>
          </button>
        </div>

        {/* Navigation Folders */}
        <nav className="px-3 space-y-1">
          {folders.map(folder => {
            const Icon = folder.icon;
            const active = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active 
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Domain Status */}
      <div className="p-3 border-t border-slate-800/60 space-y-2">
        {/* Test Simulator Button */}
        <button
          onClick={onSimulateInbound}
          disabled={isSimulating}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          title={`Simulate receiving an inbound email to ${activeMailbox}`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimulating ? 'Sending...' : 'Simulate Inbound'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 font-mono">TEST</span>
        </button>

        {/* Domain & Accounts Settings Hub */}
        <button
          onClick={() => onOpenSettings('domains')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="truncate text-left">
              <p className="font-semibold truncate text-slate-200">Domains & Accounts</p>
              <p className="text-[10px] text-slate-400">{domains.length} Domain{domains.length !== 1 ? 's' : ''} • {mailboxes.length} Account{mailboxes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Server status indicator */}
        <div className="px-1 pt-0.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SMTP :{settings?.smtpPort || 2525}</span>
          </div>
          <span className="font-mono text-slate-400">HTTP :{settings?.httpPort || 4000}</span>
        </div>
      </div>
    </aside>
  );
}
