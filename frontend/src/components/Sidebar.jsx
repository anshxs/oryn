import React from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus, 
  Settings, 
  Zap, 
  ChevronDown, 
  Check, 
  Server, 
  Mail, 
  Sun, 
  Moon,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';

export default function Sidebar({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  onOpenSettings,
  onSimulateInbound,
  onOpenShortcuts,
  stats,
  settings,
  domains = [],
  mailboxes = [],
  activeMailbox,
  onSelectMailbox,
  isSimulating,
  theme = 'light',
  onToggleTheme,
  wsStatus = 'connected'
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

  const wsColor = {
    connected: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse-subtle',
    connecting: 'bg-amber-400 animate-pulse',
    disconnected: 'bg-rose-500',
    error: 'bg-rose-500'
  }[wsStatus] || 'bg-emerald-500';

  return (
    <aside className="w-64 bg-[#fbfbfc] dark:bg-[#0d0e12] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between select-none shrink-0 transition-colors duration-200 z-10">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-white dark:bg-[#0d0e12]">
          <div className="flex items-center gap-2.5">
            <div className="h-7.5 w-7.5 rounded-lg bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-xs transition-transform duration-150 hover:scale-105">
              <Mail className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight text-zinc-950 dark:text-white">
                Oryn
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                MTA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-700 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>
          </div>
        </div>

        {/* Account Selector Card */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#13151b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group cursor-pointer shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                    <AvatarFallback className="text-[11px] bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 font-bold">
                      {getInitials(currentMailboxObj?.name || currentMailboxObj?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate leading-tight">
                      {currentMailboxObj?.name || currentMailboxObj?.username || 'Default User'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate leading-tight mt-0.5">
                      {activeMailbox || 'admin@domain.com'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0 ml-1.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Select Email Account</DropdownMenuLabel>
              {mailboxes.map((mb) => {
                const isSelected = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                return (
                  <DropdownMenuItem
                    key={mb.id || mb.email}
                    onClick={() => onSelectMailbox(mb.email)}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {mb.name || mb.username}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono truncate">
                        {mb.email}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-50 shrink-0 font-bold" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenSettings('mailboxes')}
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Mailbox
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Compose Action */}
          <div className="mt-2.5">
            <Button
              onClick={onOpenCompose}
              className="w-full h-9 justify-between px-3 text-xs bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white shadow-xs rounded-xl font-semibold transition-all duration-150 hover:shadow-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                New Message
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800 font-mono text-[10px] font-bold">
                C
              </kbd>
            </Button>
          </div>
        </div>

        {/* Folders List */}
        <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 font-mono">
            Mailboxes
          </div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150 group cursor-pointer",
                  isActive
                    ? "bg-zinc-200/90 text-zinc-950 dark:bg-zinc-800/90 dark:text-white font-bold shadow-2xs"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white font-medium"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn(
                    "w-4 h-4 transition-transform duration-150 group-hover:scale-110 stroke-[1.8]",
                    isActive ? "text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
                  )} />
                  <span className="tracking-tight">{folder.label}</span>
                </div>
                {folder.count !== undefined && folder.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums font-bold transition-colors",
                    isActive
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                  )}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Tools */}
          <div className="pt-4 px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 font-mono">
            Infrastructure
          </div>

          <button
            onClick={onSimulateInbound}
            disabled={isSimulating}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Zap className={cn("w-4 h-4 text-amber-500 transition-transform duration-150 group-hover:scale-110", isSimulating && "animate-spin")} />
              <span>Simulate Inbound</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold">
              Test
            </span>
          </button>

          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-transform duration-150 group-hover:scale-110" />
              <span>DNS & Records</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
              {domains.length}
            </span>
          </button>
        </div>

        {/* Server Status Footer */}
        <div className="m-2.5 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#13151b] space-y-2 shadow-2xs">
          {/* Real-time Connection Status */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", wsColor)} />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 capitalize tracking-tight">
                {wsStatus === 'connected' ? 'SMTP Engine Live' : wsStatus}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
              Port {settings?.smtpPort || 2525}
            </span>
          </div>

          {/* Quick Settings Action */}
          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Settings & Relay
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[9px] font-bold border border-zinc-200 dark:border-zinc-700">
              ⌘,
            </kbd>
          </button>
        </div>
      </div>
    </aside>
  );
}
