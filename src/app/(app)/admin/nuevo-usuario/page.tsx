import { requireAdmin } from "@/lib/actions/admin-users";
import { NuevoUsuarioForm } from "@/components/nuevo-usuario-form";

export default async function NuevoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string }>;
}) {
  await requireAdmin();
  const { creado } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo usuario</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Creá la cuenta de un docente. Le llega un correo de bienvenida con un enlace para que
        elija su propia contraseña.
      </p>

      {creado && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Cuenta creada. Le enviamos el correo de bienvenida.
        </p>
      )}

      <NuevoUsuarioForm />
    </div>
  );
}
