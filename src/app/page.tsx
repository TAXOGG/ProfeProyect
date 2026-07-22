import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";

const TITLE = "ARCE — Registro de Calificaciones para Docentes de Costa Rica";
const DESCRIPTION =
  "Olvidá el Excel de notas. ARCE es la plataforma de registro de calificaciones para docentes de Costa Rica: simple, funciona sin internet y con soporte real.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "registro de calificaciones",
    "notas para docentes Costa Rica",
    "sistema de notas MEP",
    "alternativa a Excel para profesores",
    "plataforma educativa Costa Rica",
    "control de asistencia docentes",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://arcecr.com",
    siteName: "ARCE",
    locale: "es_CR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// Paleta: tonos fríos (no crema/cálido) + los colores reales de los 5 módulos
// de la app (module-colors.ts), reutilizados a propósito en vez de inventar
// un acento decorativo aparte.
const INK = "#10201c";
const INK_MUTED = "#5c6d68";
const PAPER = "#f2f6f5";
const PAPER_ALT = "#e8f0ee";
const WHITE = "#ffffff";
const TEAL = "#0f766e";
const TEAL_DEEP = "#0b3d38";
const LINE = "rgba(16,32,28,0.12)";

const MOD = {
  cotidiano: "#0d9488",
  pruebas: "#6FA83D",
  tareas: "#0ea5e9",
  proyecto: "#8b5cf6",
  asistencia: "#f97316",
  estudiantes: "#71717a",
};

const GRID_BG = {
  backgroundImage: `linear-gradient(to right, rgba(15,118,110,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,118,110,0.08) 1px, transparent 1px)`,
  backgroundSize: "36px 36px",
};

type Pain = {
  icon: (props: { className?: string }) => React.ReactNode;
  dolor: string;
  solucion: string;
  color: string;
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
      <path d="M12 4.5 21 19H3L12 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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

function IconPuzzle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 4.5h3.5a1.3 1.3 0 0 1 1.3 1.7c-.2.6.2 1.3.9 1.3H17a2 2 0 0 1 2 2v2.3c0 .7-.7 1.1-1.3.9a1.3 1.3 0 0 0-1.7 1.3V17a2 2 0 0 1-2 2h-2.3c-.7 0-1.1-.7-.9-1.3a1.3 1.3 0 0 0-1.3-1.7H8a2 2 0 0 1-2-2v-2.3c0-.7.7-1.1 1.3-.9.8.3 1.7-.3 1.7-1.3V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10.3 10.3 19.5 19.5M15.3 14.5l2.2-2.2M17.8 17l2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="7" r="1.7" fill="currentColor" />
      <circle cx="16" cy="12" r="1.7" fill="currentColor" />
      <circle cx="10.5" cy="17" r="1.7" fill="currentColor" />
    </svg>
  );
}

function IconClipboardCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="4.5" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 13 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWifiOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 9a11 11 0 0 1 14 0M8 12.3a6.5 6.5 0 0 1 8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20 4 3 11l6 2.5m11-9.5L13.5 20l-4.5-6.5M20 4 8.5 13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PAINS: Pain[] = [
  {
    icon: IconClock,
    color: TEAL,
    solucion: "La nota final se calcula sola, con los 5 rubros ya configurados.",
    dolor: "Antes: copiar fórmulas entre hojas de Excel un domingo en la noche, con miedo de romper algo.",
  },
  {
    icon: IconCloud,
    color: TEAL,
    solucion: "Seguís registrando aunque se corte el internet — se sube solo al volver la señal.",
    dolor: "Antes: perder el trabajo del día porque falló la conexión del cole.",
  },
  {
    icon: IconMail,
    color: TEAL,
    solucion: "Con un clic, el resultado de cualquier módulo llega en PDF al correo del encargado.",
    dolor: "Antes: armar el resumen a mano o mandar capturas de pantalla del Excel.",
  },
  {
    icon: IconAlert,
    color: MOD.asistencia,
    solucion: "Aviso automático de quién necesita atención en asistencia — con la tabla oficial del MEP si querés.",
    dolor: "Antes: enterarte cuando ya no había tiempo para la convocatoria.",
  },
  {
    icon: IconLifeBuoy,
    color: TEAL,
    solucion: "Soporte real, dentro de la plataforma, con alguien del otro lado.",
    dolor: "Antes: un video de YouTube de hace 6 años, si tenías suerte.",
  },
  {
    icon: IconCamera,
    color: MOD.estudiantes,
    solucion: "Respaldo de fotos por estudiante, ordenado y privado.",
    dolor: "Antes: perdidas entre chats de WhatsApp y el rollo del celular.",
  },
];

type Step = {
  icon: (props: { className?: string }) => React.ReactNode;
  titulo: string;
  texto: string;
};

const STEPS: Step[] = [
  { icon: IconKey, titulo: "Pedís acceso", texto: "Te habilitamos la cuenta" },
  { icon: IconSliders, titulo: "Configurás tu sección", texto: "Rubros, periodos, estudiantes" },
  { icon: IconClipboardCheck, titulo: "Registrás sin dedazos", texto: "Aviso si algo no cuadra" },
  { icon: IconWifiOff, titulo: "Sin internet, sin problema", texto: "Se sube solo al volver" },
  { icon: IconSend, titulo: "Compartís con un clic", texto: "PDF directo al encargado" },
];

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Ir a mi panel" : "Iniciar sesión";

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} font-[family-name:var(--font-body)]`}
      style={{ background: PAPER, color: INK }}
    >
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ARCE",
            alternateName: "Agilización de Registros para la Calificación del Educador",
            applicationCategory: "EducationApplication",
            operatingSystem: "Web",
            description: DESCRIPTION,
            url: "https://arcecr.com",
            inLanguage: "es-CR",
            areaServed: { "@type": "Country", name: "Costa Rica" },
            audience: { "@type": "Audience", audienceType: "Docentes" },
          }),
        }}
      />
      <style>{`
        @keyframes arceRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .arce-reveal { opacity: 0; animation: arceRise .8s cubic-bezier(.16,.8,.24,1) both; }
        .arce-d1 { animation-delay: .05s; }
        .arce-d2 { animation-delay: .2s; }
        .arce-d3 { animation-delay: .35s; }
        .arce-d4 { animation-delay: .5s; }
        .arce-card { transition: transform .2s ease, border-color .2s ease; }
        .arce-card:hover { transform: translateY(-2px); border-color: rgba(15,118,110,0.4) !important; }
        @media (prefers-reduced-motion: reduce) {
          .arce-reveal { animation: none; opacity: 1; }
          .arce-card:hover { transform: none; }
        }
      `}</style>

      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-arce.png" alt="" width={30} height={30} unoptimized />
          <span className="font-[family-name:var(--font-display)] text-lg font-bold" style={{ color: TEAL }}>
            ARCE
          </span>
        </div>
        <Link
          href={primaryHref}
          className="rounded-sm px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: TEAL }}
        >
          {primaryLabel}
        </Link>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24" style={GRID_BG}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p
              className="arce-reveal arce-d1 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.1em]"
              style={{ color: TEAL }}
            >
              [ Para docentes de Costa Rica ]
            </p>
            <h1 className="arce-reveal arce-d2 mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
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
                className="rounded-sm px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: TEAL }}
              >
                {primaryLabel}
              </Link>
              {!user && (
                <Link
                  href="/solicitar-acceso"
                  className="rounded-sm border px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
                  style={{ borderColor: LINE, color: INK }}
                >
                  Solicitar acceso
                </Link>
              )}
            </div>
            <p
              className="arce-reveal arce-d4 mt-4 font-[family-name:var(--font-mono)] text-xs"
              style={{ color: INK_MUTED }}
            >
              Acceso por invitación — así mantenemos el soporte cercano, no genérico.
            </p>
          </div>

          <div className="arce-reveal arce-d3 flex justify-center lg:justify-end">
            <ProductWindowMock />
          </div>
        </div>
      </section>

      {/* EL DOLOR */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-none"
            style={{ color: PAPER_ALT }}
            aria-hidden
          >
            &ldquo;
          </span>
          <p className="-mt-3 text-xl leading-relaxed sm:text-2xl" style={{ color: INK }}>
            Son las 9pm de un domingo. Excel abierto en una pestaña, la calculadora del celular en
            la otra, y todavía te faltan dos periodos por revisar. Una fórmula se corrió sin que
            la vieras y ahora nada cuadra.
          </p>
          <p
            className="mt-4 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-wide"
            style={{ color: TEAL }}
          >
            ¿Te suena conocido? No tiene que ser así.
          </p>
        </div>
      </section>

      {/* DOLOR -> SOLUCION */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="arce-card rounded-md border bg-white p-6"
                style={{ borderColor: LINE }}
              >
                <span style={{ color: p.color }}>
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-4 text-base font-semibold leading-snug" style={{ color: INK }}>
                  {p.solucion}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed" style={{ color: INK_MUTED }}>
                  {p.dolor}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA — ruta visual, texto mínimo */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: PAPER_ALT }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Así de simple
          </h2>
          <div className="relative mt-14">
            <div
              className="absolute left-0 right-0 top-6 hidden sm:block"
              style={{ height: 1, backgroundColor: "rgba(15,118,110,0.3)" }}
              aria-hidden
            />
            <div className="relative grid gap-10 sm:grid-cols-5 sm:gap-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.titulo} className="flex flex-col items-center text-center">
                    <div
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border bg-white"
                      style={{ borderColor: TEAL, color: TEAL }}
                    >
                      <Icon className="h-5 w-5" />
                      <span
                        className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-sm font-[family-name:var(--font-mono)] text-[10px] font-medium text-white"
                        style={{ backgroundColor: TEAL }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold">{s.titulo}</h3>
                    <p className="mt-1 text-xs" style={{ color: INK_MUTED }}>
                      {s.texto}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* EN DESARROLLO */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-md border-2 border-dashed p-8 text-center" style={{ borderColor: LINE, backgroundColor: PAPER }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-wide text-white"
              style={{ backgroundColor: MOD.asistencia }}
            >
              <IconPuzzle className="h-3.5 w-3.5" />
              En desarrollo
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
              Y esto apenas empieza
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: INK_MUTED }}>
              Estamos construyendo una <strong style={{ color: INK }}>extensión de Chrome</strong>{" "}
              que sube automáticamente tus datos al <strong style={{ color: INK }}>SEA</strong>{" "}
              (Sistema de Evaluación Ágil del MEP) — la misma información que ya llevás en ARCE,
              sin volver a digitarla. Menos horas de reproceso, un solo lugar donde registrar.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:px-8" style={{ backgroundColor: TEAL }}>
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white sm:text-4xl">
            ¿Listo para dejar Excel atrás?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            Entrá con tu cuenta, o contanos de tu institución para habilitarte una.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-sm px-6 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: WHITE, color: TEAL }}
            >
              {primaryLabel}
            </Link>
            {!user && (
              <Link
                href="/solicitar-acceso"
                className="rounded-sm border px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.4)" }}
              >
                Solicitar acceso
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-10 text-center text-xs sm:px-8" style={{ backgroundColor: TEAL_DEEP, color: "rgba(242,246,245,0.6)" }}>
        <p>
          <span className="font-[family-name:var(--font-display)] font-bold" style={{ color: "#5fc4b8" }}>
            ARCE
          </span>{" "}
          — Agilización de Registros para la Calificación del Educador. Hecho en Costa Rica.
        </p>
      </footer>
    </div>
  );
}

function ProductWindowMock() {
  const students = [
    { name: "Araica Bermudez S.", cot: 90, tar: 95, prue: 85, proy: 100, asis: 98 },
    { name: "Brenes Duran S.", cot: 75, tar: 80, prue: 70, proy: 90, asis: 92 },
    { name: "Briceño Guardado B.", cot: 100, tar: 100, prue: 95, proy: 100, asis: 100 },
  ];
  const modules: { key: keyof (typeof students)[number]; label: string; color: string }[] = [
    { key: "cot", label: "COT", color: MOD.cotidiano },
    { key: "prue", label: "PRU", color: MOD.pruebas },
    { key: "tar", label: "TAR", color: MOD.tareas },
    { key: "proy", label: "PRO", color: MOD.proyecto },
    { key: "asis", label: "ASI", color: MOD.asistencia },
  ];

  return (
    <div className="w-full max-w-md overflow-hidden rounded-md border shadow-lg" style={{ borderColor: LINE, backgroundColor: WHITE }}>
      {/* chrome bar */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: LINE, backgroundColor: PAPER }}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#c7d2d0" }} />
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#c7d2d0" }} />
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#c7d2d0" }} />
        <span
          className="ml-2 font-[family-name:var(--font-mono)] text-[10px]"
          style={{ color: INK_MUTED }}
        >
          arcecr.com/física-10-1
        </span>
      </div>

      {/* module tabs */}
      <div className="flex gap-1 border-b px-3 pt-2.5" style={{ borderColor: LINE }}>
        {modules.map((m, i) => (
          <span
            key={m.key}
            className="rounded-t-sm px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-medium"
            style={{
              color: i === 0 ? WHITE : m.color,
              backgroundColor: i === 0 ? m.color : "transparent",
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* grade table */}
      <div className="p-3">
        <table className="w-full font-[family-name:var(--font-mono)] text-[11px]">
          <thead>
            <tr>
              <th className="pb-2 text-left font-medium" style={{ color: INK_MUTED }}>
                Estudiante
              </th>
              {modules.map((m) => (
                <th key={m.key} className="pb-2 text-center font-medium" style={{ color: m.color }}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.name} className="border-t" style={{ borderColor: LINE }}>
                <td
                  className="whitespace-nowrap py-1.5 pr-3 font-[family-name:var(--font-body)] font-medium"
                  style={{ color: INK }}
                >
                  {s.name}
                </td>
                {modules.map((m) => (
                  <td key={m.key} className="py-1.5 text-center tabular-nums" style={{ color: INK_MUTED }}>
                    {s[m.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
