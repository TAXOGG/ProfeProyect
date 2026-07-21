import Image from "next/image";
import Link from "next/link";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const INK = "#241f1b";
const INK_MUTED = "#5b5147";
const CREAM = "#fbf5ea";
const TEAL = "#0f766e";
const EMBER = "#c1440e";

type Pain = {
  icon: (props: { className?: string }) => React.ReactNode;
  dolor: string;
  solucion: string;
};

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.2 8.1 4.5 4.5 0 0 1 16.5 18H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m9.5 13.5 1.8 1.8L14.5 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7 7.5 5.5L19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4.5 21 19H3L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 10.5v3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconLifeBuoy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.3 6.3 3.3 3.3M14.4 14.4l3.3 3.3M17.7 6.3l-3.3 3.3M9.6 14.4l-3.3 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-2h6.5l1 2h2A1.5 1.5 0 0 1 19.5 8.5v8a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.3" r="3.1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const PAINS: Pain[] = [
  {
    icon: IconClock,
    dolor: "Se te va la tarde del domingo copiando fórmulas entre hojas de Excel, con miedo de romper algo.",
    solucion: "La nota final por periodo y anual se calcula sola, con los 5 rubros ya configurados. Sin fórmulas que romper.",
  },
  {
    icon: IconCloud,
    dolor: "Si se daña la computadora o el internet del cole falla justo cuando más lo necesitás, el trabajo se pierde.",
    solucion: "Todo respaldado en la nube. Cotidiano, Pruebas, Tareas, Proyecto y Asistencia funcionan aunque se corte la conexión.",
  },
  {
    icon: IconMail,
    dolor: "Cuando un encargado pregunta cómo va su hijo, armás un resumen a mano o mandás capturas de pantalla.",
    solucion: "Un clic y se envía un certificado o reporte por rubro, en PDF, directo al correo del encargado.",
  },
  {
    icon: IconAlert,
    dolor: "Te enterás de que un estudiante está en riesgo por ausencias justo cuando ya es tarde para la convocatoria.",
    solucion: "Código de color automático (o la tabla oficial del MEP) que resalta a tiempo a quién hay que darle seguimiento.",
  },
  {
    icon: IconLifeBuoy,
    dolor: "Cuando algo falla en el Excel, no hay a quién llamar — a lo mucho, un video de YouTube de hace 6 años.",
    solucion: "Soporte real: un botón dentro de la plataforma para pedir ayuda o reportar algo, y alguien del otro lado.",
  },
  {
    icon: IconCamera,
    dolor: "Las fotos de evidencia de trabajos o incidentes se pierden entre chats de WhatsApp y el rollo del celular.",
    solucion: "Respaldo de fotos por estudiante, ordenado y privado — donde tiene que estar, no donde quepa.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Ir a mi panel" : "Iniciar sesión";

  return (
    <div
      className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)]`}
      style={{ background: CREAM, color: INK }}
    >
      <style>{`
        @keyframes arceRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .arce-reveal { opacity: 0; animation: arceRise .8s cubic-bezier(.16,.8,.24,1) both; }
        .arce-d1 { animation-delay: .05s; }
        .arce-d2 { animation-delay: .2s; }
        .arce-d3 { animation-delay: .35s; }
        .arce-d4 { animation-delay: .5s; }
        .arce-card { transition: transform .25s ease, box-shadow .25s ease; }
        .arce-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(36,31,27,0.25); }
        @media (prefers-reduced-motion: reduce) {
          .arce-reveal { animation: none; opacity: 1; }
          .arce-card:hover { transform: none; }
        }
      `}</style>

      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-arce.png" alt="" width={32} height={32} unoptimized />
          <span
            className="font-[family-name:var(--font-display)] text-lg font-semibold"
            style={{ color: TEAL }}
          >
            ARCE
          </span>
        </div>
        <Link
          href={primaryHref}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: TEAL }}
        >
          {primaryLabel}
        </Link>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(15,118,110,0.07) 28px), radial-gradient(ellipse 60% 50% at 85% 15%, rgba(15,118,110,0.12), transparent)`,
        }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p
              className="arce-reveal arce-d1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: EMBER }}
            >
              Hecho por y para docentes de Costa Rica
            </p>
            <h1
              className="arce-reveal arce-d2 mt-4 font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl"
            >
              Basta de pelear
              <br />
              con Excel.
            </h1>
            <p className="arce-reveal arce-d3 mt-5 max-w-md text-lg leading-relaxed" style={{ color: INK_MUTED }}>
              ARCE es el registro de calificaciones pensado para el aula costarricense: simple,
              sin fórmulas que romper, y con soporte real cuando lo necesitás.
            </p>
            <div className="arce-reveal arce-d4 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: TEAL }}
              >
                {primaryLabel}
              </Link>
              {!user && (
                <Link
                  href="/solicitar-acceso"
                  className="rounded-md border px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
                  style={{ borderColor: "#d8cdb8", color: INK }}
                >
                  Solicitar acceso
                </Link>
              )}
            </div>
            <p className="arce-reveal arce-d4 mt-4 text-xs" style={{ color: INK_MUTED }}>
              Acceso por invitación — así mantenemos el soporte cercano, no genérico.
            </p>
          </div>

          <div className="arce-reveal arce-d3 flex justify-center lg:justify-end">
            <div className="relative">
              <div
                className="absolute -inset-8 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(15,118,110,0.18), transparent 70%)" }}
              />
              <div className="rounded-2xl border bg-white p-5 shadow-lg" style={{ borderColor: "#e8ddc8" }}>
                <div className="mb-3 flex items-center gap-2">
                  <Image src="/logo-arce.png" alt="" width={28} height={28} unoptimized />
                  <span className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                    Física — 10-1
                  </span>
                </div>
                <MiniGradeCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EL DOLOR */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="font-[family-name:var(--font-display)] text-xl italic leading-relaxed sm:text-2xl"
            style={{ color: INK_MUTED }}
          >
            &ldquo;Son las 9pm de un domingo. Excel abierto en una pestaña, la calculadora del
            celular en la otra, y todavía te faltan dos periodos por revisar. Una fórmula se
            corrió sin que la vieras y ahora nada cuadra.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold" style={{ color: TEAL }}>
            ¿Te suena conocido? No tiene que ser así.
          </p>
        </div>
      </section>

      {/* DOLOR -> SOLUCION */}
      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="arce-card rounded-xl border bg-white p-6"
                style={{ borderColor: "#e8ddc8" }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "#fdece2", color: EMBER }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: INK_MUTED }}>
                  {p.dolor}
                </p>
                <p className="mt-3 text-sm font-semibold leading-relaxed" style={{ color: TEAL }}>
                  {p.solucion}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: "#f3ead9" }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                paso: "1",
                titulo: "Configurá tu sección",
                texto: "Rubros, periodos y estudiantes, en minutos — clonás la estructura de una sección existente si ya tenés una.",
              },
              {
                paso: "2",
                titulo: "Registrá en cada módulo",
                texto: "Cotidiano, Pruebas, Tareas, Proyecto y Asistencia, con aviso automático si un puntaje se ve fuera de lo esperado.",
              },
              {
                paso: "3",
                titulo: "Compartí con un clic",
                texto: "Actas, certificados y reportes por rubro, listos para imprimir o enviar por correo al encargado.",
              },
            ].map((s) => (
              <div key={s.paso}>
                <span
                  className="font-[family-name:var(--font-display)] text-4xl font-black"
                  style={{ color: TEAL, opacity: 0.35 }}
                >
                  {s.paso}
                </span>
                <h3 className="mt-2 text-base font-semibold">{s.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_MUTED }}>
                  {s.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-20 text-center sm:px-8">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
          ¿Listo para dejar Excel atrás?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: INK_MUTED }}>
          Entrá con tu cuenta, o contanos de tu institución para habilitarte una.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: TEAL }}
          >
            {primaryLabel}
          </Link>
          {!user && (
            <Link
              href="/solicitar-acceso"
              className="rounded-md border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: "#d8cdb8", color: INK }}
            >
              Solicitar acceso
            </Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t px-5 py-8 text-center text-xs sm:px-8" style={{ borderColor: "#e8ddc8", color: INK_MUTED }}>
        <p>
          <span className="font-[family-name:var(--font-display)] font-semibold" style={{ color: TEAL }}>
            ARCE
          </span>{" "}
          — Agilización de Registros para la Calificación del Educador. Hecho en Costa Rica.
        </p>
      </footer>
    </div>
  );
}

function MiniGradeCard() {
  const rows = [
    { name: "Araica Bermudez S.", cot: 90, tar: 95, prue: 85, proy: 100, asis: 98 },
    { name: "Brenes Duran S.", cot: 75, tar: 80, prue: 70, proy: 90, asis: 92 },
    { name: "Briceño Guardado B.", cot: 100, tar: 100, prue: 95, proy: 100, asis: 100 },
  ];
  const cols: { key: keyof (typeof rows)[number]; label: string; color: string }[] = [
    { key: "cot", label: "Cot.", color: "#0d9488" },
    { key: "tar", label: "Tar.", color: "#0ea5e9" },
    { key: "prue", label: "Prue.", color: "#6FA83D" },
    { key: "proy", label: "Proy.", color: "#8b5cf6" },
    { key: "asis", label: "Asis.", color: "#f97316" },
  ];

  return (
    <table className="w-full text-[11px]" style={{ color: INK_MUTED }}>
      <thead>
        <tr>
          <th className="pb-1.5 text-left font-medium">Estudiante</th>
          {cols.map((c) => (
            <th key={c.key} className="pb-1.5 text-center font-medium" style={{ color: c.color }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t" style={{ borderColor: "#eee2cd" }}>
            <td className="whitespace-nowrap py-1.5 pr-3 font-medium" style={{ color: INK }}>
              {r.name}
            </td>
            {cols.map((c) => (
              <td key={c.key} className="py-1.5 text-center">
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
