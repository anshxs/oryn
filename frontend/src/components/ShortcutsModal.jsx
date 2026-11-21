import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Command } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  const shortcuts = [
    { key: 'C', description: 'Compose new message' },
    { key: '/', description: 'Focus search bar' },
    { key: 'J / ↓', description: 'Next message in list' },
    { key: 'K / ↑', description: 'Previous message in list' },
    { key: 'S', description: 'Star / unstar active message' },
    { key: 'E / ⌫', description: 'Delete / Trash active message' },
    { key: 'R', description: 'Reply to active sender' },
    { key: 'F', description: 'Forward active message' },
    { key: 'Esc', description: 'Close modals or deselect' },
    { key: '?', description: 'Open this shortcuts helper' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-white/95 dark:bg-zinc-950 backdrop-blur-2xl text-zinc-950 dark:text-zinc-50 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <Command className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <DialogTitle className="text-sm font-bold tracking-tight">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Navigate Oryn at terminal velocity with Superhuman & Linear style navigation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
