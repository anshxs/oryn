import React, { useState, useRef, useEffect } from 'react';
import { 
  Reply, 
  Forward, 
  Trash2, 
  Mail, 
  Star, 
  Paperclip, 
  Download, 
  Code, 
  Calendar, 
  ArrowLeft,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmailDetail({
  email,
  onReply,
  onForward,
  onDelete,
  onToggleStar,
  onMarkUnread,
  onBack
}) {
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && email?.html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <base target="_blank">
              <style>
                body {
                  margin: 0;
                  padding: 16px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #e5e5e5;
                  background-color: transparent;
                  line-height: 1.6;
                  word-break: break-word;
                }
                a { color: #ffffff; text-decoration: underline; }
                img { max-width: 100%; height: auto; border-radius: 6px; }
                pre, code { background: #171717; padding: 2px 5px; border-radius: 4px; font-family: monospace; border: 1px solid #262626; }
                blockquote { border-left: 2px solid #404040; margin-left: 0; padding-left: 12px; color: #a3a3a3; }
              </style>
            </head>
            <body>${email.html}</body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          if (iframeRef.current && iframeRef.current.contentDocument) {
            iframeRef.current.style.height = `${iframeRef.current.contentDocument.body.scrollHeight + 30}px`;
          }
        }, 150);
      }
    }
  }, [email]);

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-600 bg-black">
        <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 text-neutral-600 stroke-[1.5]" />
        </div>
        <h3 className="text-xs font-medium text-neutral-400">No message selected</h3>
        <p className="text-[11px] text-neutral-600 max-w-xs mt-1">
          Select an email from the left pane to view its content, attachments, and authentication headers.
        </p>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getInitials = (fromStr) => {
    if (!fromStr) return '?';
    const clean = fromStr.replace(/<[^>]+>/g, '').trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between bg-black">
        <div className="flex items-center gap-1.5">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onReply(email)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          <button
            onClick={() => onForward(email)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>

          <button
            onClick={() => onToggleStar(email.id, !email.starred)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title={email.starred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-3.5 h-3.5 ${email.starred ? 'fill-white text-white' : 'text-neutral-500'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRawHeaders(!showRawHeaders)}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              showRawHeaders ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
            }`}
            title="RFC Headers"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Subject Header */}
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight leading-snug">
            {email.subject || '(No Subject)'}
          </h2>
        </div>

        {/* Sender & Recipient Card */}
        <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono text-xs text-neutral-300 shrink-0">
              {getInitials(email.from)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-white">{email.from}</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 space-y-0.5 font-mono">
                <p><span className="text-neutral-600">To:</span> <span className="text-neutral-400">{email.to}</span></p>
                {email.cc && <p><span className="text-neutral-600">Cc:</span> <span className="text-neutral-400">{email.cc}</span></p>}
              </div>

              {/* Security Header Authentication Status */}
              {email.security && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    email.security.isSafe !== false
                      ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                      : 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                  }`}>
                    {email.security.isSafe !== false ? <ShieldCheck className="w-3 h-3 text-neutral-400" /> : <ShieldAlert className="w-3 h-3 text-rose-400" />}
                    <span>{email.security.isSafe !== false ? 'AUTHENTICATED' : 'UNVERIFIED'}</span>
                  </span>
                  {email.security.spf && email.security.spf !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      SPF:{email.security.spf.toUpperCase()}
                    </span>
                  )}
                  {email.security.dkim && email.security.dkim !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      DKIM:{email.security.dkim.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {email.date ? format(new Date(email.date), 'MMM d, yyyy h:mm a') : ''}
            </span>
          </div>
        </div>

        {/* Raw Headers Drawer */}
        {showRawHeaders && (
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-400 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-800 font-semibold text-neutral-300">
              <span>RFC Headers</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">{JSON.stringify(email.headers || {}, null, 2)}</pre>
          </div>
        )}

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3 h-3" />
              Attachments ({email.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-md bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-neutral-300 truncate">{att.filename}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">{formatFileSize(att.size)}</p>
                  </div>
                  {att.id ? (
                    <a
                      href={`/api/attachments/${att.id}`}
                      download={att.filename}
                      className="p-1.5 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-neutral-600 font-mono">Inline</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Body Rendering */}
        <div className="pt-1">
          {email.html ? (
            <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-1 overflow-hidden">
              <iframe
                ref={iframeRef}
                title="Email Content"
                sandbox="allow-same-origin allow-popups"
                className="w-full border-0 min-h-[300px]"
              />
            </div>
          ) : (
            <div className="p-5 rounded-lg border border-neutral-800/80 bg-neutral-950 text-neutral-300 text-xs whitespace-pre-wrap leading-relaxed font-sans">
              {email.text || '(Empty message)'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
