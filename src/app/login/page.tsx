"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [idleNotice, setIdleNotice] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Lee el querystring solo en el cliente (no existe durante el render en el servidor);
    // hacerlo en el render mismo produciría un mismatch de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdleNotice(new URLSearchParams(window.location.search).get("motivo") === "inactividad");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo-arce.png" alt="" width={40} height={40} className="shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">ARCE</h1>
            <p className="text-[11px] leading-tight text-zinc-500">
              Agilización de Registros para la Calificación del Educador
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-500">Ingresa a tu cuenta</p>

        {idleNotice && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Cerramos tu sesión automáticamente por inactividad, para proteger tu cuenta si dejaste
            el dispositivo desatendido.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? "Un momento..." : "Ingresar"}
          </button>
        </form>

        <Link
          href="/solicitar-acceso"
          className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-800"
        >
          ¿No tienes cuenta? Solicita acceso
        </Link>
      </div>
    </div>
  );
}
