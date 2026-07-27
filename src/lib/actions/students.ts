"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertWithAutoIncrementRetry } from "@/lib/insert-with-retry";

const IMPORT_HEADER_MAP: Record<string, string> = {
  "primer apellido": "primer_apellido",
  "1er apellido": "primer_apellido",
  "apellido 1": "primer_apellido",
  apellido1: "primer_apellido",
  "segundo apellido": "segundo_apellido",
  "2do apellido": "segundo_apellido",
  "apellido 2": "segundo_apellido",
  apellido2: "segundo_apellido",
  nombre: "nombre",
  nombres: "nombre",
  identificacion: "identificacion",
  cedula: "identificacion",
  sexo: "sexo",
  genero: "sexo",
  "tipo de apoyo": "tipo_apoyo",
  tipo_apoyo: "tipo_apoyo",
};

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeHeader(h: string) {
  return h.toString().trim().toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

// "M" ya no significa Masculino: el código vigente es H(Hombre)/M(Mujer).
// "F" (Femenino) se sigue aceptando en archivos importados como sinónimo de Mujer.
function parseSexo(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase().normalize("NFD").replace(DIACRITICS_RE, "");
  if (s === "H" || s.startsWith("HOMBRE") || s.startsWith("MASC")) return "H";
  if (s === "M" || s === "F" || s.startsWith("MUJER") || s.startsWith("FEM")) return "M";
  return null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ImportPreview = {
  error?: string;
  headers?: string[];
  rows?: string[][];
  guessedMapping?: (string | null)[];
};

export async function analyzeImportFile(
  _prev: ImportPreview | null,
  formData: FormData,
): Promise<ImportPreview> {
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  let grid: string[][];
  try {
    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();
      grid = parseCsv(text);
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];
      grid = [];
      worksheet?.eachRow((row) => {
        const values = (row.values as unknown[]).slice(1);
        grid.push(values.map((v) => (v == null ? "" : String(v))));
      });
    }
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido." };
  }

  if (grid.length < 2) {
    return { error: "El archivo no tiene filas de datos." };
  }

  const headers = grid[0];
  const rows = grid.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) {
    return { error: "El archivo no tiene filas de datos." };
  }

  const guessedMapping = headers.map((h) => IMPORT_HEADER_MAP[normalizeHeader(h)] ?? null);

  return { headers, rows, guessedMapping };
}

export type ImportStudentsResult = {
  error?: string;
  success?: boolean;
  imported?: number;
  skipped?: number;
};

export async function importStudentsFromGrid(
  sectionId: string,
  rows: string[][],
  mapping: (string | null)[],
): Promise<ImportStudentsResult> {
  const supabase = await createClient();

  if (!mapping.includes("primer_apellido") || !mapping.includes("nombre")) {
    return { error: 'Debes asignar al menos las columnas "Primer Apellido" y "Nombre".' };
  }

  const { data: existing } = await supabase
    .from("students")
    .select("numero")
    .eq("section_id", sectionId)
    .order("numero", { ascending: false })
    .limit(1);
  let nextNumero = (existing?.[0]?.numero ?? 0) + 1;

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const dataRow of rows) {
    const mapped: Record<string, string> = {};
    mapping.forEach((field, i) => {
      if (field) mapped[field] = (dataRow[i] ?? "").toString().trim();
    });
    if (!mapped.primer_apellido || !mapped.nombre) {
      skipped++;
      continue;
    }
    const sexo = parseSexo(mapped.sexo);
    toInsert.push({
      section_id: sectionId,
      numero: nextNumero++,
      primer_apellido: mapped.primer_apellido.toUpperCase(),
      segundo_apellido: mapped.segundo_apellido ? mapped.segundo_apellido.toUpperCase() : null,
      nombre: mapped.nombre.toUpperCase(),
      identificacion: mapped.identificacion || null,
      sexo,
      tipo_apoyo: mapped.tipo_apoyo || "No tiene",
    });
  }

  if (toInsert.length === 0) {
    return { error: "Ninguna fila tenía Primer Apellido y Nombre completos." };
  }

  const { error } = await supabase.from("students").insert(toInsert);
  if (error) return { error: error.message };

  revalidatePath(`/secciones/${sectionId}/estudiantes`);
  return { success: true, imported: toInsert.length, skipped };
}

async function maxStudentNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string,
) {
  const { data } = await supabase
    .from("students")
    .select("numero")
    .eq("section_id", sectionId)
    .order("numero", { ascending: false })
    .limit(1)
    .single();
  return data?.numero ?? 0;
}

export async function createStudent(sectionId: string, formData: FormData) {
  const supabase = await createClient();

  const primerApellido = String(formData.get("primer_apellido") ?? "").trim().toUpperCase();
  const segundoApellido = String(formData.get("segundo_apellido") ?? "").trim().toUpperCase();
  const nombre = String(formData.get("nombre") ?? "").trim().toUpperCase();
  if (!primerApellido || !nombre) return;

  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  const { error } = await insertWithAutoIncrementRetry(
    (count ?? 0) + 1,
    (numero) =>
      supabase.from("students").insert({
        section_id: sectionId,
        numero,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido || null,
        nombre,
        identificacion: String(formData.get("identificacion") ?? "").trim() || null,
        sexo: String(formData.get("sexo") ?? "").trim() || null,
        tipo_apoyo: String(formData.get("tipo_apoyo") ?? "No tiene").trim(),
      }),
    () => maxStudentNumero(supabase, sectionId),
  );

  if (error) throw new Error(error);

  // Reordena/renumera la sección por apellido para que el nuevo estudiante
  // quede en su posición alfabética, no al final de la lista.
  await supabase.rpc("reorder_students_by_apellido", { p_section_id: sectionId });

  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}

export async function updateStudentContacto(
  sectionId: string,
  studentId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const contactoNombre = String(formData.get("contacto_nombre") ?? "").trim();
  const contactoParentesco = String(formData.get("contacto_parentesco") ?? "").trim();
  const contactoCorreo = String(formData.get("contacto_correo") ?? "").trim();

  const { error } = await supabase
    .from("students")
    .update({
      contacto_nombre: contactoNombre || null,
      contacto_parentesco: contactoParentesco || null,
      contacto_correo: contactoCorreo || null,
    })
    .eq("id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}

export async function updateStudentEstado(
  sectionId: string,
  studentId: string,
  estado: "activo" | "trasladado" | "salido",
) {
  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ estado }).eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}

export async function deleteStudent(sectionId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}
