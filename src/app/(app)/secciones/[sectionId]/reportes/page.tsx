import { Fragment } from "react";
import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { SendCertificateButton } from "@/components/send-certificate-button";
import { moduleColor } from "@/lib/module-colors";

export default async function ReportesPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const data = await fetchSectionGradesData(sectionId);
  if (!data) return null;
  const { periods: periodList, grades } = data;

  const color = moduleColor("reportes");

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 sm:px-5 sm:py-4 ${color.headerBg} ${color.headerBorder}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Registro consolidado</h2>
          <p className="text-sm text-zinc-600">
            Nota final por periodo y anual, calculada automáticamente a partir de los 5 rubros.
          </p>
        </div>
        <ExportPdfButton />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th rowSpan={2} className="sticky left-0 bg-zinc-50 px-4 py-2 text-left align-bottom">
                Estudiante
              </th>
              {periodList.map((p) => (
                <th key={p.id} colSpan={6} className="border-l border-zinc-200 px-2 py-2 text-center">
                  {p.nombre} ({(p.porcentaje * 100).toFixed(0)}%)
                </th>
              ))}
              <th rowSpan={2} className="border-l border-zinc-200 px-3 py-2 text-center align-bottom">
                Nota Anual
              </th>
              <th rowSpan={2} className="px-3 py-2 text-center align-bottom">
                Condición
              </th>
              <th rowSpan={2} className="no-print px-3 py-2 text-center align-bottom">
                Certificado
              </th>
            </tr>
            <tr>
              {periodList.map((p) => (
                <Fragment key={p.id}>
                  <th className={`border-l border-zinc-200 px-2 py-1 text-center ${moduleColor("cotidiano").text}`}>
                    Cot.
                  </th>
                  <th className={`px-2 py-1 text-center ${moduleColor("tareas").text}`}>Tar.</th>
                  <th className={`px-2 py-1 text-center ${moduleColor("pruebas").text}`}>Prue.</th>
                  <th className={`px-2 py-1 text-center ${moduleColor("proyecto").text}`}>Proy.</th>
                  <th className={`px-2 py-1 text-center ${moduleColor("asistencia").text}`}>Asis.</th>
                  <th className="px-2 py-1 text-center font-semibold text-zinc-500">Nota</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {grades.map(({ student, periodos, notaAnual, condicion }) => (
              <tr key={student.id}>
                <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-1.5 font-medium text-zinc-900">
                  {student.primer_apellido} {student.segundo_apellido} {student.nombre}
                </td>
                {periodList.map((p) => {
                  const g = periodos[p.id];
                  return (
                    <Fragment key={p.id}>
                      <td
                        className={`border-l border-zinc-100 px-2 py-1.5 text-center text-zinc-600 ${moduleColor("cotidiano").cellBg}`}
                      >
                        {g.cotidiano.toFixed(0)}
                      </td>
                      <td className={`px-2 py-1.5 text-center text-zinc-600 ${moduleColor("tareas").cellBg}`}>
                        {g.tareas.toFixed(0)}
                      </td>
                      <td className={`px-2 py-1.5 text-center text-zinc-600 ${moduleColor("pruebas").cellBg}`}>
                        {g.pruebas.toFixed(0)}
                      </td>
                      <td className={`px-2 py-1.5 text-center text-zinc-600 ${moduleColor("proyecto").cellBg}`}>
                        {g.proyecto.toFixed(0)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-center text-zinc-600 ${moduleColor("asistencia").cellBg}`}
                      >
                        {g.asistencia.toFixed(0)}
                      </td>
                      <td className="px-2 py-1.5 text-center font-semibold text-zinc-900">
                        {g.notaFinal.toFixed(1)}
                      </td>
                    </Fragment>
                  );
                })}
                <td className="border-l border-zinc-200 px-3 py-1.5 text-center font-semibold text-zinc-900">
                  {notaAnual.toFixed(1)}
                </td>
                <td
                  className={`px-3 py-1.5 text-center font-medium ${
                    condicion === "APROBADO" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {condicion}
                </td>
                <td className="no-print px-3 py-1.5 text-center">
                  <SendCertificateButton
                    sectionId={sectionId}
                    studentId={student.id}
                    hasEmail={!!student.contacto_correo}
                  />
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td
                  colSpan={periodList.length * 6 + 3}
                  className="px-4 py-6 text-center text-zinc-400"
                >
                  No hay estudiantes activos en esta sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
