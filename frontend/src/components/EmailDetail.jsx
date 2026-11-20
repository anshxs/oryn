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
  User,
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
    // Resize iframe to fit content when HTML exists
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
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #e2e8f0;
                  background-color: transparent;
                  line-height: 1.6;
                  word-break: break-word;
                }
                a { color: #60a5fa; text-decoration: underline; }
                img { max-width: 100%; height: auto; border-radius: 8px; }
                pre, code { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
                table { border-collapse: collapse; max-width: 100%; }
                blockquote { border-left: 3px solid #475569; margin-left: 0; padding-left: 12px; color: #94a3b8; }
              </style>
            </head>
            <body>${email.html}</body>
          </html>
        `);
        doc.close();

        // Adjust height automatically
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
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-950/40">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
          <Mail className="w-8 h-8 text-slate-400 stroke-[1.25]" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">Select an email to read</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Choose a message from the list on the left to preview its content, attachments, and headers.
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
    <div className="flex-1 flex flex-col h-full bg-slate-950/60 overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onReply(email)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          <button
            onClick={() => onForward(email)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>

          <button
            onClick={() => onToggleStar(email.id, !email.starred)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
            title={email.starred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-4 h-4 ${email.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawHeaders(!showRawHeaders)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              showRawHeaders ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Inspect RFC headers"
          >
            <Code className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Subject Header */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
            {email.subject || '(No Subject)'}
          </h2>
        </div>

        {/* Sender & Recipient Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-blue-500/10">
              {getInitials(email.from)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">{email.from}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 space-y-0.5">
                <p><span className="text-slate-400">To:</span> <span className="text-slate-300 font-mono text-[11px]">{email.to}</span></p>
                {email.cc && <p><span className="text-slate-400">Cc:</span> <span className="text-slate-300 font-mono text-[11px]">{email.cc}</span></p>}
              </div>

              {/* Security Header Authentication Status */}
              {email.security && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    email.security.isSafe !== false
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {email.security.isSafe !== false ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <ShieldAlert className="w-3 h-3 text-rose-400" />}
                    <span>{email.security.isSafe !== false ? 'Authenticated' : 'Unverified'}</span>
                  </span>
                  {email.security.spf && email.security.spf !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      SPF: {email.security.spf}
                    </span>
                  )}
                  {email.security.dkim && email.security.dkim !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      DKIM: {email.security.dkim}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {email.date ? format(new Date(email.date), 'PPpp') : 'Unknown date'}
            </span>
          </div>
        </div>

        {/* Raw Headers Drawer */}
        {showRawHeaders && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-slate-400">
              <span>RFC 5322 Headers</span>
            </div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(email.headers || {}, null, 2)}</pre>
          </div>
        )}

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({email.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-slate-200 truncate">{att.filename}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                  </div>
                  {att.id ? (
                    <a
                      href={`/api/attachments/${att.id}`}
                      download={att.filename}
                      className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">Inline</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Body Rendering */}
        <div className="pt-2">
          {email.html ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-2 overflow-hidden">
              <iframe
                ref={iframeRef}
                title="Email Content"
                sandbox="allow-same-origin allow-popups"
                className="w-full border-0 min-h-[300px]"
              />
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-sans">
              {email.text || '(Empty email message)'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
