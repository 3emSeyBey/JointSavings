interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <h3 className="font-display font-bold text-lg text-[var(--text)]">{title}</h3>
        <p className="text-[var(--text-dim)] text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-display font-bold text-sm border border-[var(--border)] bg-[var(--surface-raised)]/60 text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm text-white transition-opacity hover:opacity-95 ${
              danger
                ? 'bg-gradient-to-br from-rose-600 to-rose-800 shadow-lg shadow-rose-900/40'
                : 'bg-gradient-to-br from-[var(--accent-a)] to-[var(--accent-b)] shadow-lg shadow-black/35'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
