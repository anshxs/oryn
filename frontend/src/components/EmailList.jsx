import React from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  Paperclip, 
  Trash2, 
  Mail, 
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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
      // If within 24 hours, relative; otherwise short date
      if (now.getTime() - d.getTime() < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(d, { addSuffix: true });
      }
      return format(d, 'MMM d, h:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-96 border-r border-slate-800/80 bg-slate-900/40 flex flex-col h-full">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2">
            <span>{currentFolder}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {emails.length}
            </span>
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Refresh inbox"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, body..."
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Email List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Mail className="w-10 h-10 mb-2 stroke-[1.25] text-slate-500" />
            <p className="text-sm font-medium text-slate-400">No emails found</p>
            <p className="text-xs mt-1 text-slate-400">
              {currentFolder === 'inbox' 
                ? 'Send a mail to your domain or click "Simulate Inbound" to test!' 
                : `No messages in ${currentFolder}`}
            </p>
          </div>
        ) : (
          emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isUnread = !email.read;
            const hasAttachments = email.attachments && email.attachments.length > 0;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={`group relative p-3.5 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                    : isUnread
                    ? 'bg-slate-900/90 hover:bg-slate-800/80'
                    : 'bg-transparent hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 truncate">
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-500/50" />
                    )}
                    <span className={`text-xs truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                      {currentFolder === 'sent' ? `To: ${email.to}` : email.from}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {getDisplayDate(email.date)}
                  </span>
                </div>

                {/* Subject */}
                <h4 className={`text-xs truncate mb-1 ${isUnread ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
                  {email.subject || '(No Subject)'}
                </h4>

                {/* Snippet */}
                <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                  {email.text || (email.html ? email.html.replace(/<[^>]+>/g, ' ') : 'No preview available')}
                </p>

                {/* Footer Badges & Actions */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {hasAttachments && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                        <Paperclip className="w-2.5 h-2.5" />
                        <span>{email.attachments.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions (visible on hover or when starred) */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email.id, !email.starred);
                      }}
                      className="p-1 rounded hover:bg-slate-700/60 transition-colors"
                      title={email.starred ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-3.5 h-3.5 ${email.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmail(email.id);
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
