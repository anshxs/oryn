import React, { useState } from 'react';
import { 
  Reply, 
  Forward, 
  Trash2, 
  Star, 
  Mail, 
  Download, 
  Paperclip, 
  ShieldCheck, 
  ShieldAlert,
  Code,
  FileText,
  Eye,
  Check,
  Copy,
  Send,
  CornerDownRight,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
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
  const [viewMode, setViewMode] = useState('html');
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSendingQuick, setIsSendingQuick] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 bg-[#fcfdfd] dark:bg-[#08090b] flex flex-col items-center justify-center text-center p-8 select-none transition-colors">
        <div className="w-13 h-13 rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-[#121316] flex items-center justify-center mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Mail className="w-6 h-6 text-zinc-400 dark:text-zinc-500 stroke-[1.6]" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          No conversation selected
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
          Select an email from the list, or navigate with <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">J</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">K</kbd> to read.
        </p>
      </div>
    );
  }

  const getFormattedDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy • h:mm a');
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

  const hasAttachments = email.attachments && email.attachments.length > 0;
  const isSecuritySafe = email.security?.isSafe !== false;

  const handleCopyHeaders = () => {
    const raw = JSON.stringify(email.headers || {}, null, 2);
    navigator.clipboard.writeText(raw);
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  const handleSendQuickReply = async (e) => {
    e.preventDefault();
    if (!quickReplyText.trim() || typeof onQuickSend !== 'function') return;
    try {
      setIsSendingQuick(true);
      await onQuickSend({
        to: email.from,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        text: quickReplyText,
        html: quickReplyText.replace(/\n/g, '<br/>')
      });
      setQuickReplyText('');
    } finally {
      setIsSendingQuick(false);
    }
  };

  return (
    <div key={email.id} className="flex-1 bg-white dark:bg-[#0c0d10] flex flex-col h-full overflow-hidden select-text animate-content-fade-in transition-colors">
      {/* Action Toolbar */}
      <div className="px-4 py-2 border-b border-zinc-200/90 dark:border-zinc-800 flex items-center justify-between bg-[#fafbfc] dark:bg-[#0f1013] select-none shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReply(email)}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply
            <kbd className="text-[9px] font-mono opacity-60 ml-0.5">R</kbd>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onForward(email)}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            <Forward className="w-3.5 h-3.5" />
            Forward
            <kbd className="text-[9px] font-mono opacity-60 ml-0.5">F</kbd>
          </Button>

          <Separator orientation="vertical" className="h-3.5 mx-1.5 bg-zinc-200 dark:bg-zinc-800" />

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onToggleStar(email.id, !email.starred)}
            className={cn("text-zinc-500 hover:text-amber-500", email.starred && "text-amber-500")}
            title={email.starred ? "Unstar (S)" : "Star (S)"}
          >
            <Star className={cn("w-3.5 h-3.5 transition-transform", email.starred ? "fill-amber-400 animate-star-pop" : "hover:scale-115")} />
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onMarkUnread(email.id)}
            className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            title="Mark as unread"
          >
            <Mail className="w-3.5 h-3.5 hover:scale-110 transition-transform" />
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onDelete(email.id)}
            className="text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
            title="Delete / Move to Trash (E / ⌫)"
          >
            <Trash2 className="w-3.5 h-3.5 hover:scale-110 transition-transform" />
          </Button>
        </div>

        {/* View Mode Switcher */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
          <TabsList className="h-7 bg-zinc-200/60 dark:bg-zinc-800">
            <TabsTrigger value="html" className="text-[11px] h-5.5 px-2 gap-1 font-medium">
              <Eye className="w-3 h-3" /> Preview
            </TabsTrigger>
            <TabsTrigger value="text" className="text-[11px] h-5.5 px-2 gap-1 font-medium">
              <FileText className="w-3 h-3" /> Plain
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-[11px] h-5.5 px-2 gap-1 font-medium">
              <Code className="w-3 h-3" /> Headers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Message Header */}
      <div className="p-5 border-b border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#0c0d10] space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight leading-snug">
            {email.subject || '(No Subject)'}
          </h1>
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono shrink-0 whitespace-nowrap tabular-nums font-medium">
            {getFormattedDate(email.date)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8.5 w-8.5 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs">
              <AvatarFallback className="text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold">
                {getInitials(email.from)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                  {email.from.replace(/<.*>/, '').trim() || 'Unknown'}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono truncate">
                  {email.from.includes('<') ? email.from.match(/<([^>]+)>/)?.[1] : email.from}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono truncate mt-0.5">
                To: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{email.to || email.mailbox}</span>
                {email.cc && <span className="ml-2 font-normal text-zinc-500">Cc: {email.cc}</span>}
              </p>
            </div>
          </div>

          {/* Security Status Pill */}
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => setShowSecurityDetails(prev => !prev)}
              className="flex items-center cursor-pointer transition-transform hover:scale-105"
            >
              {isSecuritySafe ? (
                <Badge variant="success" className="text-[10px] gap-1 font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SPF {email.security?.spf ? email.security.spf.toUpperCase() : 'PASS'}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] gap-1 font-mono font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Auth Warning
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Security Breakdown */}
        {showSecurityDetails && (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5 font-mono animate-content-fade-in shadow-2xs">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">SPF Validation:</span>
              <span className={email.security?.spf === 'pass' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}>
                {email.security?.spf || 'none'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">DKIM Signature:</span>
              <span className={email.security?.dkim === 'pass' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}>
                {email.security?.dkim || 'none'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">DMARC Policy:</span>
              <span className={email.security?.dmarc === 'pass' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}>
                {email.security?.dmarc || 'none'}
              </span>
            </div>
            {email.security?.warnings?.length > 0 && (
              <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1.5 border-t border-zinc-200 dark:border-zinc-800 font-sans">
                {email.security.warnings.join(' • ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Email Body Viewer */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfd] dark:bg-[#08090b]">
        <div className="max-w-4xl mx-auto space-y-6">
          {viewMode === 'html' ? (
            email.html ? (
              <div className="w-full rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white shadow-xs overflow-hidden">
                <iframe
                  title="Email Body"
                  srcDoc={email.html}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="w-full min-h-[460px] border-0"
                />
              </div>
            ) : (
              <div className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap font-sans">
                {email.text || '(Empty email body)'}
              </div>
            )
          ) : viewMode === 'text' ? (
            <div className="text-xs text-zinc-900 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] shadow-2xs">
              {email.text || email.html || '(Empty body)'}
            </div>
          ) : (
            /* Headers view */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider">
                  RFC 822 MIME Headers
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyHeaders}
                  className="h-6.5 text-[11px]"
                >
                  {copiedHeaders ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" /> Copy JSON
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-zinc-800 dark:text-zinc-200 font-mono p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] overflow-x-auto leading-relaxed shadow-2xs">
                {JSON.stringify(email.headers || {}, null, 2)}
              </pre>
            </div>
          )}

          {/* Attachments Section */}
          {hasAttachments && (
            <div className="pt-4 border-t border-zinc-200/90 dark:border-zinc-800 space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                Attachments ({email.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {email.attachments.map((att, idx) => (
                  <Card
                    key={att.id || idx}
                    className="p-3 flex items-center justify-between bg-white dark:bg-[#121316] border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-2xs"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                        {att.size ? `${Math.round(att.size / 1024)} KB` : 'Attachment'}
                      </p>
                    </div>
                    {att.id ? (
                      <a
                        href={`/api/attachments/${att.id}`}
                        download={att.filename}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Download attachment"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">Sent</span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inline Quick Reply Dock */}
          <div className="pt-4 border-t border-zinc-200/90 dark:border-zinc-800">
            <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111216] p-3.5 shadow-xs space-y-2.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all duration-150">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CornerDownRight className="w-3.5 h-3.5 text-zinc-500" />
                  Quick Reply to <span className="font-bold text-zinc-950 dark:text-white">{email.from.replace(/<.*>/, '').trim()}</span>
                </span>
                <button
                  onClick={() => onReply(email)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" /> Full Composer
                </button>
              </div>

              <Textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder="Write a quick reply..."
                className="min-h-[75px] text-xs bg-zinc-50 dark:bg-[#08090b] border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400 resize-none transition-all duration-150"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  Press Send Reply or open full composer for files
                </span>
                <Button
                  size="sm"
                  onClick={handleSendQuickReply}
                  disabled={!quickReplyText.trim() || isSendingQuick}
                  className="h-7.5 px-3.5 text-xs gap-1.5 font-semibold"
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
