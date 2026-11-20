import React, { useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-neutral-800 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-md">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-normal text-neutral-200 tracking-tight">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
