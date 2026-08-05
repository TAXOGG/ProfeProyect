import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Section, Student } from "@/lib/types";
import {
  loadArceLogoBuffer,
  getInstitutionBranding,
  getDocenteName,
  type InstitutionBranding,
} from "@/lib/pdf/branding";

const TEAL = "#0f766e";
const ZINC = "#3f3f46";
const ZINC_LIGHT = "#71717a";
const BORDER = "#e4e4e7";

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
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 22, height: 22, marginRight: 8 },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: TEAL },
  docTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docDate: { fontSize: 8, color: ZINC_LIGHT, marginTop: 2, textAlign: "right" },
  sectionBox: {
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  sectionMeta: { fontSize: 9, color: ZINC_LIGHT, marginTop: 3 },
  motivoLine: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 9,
    color: ZINC_LIGHT,
  },
  motivoRule: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginLeft: 4,
    flex: 1,
  },
  table: { marginTop: 10 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: TEAL,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 26,
  },
  th: {
    padding: 6,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  td: { padding: 6, fontSize: 9 },
  colNumero: { width: "7%", textAlign: "center" },
  colNombre: { width: "38%" },
  colIdentificacion: { width: "20%" },
  colFirma: { width: "35%" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  footerLogo: { width: 12, height: 12, marginRight: 6 },
  footerText: { fontSize: 7.5, color: ZINC_LIGHT, flex: 1 },
});

export function ListaFirmaDocument({
  section,
  students,
  motivo,
  logo,
  institution,
  docenteName,
}: {
  section: Section;
  students: Student[];
  motivo?: string;
  logo?: Buffer;
  institution?: InstitutionBranding;
  docenteName?: string | null;
}) {
  const ahora = new Date();
  const fechaEmision = ahora.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const horaEmision = ahora.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document
      title={`Lista para firma - ${section.asignatura} ${section.nombre}`}
      author="ARCE"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {institution?.logo && <Image src={institution.logo} style={styles.logo} />}
            <Text style={styles.brand}>{institution?.nombre ?? "ARCE"}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Lista para Firma</Text>
            {docenteName && <Text style={styles.docDate}>Docente: {docenteName}</Text>}
            <Text style={styles.docDate}>
              Emitido el {fechaEmision}, {horaEmision}
            </Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>
            {section.asignatura} — {section.nombre}
          </Text>
          <Text style={styles.sectionMeta}>
            {section.nivel} · Ciclo {section.ciclo_escolar}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Text style={styles.motivoLine}>Motivo:</Text>
          <View style={styles.motivoRule}>
            <Text style={styles.motivoLine}>{motivo ?? ""}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colNumero]}>N°</Text>
            <Text style={[styles.th, styles.colNombre]}>Nombre completo</Text>
            <Text style={[styles.th, styles.colIdentificacion]}>Identificación</Text>
            <Text style={[styles.th, styles.colFirma]}>Firma</Text>
          </View>
          {students.map((s) => (
            <View key={s.id} style={styles.tableRow}>
              <Text style={[styles.td, styles.colNumero]}>{s.numero}</Text>
              <Text style={[styles.td, styles.colNombre]}>
                {s.primer_apellido} {s.segundo_apellido} {s.nombre}
              </Text>
              <Text style={[styles.td, styles.colIdentificacion]}>{s.identificacion ?? ""}</Text>
              <Text style={styles.colFirma}></Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          {logo && <Image src={logo} style={styles.footerLogo} />}
          <Text style={styles.footerText}>
            Documento generado automáticamente por ARCE a partir de la lista de estudiantes de la
            sección.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderListaFirmaPdf(props: {
  section: Section;
  students: Student[];
  motivo?: string;
}): Promise<Buffer> {
  const [logo, institution, docenteName] = await Promise.all([
    loadArceLogoBuffer(),
    getInstitutionBranding(props.section.institution_id),
    getDocenteName(props.section.teacher_id),
  ]);
  return renderToBuffer(
    <ListaFirmaDocument
      {...props}
      logo={logo}
      institution={institution ?? undefined}
      docenteName={docenteName}
    />,
  );
}
