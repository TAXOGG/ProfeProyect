import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Period, Section, Student } from "@/lib/types";
import type { StudentGrades } from "@/lib/grades";
import { loadArceLogoBuffer, getInstitutionBranding, type InstitutionBranding } from "@/lib/pdf/branding";

const TEAL = "#0f766e";
const TEAL_LIGHT = "#f0fdfa";
const ZINC = "#3f3f46";
const ZINC_LIGHT = "#71717a";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: ZINC,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 10,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docDate: {
    fontSize: 8,
    color: ZINC_LIGHT,
    marginTop: 2,
    textAlign: "right",
  },
  studentBox: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  studentMeta: {
    fontSize: 9,
    color: ZINC_LIGHT,
    marginTop: 3,
  },
  table: {
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: TEAL,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  th: {
    padding: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  td: {
    padding: 6,
    fontSize: 9,
  },
  colPeriodo: { width: "24%" },
  colRubro: { width: "12.8%", textAlign: "center" },
  colNota: { width: "12%", textAlign: "center", fontFamily: "Helvetica-Bold" },
  summaryRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 8,
    color: ZINC_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },
  condicionAprobado: { color: "#15803d" },
  condicionAplazado: { color: "#b91c1c" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  footerLogo: {
    width: 12,
    height: 12,
    marginRight: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: ZINC_LIGHT,
    flex: 1,
  },
});

function fmt(n: number) {
  return n.toFixed(1);
}

export function CertificadoNotasDocument({
  section,
  student,
  periods,
  grades,
  logo,
  institution,
}: {
  section: Section;
  student: Student;
  periods: Period[];
  grades: StudentGrades;
  logo?: Buffer;
  institution?: InstitutionBranding;
}) {
  const fechaEmision = new Date().toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document
      title={`Certificado de notas - ${student.primer_apellido} ${student.nombre}`}
      author="ARCE"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {institution?.logo && <Image src={institution.logo} style={styles.logo} />}
            <Text style={styles.brand}>{institution?.nombre ?? "ARCE"}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Certificado de Calificaciones</Text>
            <Text style={styles.docDate}>Emitido el {fechaEmision}</Text>
          </View>
        </View>

        <View style={styles.studentBox}>
          <Text style={styles.studentName}>
            {student.primer_apellido} {student.segundo_apellido} {student.nombre}
          </Text>
          <Text style={styles.studentMeta}>
            {student.identificacion ? `Identificación: ${student.identificacion} · ` : ""}
            {section.asignatura} — {section.nombre} · {section.nivel} · Ciclo{" "}
            {section.ciclo_escolar}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colPeriodo]}>Periodo</Text>
            <Text style={[styles.th, styles.colRubro]}>Cotidiano</Text>
            <Text style={[styles.th, styles.colRubro]}>Tareas</Text>
            <Text style={[styles.th, styles.colRubro]}>Pruebas</Text>
            <Text style={[styles.th, styles.colRubro]}>Proyecto</Text>
            <Text style={[styles.th, styles.colRubro]}>Asistencia</Text>
            <Text style={[styles.th, styles.colNota]}>Nota</Text>
          </View>
          {periods.map((p) => {
            const g = grades.periodos[p.id];
            if (!g) return null;
            return (
              <View key={p.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colPeriodo]}>{p.nombre}</Text>
                <Text style={[styles.td, styles.colRubro]}>{fmt(g.cotidiano)}</Text>
                <Text style={[styles.td, styles.colRubro]}>{fmt(g.tareas)}</Text>
                <Text style={[styles.td, styles.colRubro]}>{fmt(g.pruebas)}</Text>
                <Text style={[styles.td, styles.colRubro]}>{fmt(g.proyecto)}</Text>
                <Text style={[styles.td, styles.colRubro]}>{fmt(g.asistencia)}</Text>
                <Text style={[styles.td, styles.colNota]}>{fmt(g.notaFinal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Nota anual</Text>
            <Text style={styles.summaryValue}>{fmt(grades.notaAnual)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Condición</Text>
            <Text
              style={[
                styles.summaryValue,
                grades.condicion === "APROBADO"
                  ? styles.condicionAprobado
                  : styles.condicionAplazado,
              ]}
            >
              {grades.condicion}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {logo && <Image src={logo} style={styles.footerLogo} />}
          <Text style={styles.footerText}>
            Documento generado automáticamente por ARCE, a partir de la información que el
            docente ha registrado en la plataforma. No requiere firma para uso informativo del
            padre, madre o representante.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificadoNotasPdf(props: {
  section: Section;
  student: Student;
  periods: Period[];
  grades: StudentGrades;
}): Promise<Buffer> {
  const [logo, institution] = await Promise.all([
    loadArceLogoBuffer(),
    getInstitutionBranding(props.section.institution_id),
  ]);
  return renderToBuffer(
    <CertificadoNotasDocument {...props} logo={logo} institution={institution ?? undefined} />,
  );
}
