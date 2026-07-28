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

// Clave de comparación para detectar duplicados: mismas letras sin importar
// acentos, mayúsculas o espacios extra.
function normalizeCompareKey(s: string) {
  return s.trim().toUpperCase().normalize("NFD").replace(DIACRITICS_RE, "").replace(/\s+/g, " ");
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
  sheets?: string[];
  sheetName?: string;
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

  // Un Excel con varias hojas (una por sección, ej. "10-1", "10-2") pide
  // primero elegir cuál corresponde a la sección actual, antes de analizar
  // columnas. Este campo llega vacío en la primera pasada.
  const hoja = String(formData.get("hoja") ?? "").trim();

  let grid: string[][];
  let sheetName: string | undefined;
  try {
    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();
      grid = parseCsv(text);
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const sheets = workbook.worksheets.filter((ws) => ws.rowCount > 0);

      if (sheets.length === 0) {
        return { error: "El archivo no tiene hojas con datos." };
      }

      if (sheets.length > 1 && !hoja) {
        return { sheets: sheets.map((ws) => ws.name) };
      }

      const worksheet = hoja ? (sheets.find((ws) => ws.name === hoja) ?? sheets[0]) : sheets[0];
      sheetName = worksheet.name;

      grid = [];
      worksheet.eachRow((row) => {
        const values = (row.values as unknown[]).slice(1);
        grid.push(values.map((v) => (v == null ? "" : String(v))));
      });
    }
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido." };
  }

  if (grid.length < 2) {
    return { error: "La hoja no tiene filas de datos." };
  }

  const headers = grid[0];
  const rows = grid.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) {
    return { error: "La hoja no tiene filas de datos." };
  }

  const guessedMapping = headers.map((h) => IMPORT_HEADER_MAP[normalizeHeader(h)] ?? null);

  return { sheetName, headers, rows, guessedMapping };
}

export type ImportStudentsResult = {
  error?: string;
  success?: boolean;
  imported?: number;
  updated?: number;
  skipped?: number;
  duplicates?: number;
  skippedRows?: { fila: number; motivo: string }[];
};

export type DuplicateMode = "omitir" | "actualizar" | "nuevo";

export async function importStudentsFromGrid(
  sectionId: string,
  rows: string[][],
  mapping: (string | null)[],
  duplicateMode?: DuplicateMode,
): Promise<ImportStudentsResult> {
  const supabase = await createClient();

  if (!mapping.includes("primer_apellido") || !mapping.includes("nombre")) {
    return { error: 'Debes asignar al menos las columnas "Primer Apellido" y "Nombre".' };
  }

  const { data: existingStudents } = await supabase
    .from("students")
    .select("id, primer_apellido, segundo_apellido, nombre, identificacion, numero")
    .eq("section_id", sectionId)
    .is("deleted_at", null);

  // Un estudiante ya cargado se reconoce por identificación igual, o por
  // nombre completo igual si no hay identificación en alguno de los dos.
  const existingByIdent = new Map<string, string>();
  const existingByName = new Map<string, string>();
  for (const s of existingStudents ?? []) {
    if (s.identificacion) existingByIdent.set(normalizeCompareKey(s.identificacion), s.id);
    existingByName.set(
      normalizeCompareKey(`${s.primer_apellido} ${s.segundo_apellido ?? ""} ${s.nombre}`),
      s.id,
    );
  }
  let nextNumero = (existingStudents ?? []).reduce((max, s) => Math.max(max, s.numero), 0) + 1;

  type ParsedRow = {
    primerApellido: string;
    segundoApellido: string | null;
    nombre: string;
    identificacion: string | null;
    sexo: string | null;
    tipoApoyo: string;
    duplicateOf: string | null;
  };

  const parsedRows: ParsedRow[] = [];
  const skippedRows: { fila: number; motivo: string }[] = [];

  rows.forEach((dataRow, i) => {
    const mapped: Record<string, string> = {};
    mapping.forEach((field, ci) => {
      if (field) mapped[field] = (dataRow[ci] ?? "").toString().trim();
    });
    if (!mapped.primer_apellido || !mapped.nombre) {
      skippedRows.push({ fila: i + 2, motivo: "Falta primer apellido o nombre" });
      return;
    }

    const primerApellido = mapped.primer_apellido.toUpperCase();
    const segundoApellido = mapped.segundo_apellido ? mapped.segundo_apellido.toUpperCase() : null;
    const nombre = mapped.nombre.toUpperCase();
    const identificacion = mapped.identificacion || null;

    const identKey = identificacion ? normalizeCompareKey(identificacion) : null;
    const nameKey = normalizeCompareKey(`${primerApellido} ${segundoApellido ?? ""} ${nombre}`);
    const duplicateOf = (identKey && existingByIdent.get(identKey)) || existingByName.get(nameKey) || null;

    parsedRows.push({
      primerApellido,
      segundoApellido,
      nombre,
      identificacion,
      sexo: parseSexo(mapped.sexo),
      tipoApoyo: mapped.tipo_apoyo || "No tiene",
      duplicateOf,
    });
  });

  if (parsedRows.length === 0) {
    return { error: "Ninguna fila tenía Primer Apellido y Nombre completos.", skippedRows };
  }

  const duplicateCount = parsedRows.filter((r) => r.duplicateOf).length;
  if (duplicateCount > 0 && !duplicateMode) {
    // Todavía no se decidió qué hacer con los duplicados: no se inserta ni
    // actualiza nada; el cliente muestra la decisión y reintenta con el modo
    // elegido.
    return { duplicates: duplicateCount };
  }

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];
  let skippedDuplicates = 0;

  for (const r of parsedRows) {
    const data = {
      primer_apellido: r.primerApellido,
      segundo_apellido: r.segundoApellido,
      nombre: r.nombre,
      identificacion: r.identificacion,
      sexo: r.sexo,
      tipo_apoyo: r.tipoApoyo,
    };
    if (r.duplicateOf) {
      if (duplicateMode === "omitir") {
        skippedDuplicates++;
        continue;
      }
      if (duplicateMode === "actualizar") {
        toUpdate.push({ id: r.duplicateOf, data });
        continue;
      }
      // duplicateMode === "nuevo": cae al alta normal de abajo.
    }
    toInsert.push({ section_id: sectionId, numero: nextNumero++, ...data });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("students").insert(toInsert);
    if (error) return { error: error.message };
  }

  for (const u of toUpdate) {
    const { error } = await supabase.from("students").update(u.data).eq("id", u.id);
    if (error) return { error: error.message };
  }

  if (toInsert.length > 0 || toUpdate.length > 0) {
    // La lista siempre debe quedar ordenada por apellido, venga la data de
    // un alta manual o de un archivo importado.
    const { error: reorderError } = await supabase.rpc("reorder_students_by_apellido", {
      p_section_id: sectionId,
    });
    if (reorderError) return { error: reorderError.message };
  }

  revalidatePath(`/secciones/${sectionId}/estudiantes`);
  return {
    success: true,
    imported: toInsert.length,
    updated: toUpdate.length,
    skipped: skippedRows.length + skippedDuplicates,
    skippedRows: skippedRows.length > 0 ? skippedRows : undefined,
  };
}

async function maxStudentNumero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string,
) {
  const { data } = await supabase
    .from("students")
    .select("numero")
    .eq("section_id", sectionId)
    .is("deleted_at", null)
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
    .eq("section_id", sectionId)
    .is("deleted_at", null);

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
  const { error: reorderError } = await supabase.rpc("reorder_students_by_apellido", {
    p_section_id: sectionId,
  });
  if (reorderError) throw new Error(reorderError.message);

  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}

// Corrige datos de un estudiante ya creado: algo que se cargó mal (a mano o
// por importación) o que cambió durante el periodo (ej. tipo de apoyo).
export async function updateStudent(sectionId: string, studentId: string, formData: FormData) {
  const supabase = await createClient();

  const primerApellido = String(formData.get("primer_apellido") ?? "").trim().toUpperCase();
  const segundoApellido = String(formData.get("segundo_apellido") ?? "").trim().toUpperCase();
  const nombre = String(formData.get("nombre") ?? "").trim().toUpperCase();
  if (!primerApellido || !nombre) {
    throw new Error("Primer apellido y nombre son obligatorios.");
  }

  const { error } = await supabase
    .from("students")
    .update({
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido || null,
      nombre,
      identificacion: String(formData.get("identificacion") ?? "").trim() || null,
      sexo: String(formData.get("sexo") ?? "").trim() || null,
      tipo_apoyo: String(formData.get("tipo_apoyo") ?? "No tiene").trim(),
    })
    .eq("id", studentId);

  if (error) throw new Error(error.message);

  // El apellido pudo haber cambiado, así que la posición en la lista
  // también podría necesitar ajustarse.
  const { error: reorderError } = await supabase.rpc("reorder_students_by_apellido", {
    p_section_id: sectionId,
  });
  if (reorderError) throw new Error(reorderError.message);

  revalidatePath(`/secciones/${sectionId}/estudiantes`);
}

// Reordena/renumera a los estudiantes que ya existen en la sección (por
// ejemplo, los que quedaron en orden de inserción antes de que esto
// existiera, o una lista importada). No hace falta agregar un estudiante
// nuevo para disparar esto.
export async function reorderStudents(sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_students_by_apellido", {
    p_section_id: sectionId,
  });
  if (error) throw new Error(error.message);
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

// Manda a la papelera en vez de borrar directo: se puede restaurar desde
// /secciones/[sectionId]/papelera si fue un error.
export async function deleteStudent(sectionId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_student", { p_student_id: studentId });
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes`);
  revalidatePath(`/secciones/${sectionId}/papelera`);
}

export async function restoreStudent(sectionId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_student", { p_student_id: studentId });
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/estudiantes`);
  revalidatePath(`/secciones/${sectionId}/papelera`);
}

// Borrado real y permanente, solo para elementos que ya están en la
// papelera (deleted_at is not null) — vaciar la papelera a propósito.
export async function purgeStudent(sectionId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .not("deleted_at", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath(`/secciones/${sectionId}/papelera`);
}
