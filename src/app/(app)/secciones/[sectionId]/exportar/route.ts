import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSectionGradesData } from "@/lib/section-grades-data";
import { buildSectionWorkbook } from "@/lib/excel/section-export";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  const { sectionId } = await params;

  const data = await fetchSectionGradesData(sectionId);
  if (!data) {
    return NextResponse.json({ error: "No se pudo generar el archivo." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: institution } = await supabase
    .from("institutions")
    .select("nombre")
    .eq("id", data.section.institution_id)
    .maybeSingle();

  const buffer = await buildSectionWorkbook(data, institution?.nombre ?? "");

  const filename = `ARCE - ${data.section.asignatura} ${data.section.nombre} (${data.section.ciclo_escolar}).xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
