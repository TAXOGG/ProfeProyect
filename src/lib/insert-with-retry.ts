const PG_UNIQUE_VIOLATION = "23505";

/**
 * El "numero" correlativo de indicadores/pruebas/tareas/estudiantes se
 * calcula como count()+1 antes de insertar. Si dos inserts casi simultáneos
 * calculan el mismo numero, el segundo choca contra el `unique` de la tabla.
 * Este helper reintenta una vez recalculando el numero real (max+1) en vez
 * de dejar que la Server Action truene con un error de base de datos crudo.
 */
export async function insertWithAutoIncrementRetry(
  initialNumero: number,
  tryInsert: (
    numero: number,
  ) => PromiseLike<{ error: { code?: string; message: string } | null }>,
  getMaxNumero: () => Promise<number>,
): Promise<{ error: string | null }> {
  let numero = initialNumero;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await tryInsert(numero);
    if (!error) return { error: null };
    if (error.code !== PG_UNIQUE_VIOLATION) return { error: error.message };
    numero = (await getMaxNumero()) + 1;
  }
  return { error: "No se pudo asignar un número único, intenta de nuevo." };
}
