import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SupportRecordEditForm } from "@/components/support-record-edit-form";
import { SupportRecordFollowups } from "@/components/support-record-followups";
import { UploadPhotoForm } from "@/components/upload-photo-form";
import { PhotoGallery } from "@/components/photo-gallery";
import type { Student, StudentPhoto, SupportRecord, SupportRecordFollowup } from "@/lib/types";

const BUCKET = "student-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ApoyoDetallePage({
  params,
}: {
  params: Promise<{ sectionId: string; recordId: string }>;
}) {
  const { sectionId, recordId } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("support_records")
    .select("*")
    .eq("id", recordId)
    .single();

  if (!record) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-500">
        No se encontró este registro.
      </div>
    );
  }

  const [{ data: student }, { data: followups }, { data: photos }] = await Promise.all([
    supabase.from("students").select("*").eq("id", record.student_id).single(),
    supabase
      .from("support_record_followups")
      .select("*")
      .eq("support_record_id", recordId)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_photos")
      .select("*")
      .eq("support_record_id", recordId)
      .order("created_at", { ascending: false }),
  ]);

  const photoList = (photos as StudentPhoto[]) ?? [];
  const paths = photoList.map((p) => p.storage_path);
  let signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    signedUrlByPath = Object.fromEntries(
      (signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl as string]),
    );
  }

  const s = student as Student | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href={`/secciones/${sectionId}/apoyos`}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← Volver a Apoyos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {s ? `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}` : "Estudiante"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {(record as SupportRecord).tipo_apoyo} · {(record as SupportRecord).fecha}
        {record.estado === "archivado" ? " · Archivado" : ""}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <SupportRecordEditForm sectionId={sectionId} record={record as SupportRecord} />
        <SupportRecordFollowups
          sectionId={sectionId}
          recordId={recordId}
          followups={(followups as SupportRecordFollowup[]) ?? []}
        />

        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Evidencia</h3>
          <div className="mt-2 flex flex-col gap-3">
            <UploadPhotoForm sectionId={sectionId} studentId={record.student_id} supportRecordId={recordId} />
            <PhotoGallery
              sectionId={sectionId}
              studentId={record.student_id}
              photos={photoList.map((p) => ({ ...p, url: signedUrlByPath[p.storage_path] ?? null }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
