import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { householdDataCollection, householdDataDoc } from '@/lib/firestorePaths';
import { sanitizeChecklistHtml } from '@/lib/checklistHtml';
import { validateChecklistItemInput } from '@/lib/validation';
import type { ChecklistItem, ChecklistItemInput, ChecklistItemKind, ChecklistDueKind, ChecklistHorizon } from '@/types';

const KINDS: ChecklistItemKind[] = ['task', 'purchase', 'life_us', 'life_relationship'];
const DUE: ChecklistDueKind[] = ['none', 'day', 'week', 'month'];
const HORIZONS: ChecklistHorizon[] = ['short', 'long'];

function normalizeChecklistItem(id: string, data: Record<string, unknown>): ChecklistItem {
  const kind = data.kind;
  const dueKind = data.dueKind;
  const horizon = data.horizon;
  return {
    id,
    title: String(data.title ?? ''),
    descriptionHtml: String(data.descriptionHtml ?? ''),
    kind: KINDS.includes(kind as ChecklistItemKind) ? (kind as ChecklistItemKind) : 'task',
    dueKind: DUE.includes(dueKind as ChecklistDueKind) ? (dueKind as ChecklistDueKind) : 'none',
    dueValue: data.dueValue != null && String(data.dueValue).trim() ? String(data.dueValue) : null,
    horizon: HORIZONS.includes(horizon as ChecklistHorizon) ? (horizon as ChecklistHorizon) : 'short',
    consequence: data.consequence != null && String(data.consequence).trim() ? String(data.consequence) : null,
    completed: Boolean(data.completed),
    completedAt: data.completedAt != null ? String(data.completedAt) : null,
    createdAt: String(data.createdAt ?? ''),
    createdBy: String(data.createdBy ?? ''),
    updatedAt: String(data.updatedAt ?? data.createdAt ?? ''),
  };
}

export function useChecklist(enabled: boolean, userId: string | undefined) {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!enabled || !db) return;

    const col = householdDataCollection(db, 'checklistItems');
    const unsub = onSnapshot(col, (snap) => {
      const next = snap.docs.map((d) => normalizeChecklistItem(d.id, d.data() as Record<string, unknown>));
      setItems(next);
    });
    return () => unsub();
  }, [enabled]);

  const addItem = useCallback(
    async (input: ChecklistItemInput) => {
      if (!db || !userId) return;
      const v = validateChecklistItemInput(input);
      if (!v.ok) throw new Error(v.message);
      const descriptionHtml = sanitizeChecklistHtml(input.descriptionHtml);
      const now = new Date().toISOString();
      await addDoc(householdDataCollection(db, 'checklistItems'), {
        title: input.title.trim(),
        descriptionHtml,
        kind: input.kind,
        dueKind: input.dueKind,
        dueValue: input.dueKind === 'none' ? null : input.dueValue,
        horizon: input.horizon,
        consequence: input.consequence?.trim() || null,
        completed: false,
        completedAt: null,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
      });
    },
    [userId]
  );

  const updateItem = useCallback(
    async (id: string, input: ChecklistItemInput) => {
      if (!db) return;
      const v = validateChecklistItemInput(input);
      if (!v.ok) throw new Error(v.message);
      const descriptionHtml = sanitizeChecklistHtml(input.descriptionHtml);
      await updateDoc(householdDataDoc(db, 'checklistItems', id), {
        title: input.title.trim(),
        descriptionHtml,
        kind: input.kind,
        dueKind: input.dueKind,
        dueValue: input.dueKind === 'none' ? null : input.dueValue,
        horizon: input.horizon,
        consequence: input.consequence?.trim() || null,
        updatedAt: new Date().toISOString(),
      });
    },
    []
  );

  const setCompleted = useCallback(async (id: string, completed: boolean) => {
    if (!db) return;
    await updateDoc(householdDataDoc(db, 'checklistItems', id), {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(householdDataDoc(db, 'checklistItems', id));
  }, []);

  return { checklistItems: items, addChecklistItem: addItem, updateChecklistItem: updateItem, setChecklistCompleted: setCompleted, deleteChecklistItem: deleteItem };
}
