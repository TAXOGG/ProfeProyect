import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";

const TITLE = "ARCE: calificaciones, apoyos e informes para docentes de Costa Rica";
const DESCRIPTION =
  "ARCE le quita al docente costarricense el trabajo de oficina: calcula las notas, lleva la asistencia, arma instrumentos de evaluación, guarda los apoyos educativos y manda los informes a los encargados. Todo en un solo lugar, pensado para el MEP.";

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
    "instrumentos de evaluación",
    "rúbricas de evaluación Costa Rica",
    "expediente pedagógico estudiante",
    "apoyos educativos y adecuaciones",
    "informes para encargados de familia",
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

// Paleta: se mantiene el teal de marca (es el mismo acento que ya vive en la
// app, los correos y los PDF — no tenía sentido inventar uno nuevo solo para
// el landing). Lo que cambia es la composición: bloques de color grandes y
// muy redondeados, tipografía más pesada y tarjetas flotando sobre el
// bloque — el lenguaje visual de tututor.ai y chalkie.ai, adaptado a los
// colores reales de ARCE en vez de clonar los suyos.
const INK = "#10201c";
const INK_MUTED = "#5c6d68";
const PAPER = "#f5f8f7";
const WHITE = "#ffffff";
const TEAL = "#0f766e";
const TEAL_SOFT = "#14867d";
const TEAL_DEEP = "#0b3d38";
const CREAM = "#fef9ec";
const LINE = "rgba(16,32,28,0.1)";
const LINE_ON_TEAL = "rgba(255,255,255,0.22)";

const MOD = {
  cotidiano: "#0d9488",
  pruebas: "#6FA83D",
  tareas: "#0ea5e9",
  proyecto: "#8b5cf6",
  asistencia: "#f97316",
  estudiantes: "#71717a",
};

const MESH_BG = {
  backgroundImage: `radial-gradient(ellipse 60% 50% at 15% 15%, rgba(15,118,110,0.14), transparent 60%),
    radial-gradient(ellipse 50% 45% at 85% 10%, rgba(111,168,61,0.12), transparent 60%),
    radial-gradient(ellipse 55% 50% at 50% 100%, rgba(14,165,233,0.08), transparent 60%)`,
};

type IconProps = { className?: string };

function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCloud({ className }: IconProps) {
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

function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7 7.5 5.5L19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4.5 21 19H3L12 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10.5v3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconCamera({ className }: IconProps) {
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

function IconPuzzle({ className }: IconProps) {
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

function IconKey({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.3 10.3 19.5 19.5M15.3 14.5l2.2-2.2M17.8 17l2.2-2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconSliders({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="7" r="1.7" fill="currentColor" />
      <circle cx="16" cy="12" r="1.7" fill="currentColor" />
      <circle cx="10.5" cy="17" r="1.7" fill="currentColor" />
    </svg>
  );
}

function IconClipboardCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="4.5" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 13 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWifiOff({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 9a11 11 0 0 1 14 0M8 12.3a6.5 6.5 0 0 1 8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconSend({ className }: IconProps) {
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

function IconHeartHand({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 19.2s-6.8-4.1-6.8-9.1a3.6 3.6 0 0 1 6.5-2.1 3.6 3.6 0 0 1 6.5 2.1c0 5-6.2 9.1-6.2 9.1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLayers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="m12 3.5 8 4.3-8 4.3-8-4.3 8-4.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m4 12.2 8 4.3 8-4.3M4 16.4l8 4.3 8-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8.3" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c.7-3 2.9-4.8 5.5-4.8s4.8 1.8 5.5 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8M18 19c-.4-1.9-1.3-3.3-2.6-4.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8 12.3 2.6 2.6 5.4-5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Pain = {
  icon: (props: IconProps) => React.ReactNode;
  dolor: string;
  solucion: string;
  color: string;
};

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
    solucion: "Seguís registrando aunque se corte el internet. Se sube solo cuando vuelve la señal.",
    dolor: "Antes: perder el trabajo del día porque falló la conexión del cole.",
  },
  {
    icon: IconMail,
    color: TEAL,
    solucion: "Con un clic, el informe integral del estudiante llega en PDF al correo del encargado.",
    dolor: "Antes: armar el resumen a mano o mandar capturas de pantalla del Excel.",
  },
  {
    icon: IconAlert,
    color: MOD.asistencia,
    solucion: "Alertas de umbral en asistencia, con la tabla oficial del MEP si querés usarla.",
    dolor: "Antes: enterarte cuando ya no había tiempo para la convocatoria.",
  },
  {
    icon: IconHeartHand,
    color: MOD.proyecto,
    solucion: "Apoyos, adecuaciones y expediente pedagógico, con seguimiento por estudiante.",
    dolor: "Antes: notas sueltas en un cuaderno o en la memoria, difíciles de reconstruir en junta.",
  },
  {
    icon: IconCamera,
    color: MOD.estudiantes,
    solucion: "Evidencias (fotos y PDF) respaldadas por estudiante, ordenadas y privadas.",
    dolor: "Antes: perdidas entre chats de WhatsApp y el rollo del celular.",
  },
];

type FeatureItem = { icon: (props: IconProps) => React.ReactNode; text: string };
type FeatureGroup = { titulo: string; texto: string; color: string; items: FeatureItem[] };

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    titulo: "Calificaciones y asistencia",
    texto: "El corazón del registro, sin fórmulas que romper.",
    color: TEAL,
    items: [
      { icon: IconGrid, text: "Cálculo automático de los 5 rubros: cotidiano, tareas, pruebas, proyecto y asistencia." },
      { icon: IconAlert, text: "Alertas de asistencia con umbrales configurables y la tabla oficial del MEP." },
      { icon: IconClipboardCheck, text: "Cierre y reapertura controlada de periodos, con historial de cada cambio." },
      { icon: IconWifiOff, text: "Trabajo sin conexión: seguís registrando y se sincroniza solo al volver la señal." },
    ],
  },
  {
    titulo: "Documentación pedagógica",
    texto: "Instrumentos, apoyos y expediente conectados entre sí, en vez de cinco archivos sueltos en Drive.",
    color: MOD.proyecto,
    items: [
      { icon: IconGrid, text: "Rúbricas analíticas y holísticas, listas de cotejo, escalas y registro anecdótico." },
      { icon: IconClipboardCheck, text: "El resultado del instrumento se convierte en nota automáticamente, sin doble digitación." },
      { icon: IconHeartHand, text: "Registro de apoyos educativos y adecuaciones, con seguimiento por estudiante." },
      { icon: IconLayers, text: "Expediente pedagógico: notas, asistencia, apoyos e instrumentos en una sola vista." },
    ],
  },
  {
    titulo: "Evidencias e informes",
    texto: "Todo lo que necesitás mostrar, listo para compartir.",
    color: MOD.estudiantes,
    items: [
      { icon: IconCamera, text: "Evidencias fotográficas y en PDF, organizadas por estudiante y con su propia papelera." },
      { icon: IconMail, text: "Informe integral en PDF: calificaciones, apoyos, instrumentos y observaciones en un documento." },
      { icon: IconLayers, text: "Generación masiva: los informes de toda la sección, en un solo ZIP." },
      { icon: IconClipboardCheck, text: "Exportación completa a Excel y PDF, con respaldo y papelera para estudiantes y notas." },
    ],
  },
  {
    titulo: "Comunicación con familias",
    texto: "Preparás el mensaje y ARCE lo registra. Ya no se pierde en el chat de WhatsApp.",
    color: MOD.tareas,
    items: [
      { icon: IconUsers, text: "Centro de comunicaciones: progreso, ausencias, convocatorias y avisos, con plantilla inicial." },
      { icon: IconSend, text: "Envío real por correo al encargado, o registro manual si fue llamada, reunión u otro medio." },
      { icon: IconLayers, text: "Biblioteca de plantillas: reutilizá observaciones e instrumentos entre secciones." },
      { icon: IconClipboardCheck, text: "Historial de cada comunicación, por estudiante y por sección." },
    ],
  },
];

type Step = {
  icon: (props: IconProps) => React.ReactNode;
  titulo: string;
  texto: string;
};

const STEPS: Step[] = [
  { icon: IconKey, titulo: "Pedís acceso", texto: "Te habilitamos la cuenta" },
  { icon: IconSliders, titulo: "Configurás tu sección", texto: "Rubros, periodos, estudiantes" },
  { icon: IconClipboardCheck, titulo: "Registrás sin dedazos", texto: "Aviso si algo no cuadra" },
  { icon: IconWifiOff, titulo: "Sin internet, sin problema", texto: "Se sube solo al volver" },
  { icon: IconSend, titulo: "Compartís con un clic", texto: "Informe directo al encargado" },
];

const PRECIO_FUNDADOR = "19.900";
const PRECIO_REGULAR = "25.000";

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
            offers: {
              "@type": "Offer",
              price: "19900",
              priceCurrency: "CRC",
              priceValidUntil: "2027-12-31",
              availability: "https://schema.org/InStock",
              url: "https://arcecr.com/solicitar-acceso",
              description: "Precio fundador anual, fijo para siempre para quienes se unen durante el lanzamiento.",
            },
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
        .arce-card { transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .arce-card:hover { transform: translateY(-3px); border-color: rgba(15,118,110,0.35) !important; box-shadow: 0 12px 28px -14px rgba(16,32,28,0.18); }
        .arce-btn { transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease; }
        .arce-btn:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) {
          .arce-reveal { animation: none; opacity: 1; }
          .arce-card:hover, .arce-btn:hover { transform: none; }
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
        <nav className="hidden items-center gap-7 font-[family-name:var(--font-body)] text-sm font-medium sm:flex" style={{ color: INK_MUTED }}>
          <a href="#funciones" className="transition-colors hover:text-[#0f766e]">
            Funciones
          </a>
          <a href="#precio" className="transition-colors hover:text-[#0f766e]">
            Precio
          </a>
        </nav>
        <Link
          href={primaryHref}
          className="arce-btn rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: TEAL }}
        >
          {primaryLabel}
        </Link>
      </header>

      {/* HERO — bloque redondeado de color, tipografía pesada, tarjeta flotando encima */}
      <section className="px-5 pt-4 pb-10 sm:px-8 sm:pb-16">
        <div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 sm:rounded-[2.5rem] sm:px-14 sm:py-20"
          style={{ backgroundColor: TEAL }}
        >
          <div className="pointer-events-none absolute inset-0" style={MESH_BG} aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
            <div>
              <p
                className="arce-reveal arce-d1 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.08em] text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.14)", border: `1px solid ${LINE_ON_TEAL}` }}
              >
                Para docentes de Costa Rica
              </p>
              <h1 className="arce-reveal arce-d2 mt-5 font-[family-name:var(--font-display)] text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4rem]">
                Registrá una vez.
                <br />
                ARCE hace el resto.
              </h1>
              <p className="arce-reveal arce-d3 mt-5 max-w-md text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                Notas, asistencia, instrumentos de evaluación, apoyos educativos e informes para
                encargados, todo en un solo lugar. Pensado para cómo trabajás de verdad, en un aula
                de Costa Rica.
              </p>
              <div className="arce-reveal arce-d4 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="arce-btn rounded-full px-6 py-3.5 text-sm font-semibold shadow-md"
                  style={{ backgroundColor: WHITE, color: TEAL_DEEP }}
                >
                  {primaryLabel}
                </Link>
                {!user && (
                  <Link
                    href="/solicitar-acceso"
                    className="arce-btn rounded-full border px-6 py-3.5 text-sm font-semibold text-white"
                    style={{ borderColor: "rgba(255,255,255,0.45)" }}
                  >
                    Solicitar acceso
                  </Link>
                )}
              </div>
              <div className="arce-reveal arce-d4 mt-6 flex flex-wrap gap-x-5 gap-y-2 font-[family-name:var(--font-mono)] text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                <span>🇨🇷 Hecho para el MEP</span>
                <span>📶 Funciona sin internet</span>
                <span>🔒 Datos privados de tus estudiantes</span>
              </div>
            </div>

            <div className="arce-reveal arce-d3 relative flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* EL DOLOR */}
      <section className="px-5 py-14 sm:px-8" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-none" style={{ color: PAPER }} aria-hidden>
            &ldquo;
          </span>
          <p className="-mt-3 text-xl leading-relaxed sm:text-2xl" style={{ color: INK }}>
            Son las 9pm de un domingo. Excel abierto en una pestaña, la calculadora del celular en
            la otra, y todavía te faltan dos periodos por revisar. Una fórmula se corrió sin que
            la vieras y ahora nada cuadra.
          </p>
          <p className="mt-4 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-wide" style={{ color: TEAL }}>
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
              <div key={i} className="arce-card rounded-2xl border bg-white p-6" style={{ borderColor: LINE }}>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ color: p.color, backgroundColor: `${p.color}14` }}
                >
                  <Icon className="h-5 w-5" />
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

      {/* FUNCIONES — los 4 grupos reales de la plataforma */}
      <section id="funciones" className="px-5 py-16 sm:px-8" style={{ backgroundColor: WHITE }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.1em]" style={{ color: TEAL }}>
              Todo lo que ya podés hacer hoy
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Todo el trabajo pedagógico, en un solo lugar
            </h2>
            <p className="mt-3 text-base leading-relaxed" style={{ color: INK_MUTED }}>
              Cuatro áreas conectadas entre sí, para que la información que registrás una vez se
              reutilice en calificaciones, expedientes, informes y comunicaciones.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {FEATURE_GROUPS.map((g) => (
              <div key={g.titulo} className="arce-card rounded-2xl border p-6 sm:p-7" style={{ borderColor: LINE, backgroundColor: PAPER }}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold" style={{ color: INK }}>
                    {g.titulo}
                  </h3>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: g.color }} aria-hidden />
                </div>
                <p className="mt-1.5 text-sm" style={{ color: INK_MUTED }}>
                  {g.texto}
                </p>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {g.items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ color: g.color, backgroundColor: `${g.color}14` }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm leading-relaxed" style={{ color: INK }}>
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-extrabold">Así de simple</h2>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden sm:block" style={{ height: 1, backgroundColor: "rgba(15,118,110,0.3)" }} aria-hidden />
            <div className="relative grid gap-10 sm:grid-cols-5 sm:gap-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.titulo} className="flex flex-col items-center text-center">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white" style={{ borderColor: TEAL, color: TEAL }}>
                      <Icon className="h-5 w-5" />
                      <span
                        className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-[10px] font-medium text-white"
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

      {/* PRECIO */}
      <section id="precio" className="relative overflow-hidden px-5 py-16 sm:px-8" style={{ backgroundColor: WHITE }}>
        <div className="pointer-events-none absolute inset-0" style={MESH_BG} aria-hidden />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.1em]" style={{ color: TEAL }}>
            Lanzamiento
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Precio fundador, para siempre
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed" style={{ color: INK_MUTED }}>
            Si entrás durante el lanzamiento, nos ayudás a mejorar ARCE con tu uso y tu feedback.
            A cambio, ese precio se queda congelado para vos. Aunque el precio regular suba más
            adelante, el tuyo no se mueve.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-md">
          <div className="overflow-hidden rounded-[1.75rem] border-2 bg-white shadow-xl" style={{ borderColor: TEAL }}>
            <div className="px-7 pt-7 sm:px-9 sm:pt-9">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: TEAL }}
              >
                Precio fundador
              </span>
              <div className="mt-5 flex items-end gap-2">
                <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight" style={{ color: INK }}>
                  ₡{PRECIO_FUNDADOR}
                </span>
                <span className="pb-1.5 text-sm font-medium" style={{ color: INK_MUTED }}>
                  / año, por docente
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: INK_MUTED }}>
                Después del lanzamiento, el precio regular sube a{" "}
                <span className="line-through">₡{PRECIO_REGULAR}</span> anuales. Vos lo mantenés
                en ₡{PRECIO_FUNDADOR}, sin vencimiento.
              </p>
            </div>

            <ul className="mt-6 flex flex-col gap-3 px-7 sm:px-9">
              {[
                "Calificaciones, asistencia, instrumentos de evaluación y apoyos educativos",
                "Expediente pedagógico, evidencias e informes para encargados",
                "Centro de comunicaciones y biblioteca de plantillas",
                "Todas las actualizaciones y funciones nuevas, sin costo adicional",
                "Trabajo sin conexión y respaldo automático",
                "Soporte real, en español",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: INK }}>
                  <span className="mt-0.5 shrink-0" style={{ color: TEAL }}>
                    <IconCheck className="h-4 w-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="p-7 pt-8 sm:p-9 sm:pt-8">
              <Link
                href={user ? primaryHref : "/solicitar-acceso"}
                className="arce-btn block rounded-full px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md"
                style={{ backgroundColor: TEAL }}
              >
                {user ? primaryLabel : "Quiero el precio fundador"}
              </Link>
              <p className="mt-3 text-center font-[family-name:var(--font-mono)] text-xs" style={{ color: INK_MUTED }}>
                Acceso por invitación, para dar soporte de verdad y no uno genérico.
              </p>
            </div>
          </div>
          <p className="mt-5 text-center text-sm" style={{ color: INK_MUTED }}>
            ¿Sos un centro educativo con varios docentes?{" "}
            <Link href="/solicitar-acceso" className="font-semibold underline" style={{ color: TEAL }}>
              Escribinos
            </Link>{" "}
            para una propuesta institucional.
          </p>
        </div>
      </section>

      {/* EN DESARROLLO */}
      <section className="px-5 py-16 sm:px-8" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[1.75rem] border-2 border-dashed p-8 text-center sm:p-10" style={{ borderColor: LINE, backgroundColor: WHITE }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-wide text-white"
              style={{ backgroundColor: MOD.asistencia }}
            >
              <IconPuzzle className="h-3.5 w-3.5" />
              En desarrollo
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">Y esto apenas empieza</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: INK_MUTED }}>
              Estamos construyendo una <strong style={{ color: INK }}>extensión de Chrome</strong>{" "}
              que sube automáticamente tus datos al <strong style={{ color: INK }}>SEA</strong>{" "}
              (Sistema de Evaluación Ágil del MEP). La misma información que ya llevás en ARCE,
              sin que la vuelvas a digitar. Un domingo menos de reproceso.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:px-8" style={{ backgroundColor: TEAL }}>
        <div className="pointer-events-none absolute inset-0" style={MESH_BG} aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white sm:text-4xl">
            ¿Listo para dejar Excel atrás?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            Entrá con tu cuenta, o pedí tu acceso con precio fundador antes de que suba.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="arce-btn rounded-full px-6 py-3.5 text-sm font-semibold shadow-md"
              style={{ backgroundColor: WHITE, color: TEAL_DEEP }}
            >
              {primaryLabel}
            </Link>
            {!user && (
              <Link
                href="/solicitar-acceso"
                className="arce-btn rounded-full border px-6 py-3.5 text-sm font-semibold text-white"
                style={{ borderColor: "rgba(255,255,255,0.45)" }}
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
          </span>
          {": "}Agilización de Registros para la Calificación del Educador. Hecho en Costa Rica.
        </p>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full max-w-lg py-6 lg:py-10">
      <div
        className="absolute -left-3 bottom-2 hidden w-52 -rotate-6 rounded-xl border bg-white p-3.5 shadow-xl sm:block lg:-left-8 lg:bottom-6"
        style={{ borderColor: LINE }}
        aria-hidden
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm"
          style={{ color: MOD.asistencia, backgroundColor: `${MOD.asistencia}18` }}
        >
          ⚠
        </span>
        <p className="mt-2 text-xs font-semibold leading-snug" style={{ color: INK }}>
          2 estudiantes con asistencia baja
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px]" style={{ color: INK_MUTED }}>
          Alerta automática
        </p>
      </div>

      <div
        className="absolute -right-3 -top-3 hidden w-44 rotate-3 rounded-xl border bg-white p-3 shadow-xl md:block lg:-right-6 lg:-top-6"
        style={{ borderColor: LINE }}
        aria-hidden
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm"
          style={{ color: TEAL, backgroundColor: "rgba(15,118,110,0.1)" }}
        >
          ✓
        </span>
        <p className="mt-2 text-xs font-semibold leading-snug" style={{ color: INK }}>
          Nota final calculada sola
        </p>
      </div>

      <ProductWindowMock />
    </div>
  );
}

function ProductWindowMock() {
  const students = [
    { name: "Araica Bermudez S.", cot: 90, tar: 95, prue: 85, proy: 100, asis: 98 },
    { name: "Brenes Duran S.", cot: 75, tar: 80, prue: 70, proy: 90, asis: 92 },
    { name: "Briceño Guardado B.", cot: 100, tar: 100, prue: 95, proy: 100, asis: 100 },
    { name: "Castro Vindas L.", cot: 88, tar: 92, prue: 80, proy: 95, asis: 96 },
  ];
  const modules: { key: keyof (typeof students)[number]; label: string; color: string }[] = [
    { key: "cot", label: "COT", color: MOD.cotidiano },
    { key: "prue", label: "PRU", color: MOD.pruebas },
    { key: "tar", label: "TAR", color: MOD.tareas },
    { key: "proy", label: "PRO", color: MOD.proyecto },
    { key: "asis", label: "ASI", color: MOD.asistencia },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border shadow-2xl" style={{ borderColor: LINE, backgroundColor: WHITE }}>
      {/* chrome bar */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: LINE, backgroundColor: CREAM }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#e4b866" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#d99a7a" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL_SOFT }} />
        <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px]" style={{ color: INK_MUTED }}>
          arcecr.com/física-10-1
        </span>
      </div>

      {/* module tabs */}
      <div className="flex gap-1 border-b px-3 pt-2.5" style={{ borderColor: LINE }}>
        {modules.map((m, i) => (
          <span
            key={m.key}
            className="rounded-t-lg px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-medium"
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
                <td className="whitespace-nowrap py-1.5 pr-3 font-[family-name:var(--font-body)] font-medium" style={{ color: INK }}>
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

      {/* mini footer strip — informe listo */}
      <div className="flex items-center justify-between border-t px-3 py-2.5" style={{ borderColor: LINE, backgroundColor: CREAM }}>
        <span className="font-[family-name:var(--font-mono)] text-[10px]" style={{ color: INK_MUTED }}>
          Informe integral
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] font-medium text-white"
          style={{ backgroundColor: TEAL }}
        >
          ✓ enviado
        </span>
      </div>
    </div>
  );
}
