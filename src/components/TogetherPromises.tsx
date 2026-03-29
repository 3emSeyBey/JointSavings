import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, X, Sparkles, Pencil } from 'lucide-react';
import type { Profile, PartnerPromise, Theme } from '@/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/context/ToastContext';

interface TogetherPromisesProps {
  profiles: Record<string, Profile>;
  profileIds: string[];
  partnerPromisesByProfileId: Record<string, PartnerPromise>;
  currentProfileId: string;
  canWrite: boolean;
  currentTheme: Theme;
  onSavePromise: (profileId: string, text: string) => Promise<void>;
}

export function TogetherPromises({
  profiles,
  profileIds,
  partnerPromisesByProfileId,
  currentProfileId,
  canWrite,
  currentTheme,
  onSavePromise,
}: TogetherPromisesProps) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  /** When true, scroll to and show the editor for the current profile */
  const [showEditor, setShowEditor] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [reflectChecked, setReflectChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRevise, setPendingRevise] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const mine = partnerPromisesByProfileId[currentProfileId];
  const hasMine = Boolean(mine?.text?.trim());

  const openModal = useCallback((withEditor: boolean) => {
    setModalOpen(true);
    setShowEditor(withEditor);
    if (withEditor) {
      setDraftText(mine?.text ?? '');
      setReflectChecked(false);
    }
  }, [mine?.text]);

  useEffect(() => {
    if (modalOpen && showEditor && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [modalOpen, showEditor]);

  const closeModal = () => {
    setModalOpen(false);
    setShowEditor(false);
    setDraftText('');
    setReflectChecked(false);
  };

  const startReviseFromBar = () => {
    if (hasMine) setPendingRevise(true);
    else openModal(true);
  };

  const confirmRevise = () => {
    setPendingRevise(false);
    setDraftText(mine?.text ?? '');
    setReflectChecked(false);
    setModalOpen(true);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!reflectChecked) return;
    setSaving(true);
    try {
      await onSavePromise(currentProfileId, draftText);
      showToast('Your words are saved with care.', 'success');
      closeModal();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatWhen = useCallback((iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]/20 px-3 py-2 sm:py-2.5 sm:px-4">
        <HeartHandshake className="text-[var(--accent-a)] shrink-0" size={20} strokeWidth={2} aria-hidden />
        <span className="text-sm font-display font-bold text-[var(--text)] shrink-0">Our promises</span>
        <span className="text-[11px] sm:text-xs text-[var(--text-dim)] flex-1 min-w-[140px]">
          One commitment each — open to read both.
        </span>
        <button
          type="button"
          onClick={() => openModal(false)}
          className="shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-display font-bold border border-[var(--border)] bg-[var(--surface)]/60 text-[var(--text)] hover:bg-[var(--surface-raised)]/50 transition-colors"
        >
          Open
        </button>
        {canWrite && (
          <button
            type="button"
            onClick={startReviseFromBar}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-display font-bold text-white ${currentTheme.bgClass}`}
          >
            {hasMine ? (
              <>
                <Pencil size={14} aria-hidden />
                Update mine
              </>
            ) : (
              <>
                <Sparkles size={14} aria-hidden />
                Declare mine
              </>
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6 bg-black/60 backdrop-blur-md safe-area-pt safe-area-pb"
            role="dialog"
            aria-modal
            aria-labelledby="promise-modal-title"
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="w-full max-w-md max-h-[min(92dvh,680px)] flex flex-col rounded-t-3xl sm:rounded-3xl glass-panel border border-[var(--border)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
                <h2 id="promise-modal-title" className="font-display font-extrabold text-base sm:text-lg text-[var(--text)]">
                  Our word
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl text-[var(--text-dim)] hover:bg-[var(--surface)] shrink-0"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  Each of you has one promise to the other — not a task, something you mean to keep.
                </p>

                {profileIds.map((pid) => {
                  const profile = profiles[pid];
                  if (!profile) return null;
                  const row = partnerPromisesByProfileId[pid];
                  const isYours = pid === currentProfileId;
                  const hasText = Boolean(row?.text?.trim());

                  return (
                    <div
                      key={pid}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg" aria-hidden>
                          {profile.emoji}
                        </span>
                        <span className="font-display font-bold text-sm text-[var(--text)]">{profile.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                          {isYours ? 'You' : 'Partner'}
                        </span>
                      </div>
                      {hasText ? (
                        <>
                          <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-[color-mix(in_srgb,var(--accent-a)_45%,transparent)]">
                            “{row!.text}”
                          </p>
                          <p className="text-[10px] text-[var(--text-dim)] mt-2">
                            {formatWhen(row!.declaredAt)}
                            {row!.revisedCount > 0
                              ? ` · revised ${row!.revisedCount}×`
                              : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--text-dim)] italic">
                          {isYours ? 'You haven’t declared yet.' : `${profile.name} hasn’t declared yet.`}
                        </p>
                      )}
                    </div>
                  );
                })}

                {canWrite && !showEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasMine) setPendingRevise(true);
                      else {
                        setDraftText('');
                        setReflectChecked(false);
                        setShowEditor(true);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl font-display font-bold text-sm text-white ${currentTheme.bgClass}`}
                  >
                    {hasMine ? 'Revise my promise' : 'Declare my promise'}
                  </button>
                )}

                {canWrite && showEditor && (
                  <div ref={editorRef} className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs font-display font-bold text-[var(--text)]">
                      {hasMine ? 'New words' : 'Your promise'}
                    </p>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={6}
                      placeholder="Write what you’ll stand by…"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]/50 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-a)_40%,transparent)] resize-y min-h-[120px]"
                    />
                    <p className="text-[10px] text-[var(--text-dim)]">{draftText.trim().length} chars · min 12</p>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reflectChecked}
                        onChange={(e) => setReflectChecked(e.target.checked)}
                        className="mt-0.5 rounded border-[var(--border)] text-[var(--accent-a)]"
                      />
                      <span className="text-xs text-[var(--text-dim)]">
                        I’ve thought this through and I’m ready to stand by these words.
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditor(false);
                          setDraftText('');
                          setReflectChecked(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-display font-bold text-[var(--text-dim)] hover:bg-[var(--surface)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving || !reflectChecked || draftText.trim().length < 12}
                        onClick={() => void handleSave()}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-display font-bold text-white disabled:opacity-45 ${currentTheme.bgClass}`}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pendingRevise}
        title="Change words you already gave?"
        message="Only revise if something real has shifted. Your partner may notice the update."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={confirmRevise}
        onCancel={() => setPendingRevise(false)}
      />
    </>
  );
}
