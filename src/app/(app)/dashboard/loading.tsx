export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
