import React, { useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  Paperclip, 
  Trash2, 
  Mail,
  MailOpen,
  X,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export default function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  searchQuery,
  onSearchChange,
  onRefresh,
  loading,
  currentFolder,
  onToggleStar,
  onDeleteEmail
}) {
  const searchInputRef = useRef(null);

  const getDisplayDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (now.getTime() - d.getTime() < 24 * 60 * 60 * 1000) {
        return format(d, 'h:mm a');
      }
      if (d.getFullYear() === now.getFullYear()) {
        return format(d, 'MMM d');
      }
      return format(d, 'MM/dd/yy');
    } catch (e) {
      return dateStr;
    }
  };

  const cleanSenderName = (fromStr) => {
    if (!fromStr) return 'Unknown Sender';
    const clean = fromStr.replace(/<.*>/, '').trim();
    return clean || fromStr.split('@')[0] || 'Unknown';
  };

  return (
    <div className="w-80 md:w-96 border-r border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-[#090a0c] flex flex-col h-full shrink-0 select-none">
      {/* Search & Folder Bar */}
      <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-850 space-y-2 bg-white dark:bg-[#090a0c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 capitalize">
              {currentFolder}
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold tabular-nums">
              {emails.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onRefresh}
              disabled={loading}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Refresh (or wait for live push)"
            >
              <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Search Input with Keyboard Shortcut hint */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search subject, sender, body..."
            className="pl-8 pr-12 h-8 text-xs bg-zinc-50 dark:bg-[#121316] border-zinc-200/80 dark:border-zinc-800 rounded-lg placeholder:text-zinc-400 focus-visible:ring-zinc-400"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-400 font-mono text-[9px] pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Email Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850/60">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center mb-2.5">
              <Inbox className="w-5 h-5 text-zinc-400 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {searchQuery ? 'No matching emails' : `No messages in ${currentFolder}`}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] leading-relaxed">
              {searchQuery
                ? 'Try searching by a different term or clear the filter.'
                : 'Incoming emails will appear here instantly via WebSocket.'}
            </p>
          </div>
        ) : (
          emails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            const isUnread = !email.read;
            const hasAttachments = email.attachments && email.attachments.length > 0;
            const hasAuthWarning = email.security && email.security.isSafe === false;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={cn(
                  "relative p-3 cursor-pointer transition-row text-left group",
                  isSelected
                    ? "bg-zinc-100/90 dark:bg-[#14161a] border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                    : isUnread
                    ? "bg-white dark:bg-[#090a0c] hover:bg-zinc-50 dark:hover:bg-[#101114] border-l-2 border-l-transparent"
                    : "bg-white/60 dark:bg-[#090a0c]/60 hover:bg-zinc-50 dark:hover:bg-[#101114] border-l-2 border-l-transparent opacity-90"
                )}
              >
                {/* Header line: Sender & Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Unread Indicator Dot */}
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                    <span className={cn(
                      "text-xs truncate tracking-tight",
                      isUnread
                        ? "font-bold text-zinc-950 dark:text-zinc-50"
                        : "font-medium text-zinc-700 dark:text-zinc-300"
                    )}>
                      {cleanSenderName(email.from)}
                    </span>
                  </div>

                  {/* Date or Quick Hover Actions */}
                  <div className="shrink-0 flex items-center">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums group-hover:hidden">
                      {getDisplayDate(email.date)}
                    </span>

                    {/* Quick Row Hover Action Dock */}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(email.id, !email.starred);
                        }}
                        className={cn(
                          "p-1 rounded text-zinc-400 hover:text-amber-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors",
                          email.starred && "text-amber-500"
                        )}
                        title={email.starred ? "Unstar (S)" : "Star (S)"}
                      >
                        <Star className={cn("w-3 h-3", email.starred && "fill-amber-400")} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEmail(email.id);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                        title="Delete (E)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subject Line */}
                <div className="flex items-center gap-1.5 mb-1">
                  <p className={cn(
                    "text-xs truncate tracking-tight flex-1",
                    isUnread
                      ? "font-semibold text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-700 dark:text-zinc-300"
                  )}>
                    {email.subject || '(No Subject)'}
                  </p>
                  {hasAttachments && (
                    <Paperclip className="w-3 h-3 text-zinc-400 shrink-0" />
                  )}
                  {hasAuthWarning && (
                    <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" title="Sender authentication failed" />
                  )}
                </div>

                {/* Body Preview Snippet */}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-snug">
                  {email.text ? email.text.slice(0, 120) : (email.html ? email.html.replace(/<[^>]*>?/gm, '').slice(0, 120) : '(Empty message)')}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
