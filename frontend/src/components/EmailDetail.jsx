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
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

export default function EmailDetail({
  email,
  onReply,
  onForward,
  onDelete,
  onToggleStar,
  onMarkUnread
}) {
  const [viewMode, setViewMode] = useState('html');
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 bg-zinc-950/40 flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="w-12 h-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-center mb-3 shadow-sm">
          <Mail className="w-6 h-6 text-zinc-500 stroke-[1.2]" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">No message selected</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          Select an email from the left sidebar or click Simulate Inbound to generate a live test message.
        </p>
      </div>
    );
  }

  const getFormattedDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy • h:mm:ss a');
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

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col h-full overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReply(email)}
            className="text-xs border-zinc-800 text-zinc-300 hover:text-white"
          >
            <Reply className="w-3.5 h-3.5 mr-1.5" />
            Reply
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onForward(email)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            <Forward className="w-3.5 h-3.5 mr-1.5" />
            Forward
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1 opacity-50" />

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onToggleStar(email.id, !email.starred)}
            className={cn("text-zinc-400 hover:text-amber-400", email.starred && "text-amber-400")}
            title={email.starred ? "Unstar" : "Star"}
          >
            <Star className={cn("w-3.5 h-3.5", email.starred && "fill-amber-400")} />
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onMarkUnread(email.id)}
            className="text-zinc-400 hover:text-zinc-100"
            title="Mark as unread"
          >
            <Mail className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onDelete(email.id)}
            className="text-zinc-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* View Mode Switcher */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
          <TabsList className="h-7 bg-zinc-900 border-zinc-800">
            <TabsTrigger value="html" className="text-[11px] h-5 px-2.5">
              <Eye className="w-3 h-3 mr-1" /> Preview
            </TabsTrigger>
            <TabsTrigger value="text" className="text-[11px] h-5 px-2.5">
              <FileText className="w-3 h-3 mr-1" /> Plain
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-[11px] h-5 px-2.5">
              <Code className="w-3 h-3 mr-1" /> Headers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Message Metadata Header */}
      <div className="p-5 border-b border-zinc-800/80 space-y-3 bg-zinc-950/40">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight leading-snug">
            {email.subject || '(No Subject)'}
          </h1>
          <span className="text-xs text-zinc-500 font-mono shrink-0 whitespace-nowrap">
            {getFormattedDate(email.date)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-full border border-zinc-700/60">
              <AvatarFallback className="text-xs bg-zinc-800 text-zinc-200 font-semibold">
                {getInitials(email.from)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-100">
                  {email.from.replace(/<.*>/, '').trim() || 'Unknown'}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {email.from.includes('<') ? email.from.match(/<([^>]+)>/)?.[1] : email.from}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                To: <span className="text-zinc-400">{email.to || email.mailbox}</span>
                {email.cc && <span className="ml-2 text-zinc-500">Cc: {email.cc}</span>}
              </p>
            </div>
          </div>

          {/* Security Status Badge */}
          <div className="flex items-center gap-2">
            {isSecuritySafe ? (
              <Badge variant="success" className="text-[10px] gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" />
                SPF {email.security?.spf ? email.security.spf.toUpperCase() : 'OK'}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] gap-1 font-mono">
                <ShieldAlert className="w-3 h-3" />
                Auth Warning
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Email Body Viewer */}
      <div className="flex-1 overflow-y-auto p-5">
        {viewMode === 'html' ? (
          email.html ? (
            <div className="w-full h-full min-h-[400px] rounded-xl border border-zinc-800/80 bg-white shadow-xs overflow-hidden">
              <iframe
                title="Email Content"
                srcDoc={email.html}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                className="w-full h-full min-h-[500px] border-0"
              />
            </div>
          ) : (
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans max-w-3xl">
              {email.text || '(Empty email body)'}
            </div>
          )
        ) : viewMode === 'text' ? (
          <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            {email.text || email.html || '(Empty body)'}
          </div>
        ) : (
          /* RFC 822 Headers Inspector */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                RFC 822 MIME Headers
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHeaders}
                className="h-7 text-xs border-zinc-800"
              >
                {copiedHeaders ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" /> Copy JSON
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs text-zinc-300 font-mono p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-x-auto leading-relaxed">
              {JSON.stringify(email.headers || {}, null, 2)}
            </pre>
          </div>
        )}

        {/* Attachments Section */}
        {hasAttachments && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({email.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {email.attachments.map((att, idx) => (
                <Card
                  key={att.id || idx}
                  className="p-3 flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {att.filename}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {att.size ? `${Math.round(att.size / 1024)} KB` : 'Attachment'}
                    </p>
                  </div>
                  {att.id && (
                    <a
                      href={`/api/attachments/${att.id}`}
                      download={att.filename}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Download attachment"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
