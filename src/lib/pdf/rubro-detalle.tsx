import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Section, Student } from "@/lib/types";
import { loadArceLogoBuffer, getInstitutionBranding, type InstitutionBranding } from "@/lib/pdf/branding";

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
    color: "#0f766e",
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
  periodTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  table: {
    marginTop: 2,
  },
  tableHeaderRow: {
    flexDirection: "row",
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
  colItem: { width: "40%" },
  colDetalle: { width: "35%" },
  colValor: { width: "25%", textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
  },
  summaryItem: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    fontSize: 8,
    color: ZINC_LIGHT,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  noteBox: {
    marginTop: 20,
    borderRadius: 4,
    borderWidth: 1,
    padding: 10,
  },
  noteLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
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

export type RubroDetallePeriod = {
  id: string;
  nombre: string;
  rows: { item: string; detalle: string; valor: string }[];
  summaryLabel: string;
  summaryValue: string;
  aporteValue: string;
};

export function RubroDetalleDocument({
  section,
  student,
  moduleLabel,
  accentColor,
  accentColorLight,
  periods,
  noteText,
  logo,
  institution,
}: {
  section: Section;
  student: Student;
  moduleLabel: string;
  accentColor: string;
  accentColorLight: string;
  periods: RubroDetallePeriod[];
  noteText?: string;
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
      title={`${moduleLabel} - ${student.primer_apellido} ${student.nombre}`}
      author="ARCE"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.header, { borderBottomWidth: 2, borderBottomColor: accentColor }]}>
          <View style={styles.brandRow}>
            {institution?.logo && <Image src={institution.logo} style={styles.logo} />}
            <Text style={styles.brand}>{institution?.nombre ?? "ARCE"}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Reporte de {moduleLabel}</Text>
            <Text style={styles.docDate}>Emitido el {fechaEmision}</Text>
          </View>
        </View>

        <View style={[styles.studentBox, { backgroundColor: accentColorLight }]}>
          <Text style={styles.studentName}>
            {student.primer_apellido} {student.segundo_apellido} {student.nombre}
          </Text>
          <Text style={styles.studentMeta}>
            {student.identificacion ? `Identificación: ${student.identificacion} · ` : ""}
            {section.asignatura} — {section.nombre} · {section.nivel} · Ciclo{" "}
            {section.ciclo_escolar}
          </Text>
        </View>

        {periods.map((p) => (
          <View key={p.id} wrap={false}>
            <Text style={styles.periodTitle}>{p.nombre}</Text>
            {p.rows.length === 0 ? (
              <Text style={{ fontSize: 9, color: ZINC_LIGHT }}>Sin datos registrados.</Text>
            ) : (
              <View style={styles.table}>
                <View style={[styles.tableHeaderRow, { backgroundColor: accentColor }]}>
                  <Text style={[styles.th, styles.colItem]}>Detalle</Text>
                  <Text style={[styles.th, styles.colDetalle]}>Info</Text>
                  <Text style={[styles.th, styles.colValor]}>Valor</Text>
                </View>
                {p.rows.map((row, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.td, styles.colItem]}>{row.item}</Text>
                    <Text style={[styles.td, styles.colDetalle, { color: ZINC_LIGHT }]}>
                      {row.detalle}
                    </Text>
                    <Text style={[styles.td, styles.colValor]}>{row.valor}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{p.summaryLabel}</Text>
                <Text style={styles.summaryValue}>{p.summaryValue}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>% aporte a la nota</Text>
                <Text style={styles.summaryValue}>{p.aporteValue}</Text>
              </View>
            </View>
          </View>
        ))}

        {noteText && (
          <View style={[styles.noteBox, { borderColor: accentColor }]} wrap={false}>
            <Text style={[styles.noteLabel, { color: accentColor }]}>Nota importante</Text>
            <Text style={styles.noteText}>{noteText}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {logo && <Image src={logo} style={styles.footerLogo} />}
          <Text style={styles.footerText}>
            Documento generado automáticamente por ARCE, a partir de la información de{" "}
            {moduleLabel} que el docente ha registrado en la plataforma. No requiere firma para
            uso informativo del padre, madre o representante.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderRubroDetallePdf(props: {
  section: Section;
  student: Student;
  moduleLabel: string;
  accentColor: string;
  accentColorLight: string;
  periods: RubroDetallePeriod[];
  noteText?: string;
}): Promise<Buffer> {
  const [logo, institution] = await Promise.all([
    loadArceLogoBuffer(),
    getInstitutionBranding(props.section.institution_id),
  ]);
  return renderToBuffer(
    <RubroDetalleDocument {...props} logo={logo} institution={institution ?? undefined} />,
  );
}
