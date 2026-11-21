import React, { useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  Paperclip, 
  Trash2, 
  X, 
  ShieldAlert, 
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from './ui/input';
import { Button } from './ui/button';
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
    <div className="w-80 md:w-96 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/75 dark:bg-[#08090b]/80 backdrop-blur-md flex flex-col h-full shrink-0 select-none z-10">
      {/* Search & Header Bar with Clean Glass Sheen */}
      <div className="glass-lens p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold tracking-tight text-zinc-950 dark:text-zinc-50 capitalize">
              {currentFolder}
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold tabular-nums border border-zinc-200 dark:border-zinc-700">
              {emails.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={onRefresh}
              disabled={loading}
              className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Refresh inbox"
            >
              <RotateCw className={cn("w-3.5 h-3.5 transition-transform duration-300", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Search Input with Keyboard Shortcut hint */}
        <div className="relative group">
          <Search className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-150" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages (press / to focus)..."
            className="pl-8 pr-12 h-8 text-xs bg-zinc-100/70 dark:bg-[#121316]/80 border-zinc-200/90 dark:border-zinc-700/80 rounded-lg placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-400 transition-all duration-150"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[9px] font-bold pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Email Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400 animate-content-fade-in">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-2.5 shadow-2xs">
              <Inbox className="w-5 h-5 text-zinc-500 dark:text-zinc-400 stroke-[1.6]" />
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {searchQuery ? 'No matching emails' : `No messages in ${currentFolder}`}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 max-w-[210px] leading-relaxed">
              {searchQuery
                ? 'Try searching by a different term or press Esc to clear.'
                : 'Incoming emails will appear here in real time via WebSockets.'}
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
                  "relative p-3 cursor-pointer transition-row text-left group select-none",
                  isSelected
                    ? "bg-zinc-100 dark:bg-[#181a22] border-l-[3px] border-l-zinc-950 dark:border-l-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    : isUnread
                    ? "bg-white dark:bg-[#0c0d10] hover:bg-zinc-100/80 dark:hover:bg-[#15171e] border-l-[3px] border-l-transparent"
                    : "bg-white/90 dark:bg-[#08090b] hover:bg-zinc-100/80 dark:hover:bg-[#15171e] border-l-[3px] border-l-transparent"
                )}
              >
                {/* Header line: Sender & Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {/* Unread Indicator Dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.6)] animate-dot-pulse" />
                    )}
                    <span className={cn(
                      "text-xs truncate tracking-tight transition-colors",
                      isUnread
                        ? "font-bold text-zinc-950 dark:text-white"
                        : "font-semibold text-zinc-800 dark:text-zinc-200"
                    )}>
                      {cleanSenderName(email.from)}
                    </span>
                  </div>

                  {/* Timestamp & Hover Action Dock - high contrast and always readable */}
                  <div className="shrink-0 flex items-center relative min-w-[56px] justify-end">
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums font-medium group-hover:opacity-0 transition-opacity duration-150">
                      {getDisplayDate(email.date)}
                    </span>

                    {/* High-contrast floating action pill on hover */}
                    <div className="absolute right-0 flex items-center gap-0.5 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition-opacity duration-150 bg-white dark:bg-[#1f2129] border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 rounded-md shadow-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(email.id, !email.starred);
                        }}
                        className={cn(
                          "p-0.5 rounded text-zinc-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
                          email.starred && "text-amber-500 dark:text-amber-400"
                        )}
                        title={email.starred ? "Unstar (S)" : "Star (S)"}
                      >
                        <Star className={cn("w-3.5 h-3.5 transition-transform", email.starred ? "fill-amber-400 animate-star-pop" : "hover:scale-110")} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEmail(email.id);
                        }}
                        className="p-0.5 rounded text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        title="Delete (E / ⌫)"
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subject Line */}
                <div className="flex items-center gap-1.5 mb-1">
                  <p className={cn(
                    "text-xs truncate tracking-tight flex-1 transition-colors",
                    isUnread
                      ? "font-bold text-zinc-950 dark:text-zinc-100"
                      : "font-medium text-zinc-700 dark:text-zinc-300"
                  )}>
                    {email.subject || '(No Subject)'}
                  </p>
                  {hasAttachments && (
                    <Paperclip className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                  )}
                  {hasAuthWarning && (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" title="Authentication warning" />
                  )}
                </div>

                {/* Snippet Preview */}
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1 leading-normal font-normal">
                  {email.text ? email.text.slice(0, 130) : (email.html ? email.html.replace(/<[^>]*>?/gm, '').slice(0, 130) : '(Empty body)')}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
