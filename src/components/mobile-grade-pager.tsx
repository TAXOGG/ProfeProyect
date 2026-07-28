"use client";

import { useState } from "react";
import type { Student } from "@/lib/types";

export type MobilePagerItem = { id: string; label: string; max: number };

/**
 * Vista alterna a la tabla ancha con scroll horizontal: un estudiante a la
 * vez con navegación anterior/siguiente, pensada para cargar notas desde el
 * teléfono durante la clase. Solo visible bajo el breakpoint `md` (la tabla
 * de escritorio sigue siendo la vista principal en pantallas grandes).
 */
export function MobileGradePager({
  students,
  items,
  getValue,
  onChange,
  onBlur,
  isPending,
  isSaved,
}: {
  students: Student[];
  items: MobilePagerItem[];
  getValue: (itemId: string, studentId: string) => number;
  onChange: (itemId: string, studentId: string, raw: string) => void;
  onBlur: (itemId: string, studentId: string, raw: string) => void;
  isPending: boolean;
  isSaved: (itemId: string, studentId: string) => boolean;
}) {
  const [index, setIndex] = useState(0);

  if (students.length === 0) return null;
  const clampedIndex = Math.min(index, students.length - 1);
  const student = students[clampedIndex];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={clampedIndex === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Estudiante anterior"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-lg text-zinc-600 disabled:opacity-30"
        >
          ‹
        </button>
        <select
          value={student.id}
          onChange={(e) => setIndex(students.findIndex((s) => s.id === e.target.value))}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm font-medium text-zinc-900"
        >
          {students.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.primer_apellido} {s.segundo_apellido} {s.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={clampedIndex === students.length - 1}
          onClick={() => setIndex((i) => Math.min(students.length - 1, i + 1))}
          aria-label="Siguiente estudiante"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-lg text-zinc-600 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => {
          const justSaved = isSaved(item.id, student.id);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2.5"
            >
              <label htmlFor={`mobile-${item.id}-${student.id}`} className="text-sm text-zinc-700">
                {item.label}
              </label>
              <input
                id={`mobile-${item.id}-${student.id}`}
                type="number"
                min={0}
                max={item.max}
                value={getValue(item.id, student.id)}
                onChange={(e) => onChange(item.id, student.id, e.target.value)}
                onBlur={(e) => onBlur(item.id, student.id, e.target.value)}
                disabled={isPending}
                className={`w-20 shrink-0 rounded-md border px-3 py-2 text-center text-base transition-colors ${
                  justSaved ? "border-emerald-400 ring-1 ring-emerald-200" : "border-zinc-300"
                }`}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-zinc-400">
        {clampedIndex + 1} de {students.length}
      </p>
    </div>
  );
}
