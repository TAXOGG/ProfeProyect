import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SeccionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const { data: section } = await supabase
    .from("sections")
    .select("nombre, nivel, asignatura, ciclo_escolar, institutions ( nombre )")
    .eq("id", sectionId)
    .single();

  if (!section) notFound();

  const institutionNombre =
    (section.institutions as unknown as { nombre: string } | null)?.nombre ?? "";

  return (
    <div>
      <header className="hidden border-b border-zinc-200 bg-white px-4 py-4 sm:px-8 md:block">
        <h1 className="text-lg font-semibold text-zinc-900">
          {section.asignatura} — {section.nombre}
        </h1>
        <p className="text-sm text-zinc-500">
          {institutionNombre} · {section.nivel} · Ciclo {section.ciclo_escolar}
        </p>
      </header>
      <div className="px-4 py-4 sm:px-8 sm:py-6">{children}</div>
    </div>
  );
}
