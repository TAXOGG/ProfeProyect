export function Proximamente({ modulo }: { modulo: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-16 text-center">
      <p className="text-sm font-medium text-zinc-700">{modulo}</p>
      <p className="mt-1 text-sm text-zinc-400">Este módulo aún no está implementado.</p>
    </div>
  );
}
