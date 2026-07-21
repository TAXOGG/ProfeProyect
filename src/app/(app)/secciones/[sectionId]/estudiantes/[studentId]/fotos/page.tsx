import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadPhotoForm } from "@/components/upload-photo-form";
import { PhotoGallery } from "@/components/photo-gallery";
import type { Student, StudentPhoto } from "@/lib/types";

const BUCKET = "student-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

export default async function StudentFotosPage({
  params,
}: {
  params: Promise<{ sectionId: string; studentId: string }>;
}) {
  const { sectionId, studentId } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: photos }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase
      .from("student_photos")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  if (!student) notFound();

  const photoList = (photos as StudentPhoto[]) ?? [];
  const paths = photoList.map((p) => p.storage_path);

  let signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    signedUrlByPath = Object.fromEntries(
      (signed ?? [])
        .filter((s) => s.signedUrl)
        .map((s) => [s.path, s.signedUrl as string]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/secciones/${sectionId}/estudiantes`}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          ← Volver a Estudiantes
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">
          Fotos de respaldo — {(student as Student).primer_apellido}{" "}
          {(student as Student).segundo_apellido} {(student as Student).nombre}
        </h2>
        <p className="text-sm text-zinc-500">
          Fotos de tareas, trabajo cotidiano, o cualquier evidencia que quieras guardar de este
          estudiante. Solo tú puedes verlas.
        </p>
      </div>

      <UploadPhotoForm sectionId={sectionId} studentId={studentId} />

      <PhotoGallery
        sectionId={sectionId}
        studentId={studentId}
        photos={photoList.map((p) => ({ ...p, url: signedUrlByPath[p.storage_path] ?? null }))}
      />
    </div>
  );
}
