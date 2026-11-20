import React from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  Paperclip, 
  Trash2, 
  Mail,
  ShieldCheck,
  X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  const getDisplayDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (now.getTime() - d.getTime() < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(d, { addSuffix: true });
      }
      return format(d, 'MMM d, h:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  const getInitials = (sender) => {
    if (!sender) return 'M';
    const clean = sender.replace(/<.*>/, '').trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-80 md:w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 flex flex-col h-full">
      {/* Top Header & Search */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {currentFolder}
            </h2>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {emails.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onRefresh}
            disabled={loading}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            title="Refresh inbox"
          >
            <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Polished Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="pl-8 pr-7 h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Email List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1.5 space-y-1">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
            <div className="w-10 h-10 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-800 flex items-center justify-center mb-2.5 shadow-2xs">
              <Mail className="w-5 h-5 text-zinc-500 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No messages in {currentFolder}</p>
            <p className="text-[11px] mt-1 text-zinc-400 dark:text-zinc-500 max-w-[200px]">
              {currentFolder === 'inbox' 
                ? 'Send an email to your domain or click "Simulate Inbound".' 
                : 'Folder is empty.'}
            </p>
          </div>
        ) : (
          emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isUnread = !email.read;
            const hasAttachments = email.attachments && email.attachments.length > 0;
            const senderClean = (email.from || 'Unknown').replace(/<.*>/, '').trim();

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all duration-150 border",
                  isSelected
                    ? "bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50 shadow-2xs"
                    : isUnread
                    ? "bg-white border-zinc-200/90 text-zinc-900 shadow-2xs hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/60"
                    : "bg-white/60 border-transparent text-zinc-700 hover:bg-white hover:border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 mt-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-800 font-semibold dark:bg-zinc-800 dark:text-zinc-200">
                      {getInitials(senderClean)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                        )}
                        <span className={cn(
                          "text-xs truncate",
                          isUnread ? "font-bold text-zinc-900 dark:text-zinc-100" : "font-medium text-zinc-700 dark:text-zinc-300"
                        )}>
                          {senderClean || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">
                        {getDisplayDate(email.date)}
                      </span>
                    </div>

                    <h4 className={cn(
                      "text-xs truncate mb-1",
                      isUnread ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                    )}>
                      {email.subject || '(No Subject)'}
                    </h4>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-relaxed">
                      {email.text || '(No message preview)'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        {email.security?.spf === 'pass' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                            <ShieldCheck className="w-3 h-3" /> SPF
                          </span>
                        )}
                        {hasAttachments && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            <Paperclip className="w-3 h-3" /> {email.attachments.length}
                          </span>
                        )}
                      </div>

                      {/* Quick Hover Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(email.id, !email.starred);
                          }}
                          className={cn(
                            "p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
                            email.starred ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          )}
                          title={email.starred ? "Unstar" : "Star"}
                        >
                          <Star className={cn("w-3 h-3", email.starred && "fill-amber-400")} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEmail(email.id);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
