import React from 'react';
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
  Server
} from 'lucide-react';

export default function Sidebar({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  onOpenSettings,
  onSimulateInbound,
  stats,
  settings,
  isSimulating
}) {
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats?.unreadInbox },
    { id: 'sent', label: 'Sent', icon: Send, count: stats?.sentCount },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats?.trashCount }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Oryn <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">MTA</span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                @{settings?.domain || 'custom-domain'}
              </p>
            </div>
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 transform hover:-translate-y-0.5"
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
      <div className="p-4 border-t border-slate-800/60 space-y-2.5">
        {/* Test Simulator Button */}
        <button
          onClick={onSimulateInbound}
          disabled={isSimulating}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          title="Simulate receiving an inbound email from external client"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Inbound'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 font-mono">TEST</span>
        </button>

        {/* Domain Config Pill */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="truncate text-left">
              <p className="font-semibold truncate text-slate-200">{settings?.domain || 'Configure Domain'}</p>
              <p className="text-[10px] text-slate-400">DNS & SMTP Setup</p>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Server status indicator */}
        <div className="px-1 pt-1 flex items-center justify-between text-[11px] text-slate-400">
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
