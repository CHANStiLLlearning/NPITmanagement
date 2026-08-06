import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'destructive' | 'default';
  isPending?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'destructive',
  isPending = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 ">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a1f44] ">{title}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 :bg-[#1c3a73]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-6 text-sm text-slate-600 ">
            {message}
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className={confirmVariant === 'destructive' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-[#2269ff] hover:bg-[#2269ff] text-white'}
              disabled={isPending}>
              {isPending ? 'Processing…' : confirmText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
