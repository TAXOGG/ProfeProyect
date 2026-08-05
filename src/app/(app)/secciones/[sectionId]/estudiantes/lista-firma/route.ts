import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderListaFirmaPdf } from "@/lib/pdf/lista-firma";
import type { Section, Student } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  const { sectionId } = await params;
  const motivo = request.nextUrl.searchParams.get("motivo") ?? undefined;

  const supabase = await createClient();
  const [{ data: section }, { data: students }] = await Promise.all([
    supabase.from("sections").select("*").eq("id", sectionId).single(),
    supabase
      .from("students")
      .select("*")
      .eq("section_id", sectionId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .order("numero"),
  ]);

  if (!section) {
    return NextResponse.json({ error: "No se encontró la sección." }, { status: 404 });
  }

  const buffer = await renderListaFirmaPdf({
    section: section as Section,
    students: (students as Student[]) ?? [],
    motivo,
  });

  const filename = `lista-firma-${(section as Section).nombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
