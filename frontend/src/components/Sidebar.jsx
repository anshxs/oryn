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
  Mail,
  Sun,
  Moon
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
  isSimulating,
  theme = 'light',
  onToggleTheme
}) {
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-500', count: stats?.unreadInbox },
    { id: 'sent', label: 'Sent', icon: Send, color: 'text-emerald-500', count: stats?.sentCount },
    { id: 'starred', label: 'Starred', icon: Star, color: 'text-amber-500' },
    { id: 'trash', label: 'Trash', icon: Trash2, color: 'text-rose-500', count: stats?.trashCount }
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
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none shadow-xs">
      <div className="flex flex-col h-full">
        {/* Header with Branding & Theme Switcher */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xs text-white">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Oryn <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">MTA</Badge>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mailbox Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-left group cursor-pointer shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Avatar className="h-7 w-7 rounded-md border border-indigo-200 dark:border-indigo-900">
                    <AvatarFallback className="text-[11px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                      {getInitials(currentMailboxObj?.name || activeMailbox)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {currentMailboxObj?.name || 'My Mailbox'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {activeMailbox || 'Select account'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 transition-transform" />
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
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{mb.name || mb.username}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{mb.email}</p>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onOpenSettings('mailboxes')}
                className="cursor-pointer text-xs text-indigo-600 dark:text-indigo-400"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Add Mailbox Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Compose Action */}
          <Button
            onClick={onOpenCompose}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Compose Message
          </Button>
        </div>

        {/* Navigation Folders */}
        <div className="p-2 space-y-0.5 flex-1 overflow-y-auto">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
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
                    ? 'bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/60 dark:text-indigo-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${folder.color}`} />
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
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            Control Center
          </div>

          <button
            onClick={() => onOpenSettings('domains')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>Domains & DNS</span>
            </div>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
              {domains.length}
            </Badge>
          </button>

          <button
            onClick={() => onOpenSettings('relay')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-violet-500" />
              <span>Outbound Relay</span>
            </div>
            <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono uppercase">
              {settings?.outboundMode || 'Direct'}
            </Badge>
          </button>

          <button
            onClick={() => onOpenSettings('diagnostics')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Diagnostics & Team</span>
          </button>
        </div>

        {/* Bottom Actions Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Simulate Inbound Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateInbound}
            disabled={isSimulating}
            className="w-full text-xs font-normal border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 text-amber-500 ${isSimulating ? 'animate-bounce' : ''}`} />
            {isSimulating ? 'Receiving Mail...' : 'Simulate Inbound'}
          </Button>

          {/* Server Info Pill */}
          <div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <div className="truncate pr-1">
              <p className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate">
                {domains[0]?.name || 'glennesports.app'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Port {settings?.smtpPort || 2525} • SMTP Active
              </p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
}
