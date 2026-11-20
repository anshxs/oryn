import React from 'react';
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
  Server,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';

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
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats?.unreadInbox },
    { id: 'sent', label: 'Sent', icon: Send, count: stats?.sentCount },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats?.trashCount }
  ];

  const currentMailboxObj = mailboxes.find(
    m => m.email.toLowerCase() === activeMailbox?.toLowerCase()
  ) || mailboxes[0];

  const getInitials = (name) => {
    if (!name) return 'O';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-zinc-950/95 border-r border-zinc-800/80 flex flex-col justify-between select-none backdrop-blur-md">
      <div className="flex flex-col h-full">
        {/* Modern SaaS Header */}
        <div className="p-4 border-b border-zinc-800/80 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/60 flex items-center justify-center shadow-xs">
                <Radio className="w-3.5 h-3.5 text-zinc-100" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                  Oryn <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">MTA</Badge>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-medium tracking-wide">Live</span>
            </div>
          </div>

          {/* Mailbox Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700 transition-all text-left group cursor-pointer shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Avatar className="h-7 w-7 rounded-md border border-zinc-700/50">
                    <AvatarFallback className="text-[11px] bg-zinc-800 text-zinc-200">
                      {getInitials(currentMailboxObj?.name || activeMailbox)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                      {currentMailboxObj?.name || 'My Mailbox'}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">
                      {activeMailbox || 'Select account'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-transform" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Mailbox Accounts ({mailboxes.length})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mailboxes.map((mb) => {
                const isCurrent = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                return (
                  <DropdownMenuItem
                    key={mb.id || mb.email}
                    onClick={() => onSelectMailbox(mb.email)}
                    className="flex items-center justify-between cursor-pointer py-1.5"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-medium text-zinc-200 truncate">{mb.name || mb.username}</p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{mb.email}</p>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-zinc-100 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenSettings('mailboxes')}
                className="cursor-pointer text-xs text-zinc-300"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Add Mailbox Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Compose Action */}
          <Button
            onClick={onOpenCompose}
            className="w-full justify-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Compose Message
          </Button>
        </div>

        {/* Navigation Folders */}
        <div className="p-2 space-y-0.5 flex-1 overflow-y-auto">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Folders
          </div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800/90 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                  <span>{folder.label}</span>
                </div>
                {folder.count !== undefined && folder.count > 0 && (
                  <Badge
                    variant={folder.id === 'inbox' ? 'default' : 'secondary'}
                    className="text-[10px] h-4 min-w-4 px-1 flex items-center justify-center font-mono"
                  >
                    {folder.count}
                  </Badge>
                )}
              </button>
            );
          })}

          <Separator className="my-3 opacity-60" />

          {/* Configuration & Controls */}
          <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Control Center
          </div>

          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>Domains & DNS</span>
            </div>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
              {domains.length}
            </Badge>
          </button>

          <button
            onClick={() => onOpenSettings('relay')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-zinc-400" />
              <span>Outbound Relay</span>
            </div>
            <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono uppercase">
              {settings?.outboundMode || 'Direct'}
            </Badge>
          </button>

          <button
            onClick={() => onOpenSettings('diagnostics')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Diagnostics & Team</span>
          </button>
        </div>

        {/* Bottom Actions Card */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          {/* Simulate Inbound Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateInbound}
            disabled={isSimulating}
            className="w-full text-xs font-normal border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:text-zinc-100"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 text-amber-400 ${isSimulating ? 'animate-bounce' : ''}`} />
            {isSimulating ? 'Receiving Mail...' : 'Simulate Inbound'}
          </Button>

          {/* Server Info Pill */}
          <div className="px-2.5 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
            <div className="truncate pr-1">
              <p className="font-mono text-zinc-300 truncate">
                {domains[0]?.name || 'glennesports.app'}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Port {settings?.smtpPort || 2525} • SMTP
              </p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
}
