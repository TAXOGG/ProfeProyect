import ExcelJS from "exceljs";
import type { fetchSectionGradesData } from "@/lib/section-grades-data";

type SectionGradesData = NonNullable<Awaited<ReturnType<typeof fetchSectionGradesData>>>;

function studentName(s: { primer_apellido: string; segundo_apellido: string | null; nombre: string }) {
  return `${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`.replace(/\s+/g, " ").trim();
}

function addTitleBlock(
  ws: ExcelJS.Worksheet,
  section: SectionGradesData["section"],
  institutionNombre: string,
) {
  ws.addRow([`ARCE — ${section.asignatura} · ${section.nombre} (${section.nivel})`]);
  ws.addRow([`${institutionNombre} · Ciclo ${section.ciclo_escolar}`]);
  ws.addRow([`Generado el ${new Date().toLocaleString("es-CR")}`]);
  ws.addRow([]);
  ws.getRow(1).font = { bold: true, size: 12 };
  ws.getRow(2).font = { color: { argb: "FF71717A" } };
  ws.getRow(3).font = { color: { argb: "FF71717A" }, italic: true };
}

function styleHeaderRow(ws: ExcelJS.Worksheet, rowNumber: number) {
  const row = ws.getRow(rowNumber);
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };
  });
}

export async function buildSectionWorkbook(
  data: SectionGradesData,
  institutionNombre: string,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ARCE";
  workbook.created = new Date();

  const {
    section,
    periods,
    students,
    grades,
    cotidianoIndicators,
    cotidianoScores,
    exams,
    examScores,
    homeworkItems,
    homeworkScores,
    projectStages,
    projectScores,
  } = data;

  // ---------- Estudiantes ----------
  const wsStudents = workbook.addWorksheet("Estudiantes");
  addTitleBlock(wsStudents, section, institutionNombre);
  wsStudents.addRow([
    "#",
    "Primer apellido",
    "Segundo apellido",
    "Nombre",
    "Identificación",
    "Sexo",
    "Tipo de apoyo",
    "Estado",
    "Contacto",
    "Parentesco",
    "Correo de contacto",
  ]);
  styleHeaderRow(wsStudents, wsStudents.lastRow!.number);
  for (const s of students) {
    wsStudents.addRow([
      s.numero,
      s.primer_apellido,
      s.segundo_apellido ?? "",
      s.nombre,
      s.identificacion ?? "",
      s.sexo === "H" ? "Hombre" : s.sexo === "M" ? "Mujer" : "",
      s.tipo_apoyo ?? "",
      s.estado,
      s.contacto_nombre ?? "",
      s.contacto_parentesco ?? "",
      s.contacto_correo ?? "",
    ]);
  }
  wsStudents.columns.forEach((c) => (c.width = 18));

  // ---------- Acta de Notas ----------
  const wsActa = workbook.addWorksheet("Acta de Notas");
  addTitleBlock(wsActa, section, institutionNombre);
  const actaHeader = ["Estudiante"];
  for (const p of periods) {
    actaHeader.push(
      `${p.nombre} · Cot.`,
      `${p.nombre} · Tar.`,
      `${p.nombre} · Prue.`,
      `${p.nombre} · Proy.`,
      `${p.nombre} · Asis.`,
      `${p.nombre} · Nota`,
    );
  }
  actaHeader.push("Nota Anual", "Condición");
  wsActa.addRow(actaHeader);
  styleHeaderRow(wsActa, wsActa.lastRow!.number);
  for (const g of grades) {
    const row: (string | number)[] = [studentName(g.student)];
    for (const p of periods) {
      const pg = g.periodos[p.id];
      row.push(
        pg?.cotidiano ?? 0,
        pg?.tareas ?? 0,
        pg?.pruebas ?? 0,
        pg?.proyecto ?? 0,
        pg?.asistencia ?? 0,
        pg?.notaFinal ?? 0,
      );
    }
    row.push(g.notaAnual, g.condicion);
    wsActa.addRow(row);
  }
  wsActa.getColumn(1).width = 32;
  for (let i = 2; i <= actaHeader.length; i++) wsActa.getColumn(i).width = 12;

  // ---------- Matrices por rubro ----------
  function addRubricMatrix(
    name: string,
    columns: { id: string; label: string }[],
    scoreLookup: (studentId: string, columnId: string) => number | null,
  ) {
    const ws = workbook.addWorksheet(name);
    addTitleBlock(ws, section, institutionNombre);
    if (columns.length === 0) {
      ws.addRow(["Esta sección no tiene indicadores/ítems configurados en este rubro."]);
      return;
    }
    ws.addRow(["Estudiante", ...columns.map((c) => c.label)]);
    styleHeaderRow(ws, ws.lastRow!.number);
    for (const s of students) {
      ws.addRow([studentName(s), ...columns.map((c) => scoreLookup(s.id, c.id) ?? 0)]);
    }
    ws.getColumn(1).width = 32;
    for (let i = 2; i <= columns.length + 1; i++) ws.getColumn(i).width = 14;
  }

  const periodNombre = (id: string) => periods.find((p) => p.id === id)?.nombre ?? "";

  addRubricMatrix(
    "Cotidiano",
    cotidianoIndicators.map((i) => ({
      id: i.id,
      label: `${periodNombre(i.period_id)} #${i.numero} (máx. ${i.puntos_max})`,
    })),
    (studentId, indicatorId) =>
      cotidianoScores.find((s) => s.student_id === studentId && s.indicator_id === indicatorId)
        ?.puntaje ?? null,
  );

  addRubricMatrix(
    "Pruebas",
    exams.map((e) => ({
      id: e.id,
      label: `${periodNombre(e.period_id)} · ${e.nombre} (máx. ${e.puntos_max})`,
    })),
    (studentId, examId) =>
      examScores.find((s) => s.student_id === studentId && s.exam_id === examId)
        ?.puntos_obtenidos ?? null,
  );

  addRubricMatrix(
    "Tareas",
    homeworkItems.map((h) => ({
      id: h.id,
      label: `${periodNombre(h.period_id)} #${h.numero}${h.descripcion ? ` (${h.descripcion})` : ""}`,
    })),
    (studentId, homeworkId) =>
      homeworkScores.find((s) => s.student_id === studentId && s.homework_id === homeworkId)
        ?.nota ?? null,
  );

  addRubricMatrix(
    "Proyecto",
    projectStages.map((st) => ({
      id: st.id,
      label: `${periodNombre(st.period_id)} · ${st.nombre} (máx. ${st.puntos_max})`,
    })),
    (studentId, stageId) =>
      projectScores.find((s) => s.student_id === studentId && s.stage_id === stageId)
        ?.puntos_obtenidos ?? null,
  );

  // ---------- Asistencia (resumen por periodo) ----------
  const wsAsistencia = workbook.addWorksheet("Asistencia");
  addTitleBlock(wsAsistencia, section, institutionNombre);
  wsAsistencia.addRow(["Estudiante", ...periods.map((p) => `${p.nombre} · Nota de asistencia`)]);
  styleHeaderRow(wsAsistencia, wsAsistencia.lastRow!.number);
  for (const g of grades) {
    wsAsistencia.addRow([
      studentName(g.student),
      ...periods.map((p) => g.periodos[p.id]?.asistencia ?? 0),
    ]);
  }
  wsAsistencia.getColumn(1).width = 32;
  for (let i = 2; i <= periods.length + 1; i++) wsAsistencia.getColumn(i).width = 20;

  return workbook.xlsx.writeBuffer();
}
