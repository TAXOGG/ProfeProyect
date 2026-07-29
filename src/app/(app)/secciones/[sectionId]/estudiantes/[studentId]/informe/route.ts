import { NextResponse, type NextRequest } from "next/server";
import { buildInformeIntegralData } from "@/lib/actions/informe";
import { renderInformeIntegralPdf } from "@/lib/pdf/informe-integral";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sectionId: string; studentId: string }> },
) {
  const { sectionId, studentId } = await params;

  const data = await buildInformeIntegralData(sectionId, studentId);
  if (!data) {
    return NextResponse.json({ error: "No se pudo generar el informe." }, { status: 404 });
  }

  const buffer = await renderInformeIntegralPdf(data);
  const studentFullName = `${data.student.primer_apellido} ${data.student.segundo_apellido ?? ""} ${data.student.nombre}`
    .replace(/\s+/g, " ")
    .trim();
  const filename = `informe-${studentFullName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
