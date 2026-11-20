import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  FileText, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle 
} from 'lucide-react';

export default function ComposeModal({
  isOpen,
  onClose,
  onSend,
  initialData = {},
  defaultFrom,
  mailboxes = [],
  activeMailbox
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFrom(initialData.from || activeMailbox || defaultFrom || (mailboxes[0]?.email) || 'user@domain.com');
      setTo(initialData.to || '');
      setCc(initialData.cc || '');
      setBcc(initialData.bcc || '');
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setAttachments([]);
      setError('');
      if (initialData.cc || initialData.bcc) {
        setShowCcBcc(true);
      }
    }
  }, [isOpen, initialData, defaultFrom, activeMailbox, mailboxes]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            filename: file.name,
            content: reader.result.split(',')[1],
            encoding: 'base64',
            contentType: file.type,
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!to.trim()) {
      setError('Please provide at least one recipient email address.');
      return;
    }

    try {
      setIsSending(true);
      setError('');
      await onSend({
        from,
        to,
        cc,
        bcc,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br/>'),
        attachments
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-black">
          <h3 className="font-medium text-white text-xs tracking-tight">New Message</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-2.5 flex-1 overflow-y-auto">
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-white mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* From Address */}
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-2">
              <span className="text-xs font-medium text-neutral-500 w-12 font-mono">From:</span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="sender@yourdomain.com"
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono"
                  required
                />
                {mailboxes && mailboxes.length > 0 && (
                  <select
                    value={mailboxes.some(m => m.email === from) ? from : ''}
                    onChange={(e) => {
                      if (e.target.value) setFrom(e.target.value);
                    }}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-400 focus:outline-none font-mono max-w-[140px] truncate"
                  >
                    <option value="" disabled>Mailboxes...</option>
                    {mailboxes.map(mb => (
                      <option key={mb.email} value={mb.email}>
                        {mb.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* To Address */}
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-2">
              <span className="text-xs font-medium text-neutral-500 w-12 font-mono">To:</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-mono"
              >
                <span>Cc/Bcc</span>
                {showCcBcc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible CC & BCC */}
            {showCcBcc && (
              <div className="space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center gap-3 border-b border-neutral-850 pb-2">
                  <span className="text-xs font-medium text-neutral-500 w-12 font-mono">Cc:</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-3 border-b border-neutral-850 pb-2">
                  <span className="text-xs font-medium text-neutral-500 w-12 font-mono">Bcc:</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-2">
              <span className="text-xs font-medium text-neutral-500 w-12 font-mono">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 bg-transparent text-xs text-white focus:outline-none font-medium"
              />
            </div>

            {/* Email Body */}
            <div className="pt-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email here..."
                rows={9}
                className="w-full bg-transparent p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Attached files chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 font-mono"
                  >
                    <FileText className="w-3 h-3 text-neutral-400" />
                    <span className="truncate max-w-[140px]">{file.filename}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="p-0.5 hover:text-white text-neutral-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-neutral-800/80 bg-black flex items-center justify-between">
            <div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors">
                <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
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
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-all shadow-sm disabled:opacity-50"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
