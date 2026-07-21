import Link from "next/link";
import type { Period } from "@/lib/types";

export function PeriodTabs({
  basePath,
  periods,
  currentPeriodId,
}: {
  basePath: string;
  periods: Period[];
  currentPeriodId: string;
}) {
  return (
    <div className="flex gap-2 border-b border-zinc-200">
      {periods.map((p) => {
        const active = p.id === currentPeriodId;
        return (
          <Link
            key={p.id}
            href={`${basePath}?periodo=${p.id}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              active
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {p.nombre}
          </Link>
        );
      })}
    </div>
  );
}
