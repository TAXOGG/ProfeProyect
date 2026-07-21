// Mismo formato que usaba el Excel: "2" = 2 ausencias, "2j" = justificadas (no cuentan), "t" = tardía.
export function parseAttendanceInput(raw: string): {
  ausencias: number;
  justificada: boolean;
  tardia: boolean;
} {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { ausencias: 0, justificada: false, tardia: false };

  if (trimmed.endsWith("j")) {
    return { ausencias: Number(trimmed.slice(0, -1)) || 0, justificada: true, tardia: false };
  }
  if (trimmed.endsWith("t")) {
    return { ausencias: Number(trimmed.slice(0, -1)) || 0, justificada: false, tardia: true };
  }
  return { ausencias: Number(trimmed) || 0, justificada: false, tardia: false };
}

export function formatAttendanceValue(record: {
  ausencias: number;
  justificada: boolean;
  tardia: boolean;
}): string {
  if (record.ausencias === 0 && !record.justificada && !record.tardia) return "";
  if (record.justificada) return `${record.ausencias}j`;
  if (record.tardia) return `${record.ausencias}t`;
  return `${record.ausencias}`;
}
