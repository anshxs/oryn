import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  X, 
  RotateCw,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

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
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFrom(initialData.from || defaultFrom || (mailboxes[0]?.email || ''));
      setTo(initialData.to || '');
      setCc(initialData.cc || '');
      setBcc(initialData.bcc || '');
      setShowCc(Boolean(initialData.cc));
      setShowBcc(Boolean(initialData.bcc));
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setAttachments([]);
      setError('');
      setIsMinimized(false);
      setIsMaximized(false);
    }
  }, [isOpen, initialData, defaultFrom, mailboxes]);

  if (!isOpen) return null;

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
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

  const handleFileUpload = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!to || !to.trim()) {
      setError('Please provide a recipient email address.');
      return;
    }
    if (!from || !from.trim()) {
      setError('Please select a sender mailbox.');
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

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && !sending) {
      onClose();
    }
  };

  // Minimized floating pill dock
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 z-50 w-72 bg-white/95 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-t-xl shadow-xl flex items-center justify-between p-3 select-none animate-in slide-in-from-bottom-2 duration-150">
        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate">
          {subject || 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-white/95 dark:bg-zinc-950 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in-0 zoom-in-95",
        isMaximized
          ? "inset-4 rounded-2xl"
          : "bottom-5 right-6 w-full max-w-xl h-[560px] rounded-2xl"
      )}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Compose Window Header */}
      <div className="px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-between select-none shrink-0">
        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
          New Message
        </span>

        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recipient Configuration Fields */}
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 px-4 text-xs shrink-0 bg-white/50 dark:bg-zinc-950">
        {/* From selector */}
        <div className="flex items-center py-2 gap-3">
          <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">From</span>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="flex-1 bg-transparent border-0 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            {mailboxes.map((mb) => (
              <option key={mb.email} value={mb.email} className="dark:bg-zinc-950 dark:text-zinc-100">
                {mb.name ? `${mb.name} <${mb.email}>` : mb.email}
              </option>
            ))}
          </select>
        </div>

        {/* To field */}
        <div className="flex items-center py-2 gap-3">
          <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">To</span>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@domain.com"
            autoFocus
            className="flex-1 bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] font-semibold">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-zinc-950 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-zinc-950 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* Cc field */}
        {showCc && (
          <div className="flex items-center py-2 gap-3 animate-in fade-in-0 duration-150">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">Cc</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="carboncopy@domain.com"
              className="flex-1 bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        )}

        {/* Bcc field */}
        {showBcc && (
          <div className="flex items-center py-2 gap-3 animate-in fade-in-0 duration-150">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">Bcc</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="blindcarboncopy@domain.com"
              className="flex-1 bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        )}

        {/* Subject field */}
        <div className="flex items-center py-2 gap-3">
          <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this message about?"
            className="flex-1 bg-transparent border-0 text-xs font-semibold text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-2xs"
            >
              <Paperclip className="w-3 h-3 text-zinc-400" />
              <span className="truncate max-w-[140px] text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
                {att.filename}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-zinc-400 hover:text-rose-500 ml-1 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Message Text Area */}
      <div className="flex-1 p-4 relative flex flex-col bg-white dark:bg-zinc-950">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email here..."
          className="w-full flex-1 resize-none bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none leading-relaxed"
        />

        {/* Drag and Drop Zone Overlay */}
        {isDragOver && (
          <div className="absolute inset-2 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/60 dark:bg-blue-950/60 flex items-center justify-center pointer-events-none backdrop-blur-2xs">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Drop attachments here
            </p>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Compose Footer Toolbar */}
      <div className="px-4 py-2.5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
            title="Attach files"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            ⌘+Enter to send
          </span>

          <Button
            onClick={handleSend}
            disabled={sending}
            className="h-8 px-4 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-lg shadow-sm gap-2 cursor-pointer"
          >
            {sending ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
