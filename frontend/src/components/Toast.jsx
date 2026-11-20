import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-zinc-300 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/20 bg-zinc-950/90 text-zinc-200',
    error: 'border-red-500/20 bg-zinc-950/90 text-zinc-200',
    info: 'border-zinc-800 bg-zinc-950/90 text-zinc-200'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
      {icons[type] || icons.info}
      <span className="font-medium text-xs leading-none">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
