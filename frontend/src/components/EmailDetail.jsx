import React, { useState } from 'react';
import { 
  Reply, 
  Forward, 
  Trash2, 
  Star, 
  Mail, 
  Paperclip, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  CornerDownRight, 
  Send, 
  Maximize2, 
  Info,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Code
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '../lib/utils';

export default function EmailDetail({
  email,
  onReply,
  onForward,
  onDelete,
  onToggleStar,
  onMarkUnread,
  onQuickSend
}) {
  const [quickReplyText, setQuickReplyText] = useState('');
  const [viewMode, setViewMode] = useState('html'); // 'html' | 'text' | 'raw'
  const [isSendingQuick, setIsSendingQuick] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  // Injects dark mode typography into iframe srcDoc so email bodies seamlessly blend with shadcn dark mode
  const getThemedHtml = (rawHtml) => {
    if (!rawHtml) return '';
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    if (!isDark) return rawHtml;

    const darkStyles = `
      <style>
        :root { color-scheme: dark; }
        html, body {
          background-color: #09090b !important;
          color: #fafafa !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 16px;
          line-height: 1.6;
        }
        p, span, div, li, td, th {
          color: #d4d4d8 !important;
        }
        h1, h2, h3, h4, strong, b {
          color: #ffffff !important;
        }
        a {
          color: #60a5fa !important;
        }
        code, pre {
          background-color: #18181b !important;
          color: #e4e4e7 !important;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #27272a !important;
          font-size: 0.9em;
        }
      </style>
    `;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${darkStyles}</head><body>${rawHtml}</body></html>`;
  };

  if (!email) {
    return (
      <div className="flex-1 bg-white/50 dark:bg-[#09090b] flex flex-col items-center justify-center text-center p-8 select-none transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-xs">
          <Mail className="w-6 h-6 text-zinc-400 dark:text-zinc-500 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          No Message Selected
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Select an email from the inbox list or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">J</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">K</kbd> to navigate through your messages.
        </p>
      </div>
    );
  }

  const getInitials = (fromStr) => {
    if (!fromStr) return 'M';
    const clean = fromStr.replace(/<.*>/, '').trim();
    if (!clean) return fromStr[0].toUpperCase();
    return clean
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSendQuickReply = async () => {
    if (!quickReplyText.trim()) return;
    try {
      setIsSendingQuick(true);
      await onQuickSend({
        to: email.from,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        text: quickReplyText,
        html: quickReplyText.replace(/\n/g, '<br/>')
      });
      setQuickReplyText('');
    } catch (err) {
      console.error('Failed to send quick reply:', err);
    } finally {
      setIsSendingQuick(false);
    }
  };

  return (
    <div key={email.id} className="flex-1 bg-[#f9fafc] dark:bg-[#09090b] flex flex-col h-full overflow-hidden select-text animate-content-fade-in transition-colors z-10">
      {/* Action Toolbar - High-contrast shadcn in Dark Mode & Liquid Glass in Light Mode */}
      <div className="px-4 py-2 border-b border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-[#09090b] flex items-center justify-between select-none shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onReply(email)}
            className="flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Reply</span>
            <kbd className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded border border-zinc-300/60 dark:border-zinc-700">R</kbd>
          </button>

          <button
            onClick={() => onForward(email)}
            className="flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
          >
            <Forward className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Forward</span>
            <kbd className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded border border-zinc-300/60 dark:border-zinc-700">F</kbd>
          </button>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={() => onToggleStar(email.id, !email.starred)}
            className={cn(
              "p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer",
              email.starred ? "text-amber-500 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"
            )}
            title={email.starred ? "Unstar (S)" : "Star (S)"}
          >
            <Star className={cn("w-3.5 h-3.5", email.starred && "fill-amber-400")} />
          </button>

          <button
            onClick={() => onMarkUnread(email.id)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Mark as unread"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete (E / ⌫)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
          <button
            onClick={() => setViewMode('html')}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
              viewMode === 'html'
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
            )}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
              viewMode === 'text'
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
            )}
          >
            <FileText className="w-3 h-3" /> Plain
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
              viewMode === 'raw'
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
            )}
          >
            <Code className="w-3 h-3" /> Headers
          </button>
        </div>
      </div>

      {/* Message Header */}
      <div className="p-5 border-b border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b] space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
            {email.subject || '(No Subject)'}
          </h1>

          <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(email.date), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
          </div>
        </div>

        {/* Sender details and security badge */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <AvatarFallback className="text-xs bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-bold">
                {getInitials(email.from)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 truncate">
                  {email.from.replace(/<.*>/, '').trim() || email.from}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  {email.from.includes('<') ? email.from.match(/<([^>]+)>/)?.[1] : email.from}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                To: <span className="font-mono text-zinc-700 dark:text-zinc-300">{email.to}</span>
                {email.cc && <span className="ml-2 font-mono">Cc: {email.cc}</span>}
              </p>
            </div>
          </div>

          {/* Security & Authentication Badge */}
          {email.security && (
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={email.security.isSafe ? "outline" : "destructive"}
                className={cn(
                  "cursor-pointer font-mono text-[10px] px-2 py-0.5 gap-1 select-none",
                  email.security.isSafe
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                )}
                onClick={() => setShowSecurityDetails(!showSecurityDetails)}
              >
                {email.security.isSafe ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                )}
                <span>SPF {email.security.spf || 'NONE'}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Security Details Inspector Card */}
        {showSecurityDetails && email.security && (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 animate-in fade-in-0 duration-150">
            <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500" />
                Authentication & Transport Security
              </span>
              <span className="text-[11px] font-mono text-zinc-500">RFC 5321</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500">SPF Status</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{email.security.spf || 'Not Verified'}</p>
              </div>
              <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500">DKIM Signature</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{email.security.dkim || 'Not Verified'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Email Body Viewer */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] dark:bg-[#09090b]">
        <div className="max-w-4xl mx-auto space-y-6">
          {viewMode === 'html' ? (
            email.html ? (
              <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-xs overflow-hidden">
                <iframe
                  title="Email Body"
                  srcDoc={getThemedHtml(email.html)}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="w-full min-h-[460px] border-0 bg-white dark:bg-[#09090b]"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-xs">
                {email.text || '(No message body provided)'}
              </div>
            )
          ) : viewMode === 'text' ? (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 whitespace-pre-wrap font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed shadow-xs">
              {email.text || '(No plain text alternative present)'}
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs leading-relaxed overflow-x-auto shadow-xs">
              <pre>{JSON.stringify({
                id: email.id,
                from: email.from,
                to: email.to,
                subject: email.subject,
                date: email.date,
                messageId: email.messageId,
                security: email.security,
                headers: email.headers || 'RFC 5321 Standard Headers'
              }, null, 2)}</pre>
            </div>
          )}

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                <span>Attachments ({email.attachments.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {email.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {att.filename || `attachment-${idx + 1}`}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/api/attachments/${att.id || att.filename}`}
                      download={att.filename}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                      title="Download attachment"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Quick Reply Dock */}
          <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/40 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CornerDownRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  Quick Reply to <span className="font-bold text-zinc-950 dark:text-zinc-100">{email.from.replace(/<.*>/, '').trim()}</span>
                </span>
                <button
                  onClick={() => onReply(email)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Full Composer
                </button>
              </div>

              <Textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder="Write a quick reply..."
                className="min-h-[75px] text-xs bg-zinc-50/70 dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400 resize-none transition-all rounded-xl"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-zinc-400">
                  Tip: Press <b>R</b> for full keyboard composer
                </span>
                <Button
                  size="sm"
                  onClick={handleSendQuickReply}
                  disabled={!quickReplyText.trim() || isSendingQuick}
                  className="h-7.5 px-3.5 text-xs gap-1.5 font-semibold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-lg shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
