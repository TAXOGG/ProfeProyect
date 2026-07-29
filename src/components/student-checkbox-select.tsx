"use client";

import { useMemo, useState } from "react";
import type { Student } from "@/lib/types";

type StudentOption = Pick<Student, "id" | "primer_apellido" | "segundo_apellido" | "nombre">;

function studentName(s: StudentOption) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

export function StudentCheckboxSelect({ students }: { students: StudentOption[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = useMemo(() => selected.size === students.length, [selected, students]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (students.length === 0) {
    return <p className="px-1 py-1 text-xs text-zinc-400">No hay estudiantes activos.</p>;
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)))
          }
          className="text-xs font-medium text-teal-700 hover:underline"
        >
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
      </div>
      <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-300 p-2">
        {students.map((s) => (
          <label key={s.id} className="flex items-center gap-2 py-1 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="student_id"
              value={s.id}
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="rounded"
            />
            {studentName(s)}
          </label>
        ))}
      </div>
    </div>
  );
}
