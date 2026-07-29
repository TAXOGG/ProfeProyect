import JSZip from "jszip";
import { NextResponse, type NextRequest } from "next/server";
import { buildInformeIntegralBatch } from "@/lib/actions/informe";
import { renderInformeIntegralPdf } from "@/lib/pdf/informe-integral";

export const maxDuration = 60;

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function safeFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params;

  let studentIds: string[] = [];
  try {
    const body = await request.json();
    studentIds = Array.isArray(body.studentIds) ? body.studentIds.filter((id: unknown) => typeof id === "string") : [];
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (studentIds.length === 0) {
    return NextResponse.json({ error: "Elegí al menos un estudiante." }, { status: 400 });
  }

  const dataByStudent = await buildInformeIntegralBatch(sectionId, studentIds);
  if (dataByStudent.size === 0) {
    return NextResponse.json({ error: "No se pudo generar ningún informe." }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  const errors: string[] = [];
  let generated = 0;

  for (const studentId of studentIds) {
    const data = dataByStudent.get(studentId);
    if (!data) {
      errors.push(`Estudiante ${studentId}: no está activo en esta sección o no tiene datos.`);
      continue;
    }
    const studentFullName = `${data.student.primer_apellido} ${data.student.segundo_apellido ?? ""} ${data.student.nombre}`
      .replace(/\s+/g, " ")
      .trim();
    try {
      const buffer = await renderInformeIntegralPdf(data);
      let filename = `${safeFilename(studentFullName)}.pdf`;
      let n = 2;
      while (usedNames.has(filename)) {
        filename = `${safeFilename(studentFullName)}-${n}.pdf`;
        n += 1;
      }
      usedNames.add(filename);
      zip.file(filename, buffer);
      generated += 1;
    } catch (err) {
      errors.push(`${studentFullName}: ${err instanceof Error ? err.message : "error desconocido"}`);
    }
  }

  if (errors.length > 0) {
    zip.file("errores.txt", errors.join("\n"));
  }

  if (generated === 0) {
    return NextResponse.json({ error: "No se pudo generar ningún informe.", details: errors }, { status: 500 });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const sectionSlug = safeFilename(String(sectionId)).slice(0, 8);

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="informes-${sectionSlug}.zip"`,
      "X-Generated-Count": String(generated),
      "X-Failed-Count": String(errors.length),
    },
  });
}
