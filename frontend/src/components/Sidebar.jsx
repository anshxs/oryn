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
  Command,
  HelpCircle,
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
    connected: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    connecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-rose-500',
    error: 'bg-rose-500'
  }[wsStatus] || 'bg-emerald-500';

  return (
    <aside className="w-64 bg-[#f8f9fa] dark:bg-[#0c0d0f] border-r border-zinc-200/80 dark:border-zinc-850 flex flex-col justify-between select-none shrink-0 transition-colors">
      <div className="flex flex-col h-full">
        {/* Brand & Theme Bar */}
        <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
                Oryn
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                MTA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mailbox Selector Card */}
        <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-850">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                    <AvatarFallback className="text-[10px] bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-semibold">
                      {getInitials(currentMailboxObj?.name || currentMailboxObj?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                      {currentMailboxObj?.name || currentMailboxObj?.username || 'Default User'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate leading-tight mt-0.5">
                      {activeMailbox || 'admin@domain.com'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 ml-1.5 transition-transform" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="text-[10px]">Select Email Account</DropdownMenuLabel>
              {mailboxes.map((mb) => {
                const isSelected = mb.email.toLowerCase() === activeMailbox?.toLowerCase();
                return (
                  <DropdownMenuItem
                    key={mb.id || mb.email}
                    onClick={() => onSelectMailbox(mb.email)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {mb.name || mb.username}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                        {mb.email}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenSettings('mailboxes')}
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300 gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Mailbox
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Compose Action with Shortcut Hint */}
          <div className="mt-2.5">
            <Button
              onClick={onOpenCompose}
              className="w-full h-8.5 justify-between px-3 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-xs rounded-xl"
            >
              <span className="flex items-center gap-2 font-medium">
                <Plus className="w-3.5 h-3.5" />
                Compose
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700 font-mono text-[10px] font-semibold">
                C
              </kbd>
            </Button>
          </div>
        </div>

        {/* Folders List */}
        <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            Navigation
          </div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-zinc-200/80 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50 font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn(
                    "w-3.5 h-3.5 transition-colors stroke-[1.8]",
                    isActive ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                  )} />
                  <span>{folder.label}</span>
                </div>
                {folder.count !== undefined && folder.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums font-semibold",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  )}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Tools */}
          <div className="pt-4 px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            Developer & Testing
          </div>

          <button
            onClick={onSimulateInbound}
            disabled={isSimulating}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Zap className={cn("w-3.5 h-3.5 text-amber-500", isSimulating && "animate-spin")} />
              <span>Simulate Inbound</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              Test
            </span>
          </button>

          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
              <span>DNS & Domains</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              {domains.length}
            </span>
          </button>
        </div>

        {/* Server Status Footer */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-850 bg-white/50 dark:bg-[#090a0c]/50 space-y-2">
          {/* Real-time Connection Status */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", wsColor)} />
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 capitalize">
                {wsStatus === 'connected' ? 'SMTP Engine Live' : wsStatus}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              Port {settings?.smtpPort || 2525}
            </span>
          </div>

          {/* Quick Settings Action */}
          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Settings & Relay
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono text-[9px]">
              ⌘,
            </kbd>
          </button>
        </div>
      </div>
    </aside>
  );
}
