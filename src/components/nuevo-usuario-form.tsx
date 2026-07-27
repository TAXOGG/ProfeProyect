"use client";

import { InstitutionSearch } from "@/components/institution-search";
import { createTeacherAccount } from "@/lib/actions/admin-users";

export function NuevoUsuarioForm() {
  return (
    <form action={createTeacherAccount} className="mt-6 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Nombre completo</label>
        <input
          name="nombre"
          type="text"
          required
          placeholder="Nombre y apellidos del docente"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Correo</label>
        <input
          name="correo"
          type="email"
          required
          placeholder="docente@correo.com"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <InstitutionSearch />

      <button
        type="submit"
        className="mt-2 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Crear cuenta y enviar invitación
      </button>
    </form>
  );
}
