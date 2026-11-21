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
import { useLiquidGL } from '../hooks/useLiquidGL';

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

  // Apply liquidGL glass lens for floating macOS compose window
  useLiquidGL('#compose-modal-lens', {
    refraction: 0.016,
    aberration: 0.2,
    bevelDepth: 0.05,
    bevelWidth: 0.1,
    frost: 2,
    shadow: true,
    specular: true
  }, [isOpen, isMaximized]);

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
      <div className="fixed bottom-0 right-8 z-50 w-72 bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800 rounded-t-xl shadow-xl flex items-center justify-between p-3 select-none animate-in slide-in-from-bottom-2 duration-150">
        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate">
          {subject || 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="compose-modal-lens"
      className={cn(
        "fixed z-50 glass-lens shadow-[0_24px_56px_rgba(0,0,0,0.28)] flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in-0 zoom-in-95",
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
      <div className="px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-[#131418]/60 backdrop-blur-md flex items-center justify-between select-none shrink-0">
        <span className="text-xs font-bold text-zinc-950 dark:text-white tracking-tight">
          New Message
        </span>

        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recipient Configuration Fields */}
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 px-4 text-xs shrink-0">
        {/* From selector */}
        <div className="flex items-center py-2 gap-3">
          <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">From</span>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="flex-1 bg-transparent border-0 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            {mailboxes.map((mb) => (
              <option key={mb.email} value={mb.email} className="dark:bg-[#121316]">
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
                className="hover:text-zinc-950 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-zinc-950 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* Cc field */}
        {showCc && (
          <div className="flex items-center py-2 gap-3 animate-content-fade-in">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">Cc</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="comma separated addresses"
              className="flex-1 bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        )}

        {/* Bcc field */}
        {showBcc && (
          <div className="flex items-center py-2 gap-3 animate-content-fade-in">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-semibold shrink-0">Bcc</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="comma separated addresses"
              className="flex-1 bg-transparent border-0 text-xs text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        )}

        {/* Subject field */}
        <div className="flex items-center py-2 gap-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent border-0 text-xs font-bold text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none tracking-tight"
          />
        </div>
      </div>

      {/* Main Message Canvas */}
      <div className="flex-1 p-4 flex flex-col relative overflow-hidden bg-white dark:bg-[#0f1013]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email here..."
          className="flex-1 w-full bg-transparent border-0 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
        />

        {/* Drag Over Overlay */}
        {isDragOver && (
          <div className="absolute inset-4 rounded-xl border-2 border-dashed border-zinc-500 bg-white/95 dark:bg-[#121316]/95 flex items-center justify-center pointer-events-none animate-in fade-in-0 duration-100">
            <p className="text-xs font-bold text-zinc-900 dark:text-white">
              Drop attachments here
            </p>
          </div>
        )}

        {/* Attached Files Pill Bar */}
        {attachments.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            {attachments.map((file, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
              >
                <Paperclip className="w-3 h-3 text-zinc-500" />
                <span className="truncate max-w-[140px] font-medium">{file.filename}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">({Math.round(file.size / 1024)} KB)</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 font-medium animate-content-fade-in shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>

      {/* Compose Action Footer */}
      <div className="px-4 py-3 border-t border-zinc-200/90 dark:border-zinc-800 bg-[#fafbfc] dark:bg-[#131418] flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => {
              if (body || subject || to) {
                if (window.confirm('Discard this draft?')) onClose();
              } else {
                onClose();
              }
            }}
            className="text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
            title="Discard draft"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-8 px-4 text-xs gap-2 font-bold"
          >
            {sending ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Delivering...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Message
                <kbd className="text-[10px] font-mono opacity-70 ml-1 font-bold">⌘↵</kbd>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
