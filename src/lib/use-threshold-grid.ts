"use client";

import { useRef, useState, useTransition } from "react";

type Pending = { itemId: string; studentId: string; value: number; max: number };

/**
 * Grilla de captura con aviso de "posible dedazo": si el valor supera el máximo
 * esperado por más del margen de tolerancia, pide confirmación antes de guardar.
 */
export function useThresholdGrid({
  initialValues,
  tolerancePct,
  onPersist,
}: {
  initialValues: Record<string, number>;
  tolerancePct: number;
  onPersist: (itemId: string, studentId: string, value: number) => void | Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const lastConfirmed = useRef<Record<string, number>>(initialValues);
  const [pending, setPending] = useState<Pending | null>(null);
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});

  function key(itemId: string, studentId: string) {
    return `${itemId}:${studentId}`;
  }

  function getValue(itemId: string, studentId: string) {
    return values[key(itemId, studentId)] ?? 0;
  }

  function isSaved(itemId: string, studentId: string) {
    return !!savedFlags[key(itemId, studentId)];
  }

  function markSaved(k: string) {
    setSavedFlags((prev) => ({ ...prev, [k]: true }));
    setTimeout(() => {
      setSavedFlags((prev) => ({ ...prev, [k]: false }));
    }, 1500);
  }

  function handleChange(itemId: string, studentId: string, raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    setValues((prev) => ({ ...prev, [key(itemId, studentId)]: value }));
  }

  function commit(itemId: string, studentId: string, value: number) {
    const k = key(itemId, studentId);
    lastConfirmed.current = { ...lastConfirmed.current, [k]: value };
    startTransition(async () => {
      await onPersist(itemId, studentId, value);
      markSaved(k);
    });
  }

  function applyToAll(itemId: string, studentIds: string[], value: number) {
    setValues((prev) => {
      const next = { ...prev };
      for (const studentId of studentIds) next[key(itemId, studentId)] = value;
      return next;
    });
    for (const studentId of studentIds) commit(itemId, studentId, value);
  }

  function handleBlur(itemId: string, studentId: string, raw: string, max: number) {
    const value = Math.max(0, Number(raw) || 0);
    const threshold = max * (1 + tolerancePct);
    if (max > 0 && value > threshold) {
      setPending({ itemId, studentId, value, max });
      return;
    }
    commit(itemId, studentId, value);
  }

  function confirmPending() {
    if (!pending) return;
    commit(pending.itemId, pending.studentId, pending.value);
    setPending(null);
  }

  function cancelPending() {
    if (!pending) return;
    const k = key(pending.itemId, pending.studentId);
    setValues((prev) => ({ ...prev, [k]: lastConfirmed.current[k] ?? 0 }));
    setPending(null);
  }

  return {
    isPending,
    getValue,
    handleChange,
    handleBlur,
    pending,
    confirmPending,
    cancelPending,
    isSaved,
    applyToAll,
  };
}
