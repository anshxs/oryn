import React, { useState, useRef, useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus, 
  Globe, 
  Settings, 
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
    <aside className="w-64 bg-black border-r border-neutral-800/80 flex flex-col justify-between select-none">
      <div>
        {/* Vercel-style Minimal Header */}
        <div className="p-4 border-b border-neutral-800/70 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 flex items-center justify-center">
                {/* Vercel Geometric Triangle Icon */}
                <svg viewBox="0 0 1155 1000" className="w-4 h-4 fill-white">
                  <path d="M577.346 0L1154.69 1000H0L577.346 0Z" />
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                Oryn <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono border border-neutral-800">MTA</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Mailbox Selector Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors text-left group"
          >
            <div className="truncate pr-2">
              <p className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                {currentMailboxObj?.name || 'Mailbox'}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono truncate">
                {activeMailbox || 'Select account'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mailbox Dropdown Popover */}
          {dropdownOpen && (
            <div className="absolute top-[102px] left-3 right-3 z-50 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-100">
              <div className="px-2 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isCurrent
                          ? 'bg-neutral-900 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="truncate text-left">
                        <p className="truncate leading-tight text-neutral-200">{mb.name}</p>
                        <p className="text-[10px] font-mono text-neutral-500 truncate">{mb.email}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-neutral-800/80 space-y-0.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings('mailboxes');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                  <span>New Mailbox</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings('domains');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Connect Domain</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Signature Vercel Compose Button */}
        <div className="p-3">
          <button
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-md shadow-sm transition-all duration-150 active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Compose</span>
          </button>
        </div>

        {/* Minimal Navigation Folders */}
        <nav className="px-2 space-y-0.5">
          {folders.map(folder => {
            const Icon = folder.icon;
            const active = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  active 
                    ? 'bg-neutral-900 text-white font-semibold' 
                    : 'text-neutral-400 hover:bg-neutral-950 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    active ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Minimal Footer Actions */}
      <div className="p-3 border-t border-neutral-800/80 space-y-2">
        {/* Test Simulator Button */}
        <button
          onClick={onSimulateInbound}
          disabled={isSimulating}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/80 transition-colors"
          title={`Simulate receiving an inbound email to ${activeMailbox}`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-neutral-400" />
            <span>{isSimulating ? 'Receiving...' : 'Simulate Inbound'}</span>
          </div>
          <span className="text-[9px] px-1 py-0.2 rounded border border-neutral-800 font-mono text-neutral-500">TEST</span>
        </button>

        {/* Domain & Accounts Settings Hub */}
        <button
          onClick={() => onOpenSettings('domains')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-neutral-300 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/80 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <div className="truncate text-left">
              <p className="font-medium truncate text-neutral-200">Domains & Accounts</p>
              <p className="text-[10px] text-neutral-500 font-mono">{domains.length} dom • {mailboxes.length} acc</p>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        </button>

        {/* Server status indicator */}
        <div className="px-1 pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>SMTP :{settings?.smtpPort || 2525}</span>
          <span>HTTP :{settings?.httpPort || 4000}</span>
        </div>
      </div>
    </aside>
  );
}
