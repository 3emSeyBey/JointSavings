import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  CheckSquare,
  ShoppingBag,
  Users,
  Heart,
  CalendarClock,
  Zap,
  Mountain,
  Pencil,
  Trash2,
  X,
  PartyPopper,
  AlertTriangle,
} from 'lucide-react';
import type { ChecklistItem, ChecklistItemInput, ChecklistItemKind, Theme, Profile, PartnerPromise } from '@/types';
import { TogetherPromises } from '@/components/TogetherPromises';
import { sortChecklistItems, formatDueLabel, isChecklistOverdue } from '@/lib/checklistDue';
import { sanitizeChecklistHtml } from '@/lib/checklistHtml';
import { ChecklistRichDescriptionEditor } from '@/components/ChecklistRichDescriptionEditor';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/context/ToastContext';

const KIND_META: Record<
  ChecklistItemKind,
  { label: string; sub: string; icon: typeof CheckSquare; emoji: string }
> = {
  task: { label: 'Task', sub: 'Something to do', icon: CheckSquare, emoji: '✅' },
  purchase: { label: 'To buy', sub: 'Bring it home', icon: ShoppingBag, emoji: '🛒' },
  life_us: { label: 'For both of us', sub: 'Shared life', icon: Users, emoji: '🌿' },
  life_relationship: { label: 'Our bond', sub: 'Relationship', icon: Heart, emoji: '💞' },
};

function emptyDraft(): ChecklistItemInput {
  return {
    title: '',
    descriptionHtml: '<p></p>',
    kind: 'task',
    dueKind: 'none',
    dueValue: null,
    horizon: 'short',
    consequence: null,
  };
}

function itemToDraft(item: ChecklistItem): ChecklistItemInput {
  return {
    title: item.title,
    descriptionHtml: item.descriptionHtml || '<p></p>',
    kind: item.kind,
    dueKind: item.dueKind,
    dueValue: item.dueValue,
    horizon: item.horizon,
    consequence: item.consequence,
  };
}

interface ChecklistTabProps {
  items: ChecklistItem[];
  canWrite: boolean;
  currentTheme: Theme;
  profiles: Record<string, Profile>;
  profileIds: string[];
  currentProfileId: string;
  partnerPromisesByProfileId: Record<string, PartnerPromise>;
  onSavePartnerPromise: (profileId: string, text: string) => Promise<void>;
  onAdd: (input: ChecklistItemInput) => Promise<void>;
  onUpdate: (id: string, input: ChecklistItemInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetCompleted: (id: string, completed: boolean) => Promise<void>;
}

type FilterMode = 'active' | 'done' | 'all';

export function ChecklistTab({
  items,
  canWrite,
  currentTheme,
  profiles,
  profileIds,
  currentProfileId,
  partnerPromisesByProfileId,
  onSavePartnerPromise,
  onAdd,
  onUpdate,
  onDelete,
  onSetCompleted,
}: ChecklistTabProps) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterMode>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [draft, setDraft] = useState<ChecklistItemInput>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sorted = useMemo(() => [...items].sort(sortChecklistItems), [items]);

  const visible = useMemo(() => {
    if (filter === 'all') return sorted;
    if (filter === 'done') return sorted.filter((i) => i.completed);
    return sorted.filter((i) => !i.completed);
  }, [sorted, filter]);

  const openNew = useCallback(() => {
    setEditingId(null);
    setDraft(emptyDraft());
    setMountKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: ChecklistItem) => {
    setEditingId(item.id);
    setDraft(itemToDraft(item));
    setMountKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) await onUpdate(editingId, draft);
      else await onAdd(draft);
      showToast(editingId ? 'Updated — you’ve got this.' : 'Added to your shared path ✨', 'success');
      closeModal();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    try {
      await onSetCompleted(item.id, !item.completed);
      if (!item.completed) showToast('Beautiful — one step brighter today.', 'success');
    } catch {
      showToast('Could not update', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await onDelete(pendingDeleteId);
      showToast('Removed from the list', 'success');
    } catch {
      showToast('Could not delete', 'error');
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-[var(--border)] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{
            background: `conic-gradient(from 200deg, var(--accent-a), var(--accent-b), var(--accent-c), var(--accent-a))`,
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-display font-bold uppercase tracking-[0.2em] text-[var(--accent-a)] mb-2 flex items-center gap-2">
              <Sparkles size={14} className="shrink-0" aria-hidden />
              Shared intentions
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[var(--text)] leading-tight">
              What we’re moving toward — together
            </h2>
            <p className="mt-2 text-sm text-[var(--text-dim)] max-w-xl">
              Tasks, little buys, and the bigger story of your life as a pair. No pressure — progress, not
              perfection.
            </p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={openNew}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${currentTheme.bgClass}`}
            >
              <Plus size={20} strokeWidth={2.5} />
              New intention
            </button>
          )}
        </div>
      </div>

      <TogetherPromises
        profiles={profiles}
        profileIds={profileIds}
        partnerPromisesByProfileId={partnerPromisesByProfileId}
        currentProfileId={currentProfileId}
        canWrite={canWrite}
        currentTheme={currentTheme}
        onSavePromise={onSavePartnerPromise}
      />

      <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] pt-1">
        Lists & reminders
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['active', 'In motion'],
            ['done', 'Celebrated'],
            ['all', 'Everything'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-sm font-display font-bold transition-all ${
              filter === id
                ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-[0_0_0_1px_var(--border-glow)]'
                : 'text-[var(--text-dim)] hover:bg-[var(--surface-raised)]/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 px-8 py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-a)_18%,transparent)] text-3xl mb-4">
            {filter === 'done' ? '🎉' : '✨'}
          </div>
          <h3 className="text-lg font-display font-bold text-[var(--text)] mb-2">
            {filter === 'done'
              ? 'No wins here yet — your first celebration is coming.'
              : filter === 'all'
                ? 'Your canvas is wide open.'
                : 'Room for something meaningful.'}
          </h3>
          <p className="text-sm text-[var(--text-dim)] max-w-md mx-auto mb-6">
            {filter === 'active' && canWrite
              ? 'Add a task, a purchase, or a line about the life you’re building side by side.'
              : 'Switch filters or add an intention when you’re ready.'}
          </p>
          {canWrite && filter !== 'done' && (
            <button
              type="button"
              onClick={openNew}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white ${currentTheme.bgClass}`}
            >
              <Plus size={18} />
              Add your first intention
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item, index) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            const overdue = isChecklistOverdue(item);
            const dueText = formatDueLabel(item.dueKind, item.dueValue);
            const expanded = expandedId === item.id;
            const safeHtml = sanitizeChecklistHtml(item.descriptionHtml);

            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: 'spring', stiffness: 380, damping: 32 }}
                className={`rounded-2xl border overflow-hidden transition-shadow ${
                  item.completed
                    ? 'border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))]'
                    : overdue
                      ? 'border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[var(--surface)]/80'
                      : 'border-[var(--border)] bg-[var(--surface)]/70'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => handleToggle(item)}
                      className={`mt-0.5 shrink-0 h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        item.completed
                          ? 'border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]'
                          : 'border-[var(--border)] hover:border-[var(--accent-a)] text-[var(--text-dim)]'
                      } ${!canWrite ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={item.completed ? 'Mark not done' : 'Mark done'}
                    >
                      {item.completed ? <PartyPopper size={18} /> : <span className="text-xs font-bold">○</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-wider text-[var(--accent-a)]">
                          <Icon size={12} strokeWidth={2.5} aria-hidden />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                          {item.horizon === 'short' ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Zap size={10} /> This season
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              <Mountain size={10} /> Long arc
                            </span>
                          )}
                        </span>
                        {dueText && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              overdue && !item.completed ? 'text-[var(--danger)]' : 'text-[var(--text-dim)]'
                            }`}
                          >
                            <CalendarClock size={10} />
                            {dueText}
                            {overdue && !item.completed && ' · gentle nudge'}
                          </span>
                        )}
                      </div>
                      <h3
                        className={`font-display font-bold text-lg leading-snug ${
                          item.completed ? 'text-[var(--text-dim)] line-through decoration-2' : 'text-[var(--text)]'
                        }`}
                      >
                        {meta.emoji} {item.title}
                      </h3>
                      {item.consequence && !item.completed && (
                        <p className="mt-2 text-xs text-[var(--text-dim)] flex items-start gap-1.5">
                          <AlertTriangle size={14} className="shrink-0 text-amber-400/90 mt-0.5" />
                          <span>
                            <span className="font-semibold text-[var(--text)]">If it slips: </span>
                            {item.consequence}
                          </span>
                        </p>
                      )}
                      {safeHtml.replace(/<[^>]+>/g, '').trim().length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : item.id)}
                            className="mt-2 text-xs font-bold text-[var(--accent-a)] hover:underline"
                          >
                            {expanded ? 'Hide story' : 'Read the full note'}
                          </button>
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="checklist-rich-read mt-3 text-sm text-[var(--text-dim)] border-t border-[var(--border)] pt-3"
                                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                    {canWrite && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-[var(--text-dim)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
                          aria-label="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(item.id)}
                          className="p-2 rounded-lg text-[var(--text-dim)] hover:bg-rose-500/15 hover:text-rose-400"
                          aria-label="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 bg-black/55 backdrop-blur-md safe-area-pt safe-area-pb"
            role="dialog"
            aria-modal
            aria-labelledby="checklist-modal-title"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="w-full max-w-lg max-h-[min(92dvh,720px)] flex flex-col rounded-t-3xl sm:rounded-3xl glass-panel border border-[var(--border)] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/40">
                <h2 id="checklist-modal-title" className="font-display font-extrabold text-lg text-[var(--text)]">
                  {editingId ? 'Refine this intention' : 'Something new to cherish'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl text-[var(--text-dim)] hover:bg-[var(--surface)]"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="e.g. Plan our weekend reset"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-dim)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]/40"
                  />
                </div>

                <div>
                  <span className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2">
                    Kind
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(KIND_META) as ChecklistItemKind[]).map((k) => {
                      const m = KIND_META[k];
                      const I = m.icon;
                      const on = draft.kind === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                            on
                              ? 'border-[var(--accent-a)] bg-[color-mix(in_srgb,var(--accent-a)_14%,transparent)]'
                              : 'border-[var(--border)] hover:bg-[var(--surface-raised)]/40'
                          }`}
                        >
                          <I size={18} className={on ? 'text-[var(--accent-a)]' : 'text-[var(--text-dim)]'} />
                          <span>
                            <span className="block text-sm font-bold text-[var(--text)]">{m.label}</span>
                            <span className="block text-[10px] text-[var(--text-dim)]">{m.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2">
                    Time horizon
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, horizon: 'short' }))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold ${
                        draft.horizon === 'short'
                          ? 'border-[var(--accent-b)] bg-[color-mix(in_srgb,var(--accent-b)_12%,transparent)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      <Zap size={16} /> This season
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, horizon: 'long' }))}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold ${
                        draft.horizon === 'long'
                          ? 'border-[var(--accent-c)] bg-[color-mix(in_srgb,var(--accent-c)_12%,transparent)]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      <Mountain size={16} /> Long arc
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2">
                    Due (optional)
                  </span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(
                      [
                        ['none', 'No date'],
                        ['day', 'Day'],
                        ['week', 'Week'],
                        ['month', 'Month'],
                      ] as const
                    ).map(([k, lab]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, dueKind: k, dueValue: k === 'none' ? null : d.dueValue }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          draft.dueKind === k
                            ? 'bg-[var(--surface-raised)] text-[var(--text)] ring-1 ring-[var(--border-glow)]'
                            : 'text-[var(--text-dim)] bg-[var(--surface)]/50'
                        }`}
                      >
                        {lab}
                      </button>
                    ))}
                  </div>
                  {draft.dueKind === 'day' && (
                    <input
                      type="date"
                      value={draft.dueValue ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, dueValue: e.target.value || null }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-[var(--text)]"
                    />
                  )}
                  {draft.dueKind === 'week' && (
                    <input
                      type="week"
                      value={draft.dueValue ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, dueValue: e.target.value || null }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-[var(--text)]"
                    />
                  )}
                  {draft.dueKind === 'month' && (
                    <input
                      type="month"
                      value={draft.dueValue ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, dueValue: e.target.value || null }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-[var(--text)]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1.5">
                    Story & detail
                  </label>
                  <ChecklistRichDescriptionEditor
                    mountKey={`${editingId ?? 'new'}-${mountKey}`}
                    initialHtml={draft.descriptionHtml}
                    onChange={(html) => setDraft((d) => ({ ...d, descriptionHtml: html }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-dim)] mb-1.5">
                    If it doesn’t happen by then… <span className="font-normal opacity-70">(optional)</span>
                  </label>
                  <textarea
                    value={draft.consequence ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, consequence: e.target.value || null }))}
                    placeholder="e.g. We reschedule a coffee check-in — no blame, just realignment."
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]/40 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl font-display font-bold text-[var(--text-dim)] hover:bg-[var(--surface)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className={`flex-1 py-3 rounded-xl font-display font-bold text-white disabled:opacity-50 ${currentTheme.bgClass}`}
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add intention'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove this intention?"
        message="You can always add it back later. This is for both of you."
        confirmLabel="Remove"
        cancelLabel="Keep it"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDeleteId(null)}
      />
    </motion.div>
  );
}
