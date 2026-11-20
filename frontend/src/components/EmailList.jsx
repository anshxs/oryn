import React from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  Paperclip, 
  Trash2, 
  Mail
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
      if (now.getTime() - d.getTime() < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(d, { addSuffix: true });
      }
      return format(d, 'MMM d, h:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-80 md:w-96 border-r border-neutral-800/80 bg-black flex flex-col h-full">
      {/* Top Header & Minimal Search */}
      <div className="p-3.5 border-b border-neutral-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white capitalize">
              {currentFolder}
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 font-mono border border-neutral-800">
              {emails.length}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-500 rounded-md pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Email List Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
        {emails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <div className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center mb-2">
              <Mail className="w-4 h-4 text-neutral-500 stroke-[1.5]" />
            </div>
            <p className="text-xs font-medium text-neutral-400">No messages in {currentFolder}</p>
            <p className="text-[11px] mt-1 text-neutral-500">
              {currentFolder === 'inbox' 
                ? 'Send a test email to your domain to view it here.' 
                : 'Folder is empty.'}
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
                className={`group relative p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-neutral-900/90 border-l-2 border-white'
                    : isUnread
                    ? 'bg-neutral-950 hover:bg-neutral-900/40'
                    : 'bg-black hover:bg-neutral-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                    <span className={`text-xs truncate ${isUnread ? 'font-semibold text-white' : 'font-normal text-neutral-300'}`}>
                      {currentFolder === 'sent' ? `To: ${email.to}` : email.from}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-500 font-mono whitespace-nowrap shrink-0">
                    {getDisplayDate(email.date)}
                  </span>
                </div>

                {/* Subject */}
                <h4 className={`text-xs truncate mb-1 ${isUnread ? 'font-medium text-white' : 'text-neutral-400'}`}>
                  {email.subject || '(No Subject)'}
                </h4>

                {/* Snippet */}
                <p className="text-[11px] text-neutral-500 line-clamp-1 leading-relaxed">
                  {email.text || (email.html ? email.html.replace(/<[^>]+>/g, ' ') : 'No preview')}
                </p>

                {/* Footer Badges & Actions */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasAttachments && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-neutral-400 px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                        <Paperclip className="w-2.5 h-2.5" />
                        <span>{email.attachments.length}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email.id, !email.starred);
                      }}
                      className="p-1 rounded hover:bg-neutral-800 transition-colors"
                      title={email.starred ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-3 h-3 ${email.starred ? 'fill-white text-white' : 'text-neutral-500 hover:text-white'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmail(email.id);
                      }}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3 h-3" />
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
