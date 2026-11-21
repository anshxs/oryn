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
    success: 'border-emerald-500/30 bg-white/95 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xl',
    error: 'border-rose-500/30 bg-white/95 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xl',
    info: 'border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xl'
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 text-xs select-none max-w-sm",
      borders[type] || borders.info
    )}>
      {icons[type] || icons.info}
      <span className="font-semibold text-xs leading-tight flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors ml-1 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
