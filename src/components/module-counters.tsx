export function ModuleCounters({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600"
        >
          <span className="rounded-full bg-white px-1.5 text-teal-700 ring-1 ring-inset ring-teal-200">
            {item.value}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
