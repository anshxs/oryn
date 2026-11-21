import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

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
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-zinc-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/20 bg-white/95 dark:bg-[#121316]/95 text-zinc-900 dark:text-zinc-100 shadow-[0_12px_32px_rgba(16,185,129,0.08)]',
    error: 'border-rose-500/20 bg-white/95 dark:bg-[#121316]/95 text-zinc-900 dark:text-zinc-100 shadow-[0_12px_32px_rgba(244,63,94,0.08)]',
    info: 'border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#121316]/95 text-zinc-900 dark:text-zinc-100 shadow-[0_12px_32px_rgba(0,0,0,0.12)]'
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 text-xs select-none max-w-sm",
      borders[type] || borders.info
    )}>
      {icons[type] || icons.info}
      <span className="font-medium text-xs leading-tight flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
