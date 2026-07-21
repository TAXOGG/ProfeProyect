"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StudentRowActions } from "@/components/student-row-actions";
import { StudentContactModal } from "@/components/student-contact-modal";
import type { Student } from "@/lib/types";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

export function StudentsTable({
  sectionId,
  students,
}: {
  sectionId: string;
  students: Student[];
}) {
  const [query, setQuery] = useState("");
  const [contactStudent, setContactStudent] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return students;
    return students.filter((s) => {
      const haystack = normalize(
        `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre} ${s.identificacion ?? ""}`,
      );
      return haystack.includes(q);
    });
  }, [students, query]);

  return (
    <div>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, apellido o identificación..."
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-1.5 text-sm placeholder:text-zinc-500"
        />
        {query && (
          <span className="text-xs text-zinc-500">
            {filtered.length} de {students.length}
          </span>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Nombre completo</th>
              <th className="px-4 py-2">Identificación</th>
              <th className="px-4 py-2">Sexo</th>
              <th className="px-4 py-2">Tipo de apoyo</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Contacto</th>
              <th className="px-4 py-2">Fotos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-zinc-500">{s.numero}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                </td>
                <td className="px-4 py-2 text-zinc-500">{s.identificacion ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{s.sexo ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{s.tipo_apoyo ?? "—"}</td>
                <td className="px-4 py-2">
                  <StudentRowActions sectionId={sectionId} studentId={s.id} estado={s.estado} />
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setContactStudent(s)}
                    className={`text-xs font-medium hover:underline ${
                      s.contacto_correo ? "text-teal-700" : "text-zinc-400"
                    }`}
                    title={s.contacto_correo ?? "Sin correo de contacto"}
                  >
                    {s.contacto_correo ? "✓ correo" : "+ agregar"}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/secciones/${sectionId}/estudiantes/${s.id}/fotos`}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Ver fotos
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  {students.length === 0
                    ? "Aún no hay estudiantes en esta sección."
                    : "Ningún estudiante coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {contactStudent && (
        <StudentContactModal
          sectionId={sectionId}
          student={contactStudent}
          open={!!contactStudent}
          onClose={() => setContactStudent(null)}
        />
      )}
    </div>
  );
}
