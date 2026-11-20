import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  X, 
  RotateCw,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

export default function ComposeModal({
  isOpen,
  onClose,
  onSend,
  initialData = {},
  defaultFrom = '',
  mailboxes = [],
  activeMailbox = ''
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFrom(initialData.from || defaultFrom || (mailboxes[0]?.email || ''));
      setTo(initialData.to || '');
      setCc(initialData.cc || '');
      setBcc(initialData.bcc || '');
      setShowCc(Boolean(initialData.cc || initialData.bcc));
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setAttachments([]);
      setError('');
    }
  }, [isOpen, initialData, defaultFrom, mailboxes]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [
          ...prev,
          {
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            content: event.target.result.split(',')[1] || event.target.result,
            encoding: 'base64'
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to || !to.trim()) {
      setError('Recipient email is required.');
      return;
    }
    if (!from || !from.trim()) {
      setError('Sender address is required.');
      return;
    }

    try {
      setSending(true);
      setError('');
      await onSend({
        from: from.trim(),
        to: to.trim(),
        cc: cc.trim(),
        bcc: bcc.trim(),
        subject: subject.trim() || '(No Subject)',
        text: body,
        html: body.replace(/\n/g, '<br/>'),
        attachments
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to dispatch email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Message
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-0">
          <div className="p-4 space-y-3">
            {/* From Address Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-12 font-mono">From:</span>
              <div className="flex-1 flex gap-2">
                <Input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. you@glennesports.app"
                  className="h-8 text-xs font-mono"
                />
                {mailboxes.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setFrom(e.target.value);
                    }}
                    value={mailboxes.some(m => m.email === from) ? from : ''}
                    className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Preset Mailboxes</option>
                    {mailboxes.map(mb => (
                      <option key={mb.email} value={mb.email}>
                        {mb.name ? `${mb.name} (${mb.email})` : mb.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* To Address */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-12 font-mono">To:</span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <Input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com (comma separated)"
                  className="h-8 text-xs font-mono"
                  autoFocus
                />
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-mono px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cc/Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Optional Cc / Bcc */}
            {showCc && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12 font-mono">Cc:</span>
                  <Input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="h-8 text-xs font-mono flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-12 font-mono">Bcc:</span>
                  <Input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="h-8 text-xs font-mono flex-1"
                  />
                </div>
              </>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-12 font-mono">Subject:</span>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="h-8 text-xs font-medium flex-1"
              />
            </div>

            {/* Body */}
            <div>
              <Textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email here..."
                className="w-full text-xs font-sans rounded-lg p-3 min-h-[220px]"
              />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachments.map((att, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-[11px] font-mono"
                  >
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span>{att.filename}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>Attach</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={sending}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Discard
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                {sending ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Delivering...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Send Message
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
