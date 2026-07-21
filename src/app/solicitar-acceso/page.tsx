import Link from "next/link";
import { SolicitudAccesoForm } from "@/components/solicitud-acceso-form";

export default function SolicitarAccesoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Solicitar acceso</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ARCE es de acceso por invitación. Cuéntanos de tu institución y te
          contactaremos para habilitar tu cuenta.
        </p>

        <div className="mt-6">
          <SolicitudAccesoForm />
        </div>

        <Link
          href="/login"
          className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-800"
        >
          ¿Ya tienes cuenta? Ingresa
        </Link>
      </div>
    </div>
  );
}
