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
            content: reader.result.split(',')[1], // base64 payload
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <h3 className="font-semibold text-white text-base">New Message</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 space-y-3 flex-1 overflow-y-auto">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* From Address */}
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold text-slate-400 w-14">From:</span>
              {mailboxes && mailboxes.length > 0 ? (
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-mono"
                >
                  {mailboxes.map(mb => (
                    <option key={mb.email} value={mb.email}>
                      {mb.name} &lt;{mb.email}&gt;
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="your-name@yourdomain.com"
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                />
              )}
            </div>

            {/* To Address */}
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold text-slate-400 w-14">To:</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
              >
                <span>Cc/Bcc</span>
                {showCcBcc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible CC & BCC */}
            {showCcBcc && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-semibold text-slate-400 w-14">Cc:</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-semibold text-slate-400 w-14">Bcc:</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold text-slate-400 w-14">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject of the email"
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
                className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none font-sans"
              />
            </div>

            {/* Attached files chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate max-w-[150px]">{file.filename}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span>Attach Files</span>
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
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
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
