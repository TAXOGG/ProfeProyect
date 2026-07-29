import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { updateComunicacion } from "@/lib/actions/communications";
import { ComunicacionForm } from "@/components/comunicacion-form";
import { ComunicacionActions } from "@/components/comunicacion-actions";
import { TIPO_LABEL, MEDIO_LABEL, ESTADO_LABEL, ESTADO_BADGE } from "@/lib/communication-labels";
import type { Communication, CommunicationTemplate, ObservationTemplate, Period, Student } from "@/lib/types";

export default async function ComunicacionDetallePage({
  params,
}: {
  params: Promise<{ sectionId: string; comunicacionId: string }>;
}) {
  const { sectionId, comunicacionId } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: comunicacionRow } = await supabase
    .from("communications")
    .select("*")
    .eq("id", comunicacionId)
    .single();

  if (!comunicacionRow) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró esta comunicación.
      </div>
    );
  }
  const comunicacion = comunicacionRow as Communication;

  const [{ data: student }, { data: section }, { data: periods }, { data: observations }, { data: communicationTemplates }] =
    await Promise.all([
      supabase.from("students").select("*").eq("id", comunicacion.student_id).single(),
      supabase.from("sections").select("nombre, asignatura").eq("id", sectionId).single(),
      supabase.from("periods").select("*").eq("section_id", sectionId).order("numero"),
      user
        ? supabase.from("observation_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as ObservationTemplate[] }),
      user
        ? supabase.from("communication_templates").select("*").eq("owner_id", user.id).order("favorito", { ascending: false })
        : Promise.resolve({ data: [] as CommunicationTemplate[] }),
    ]);

  const s = student as Student | null;
  const sec = section as { nombre: string; asignatura: string } | null;
  const periodList = (periods as Period[]) ?? [];
  const editable = comunicacion.estado === "preparada";
  const updateForComunicacion = updateComunicacion.bind(null, sectionId, comunicacionId);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/secciones/${sectionId}/comunicaciones`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver a Comunicaciones
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{TIPO_LABEL[comunicacion.tipo]}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[comunicacion.estado]}`}>
          {ESTADO_LABEL[comunicacion.estado]}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {MEDIO_LABEL[comunicacion.medio]}
        {comunicacion.fecha_realizada ? ` · ${comunicacion.fecha_realizada}` : ""}
      </p>

      <div className="mt-6">
        <ComunicacionActions
          sectionId={sectionId}
          comunicacion={comunicacion}
          hasEmail={!!(comunicacion.destinatario || s?.contacto_correo)}
        />
      </div>

      {comunicacion.observacion && !editable && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Observación</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{comunicacion.observacion}</p>
        </div>
      )}

      <div className="mt-6">
        {editable ? (
          <ComunicacionForm
            action={updateForComunicacion}
            students={s ? [s] : []}
            observations={(observations as ObservationTemplate[]) ?? []}
            communicationTemplates={(communicationTemplates as CommunicationTemplate[]) ?? []}
            sectionLabel={sec ? `${sec.asignatura} — ${sec.nombre}` : ""}
            periodoLabel={periodList[0]?.nombre}
            initial={{
              studentId: comunicacion.student_id,
              tipo: comunicacion.tipo,
              medio: comunicacion.medio,
              destinatario: comunicacion.destinatario ?? "",
              mensaje: comunicacion.mensaje,
              adjuntaInforme: comunicacion.adjunta_informe,
            }}
            submitLabel="Guardar cambios"
            lockStudent
          />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mensaje</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{comunicacion.mensaje}</p>
            {comunicacion.adjunta_informe && s && (
              <a
                href={`/secciones/${sectionId}/estudiantes/${s.id}/informe`}
                className="mt-3 inline-block text-xs font-medium text-teal-700 hover:underline"
              >
                Descargar informe adjunto
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
