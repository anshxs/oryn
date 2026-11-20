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
    <div className="w-80 md:w-96 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-full backdrop-blur-sm">
      {/* Top Header & Search */}
      <div className="p-3.5 border-b border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 capitalize">
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
            className="text-zinc-400 hover:text-zinc-100"
            title="Refresh inbox"
          >
            <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Polished Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="pl-8 pr-7 h-8 text-xs bg-zinc-900/60 border-zinc-800/90 rounded-lg placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Email List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center mb-2.5 shadow-xs">
              <Mail className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
            </div>
            <p className="text-xs font-medium text-zinc-300">No messages in {currentFolder}</p>
            <p className="text-[11px] mt-1 text-zinc-500 max-w-[200px]">
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
                  "group relative p-3 cursor-pointer transition-all duration-150 border-l-2",
                  isSelected
                    ? "bg-zinc-900/90 border-zinc-300 shadow-xs"
                    : isUnread
                    ? "bg-zinc-900/30 border-transparent hover:bg-zinc-900/50"
                    : "border-transparent hover:bg-zinc-900/40"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 mt-0.5 rounded-full border border-zinc-800 shrink-0">
                    <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-300 font-medium">
                      {getInitials(senderClean)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                        )}
                        <span className={cn(
                          "text-xs truncate",
                          isUnread ? "font-semibold text-zinc-100" : "font-normal text-zinc-300"
                        )}>
                          {senderClean || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {getDisplayDate(email.date)}
                      </span>
                    </div>

                    <h4 className={cn(
                      "text-xs truncate mb-1",
                      isUnread ? "font-medium text-zinc-100" : "text-zinc-400"
                    )}>
                      {email.subject || '(No Subject)'}
                    </h4>

                    <p className="text-[11px] text-zinc-500 line-clamp-1 leading-relaxed">
                      {email.text || '(No message preview)'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/40">
                      <div className="flex items-center gap-1.5">
                        {email.security?.spf === 'pass' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
                            <ShieldCheck className="w-3 h-3" /> SPF
                          </span>
                        )}
                        {hasAttachments && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
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
                            "p-1 rounded hover:bg-zinc-800 transition-colors",
                            email.starred ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
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
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
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
